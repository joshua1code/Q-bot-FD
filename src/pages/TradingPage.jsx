import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createChart, CrosshairMode, ColorType } from 'lightweight-charts';
import '../App.css';

const API_BASE = 'https://qbot.mooo.com/api/trade';
const WS_URL = 'wss://qbot.mooo.com/api/trade/chart';

function TradingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const {
    selectedStock = 'Unknown',
    amount = 0,
    stopLoss,
    takeProfit,
    timeRange = 'Unknown',
  } = location.state || {};

  const [tableData, setTableData] = useState([]);
  const [tradeStatus, setTradeStatus] = useState('Preparing...');
  const [showPopup, setShowPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. START BOT
  useEffect(() => {
    const startBot = async () => {
      if (!selectedStock || Number(amount) <= 0 || !timeRange) {
        setTradeStatus('Incomplete setup');
        setErrorMessage('Missing required trade parameters.');
        return;
      }

      if (!document.cookie.includes('session_id=')) {
        setTradeStatus('Login required');
        setErrorMessage('Please log in to start a trade.');
        return;
      }

      setTradeStatus('Starting trade...');
      setErrorMessage('');

      try {
        const payload = {
          stock: selectedStock,
          amount: Number(amount),
          currency: 'USD',
          stop_loss: stopLoss ? Number(stopLoss) : null,
          take_profit: takeProfit ? Number(takeProfit) : null,
          duration: timeRange,
        };

        const res = await fetch(API_BASE, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const msg = errData.detail?.map(d => d.msg).join('; ') || res.statusText;
          throw new Error(`Server error ${res.status}: ${msg}`);
        }

        setTradeStatus('Trade started – connecting to chart...');
      } catch (err) {
        console.error('Start bot failed:', err);
        setTradeStatus('Failed to start trade');
        setErrorMessage(err.message);
      }
    };

    startBot();
  }, [selectedStock, amount, stopLoss, takeProfit, timeRange]);

  // 2. Create chart – using safe line series
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
          vertLines: { color: 'rgba(255,255,255,0.08)' },
          horzLines: { color: 'rgba(255,255,255,0.08)' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        timeScale: { timeVisible: true, secondsVisible: false },
      });

      const priceSeries = chart.addLineSeries({
        color: '#26a69a',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });

      chartRef.current = chart;
      seriesRef.current = priceSeries;

      const resizeObserver = new ResizeObserver(() => {
        chart.applyOptions({ width: chartContainerRef.current?.clientWidth || 800 });
      });
      resizeObserver.observe(chartContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        chart.remove();
      };
    } catch (err) {
      console.error('Chart creation failed:', err);
      setErrorMessage('Failed to initialize chart');
    }
  }, []);

  // 3. WebSocket
  useEffect(() => {
    let isMounted = true;

    const connectWs = () => {
      if (!isMounted || tradeStatus === 'Failed to start trade' || tradeStatus === 'Completed') return;

      setTradeStatus('Connecting to live data...');

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WS connected');
        setTradeStatus('Running');
      };

      ws.onmessage = (event) => {
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (Array.isArray(payload)) {
          const points = payload
            .map(c => ({
              time: Math.floor((new Date(c.time || c.timestamp)).getTime() / 1000),
              value: Number(c.close) || 0,
            }))
            .filter(p => p.time > 0)
            .sort((a, b) => a.time - b.time);

          seriesRef.current?.setData(points);
        }

        if (payload?.type === 'trade') {
          setTableData(prev => [{
            time: payload.time || '—',
            type: payload.side || '—',
            amount: Number(payload.amount) || 0,
            price: Number(payload.price) || 0,
            pnl: Number(payload.pnl) || 0,
          }, ...prev]);

          if (payload.close && seriesRef.current) {
            seriesRef.current.update({
              time: Math.floor((new Date(payload.time)).getTime() / 1000),
              value: Number(payload.close),
            });
          }
        }

        if (payload?.status === 'completed') {
          setTradeStatus('Completed');
          setShowPopup(true);
          ws.close();
        }
      };

      ws.onerror = (err) => {
        console.error('WS error:', err);
        setTradeStatus('Connection error – retrying...');
      };

      ws.onclose = () => {
        if (isMounted && tradeStatus !== 'Completed' && tradeStatus !== 'Failed to start trade') {
          setTradeStatus('Reconnecting...');
          reconnectTimerRef.current = setTimeout(connectWs, 5000);
        }
      };
    };

    connectWs();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [tradeStatus, selectedStock]);

  return (
    <div className="trading-page">
      <h2>Live Trading: {selectedStock}</h2>

      <p className="trade-info">
        Amount: ${Number(amount).toFixed(2)} | Duration: {timeRange}
        {stopLoss && ` | Stop Loss: $${Number(stopLoss).toFixed(2)}`}
        {takeProfit && ` | Take Profit: $${Number(takeProfit).toFixed(2)}`}
      </p>

      <p className="trade-status">Status: {tradeStatus}</p>

      {errorMessage && (
        <p style={{ color: '#ff6b6b', margin: '1rem 0', textAlign: 'center' }}>
          {errorMessage}
        </p>
      )}

      <div
        ref={chartContainerRef}
        className="chart-container"
        style={{ height: 400, width: '100%', position: 'relative' }}
      >
        {(tradeStatus.includes('Connecting') || tradeStatus === 'Reconnecting...') && (
          <div className="chart-overlay">Waiting for live chart data...</div>
        )}
      </div>

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
                <td>${row.amount.toFixed(2)}</td>
                <td>${row.price.toFixed(2)}</td>
                <td className={row.pnl >= 0 ? 'positive' : 'negative'}>
                  {row.pnl >= 0 ? '+' : '-'}${Math.abs(row.pnl).toFixed(2)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

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