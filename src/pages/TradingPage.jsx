import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Core Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,           // Required for time-based x-axis
} from 'chart.js';

// Financial chart imports (THIS is the key fix)
import {
  CandlestickController,
  CandlestickElement,
} from 'chartjs-chart-financial';

// Date adapter for time scale (Luxon recommended for good timezone/i18n support)
import 'chartjs-adapter-luxon';

import { Chart } from 'react-chartjs-2';
import '../App.css';

// Register everything once (best at module level)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  CandlestickController,
  CandlestickElement
);

const API_BASE = 'https://qbot.mooo.com/api/trade';

function TradingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Trade parameters from HomePage
  const {
    selectedStock = 'Unknown',
    amount = 0,
    stopLoss,
    takeProfit,
    timeRange = 'Unknown',
  } = location.state || {};

  const [chartData, setChartData] = useState({
    datasets: [
      {
        label: `${selectedStock} Price`,
        data: [], // Will be filled with candlestick data
        type: 'candlestick',
        borderColor: '#00c853',
        backgroundColor: '#00c853',
      },
    ],
  });

  const [tableData, setTableData] = useState([]); // Live trade updates
  const [showPopup, setShowPopup] = useState(false);
  const [tradeStatus, setTradeStatus] = useState('Running');

  useEffect(() => {
    // Poll backend for live trade data
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/live`, {
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) throw new Error('Live data fetch failed');

        const data = await response.json();

        // Update chart (expect candlestick format: [{x: time, o: open, h: high, l: low, c: close}, ...])
        if (data.chart && Array.isArray(data.chart)) {
          setChartData({
            datasets: [
              {
                label: `${selectedStock} Price`,
                data: data.chart.map(item => ({
                  x: item.time || item.timestamp, // should be number (ms) or ISO string
                  o: item.open,
                  h: item.high,
                  l: item.low,
                  c: item.close,
                })),
                type: 'candlestick',
                borderColor: (context) => {
                  const index = context.dataIndex;
                  const value = context.dataset.data[index];
                  return value.c >= value.o ? '#00c853' : '#ff5252'; // Green up, red down
                },
                backgroundColor: (context) => {
                  const index = context.dataIndex;
                  const value = context.dataset.data[index];
                  return value.c >= value.o ? 'rgba(0,200,83,0.5)' : 'rgba(255,82,82,0.5)';
                },
              },
            ],
          });
        }

        // Update table (live orders/PnL)
        if (data.table && Array.isArray(data.table)) {
          setTableData(data.table);
        }

        // Check if trade completed
        if (data.tradeComplete || data.status === 'completed') {
          setShowPopup(true);
          setTradeStatus('Completed');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Live trade data error:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [selectedStock]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: '#e0e0e0' } },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        type: 'time',                        // Crucial for dates/timestamps
        time: {
          unit: 'minute',                    // Adjust to 'day', 'hour', etc. based on your data density
          tooltipFormat: 'MMM dd, yyyy HH:mm',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM dd',
          },
        },
        ticks: { color: '#e0e0e0' },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        ticks: { color: '#e0e0e0' },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
    },
  };

  return (
    <div className="trading-page">
      <h2>Live Trading: {selectedStock}</h2>
      <p className="trade-info">
        Amount: ${Number(amount).toFixed(2)} | Duration: {timeRange} | 
        {stopLoss && ` Stop Loss: $${stopLoss}`} {takeProfit && ` | Take Profit: $${takeProfit}`}
      </p>
      <p className="trade-status">Status: {tradeStatus}</p>

      {/* Modern Candlestick Chart */}
      <div className="chart-container" style={{ height: '400px', width: '100%' }}>
        <Chart type="candlestick" data={chartData} options={chartOptions} />
      </div>

      {/* Live Trade Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Price</th>
            <th>PnL</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, idx) => (
            <tr key={idx}>
              <td>{row.time}</td>
              <td>{row.type || 'Buy'}</td>
              <td>${row.amount?.toFixed(2) || '0.00'}</td>
              <td>${row.price?.toFixed(2) || '0.00'}</td>
              <td className={`profit-loss ${row.pnl >= 0 ? 'positive' : 'negative'}`}>
                {row.pnl >= 0 ? '+' : '-'}${Math.abs(row.pnl || 0).toFixed(2)}
              </td>
            </tr>
          ))}
          {tableData.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>
                Waiting for trade updates...
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Completion Popup */}
      {showPopup && (
        <div className="popup">
          <p>Trade Completed!</p>
          <button onClick={() => navigate('/analysis')}>View Analysis</button>
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      )}
    </div>
  );
}

export default TradingPage;