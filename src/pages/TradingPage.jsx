import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createChart, CandlestickSeries, CrosshairMode, ColorType } from 'lightweight-charts';
import '../App.css';

import {API_BASE_URL, WSS_API_BASE_URL} from '../Constants';

function TradingPage({ setBalance, setSelectedCurrency }) {
  const location = useLocation();
  const navigate = useNavigate();

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const {
    selectedStock = 'NULL',
    amount = 0,
    stopLoss,
    takeProfit,
    timeRange = 'NULL',
    currency,
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

      setTradeStatus('Starting trade...');
      setErrorMessage('');

      try {
        const payload = {
          stock_symbol: selectedStock,
          amount: Number(amount),
          stop_loss: stopLoss ? Number(stopLoss) : null,
          take_profit: takeProfit ? Number(takeProfit) : null,
          duration: timeRange,
        };

        const res = await fetch(`${API_BASE_URL}/api/trade`, {
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

        const data = await res.json();

        setBalance(data.balance);
        setSelectedCurrency(data.currency);

        setTradeStatus('Trade started – connecting to chart...');
      } catch (err) {
        console.error('Start bot failed:', err);
        setTradeStatus('Failed to start trade');
        setErrorMessage(err.message);
      }
    };

    startBot();
  }, [selectedStock, amount, stopLoss, takeProfit, timeRange]);

  // 2. Create chart – using candlestick series
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { type: ColorType.Solid, color: '#0f1117' },
          textColor: '#e0e0e0',
          attributionLogo: false
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.08)' },
          horzLines: { color: 'rgba(255,255,255,0.08)' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        timeScale: { timeVisible: true, secondsVisible: false },
      });

      chart.timeScale().fitContent()

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        priceLineVisible: false,
        lastValueVisible: false,
        upColor: '#26a69a',
        downColor: '#ef5350'
      });

      chartRef.current = chart;
      seriesRef.current = candlestickSeries;

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
  }, [tradeStatus, selectedStock]);

  // 3. WebSocket
  useEffect(() => {
    let isMounted = true;

    const applyData = (data) => {
      if(data?.type === 'chart'){
        delete data.type;
        seriesRef.current.update(data);
      }else if(data?.type === 'trade'){
        seriesRef.current.setMarkers([{
          time: data.time,
          position: data.order_type === 'BUY' ? 'belowBar' : 'aboveBar',
          color: data.order_type === 'BUY' ? '#26a69a' : '#ef5350',
          shape: data.order_type === 'BUY' ? 'arrowUp' : 'arrowDown',
          text: data.info
        }]);
      }else if(data?.type === 'trade_history'){
        setTableData(prev => [{
          time: (new Date(data.time * 1000)).toLocaleString(),
          type: data.order_type,
          amount: Number(data.amount),
          price: Number(data.price),
          pnl: Number(data.pnl)
        }, ...prev]);
      }else if(data?.type === 'balance'){
        setBalance(balance);
        setSelectedCurrency(currency);
      }
    };

    const connectWs = () => {
      if (!isMounted || tradeStatus === 'Failed to start trade' || tradeStatus === 'Completed') return;

      setTradeStatus('Connecting to live data...');
      wsRef.current = new WebSocket(`${WSS_API_BASE_URL}/api/trade/chart`);

      wsRef.current.onopen = () => {
        console.log('WS connected');
        setTradeStatus('Running');
      };

      wsRef.current.onmessage = (event) => {
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (payload){
          if(Array.isArray(payload)){
            for(var i = 0;i < payload.length;i++){
              applyData();
            }
          }else{
            applyData(payload);
          }
        }

        if (payload?.status === 'completed') {
          setTradeStatus('Completed');
          setShowPopup(true);
          wsRef.current.close();
        }
      };

      wsRef.current.onerror = (err) => {
        console.error('WS error:', err);
        setTradeStatus('Connection error – retrying...');
      };

      wsRef.current.onclose = () => {
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
  }, []);

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