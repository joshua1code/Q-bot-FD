import React, { useEffect, useState } from 'react';
import '../App.css';

const API_BASE = 'https://qbot.mooo.com/api/trade';

function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/trade`, {
          method: 'GET',
          credentials: 'include',           // ← sends cookies (session_id)
          headers: {
            Accept: 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`Server responded ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        setAnalysisData(data);
      } catch (err) {
        console.error('Analysis fetch error:', err);
        setError(err.message || 'Failed to load trade analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  // Helper to render stats if present
  const renderStats = (stats) => {
    if (!stats) return null;
    return (
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Total Trades</span>
          <span className="stat-value">{stats.totalTrades ?? '-'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Win Rate</span>
          <span className="stat-value">{stats.winRate ? `${stats.winRate}%` : '-'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total PnL</span>
          <span className={`stat-value ${stats.totalPnL >= 0 ? 'positive' : 'negative'}`}>
            {stats.totalPnL ? `$${stats.totalPnL.toFixed(2)}` : '-'}
          </span>
        </div>
        {/* Add more as needed: avgProfit, maxDrawdown, etc. */}
      </div>
    );
  };

  return (
    <div className="analysis-page">
      <h2>Trade Analysis</h2>

      {loading && <p className="loading">Loading trade history and analysis...</p>}

      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && analysisData ? (
        <>
          {analysisData.summary && (
            <div className="summary">
              <h3>Summary</h3>
              <p>{analysisData.summary}</p>
            </div>
          )}

          {renderStats(analysisData.stats)}

          {analysisData.trades?.length > 0 ? (
            <div className="trade-history">
              <h3>Recent Trades</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Stock</th>
                    <th>Side</th>
                    <th>Amount</th>
                    <th>Price</th>
                    <th>PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.trades.map((trade, i) => (
                    <tr key={i}>
                      <td>{trade.time || '-'}</td>
                      <td>{trade.stock || '-'}</td>
                      <td>{trade.side || '-'}</td>
                      <td>${Number(trade.amount || 0).toFixed(2)}</td>
                      <td>${Number(trade.price || 0).toFixed(2)}</td>
                      <td className={trade.pnl >= 0 ? 'positive' : 'negative'}>
                        {trade.pnl >= 0 ? '+' : '-'}${Math.abs(Number(trade.pnl || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No completed trades found in history.</p>
          )}
        </>
      ) : (
        !loading && !error && <p>No analysis data available yet.</p>
      )}
    </div>
  );
}

export default AnalysisPage;