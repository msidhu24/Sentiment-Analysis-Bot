import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function RightSidebar({ onTickerSubmit }) {
  // Mock daily macro sentiment data
  const topStocks = [
    { ticker: 'NVDA', score: 0.92 },
    { ticker: 'MSFT', score: 0.85 },
    { ticker: 'AMZN', score: 0.78 },
    { ticker: 'PLTR', score: 0.71 },
    { ticker: 'CRWD', score: 0.65 }
  ];

  const bottomStocks = [
    { ticker: 'INTC', score: -0.88 },
    { ticker: 'BA', score: -0.75 },
    { ticker: 'TSLA', score: -0.62 },
    { ticker: 'WBD', score: -0.55 },
    { ticker: 'AMD', score: -0.45 }
  ];

  return (
    <aside className="sidebar right-sidebar">
      <div className="ranking-section">
        <h3 className="ranking-title">
          <TrendingUp color="#34C759" size={18} /> Top Sentiment
        </h3>
        <ul className="ranking-list">
          {topStocks.map(s => (
            <li key={s.ticker} onClick={() => onTickerSubmit(s.ticker)}>
              <span className="ticker">{s.ticker}</span>
              <span className="score positive">+{s.score}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="ranking-section" style={{ marginTop: '24px' }}>
        <h3 className="ranking-title">
          <TrendingDown color="#FF3B30" size={18} /> Lowest Sentiment
        </h3>
        <ul className="ranking-list">
          {bottomStocks.map(s => (
            <li key={s.ticker} onClick={() => onTickerSubmit(s.ticker)}>
              <span className="ticker">{s.ticker}</span>
              <span className="score negative">{s.score}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
