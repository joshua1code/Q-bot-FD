import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createChart, CrosshairMode, ColorType } from 'lightweight-charts';
import { API_BASE_URL, WSS_API_BASE_URL } from '../Constants';

function TradingPage({ setBalance, setSelectedCurrency }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);

  // Destructure parameters passed from HomePage
  const {
    selectedStock = 'BTC',
    amount = 0,
    stopLoss = null,
    takeProfit = null,
    timeRange = '60',
  } = location.state || {};

  const [tradeStatus, setTradeStatus] = useState('Initializing...');
  const [errorMessage, setErrorMessage] = useState('');
  const [tableData, setTableData] = useState([]);

  // --- 1. WebSocket Handler ---
 // Modify connectWs to accept sessionId
const connectWs = useCallback((sessionId) => {
  if (wsRef.current?.readyState === WebSocket.OPEN) return;

  let wsUrl = `${WSS_API_BASE_URL}/api/trade/chart`;
  if (sessionId) {
    wsUrl += `?qbot_session_id=${encodeURIComponent(sessionId)}`;
  }

  console.log('🔗 Connecting WebSocket →', wsUrl);

  const ws = new WebSocket(wsUrl);
  wsRef.current = ws;

  ws.onopen = () => {
    console.log('✅ WebSocket connection established');
    setTradeStatus('Live Trading Active');
  };

  ws.onmessage = (event) => {
    console.log('📥 WS message:', event.data); // log every message
    try {
      const data = JSON.parse(event.data);
      // your existing handlers...
    } catch (err) {
      console.error('Parse error:', err, event.data);
    }
  };

  ws.onerror = (err) => console.error('WS error:', err);
  ws.onclose = (e) => console.log('WS closed:', e.code, e.reason || 'no reason');
}, []);

// Then in success path of startTradingBot:
connectWs(result.qbot_session_id);

  // --- 2. Start Bot (Fixes 422 Error) ---
 // --- 2. Start Bot (Fixed Syntax + Enhanced Logging) ---
useEffect(() => {
const startTradingBot = async () => {
  if (!selectedStock || amount <= 0) {
    setTradeStatus('Invalid Parameters');
    setErrorMessage('Missing stock or amount. Return to Home.');
    return;
  }

  try {
    const payload = {
      stock_symbol: `${selectedStock}/USDT`,
      amount: Number(amount),
      currency: 'USD',
      duration: String(timeRange || "60"),  // ← Key fix: string
      stop_loss: stopLoss ? Number(stopLoss) : undefined,
      take_profit: takeProfit ? Number(takeProfit) : undefined,
    };

    console.log('🚀 Sending /api/trade payload:', payload);

    const response = await fetch(`${API_BASE_URL}/api/trade`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    console.log('📡 /api/trade response status:', response.status);
    console.log('📄 /api/trade response body:', result);

    if (!response.ok) {
      const details = result.detail
        ? (Array.isArray(result.detail)
            ? result.detail.map(d => `${d.loc?.join('.') || 'field'}: ${d.msg}`).join(' | ')
            : JSON.stringify(result.detail))
        : result.message || 'Unknown error';
      throw new Error(`Failed (${response.status}): ${details}`);
    }

    // Success path
    setBalance?.(result.balance);
    setSelectedCurrency?.(result.currency);
    setTradeStatus('Trade Started – Connecting to Live Data');
    connectWs();  // Start WebSocket only on success
  } catch (err) {
    console.error('❌ Trade start error:', err);
    setTradeStatus('Failed to Start Bot');
    setErrorMessage(`Error: ${err.message}. Check console for details.`);
  }
};

  startTradingBot();  // ← THIS WAS MISSING BEFORE!

  return () => {
    if (wsRef.current) wsRef.current.close();
  };
}, [selectedStock, amount, timeRange, stopLoss, takeProfit, connectWs, setBalance, setSelectedCurrency]);
  // --- 3. Chart Initialization (Fixes Blank Page) ---
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { type: ColorType.Solid, color: '#0f1117' },
          textColor: '#e0e0e0',
        },
        grid: {
          vertLines: { color: '#1e222d' },
          horzLines: { color: '#1e222d' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        timeScale: { timeVisible: true, secondsVisible: false },
      });

      // Defensive check for method existence (v4 library check)
      if (typeof chart.addCandlestickSeries !== 'function') {
        throw new Error("Library version mismatch: 'addCandlestickSeries' not found.");
      }

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#00c853',
        downColor: '#ff6b6b',
        borderVisible: false,
        wickUpColor: '#00c853',
        wickDownColor: '#ff6b6b',
      });

      seriesRef.current = candlestickSeries;
      chartRef.current = chart;

      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (err) {
      setErrorMessage(`Chart Library Error: ${err.message}`);
    }
  }, []);

  return (
    <div className="main-content">
      <div className="trading-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>{selectedStock} / USDT</h2>
          <span className={`stat-value ${tradeStatus === 'Connected' ? 'positive' : 'negative'}`} style={{ fontSize: '1rem' }}>
            STATUS: {tradeStatus}
          </span>
        </div>

        {errorMessage && (
          <div className="error" style={{ background: 'rgba(255, 107, 107, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <strong>System Error:</strong> {errorMessage}
          </div>
        )}

        <div className="chart-container" ref={chartContainerRef} style={{ height: '400px', width: '100%' }}>
          {tradeStatus === 'Initializing...' && !errorMessage && (
            <div className="chart-overlay">Establishing Secure Connection...</div>
          )}
        </div>

        <div className="summary" style={{ marginTop: '30px' }}>
          <h3>Live Trade History</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Price</th>
                <th>Amount</th>
                <th>PnL</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index}>
                  <td>{row.time}</td>
                  <td className={row.type.toLowerCase() === 'buy' ? 'positive' : 'negative'}>
                    {row.type.toUpperCase()}
                  </td>
                  <td>${Number(row.price).toLocaleString()}</td>
                  <td>{row.amount}</td>
                  <td className={Number(row.pnl) >= 0 ? 'positive' : 'negative'}>
                    {Number(row.pnl) >= 0 ? '+' : ''}{Number(row.pnl).toFixed(2)}
                  </td>
                </tr>
              ))}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', opacity: 0.5 }}>Waiting for market signals...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TradingPage;