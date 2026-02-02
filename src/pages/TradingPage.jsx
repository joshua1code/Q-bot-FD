import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'

function TradingPage() {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]); // e.g., [{time: '10:00', price: 100}, ...]
  const [tableData, setTableData] = useState([]); // e.g., [{buy: 'Yes', time: '10:00', amount: 100, pnl: 50}]
  const [showPopup, setShowPopup] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Fetch live data (poll every 5s for "live")
    const interval = setInterval(() => {
      fetch('/api/trade-data')
        .then(res => res.json())
        .then(data => {
          setChartData(data.chart);
          setTableData(data.table);
          // Simulate trade complete after some time (replace with real logic)
          if (data.tradeComplete) setShowPopup(true);
        })
        .catch(err => console.error('Trade data API error:', err));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Draw simple line chart on canvas
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (chartData.length > 1) {
      ctx.beginPath();
      ctx.moveTo(0, ctx.canvas.height - chartData[0].price);
      chartData.forEach((point, idx) => {
        ctx.lineTo(idx * (ctx.canvas.width / (chartData.length - 1)), ctx.canvas.height - point.price);
      });
      ctx.strokeStyle = 'blue';
      ctx.stroke();
    }
  }, [chartData]);

  return (
    <div className="trading-page">
      <h2>Trading Page</h2>
      <canvas ref={canvasRef} className="chart"></canvas>
      <table className="data-table">
        <thead>
          <tr>
            <th>Buy</th>
            <th>Order Time</th>
            <th>Order Amount</th>
            <th>Profit/Loss</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, idx) => (
            <tr key={idx}>
              <td>{row.buy}</td>
              <td>{row.time}</td>
              <td>{row.amount}</td>
              <td className={`profit-loss ${row.pnl >= 0 ? 'positive' : 'negative'}`}>
                {row.pnl >= 0 ? '+' : '-'} {Math.abs(row.pnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showPopup && (
        <div className="popup">
          <p>Trade time completed!</p>
          <button onClick={() => navigate('/analysis')}>View Analysis</button>
        </div>
      )}
    </div>
  );
}

export default TradingPage;