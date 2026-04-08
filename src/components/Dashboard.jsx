import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import SourceCard from './SourceCard';
import { analyzeTextSentiment, calculatePearsonCorrelation, detectDivergence } from '../utils/sentimentEngine';

export default function Dashboard({ data, marketData, llmSummary, ticker, weights, filters, timeHorizon, isSearching }) {
  
  // Calculate analytics
  const analytics = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Filter by news/social toggles
    const filteredData = data.filter(item => {
      if (!filters.news && item.source !== 'twitter') return false;
      if (!filters.social && item.source === 'twitter') return false;
      return true;
    });

    let totalScore = 0;
    let totalWeight = 0;
    
    // Time Series grouping by day
    const timeMap = {};

    filteredData.forEach(item => {
      const sentiment = analyzeTextSentiment(item.text);
      
      // Calculate weighted aggregate score
      const w = item.source === 'twitter' 
        ? (weights.social / 100) 
        : (weights.news / 100);
        
      totalScore += sentiment.score * w;
      totalWeight += w;

      // Map for timeline
      const dateStr = new Date(item.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!timeMap[dateStr]) timeMap[dateStr] = { date: dateStr, sentiments: [] };
      timeMap[dateStr].sentiments.push(sentiment.score);
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

    // Merge marketData
    let mergedChartData = [...chartData];
    if (marketData && marketData.length > 0) {
      const mDataMap = {};
      marketData.forEach(m => {
        // Standardize the date string generation so they match perfectly
        const mDateStr = new Date(m.fullDate || m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        mDataMap[mDateStr] = m.price;
      });
      
      // we can map price into existing chart points
      mergedChartData = mergedChartData.map(c => ({
        ...c,
        price: mDataMap[c.date] || null
      }));

      // Forward-fill missing prices (like weekends or holidays)
      let lastValidPrice = null;
      mergedChartData.forEach(c => {
        if (c.price !== null) lastValidPrice = c.price;
        else if (lastValidPrice !== null) c.price = lastValidPrice;
      });
      
      // Backward-fill in case the very first sentiment points preceded our market data window
      let firstValidPrice = null;
      for (let i = mergedChartData.length - 1; i >= 0; i--) {
        if (mergedChartData[i].price !== null) firstValidPrice = mergedChartData[i].price;
        else if (firstValidPrice !== null) mergedChartData[i].price = firstValidPrice;
      }
    }

    let signalType = 'hold';
    if (aggregateScore > 0.1) signalType = 'buy';
    else if (aggregateScore < -0.1) signalType = 'sell';

    // Calculate advanced metrics
    const validPoints = mergedChartData.filter(d => d.price !== null && d.score !== undefined);
    const scoreSeries = validPoints.map(d => d.score);
    const priceSeries = validPoints.map(d => d.price);

    const correlation = calculatePearsonCorrelation(scoreSeries, priceSeries);
    const divergence = detectDivergence(priceSeries, scoreSeries, 5);

    return {
      aggregateScore,
      signalType,
      chartData: mergedChartData,
      filteredData,
      correlation,
      divergence
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
          {analytics.correlation !== null && (
            <div className="badge correlation-badge">
              r = {analytics.correlation.toFixed(2)}
              <span className="badge-subtitle">
                {Math.abs(analytics.correlation) > 0.7 ? 'High' : Math.abs(analytics.correlation) > 0.4 ? 'Moderate' : 'Low'} Corr
              </span>
            </div>
          )}
          {analytics.divergence && (
            <div className={`badge divergence-badge ${analytics.divergence.includes('Bullish') ? 'bullish' : 'bearish'}`}>
              {analytics.divergence}
            </div>
          )}

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

      <div className="card chart-card">
        <div className="chart-header">Sentiment vs Price ({timeHorizon} Days)</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#8E8E93', fontSize: 12}} dy={10} />
            <YAxis yAxisId="left" domain={[-1, 1]} axisLine={false} tickLine={false} tick={{fill: '#8E8E93', fontSize: 12}} dx={-10} />
            <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fill: '#8E8E93', fontSize: 12}} dx={10} />
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
