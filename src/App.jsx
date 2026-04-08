import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RightSidebar from './components/RightSidebar';
import { getAggregatedData, fetchMarketData, fetchLLMSummary } from './services/api';

function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [data, setData] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [llmSummary, setLlmSummary] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Controls state
  const [timeHorizon, setTimeHorizon] = useState(30);
  const [weights, setWeights] = useState({ news: 70, social: 30 });
  const [filters, setFilters] = useState({ news: true, social: true });

  const fetchSentimentData = async (targetTicker, days) => {
    setIsSearching(true);
    try {
      const results = await getAggregatedData(targetTicker, days);
      setData(results);
      
      const mData = await fetchMarketData(targetTicker, days);
      setMarketData(mData);
      
      // Select top 10 snippets to send to LLM
      const topSnippets = results.slice(0, 10).map(r => ({ text: r.text, source: r.source }));
      const summary = await fetchLLMSummary(topSnippets);
      setLlmSummary(summary);
      
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchSentimentData(ticker, timeHorizon);
  }, [ticker, timeHorizon]);

  const handleTickerSubmit = (newTicker) => {
    setTicker(newTicker);
  };

  return (
    <div className="app-container">
      <Sidebar 
        ticker={ticker}
        onTickerSubmit={handleTickerSubmit}
        timeHorizon={timeHorizon}
        setTimeHorizon={setTimeHorizon}
        weights={weights}
        setWeights={setWeights}
        filters={filters}
        setFilters={setFilters}
      />
      <Dashboard 
        data={data}
        marketData={marketData}
        llmSummary={llmSummary}
        ticker={ticker}
        weights={weights}
        filters={filters}
        timeHorizon={timeHorizon}
        isSearching={isSearching}
      />
      <RightSidebar onTickerSubmit={handleTickerSubmit} />
    </div>
  );
}

export default App;
