from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import yfinance as yf
from datetime import datetime, timedelta

app = FastAPI()

# Allow requests from the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Snippet(BaseModel):
    text: str
    source: str

class SummaryRequest(BaseModel):
    snippets: List[Snippet]

@app.get("/api/market-data")
def get_market_data(ticker: str, days: int):
    try:
        # yfinance period format 
        # Add a couple days buffer to ensure we get enough data over weekends
        period_str = f"{min(days + 5, 365)}d"
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period_str)
        
        if hist.empty:
            return {"data": []}
            
        # Strip timezone from yfinance index to avoid comparison errors with naive datetime
        hist.index = hist.index.tz_localize(None)
            
        # Get just the recent data matching the exact horizon up to today
        cutoff_date = datetime.now() - timedelta(days=days)
        hist_filtered = hist[hist.index >= cutoff_date]
        
        result = []
        for date, row in hist_filtered.iterrows():
            result.append({
                "date": date.strftime("%b %d"),
                "fullDate": date.isoformat(),
                "price": row['Close'],
                "volume": row['Volume']
            })
            
        return {"data": result}
        
    except Exception as e:
        print(f"Error fetching yfinance: {e}")
        return {"error": str(e), "data": []}

@app.post("/api/llm-summary")
def get_llm_summary(request: SummaryRequest):
    # Simulated LLM logic utilizing the DRIVER™ Framework methodology secretly.
    # D - Define (Objective: Summarize sentiment drivers)
    # R - Represent (Structure: catalysts, socialTrends, riskFactors)
    # I - Implement (Mock logic evaluation)
    # V - Validate (Cross-checking mock signals below)
    # E - Evolve (Synthesizing statements for the UI)
    # R - Reflect (Ensuring this methodology transfers accurate business domain knowledge)
    
    try:
        combined_text = " ".join([s.text for s in request.snippets]).lower()
        
        is_bullish = ("moon" in combined_text or "strong" in combined_text or "rally" in combined_text)
        is_bearish = ("sell" in combined_text or "terrible" in combined_text or "downgrade" in combined_text)
        
        # Mapping DRIVER insights to UI expected components:
        # Catalysts (D/R mapping: Vision and core mechanics)
        catalyst = "Positive earnings momentum validated against expectations."
        if is_bearish:
            catalyst = "Market reacting to weak guidance discovering supply chain gaps."
            
        # Social Trends (Evolve mapping: Network effects)
        social_trend = "Retail interest surging out of optimized social engagement."
        if is_bearish:
            social_trend = "Retail sentiment turning excessively defensive, indicating deep fear."
            
        # Risk Factors (Validate mapping: Reasonableness / Edge cases)
        risk_factor = "Macroeconomic uncertainty remains an overhanging analytical boundary."
        
        return {
            "catalysts": [catalyst],
            "socialTrends": [social_trend],
            "riskFactors": [risk_factor]
        }
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return {
            "catalysts": ["Data unavailable"],
            "socialTrends": ["Data unavailable"],
            "riskFactors": ["Data unavailable"]
        }
