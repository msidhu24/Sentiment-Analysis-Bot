import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd
from pprint import pprint

# Live network libraries
import tweepy
from newsdataapi import NewsDataApiClient
from tavily import TavilyClient
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from dotenv import load_dotenv

# Load env variables from root
load_dotenv(dotenv_path="../.env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = SentimentIntensityAnalyzer()

def fetch_real_prices(ticker: str, days: int):
    period_str = f"{min(days + 5, 365)}d"
    stock = yf.Ticker(ticker)
    hist = stock.history(period=period_str)
    if hist.empty:
        return pd.DataFrame()
    hist.index = hist.index.tz_localize(None)
    cutoff_date = datetime.now() - timedelta(days=days)
    hist_filtered = hist[hist.index >= cutoff_date]
    return hist_filtered

def fetch_news(ticker: str):
    snippets = []
    key = os.getenv('VITE_NEWSDATA_KEY')
    if not key or key == 'YOUR_NEWSDATA_API_KEY': return snippets
    try:
        api = NewsDataApiClient(apikey=key)
        response = api.news_api(q=ticker, language="en")
        if response.get("status") == "success":
            for art in response.get("results", [])[:10]:
                text = str(art.get("title", "")) + " " + str(art.get("description", ""))
                snippets.append({
                    "text": text,
                    "source": "news",
                    "publishedAt": art.get("pubDate", datetime.now().isoformat())
                })
        elif response.get("status") == "error":
            raise Exception("Newsdata Auth Error")
    except Exception as e:
        print(f"News API Error: {e}")
        raise HTTPException(status_code=401, detail="Key Authentication Error")
    return snippets

def fetch_twitter(ticker: str):
    snippets = []
    bearer = os.getenv('VITE_TWITTER_BEARER')
    if not bearer or bearer == 'YOUR_TWITTER_BEARER_TOKEN': return snippets
    try:
        client = tweepy.Client(bearer_token=bearer)
        response = client.search_recent_tweets(query=f"{ticker} lang:en -is:retweet", max_results=10, tweet_fields=["created_at"])
        if response.data:
            for tweet in response.data:
                snippets.append({
                    "text": tweet.text,
                    "source": "social",
                    "publishedAt": tweet.created_at.isoformat() if tweet.created_at else datetime.now().isoformat()
                })
    except tweepy.errors.Unauthorized:
        raise HTTPException(status_code=401, detail="Key Authentication Error")
    except Exception as e:
        print(f"Twitter API Error: {e}")
        raise HTTPException(status_code=401, detail="Key Authentication Error")
    return snippets

def fetch_tavily(ticker: str):
    snippets = []
    key = os.getenv('VITE_TAVILY_KEY')
    if not key or key == 'YOUR_TAVILY_API_KEY': return snippets
    try:
        client = TavilyClient(api_key=key)
        response = client.search(f"{ticker} stock sentiment news", search_depth="basic", max_results=5)
        for result in response.get("results", []):
            snippets.append({
                "text": result.get("title", "") + " " + result.get("content", ""),
                "source": "news",
                "publishedAt": datetime.now().isoformat()
            })
    except Exception as e:
        print(f"Tavily API Error: {e}")
        raise HTTPException(status_code=401, detail="Key Authentication Error")
    return snippets

def calculate_correlation(price_df, sentiment_df):
    if price_df.empty or sentiment_df.empty:
        return None
    # Merge on date index
    merged = pd.merge(price_df, sentiment_df, left_index=True, right_index=True, how='outer')
    # Forward fill missing data for correlation
    merged = merged.ffill().bfill()
    if len(merged) < 2: return None
    corr = merged['Close'].corr(merged['Score'])
    return float(corr) if not pd.isna(corr) else None

def check_divergence(price_df, sentiment_df):
    if price_df.empty or sentiment_df.empty:
        return None
    merged = pd.merge(price_df, sentiment_df, left_index=True, right_index=True, how='outer').ffill().bfill()
    if len(merged) < 5: return None
    
    recent = merged.iloc[-5:]
    price_slope = recent['Close'].iloc[-1] - recent['Close'].iloc[0]
    sentiment_slope = recent['Score'].iloc[-1] - recent['Score'].iloc[0]
    
    if price_slope < 0 and sentiment_slope > 0.1:
        return "Bullish"
    elif price_slope > 0 and sentiment_slope < -0.1:
        return "Bearish"
    return None

@app.get("/api/analyze")
def analyze_asset(ticker: str, days: int = 30):
    # 1. Fetch live prices
    price_df = fetch_real_prices(ticker, days)
    
    # 2. Fetch live texts
    snippets = []
    snippets.extend(fetch_news(ticker))
    snippets.extend(fetch_twitter(ticker))
    snippets.extend(fetch_tavily(ticker))
    
    # Strict fallback prevention
    if len(snippets) == 0:
        raise HTTPException(status_code=401, detail="Key Authentication Error")

    # 3. Process Sentiment & Build Sentiment DataFrame
    sentiment_records = []
    for s in snippets:
        vs = analyzer.polarity_scores(s['text'])
        s['score'] = vs['compound']
        try:
            # Parse date string back to datetime, strip Z or timezone for safe alignment
            dt = datetime.fromisoformat(s['publishedAt'].replace('Z', '+00:00')).replace(tzinfo=None)
            s['parsed_date'] = dt
            sentiment_records.append({"Date": dt.date(), "Score": vs['compound']})
        except:
            dt = datetime.now()
            sentiment_records.append({"Date": dt.date(), "Score": vs['compound']})

    # Group sentiment by day to map against price
    if sentiment_records:
        sent_df = pd.DataFrame(sentiment_records)
        sent_df.set_index('Date', inplace=True)
        # Average duplicate dates
        sent_df = sent_df.groupby('Date').mean()
        # Convert index to datetime to match price_df
        sent_df.index = pd.to_datetime(sent_df.index)
    else:
        sent_df = pd.DataFrame()

    # Align price_df dates to pure dates for index
    if not price_df.empty:
        price_df.index = price_df.index.normalize()

    # 4. Mandatory Analytical Scripts
    correlation = calculate_correlation(price_df, sent_df)
    divergence = check_divergence(price_df, sent_df)
    
    # 5. AI Summary (Mock parsing actual live strings due to NO OpenAI key supplied)
    combined_text = " ".join([s['text'] for s in snippets]).lower()
    is_bullish = ("moon" in combined_text or "strong" in combined_text or "rally" in combined_text or "surge" in combined_text)
    is_bearish = ("sell" in combined_text or "terrible" in combined_text or "downgrade" in combined_text or "fear" in combined_text)
    
    if is_bearish:
        catalyst = "Live stream heavily discussing downgrades and macro pressure points."
        social_trend = "Retail displaying defensive anxiety across social networks."
        risk_factor = "Fear indicators rising on short-term horizons."
    elif is_bullish:
        catalyst = "Positive earnings momentum or strong forward guidance circulating."
        social_trend = "High organic hype matching upward volume trends."
        risk_factor = "Potential over-extension if fundamentals fail to validate social metrics."
    else:
        catalyst = "Balanced neutral reporting focusing on standard business operations."
        social_trend = "Retail interest stabilized with low variance."
        risk_factor = "Geopolitical uncertainty remains the standard overlapping risk."

    market_data_payload = []
    if not price_df.empty:
        for date, row in price_df.iterrows():
            market_data_payload.append({
                "date": date.strftime("%b %d"),
                "fullDate": date.isoformat(),
                "price": row['Close'],
                "volume": row['Volume']
            })

    # Frontend expects aggregated JSON
    return {
        "marketData": market_data_payload,
        "snippets": [{"text": s['text'], "source": s['source'], "publishedAt": s['publishedAt'], "score": s['score']} for s in snippets],
        "correlation": correlation,
        "divergence": divergence,
        "llmSummary": {
            "catalysts": [catalyst],
            "socialTrends": [social_trend],
            "riskFactors": [risk_factor]
        }
    }
