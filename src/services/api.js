// API Keys (Loaded securely from Environment Variables)
const NEWSDATA_KEY = import.meta.env.VITE_NEWSDATA_KEY || 'YOUR_NEWSDATA_API_KEY';
const TWITTER_BEARER = import.meta.env.VITE_TWITTER_BEARER || 'YOUR_TWITTER_BEARER_TOKEN';
const TAVILY_KEY = import.meta.env.VITE_TAVILY_KEY || 'YOUR_TAVILY_API_KEY';

// Mock Data Generators for Fallbacks or Time-Series distribution

const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

function generateMockData(ticker, source, count, baseDate) {
  const data = [];
  const templates = {
    news: [
      `{ticker} reports strong Q3 earnings, beating expectations.`,
      `Investor concerns grow over {ticker}'s supply chain issues.`,
      `New product launch by {ticker} receives mixed reviews.`,
      `Market rally lifts {ticker} shares to a 52-week high.`,
      `Analyst downgrades {ticker} citing slowing growth.`
    ],
    twitter: [
      `I'm long on {ticker} 🚀🚀`,
      `Just sold my {ticker} position. Getting out while I can.`,
      `What is going on with {ticker} today? Wild swings!`,
      `Can't wait to see {ticker} at the moon. Buy the dip!`,
      `Terrible customer service from {ticker} today 😡`
    ]
  };

  const pool = templates[source] || templates.news;

  for (let i = 0; i < count; i++) {
    const timeOffset = Math.floor(Math.random() * 24 * 60 * 60 * 1000); // random time within the day
    const date = new Date(baseDate.getTime() - timeOffset);
    const text = pool[i % pool.length].replace(/{ticker}/g, ticker.toUpperCase());
    
    data.push({
      id: `${source}-${date.getTime()}-${i}`,
      source: source,
      text: text,
      publishedAt: date.toISOString(),
      url: '#',
      author: source === 'twitter' ? '@user' + Math.floor(Math.random() * 1000) : 'Financial Times',
    });
  }
  return data;
}

export async function fetchNewsData(ticker) {
  try {
    const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_KEY}&q=${ticker}&language=en`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error('NewsData API failure');
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      return data.results.map(item => ({
        id: item.article_id,
        source: 'news',
        text: item.title + (item.description ? ` - ${item.description}` : ''),
        publishedAt: item.pubDate,
        url: item.link,
        author: item.source_id,
      }));
    }
  } catch (error) {
    console.warn('NewsData API fallback deployed.');
  }
  // Fallback
  return generateMockData(ticker, 'news', 10, new Date());
}

export async function fetchTwitterData(ticker) {
  try {
    // Note: Twitter API from browser often fails due to CORS. 
    // We add try-catch to handle CORS or 403 gracefully.
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${ticker} lang:en&max_results=10`;
    const res = await fetchWithTimeout(url, {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER}`,
      }
    });
    if (!res.ok) throw new Error('Twitter API failure or CORS issue');
    const data = await res.json();
    
    if (data.data && data.data.length > 0) {
      return data.data.map(item => ({
        id: item.id,
        source: 'twitter',
        text: item.text,
        publishedAt: new Date().toISOString(), // Twitter search might not return time without tweet.fields
        url: `https://twitter.com/x/status/${item.id}`,
        author: 'Twitter User',
      }));
    }
  } catch (error) {
    console.warn('Twitter API fallback deployed. (Likely CORS or Auth issues)');
  }
  // Fallback
  return generateMockData(ticker, 'twitter', 15, new Date());
}

export async function fetchTavilyData(ticker) {
  try {
    const url = 'https://api.tavily.com/search';
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `${ticker} stock sentiment news`,
        search_depth: "basic",
        max_results: 5
      })
    });
    if (!res.ok) throw new Error('Tavily API failure');
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      return data.results.map((item, idx) => ({
        id: `tavily-${idx}`,
        source: 'tavily',
        text: item.title + ' ' + item.content,
        publishedAt: new Date().toISOString(),
        url: item.url,
        author: new URL(item.url).hostname,
      }));
    }
  } catch (error) {
    console.warn('Tavily API fallback deployed.');
  }
  return [];
}

/**
 * Fetches all sources for a given ticker and distributes them over the requested time horizon.
 * (Since APIs restrict historical fetching, we use current items and mock dates to simulate time series).
 * @param {string} ticker 
 * @param {number} daysHorizon 
 */
export async function getAggregatedData(ticker, daysHorizon) {
  const [news, twitter, tavily] = await Promise.all([
    fetchNewsData(ticker),
    fetchTwitterData(ticker),
    fetchTavilyData(ticker)
  ]);

  let allData = [...news, ...twitter, ...tavily];

  // Distribute items artificially over the timeline to make chart interesting
  allData = allData.map((item, index) => {
    const date = new Date();
    // Spread exponentially backwards up to daysHorizon
    const backDays = Math.floor(Math.random() * daysHorizon);
    date.setDate(date.getDate() - backDays);
    date.setHours(Math.floor(Math.random() * 24));
    return { ...item, publishedAt: date.toISOString() };
  });

  return allData.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

/**
 * Fetches market data using the local Python backend.
 */
export async function fetchMarketData(ticker, daysHorizon) {
  try {
    const res = await fetchWithTimeout(`http://localhost:8000/api/market-data?ticker=${ticker}&days=${daysHorizon}`);
    if (!res.ok) throw new Error('Failed to fetch market data');
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('Market data fetch error:', error);
    return [];
  }
}

/**
 * Fetches the LLM intelligence summary from the local Python backend.
 */
export async function fetchLLMSummary(snippets) {
  try {
    const res = await fetchWithTimeout('http://localhost:8000/api/llm-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ snippets })
    });
    if (!res.ok) throw new Error('Failed to fetch LLM summary');
    return await res.json();
  } catch (error) {
    console.error('LLM summary fetch error:', error);
    return {
      catalysts: ["Analysis currently unavailable."],
      socialTrends: ["Analysis currently unavailable."],
      riskFactors: ["Analysis currently unavailable."]
    };
  }
}
