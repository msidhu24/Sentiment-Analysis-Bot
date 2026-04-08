import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import SourceCard from './SourceCard';

export default function Dashboard({ data, marketData, llmSummary, backendCorrelation, backendDivergence, ticker, weights, filters, timeHorizon, isSearching }) {
  
  // Calculate analytics
  const analytics = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Filter by news/social toggles
    const filteredData = data.filter(item => {
      if (!filters.news && item.source !== 'social') return false;
      if (!filters.social && item.source === 'social') return false;
      return true;
    });

    let totalScore = 0;
    let totalWeight = 0;
    
    // Time Series grouping by day
    const timeMap = {};

    filteredData.forEach(item => {
      const sentimentScore = item.score || 0;
      
      // Calculate weighted aggregate score
      const w = item.source === 'social' 
        ? (weights.social / 100) 
        : (weights.news / 100);
        
      totalScore += sentimentScore * w;
      totalWeight += w;

      // Map for timeline
      const dateStr = new Date(item.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!timeMap[dateStr]) timeMap[dateStr] = { date: dateStr, sentiments: [] };
      timeMap[dateStr].sentiments.push(sentimentScore);
    });

    const aggregateScore = totalWeight > 0 ? (totalScore / totalWeight) : 0;
    
    const chartData = Object.values(timeMap).map(day => {
      const avg = day.sentiments.reduce((a,b)=>a+b, 0) / day.sentiments.length;
      return {
        date: day.date,
        score: avg,
        fullDate: new Date(`${day.date} ${new Date().getFullYear()}`)
      };
    }).sort((a,b) => a.fullDate - b.fullDate); // chronological

    // Merge so MarketData is the foundational timeline (30 days) not just the few days that have news
    let mergedChartData = [];
    if (marketData && marketData.length > 0) {
      mergedChartData = marketData.map(m => {
        const mDateStr = new Date(m.fullDate || m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return {
          date: mDateStr,
          fullDate: new Date(m.fullDate),
          price: m.price,
          score: m.inferred_sentiment !== undefined ? m.inferred_sentiment : null
        };
      });
    } else {
      mergedChartData = [...chartData];
    }

    let signalType = 'hold';
    if (aggregateScore > 0.1) signalType = 'buy';
    else if (aggregateScore < -0.1) signalType = 'sell';

    // Advanced Oracle Prediction Engine
    let oracle = {
      label: "CONSOLIDATION",
      target: "0.0%",
      color: "#8E8E93", // Gray
      reason: "No strong sentiment divergence detected."
    };

    if (backendDivergence === 'Bullish' && aggregateScore > 0.05) {
      oracle = { label: "STRONG BULLISH", target: "+1.5% to +3.0%", color: "#34C759", reason: "Price is lagging behind highly optimistic social and news volume." };
    } else if (backendDivergence === 'Bearish' && aggregateScore < -0.05) {
      oracle = { label: "STRONG BEARISH", target: "-1.5% to -3.0%", color: "#FF3B30", reason: "Price remains elevated but underlying market sentiment has turned negative." };
    } else if (aggregateScore > 0.15) {
      oracle = { label: "MOMENTUM UP", target: "+0.5% to +1.5%", color: "#34C759", reason: "Extremely positive baseline NLP scoring across endpoints." };
    } else if (aggregateScore < -0.15) {
      oracle = { label: "MOMENTUM DOWN", target: "-0.5% to -1.5%", color: "#FF3B30", reason: "Heavy baseline negativity detected in recent data." };
    } else if (aggregateScore > 0.05) {
       oracle = { label: "SLIGHT DRIFT UP", target: "+0.1% to +0.5%", color: "#34C759", reason: "Mild optimism; lacks strong conviction." };
    } else if (aggregateScore < -0.05) {
       oracle = { label: "SLIGHT DRIFT DOWN", target: "-0.1% to -0.5%", color: "#FF3B30", reason: "Mild pessimism; lacks strong conviction." };
    }

    // Calculate advanced metrics
    return {
      aggregateScore,
      oracle,
      signalType,
      chartData: mergedChartData,
      filteredData
    };
  }, [data, marketData, weights, filters]);

  if (isSearching) {
    return (
      <main className="dashboard">
        <div className="loader-container">
          <div className="spinner">Analzying {ticker.toUpperCase()}...</div>
        </div>
      </main>
    );
  }

  if (!analytics || analytics.filteredData.length === 0) {
    return (
      <main className="dashboard">
        <div className="loader-container">
          <div>No data found for {ticker.toUpperCase()}. Try another ticker.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <div className="top-bar" style={{ flexWrap: 'wrap' }}>
        <h2 className="ticker-display">{ticker.toUpperCase()} Report</h2>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="meta-stats">
            <div className="stat-badge">
              <span className="dot" style={{ background: '#007AFF' }}></span>
              Stock Data: yfinance (Live)
            </div>
            {backendCorrelation !== null && (
              <div className="stat-badge correlation-badge">
                Pearson r: {backendCorrelation.toFixed(2)}
              </div>
            )}
            {backendDivergence && (
              <div className={`stat-badge divergence-badge ${backendDivergence.toLowerCase()}`}>
                 {backendDivergence.toUpperCase()} DIVERGENCE DETECTED
              </div>
            )}
          </div>
          <div className="gauge-container">
            <div className="gauge-circle">
              {analytics.aggregateScore > 0 ? '+' : ''}{analytics.aggregateScore.toFixed(2)}
            </div>
            <div className={`signal ${analytics.signalType}`}>
              {analytics.signalType.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {llmSummary && (
        <div className="card llm-summary-card">
          <div className="chart-header" style={{ marginBottom: '12px' }}>AI Intelligence: The Why</div>
          <div className="llm-grid">
            <div className="llm-col">
              <h4>📈 Market Catalysts</h4>
              <p>{llmSummary.catalysts.join(" ")}</p>
            </div>
            <div className="llm-col">
              <h4>🌐 Social Trends</h4>
              <p>{llmSummary.socialTrends.join(" ")}</p>
            </div>
            <div className="llm-col">
              <h4>⚠️ Risk Factors</h4>
              <p>{llmSummary.riskFactors.join(" ")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Oracle Prediction Tab / Card */}
      <div className="card oracle-card" style={{ background: 'linear-gradient(135deg, rgba(28,28,30,0.8) 0%, rgba(44,44,46,0.8) 100%)', borderLeft: `4px solid ${analytics.oracle.color}`, marginBottom: '24px' }}>
        <div className="chart-header" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔮 Oracle Forecast (T+1)</span>
          <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: analytics.oracle.color, fontWeight: 'bold' }}>
            {analytics.oracle.label}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginTop: '12px' }}>
          <div>
            <div style={{ color: '#8E8E93', fontSize: '0.85rem', marginBottom: '4px' }}>Projected Move</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: analytics.oracle.color }}>{analytics.oracle.target}</div>
          </div>
          <div>
            <div style={{ color: '#8E8E93', fontSize: '0.85rem', marginBottom: '4px' }}>Algorithmic Reasoning</div>
            <div style={{ fontSize: '0.95rem', color: '#F2F2F7', lineHeight: '1.4' }}>{analytics.oracle.reason}</div>
          </div>
        </div>
      </div>

      <div className="card chart-card">
        <div className="chart-header">Sentiment vs Price ({timeHorizon} Days)</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#8E8E93', fontSize: 12}} dy={10} />
            <YAxis yAxisId="left" domain={[-1, 1]} axisLine={false} tickLine={false} tick={{fill: '#8E8E93', fontSize: 12}} dx={-10} />
            <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fill: '#8E8E93', fontSize: 12}} dx={10} tickFormatter={(val) => {
                  if (val > 1) return `+${val.toFixed(1)}`;
                  if (val > 0) return `+${val}`;
                  return val;
                }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #D2D2D7', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Line 
              yAxisId="left"
              type="monotone" 
              name="Sentiment Score"
              dataKey="score" 
              stroke="#007AFF" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }} 
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              name="Stock Price"
              dataKey="price" 
              stroke="#34C759" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }} 
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 style={{marginBottom: '16px', fontSize: '18px', fontWeight: 600}}>Data Sources ({analytics.filteredData.length})</h3>
        <div className="cards-grid">
          {analytics.filteredData.map(item => (
            <SourceCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </main>
  );
}
