import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Chart.js core
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
  TimeScale,
} from 'chart.js';

// Financial charts
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-luxon';
import { Chart } from 'react-chartjs-2';
import '../App.css';

// Register Chart.js components
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
const WS_URL = 'wss://qbot.mooo.com/api/trade/chart';

function TradingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const {
    selectedStock = 'Unknown',
    amount = 0,
    stopLoss,
    takeProfit,
    timeRange = 'Unknown',
  } = location.state || {};

  const [chartData, setChartData] = useState({
    datasets: [{ label: `${selectedStock} Price`, type: 'candlestick', data: [] }],
  });
  const [tableData, setTableData] = useState([]);
  const [tradeStatus, setTradeStatus] = useState('Connecting...');
  const [showPopup, setShowPopup] = useState(false);
  const [wsError, setWsError] = useState(null);

  // 1️⃣ START BOT
  useEffect(() => {
    const startBot = async () => {
      try {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ stock: selectedStock, amount }),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.error('Bot start failed:', res.status, res.statusText, errText);
          setTradeStatus('Failed to start bot');
        } else {
          console.log('Bot start requested (status:', res.status, ')');
        }
      } catch (err) {
        console.error('Failed to start trade bot:', err);
        setTradeStatus('Failed to start bot');
      }
    };
    startBot();
  }, [selectedStock, amount]);


  useEffect(() => {
    let isMounted = true;

    const connectWs = () => {
      if (!isMounted) return;

      console.log('Attempting WebSocket connection...');
      setTradeStatus('Connecting to live data...');
      setWsError(null);

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Chart WebSocket connected');
        setTradeStatus('Running');
        setWsError(null);
      };

      ws.onmessage = (event) => {
        console.log('WS message received:', event.data); // ← key debug line

        let payload;
        try {
          payload = JSON.parse(event.data);
          console.log('Parsed payload:', payload);
        } catch (e) {
          console.warn('Invalid WS JSON:', event.data);
          return;
        }

        // Candlestick batch
        if (Array.isArray(payload)) {
          setChartData({
            datasets: [
              {
                label: `${selectedStock} Price`,
                type: 'candlestick',
                data: payload.map((c) => ({
                  x: new Date(c.time || c.timestamp),
                  o: Number(c.open) || 0,
                  h: Number(c.high) || 0,
                  l: Number(c.low) || 0,
                  c: Number(c.close) || 0,
                })),
              },
            ],
          });
        }

        // Trade execution
        if (payload?.type === 'trade') {
          setTableData((prev) => [
            {
              time: payload.time || '—',
              type: payload.side || '—',
              amount: Number(payload.amount) || 0,
              price: Number(payload.price) || 0,
              pnl: Number(payload.pnl) || 0,
            },
            ...prev,
          ]);
        }

        // Completion
        if (payload?.status === 'completed') {
          setTradeStatus('Completed');
          setShowPopup(true);
          ws.close();
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setWsError('Connection error – retrying...');
      };

      ws.onclose = (e) => {
        console.log('WebSocket closed:', e.code, e.reason);
        if (isMounted) {
          setWsError(`Disconnected (code ${e.code}) – retrying...`);
          // Reconnect after delay (avoid rapid loop if auth issue)
          reconnectTimerRef.current = setTimeout(connectWs, 5000);
        }
      };
    };

    connectWs();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedStock]);

  // Chart options (unchanged)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#e0e0e0' } },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: 'minute', tooltipFormat: 'MMM dd, yyyy HH:mm' },
        ticks: { color: '#e0e0e0' },
        grid: { color: '#e0e0e0' },
      },
      y: {
        ticks: { color: '#e0e0e0' },
        grid: { color: '#e0e0e0' },
      },
    },
  };

  return (
    <div className="trading-page">
      <h2>Live Trading: {selectedStock}</h2>

      <p className="trade-info">
        Amount: ${Number(amount).toFixed(2)} | Duration: {timeRange}
        {stopLoss && ` | Stop Loss: $${stopLoss}`}
        {takeProfit && ` | Take Profit: $${takeProfit}`}
      </p>

      <p className="trade-status">
        Status: {tradeStatus}
        {wsError && <span style={{ color: '#ff6b6b', marginLeft: '8px' }}>{wsError}</span>}
      </p>

      {/* Chart with loading overlay */}
      <div className="chart-container" style={{ height: 400, position: 'relative' }}>
        {chartData.datasets[0].data.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)',
              color: '#aaa',
              fontSize: '1.2rem',
              zIndex: 1,
            }}
          >
            {tradeStatus.includes('Connecting') || tradeStatus === 'Running'
              ? 'Waiting for live chart data...'
              : 'No data available'}
          </div>
        )}
        <Chart type="candlestick" data={chartData} options={chartOptions} />
      </div>

      {/* Trade History Table */}
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
          {tableData.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>
                Waiting for trades...
              </td>
            </tr>
          ) : (
            tableData.map((row, i) => (
              <tr key={i}>
                <td>{row.time}</td>
                <td>{row.type}</td>
                <td>${Number(row.amount).toFixed(2)}</td>
                <td>${Number(row.price).toFixed(2)}</td>
                <td className={row.pnl >= 0 ? 'positive' : 'negative'}>
                  {row.pnl >= 0 ? '+' : '-'}${Math.abs(Number(row.pnl)).toFixed(2)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Completion Popup */}
      {showPopup && (
        <div className="popup">
          <p>Trade Completed!</p>
          <button onClick={() => navigate('/analysis')}>View Analysis</button>
          <button onClick={() => navigate('/')}>Back Home</button>
        </div>
      )}
    </div>
  );
}

export default TradingPage;