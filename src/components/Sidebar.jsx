import React, { useState } from 'react';
import { Search, Activity } from 'lucide-react';

export default function Sidebar({
  ticker, onTickerSubmit,
  timeHorizon, setTimeHorizon,
  weights, setWeights,
  filters, setFilters
}) {
  const [localTicker, setLocalTicker] = useState(ticker);

  const handleSearch = (e) => {
    e.preventDefault();
    if (localTicker.trim()) {
      onTickerSubmit(localTicker.trim());
    }
  };

  return (
    <aside className="sidebar">
      <h1><Activity color="#007AFF" /> Sentify</h1>

      <form onSubmit={handleSearch} className="search-bar">
        <Search size={18} color="#8E8E93" />
        <input 
          type="text" 
          placeholder="Stock Ticker (e.g. AAPL)" 
          value={localTicker}
          onChange={(e) => setLocalTicker(e.target.value)}
        />
      </form>

      <div className="control-group">
        <label>Time Horizon</label>
        <div className="segmented-control">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              type="button"
              className={timeHorizon === days ? 'active' : ''}
              onClick={() => setTimeHorizon(days)}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <label>Source Weighting</label>
        <div className="slider-wrapper">
          <div className="slider-labels">
            <span>News ({weights.news}%)</span>
            <span>Social ({weights.social}%)</span>
          </div>
          <input 
            type="range" 
            min="0" max="100" 
            value={weights.news}
            onChange={(e) => {
              const newsVal = parseInt(e.target.value, 10);
              setWeights({ news: newsVal, social: 100 - newsVal });
            }}
            className="slider" 
          />
        </div>
      </div>

      <div className="control-group">
        <label>Filters</label>
        <div className="filter-toggles">
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={filters.news}
              onChange={(e) => setFilters(prev => ({...prev, news: e.target.checked}))}
            />
            Professional News
          </label>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={filters.social}
              onChange={(e) => setFilters(prev => ({...prev, social: e.target.checked}))}
            />
            Social Sentiment
          </label>
        </div>
      </div>
    </aside>
  );
}
