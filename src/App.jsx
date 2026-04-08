import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RightSidebar from './components/RightSidebar';
import { fetchLiveBackendData } from './services/api';

function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [data, setData] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [llmSummary, setLlmSummary] = useState(null);
  const [backendCorrelation, setBackendCorrelation] = useState(null);
  const [backendDivergence, setBackendDivergence] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Controls state
  const [timeHorizon, setTimeHorizon] = useState(30);
  const [weights, setWeights] = useState({ news: 70, social: 30 });
  const [filters, setFilters] = useState({ news: true, social: true });

  const fetchSentimentData = async (targetTicker, days) => {
    setIsSearching(true);
    setAuthError(null);
    try {
      const payload = await fetchLiveBackendData(targetTicker, days);
      setData(payload.snippets || []);
      setMarketData(payload.marketData || []);
      setLlmSummary(payload.llmSummary || null);
      setBackendCorrelation(payload.correlation);
      setBackendDivergence(payload.divergence);
    } catch (error) {
      if (error.message === 'Key Authentication Error') {
        setAuthError(error.message);
      }
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
      {authError ? (
        <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: 'rgba(255, 59, 48, 0.2)', border: '1px solid #FF3B30', padding: '20px', borderRadius: '12px', color: '#FFF' }}>
              <h3>Key Authentication Error</h3>
              <p>Your API keys are missing, invalid, or rate-limited.<br/>Check your .env file or API dashboard quotes.</p>
           </div>
        </div>
      ) : (
        <Dashboard 
          data={data}
          marketData={marketData}
          llmSummary={llmSummary}
          backendCorrelation={backendCorrelation}
          backendDivergence={backendDivergence}
          ticker={ticker}
          weights={weights}
          filters={filters}
          timeHorizon={timeHorizon}
          isSearching={isSearching}
        />
      )}
      <RightSidebar onTickerSubmit={handleTickerSubmit} />
    </div>
  );
}

export default App;
