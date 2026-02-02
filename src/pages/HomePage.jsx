import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'

function HomePage() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [amount, setAmount] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [timeRange, setTimeRange] = useState('');

  useEffect(() => {
    fetch('/api/stocks')
      .then(res => res.json())
      .then(data => setStocks(data.stocks)) // Assume {stocks: ['AAPL', 'GOOG', ...]}
      .catch(err => console.error('Stocks API error:', err));
  }, []);
return (
  <div className="home-page">
    <div className="home-container">
      <div className="summary">
        <h2>Welcome to Trading App</h2>
        <p>A brief summary: Trade stocks easily with live data and analysis.</p>
      </div>

      <div className="trade-form">
        <label>Stock:</label>
        <select value={selectedStock} onChange={e => setSelectedStock(e.target.value)}>
          <option value="">Select Stock</option>
          {stocks.map(stock => <option key={stock} value={stock}>{stock}</option>)}
        </select>

        <label>Amount:</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" />

        <label>Stop Loss:</label>
        <input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="Stop loss price" />

        <label>Take Profit:</label>
        <input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder="Take profit price" />

        <label>Time Range (e.g., 1h):</label>
        <input type="text" value={timeRange} onChange={e => setTimeRange(e.target.value)} placeholder="e.g., 1h, 4h, 1d" />

        <button className="start-trade" onClick={() => navigate('/trading')}>
          Start Trade
        </button>
      </div>
    </div>
  </div>
);
}

export default HomePage;