import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createChart, CrosshairMode, ColorType } from 'lightweight-charts'; // Removed CandlestickSeries import
import '../App.css';
import { API_BASE_URL, WSS_API_BASE_URL } from '../Constants';

function TradingPage({ setBalance, setSelectedCurrency }) {
  const location = useLocation();
  const navigate = useNavigate();

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const {
    selectedStock = 'NULL',
    amount = 0,
    stopLoss,
    takeProfit,
    timeRange = 'NULL',
  } = location.state || {};

  const [tableData, setTableData] = useState([]);
  const [tradeStatus, setTradeStatus] = useState('Preparing...');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  // --- 1. START TRADING BOT ---
  useEffect(() => {
    if (!selectedStock || Number(amount) <= 0 || timeRange === 'NULL') {
      setTradeStatus('Incomplete setup');
      return;
    }

    const startBot = async () => {
      setTradeStatus('Starting trade...');
      try {
        const payload = {
          stock_symbol: selectedStock,
          amount: Number(amount),
          ...(Number(timeRange) && { duration: Number(timeRange) }),
          ...(stopLoss && { stop_loss: Number(stopLoss) }),
          ...(takeProfit && { take_profit: Number(takeProfit) }),
        };

        const res = await fetch(`${API_BASE_URL}/api/trade`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Server error: ${res.statusText}`);

        const data = await res.json();
        setBalance(data.balance);
        setSelectedCurrency(data.currency);
        setTradeStatus('Connected'); // Trigger WebSocket
      } catch (err) {
        setTradeStatus('Failed');
        setErrorMessage(err.message);
      }
    };

    startBot();
  }, [selectedStock, amount, stopLoss, takeProfit, timeRange]);

  // --- 2. CHART INITIALIZATION ---
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#0f1117' },
        textColor: '#e0e0e0',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { timeVisible: true },
    });

    // This is the specific fix for the TypeError
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // --- 3. DATA APPLICATION ---
  const applyData = useCallback((data) => {
    if (!data || !seriesRef.current) return;

    if (data.type === 'chart') {
      const { type, ...candle } = data;
      seriesRef.current.update(candle);
    } else if (data.type === 'trade_history') {
      setTableData(prev => [{
        time: new Date(data.time * 1000).toLocaleTimeString(),
        type: data.order_type,
        amount: Number(data.amount),
        price: Number(data.price),
        pnl: Number(data.pnl),
      }, ...prev]);
    }
  }, [tradeStatus, selectedStock]);

  // --- 4. WEBSOCKET LOGIC ---
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = `${WSS_API_BASE_URL.replace(/\/$/, '')}/api/trade/chart`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WS Connected");
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      Array.isArray(data) ? data.forEach(applyData) : applyData(data);
      
      if (data.status === 'completed') {
        setTradeStatus('Completed');
        setShowPopup(true);
      }
    };

    ws.onclose = () => {
      // Exponential backoff
      const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 10000);
      reconnectAttemptsRef.current++;
      reconnectTimerRef.current = setTimeout(connectWs, delay);
    };

    wsRef.current = ws;
  }, [applyData]);

  useEffect(() => {
    if (tradeStatus === 'Connected') {
      connectWs();
    }
    return () => {
      wsRef.current?.close();
      clearTimeout(reconnectTimerRef.current);
    };
  }, [tradeStatus, connectWs]);

  return (
    <div className="trading-page">
      <div className="trading-header">
        <h2>{selectedStock} / USDT</h2>
        <span className={`status-badge ${tradeStatus.toLowerCase()}`}>{tradeStatus}</span>
      </div>

      <div ref={chartContainerRef} className="chart-wrapper" />

      {/* Table and Popup logic remains the same */}
      {showPopup && (
         <div className="modal-overlay">
            <div className="trade-popup">
                <h3>Trade Finalized</h3>
                <button onClick={() => navigate('/')}>Return Home</button>
            </div>
         </div>
      )}
    </div>
  );
}

export default TradingPage;