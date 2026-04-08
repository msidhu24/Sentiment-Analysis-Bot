import React from 'react';
import { MessageCircle, Newspaper, Globe } from 'lucide-react';

const SourceIcon = ({ source }) => {
  switch (source) {
    case 'social': return <MessageCircle size={18} color="#1DA1F2" />;
    case 'news': return <Newspaper size={18} color="#000000" />;
    case 'tavily': return <Globe size={18} color="#8E8E93" />;
    default: return <Globe size={18} color="#8E8E93" />;
  }
};

export default function SourceCard({ item }) {
  const score = item.score || 0;
  const label = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';
  
  const formattedDate = new Date(item.publishedAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="card source-card">
      <div className="source-card-header">
        <div className="source-info">
          <SourceIcon source={item.source} />
          <span>{item.author}</span>
        </div>
        <span className={`sentiment-badge ${label}`}>
          {label.toUpperCase()} ({score.toFixed(2)})
        </span>
      </div>
      <p className="source-text">{item.text}</p>
      <div className="source-date">{formattedDate}</div>
    </div>
  );
}
