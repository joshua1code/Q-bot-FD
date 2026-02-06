import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { createChart, CrosshairMode, ColorType } from 'lightweight-charts';
import { API_BASE_URL, WSS_API_BASE_URL } from '../Constants';

function TradingPage({ setBalance, setSelectedCurrency }) {
  const location = useLocation();

  const chartContainerRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);

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

  const tradeStatusRef = useRef(tradeStatus);
  useEffect(() => {
    tradeStatusRef.current = tradeStatus;
  }, [tradeStatus]);

  // ───────────────────────────────────────────────
  // WebSocket connection
  // ───────────────────────────────────────────────
  const connectWs = useCallback((sessionId = '') => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const wsUrl = sessionId
      ? `${WSS_API_BASE_URL}/api/trade/chart?qbot_session_id=${encodeURIComponent(sessionId)}`
      : `${WSS_API_BASE_URL}/api/trade/chart`;

    console.log('Connecting to:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket → Connected');
    };

    ws.onmessage = (event) => {
      const raw = event.data;
      if (raw === 'Ready') {
        setTradeStatus('Live Trading Active');
        return;
      }

      if (typeof raw !== 'string' || !raw.trim().startsWith('{')) return;

      try {
        const data = JSON.parse(raw);

        if (data.type === 'chart' && seriesRef.current) {
          const { type, ...candle } = data;
          seriesRef.current.update(candle);
        }

        if (data.type === 'trade_history') {
          setTableData((prev) => [
            {
              time: new Date(data.time * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
              type: data.order_type,
              price: data.price,
              amount: data.amount,
              pnl: data.pnl,
            },
            ...prev.slice(0, 199), // keep last 200 entries max
          ]);
        }

        if (data.status) {
          setTradeStatus(data.status);
        }
      } catch (err) {
        console.error('WS message parse error:', err, raw);
      }
    };

    ws.onerror = (err) => console.error('WebSocket error:', err);
    ws.onclose = (e) => {
      console.log('WebSocket closed', e.code, e.reason);
      // You could add reconnection logic here if desired
    };
  }, []);

  // ───────────────────────────────────────────────
  // Start trading session
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedStock || amount <= 0) {
      setTradeStatus('Invalid parameters');
      setErrorMessage('Stock symbol or amount missing');
      return;
    }

    let isMounted = true;

    const startBot = async () => {
      try {
        const payload = {
          stock_symbol: selectedStock.includes('/') ? selectedStock : `${selectedStock}/USDT`,
          amount: Number(amount),
          currency: 'USD',
          duration: String(timeRange || '60'),
          stop_loss: stopLoss ? Number(stopLoss) : null,
          take_profit: takeProfit ? Number(takeProfit) : null,
        };

        console.log('Starting trade →', payload);

        const res = await fetch(`${API_BASE_URL}/api/trade`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (!res.ok) {
          const msg = result.detail
            ? (Array.isArray(result.detail)
                ? result.detail.map(d => d.msg || d).join(' • ')
                : result.detail?.message || result.message || 'Server error')
            : 'Request failed';
          throw new Error(msg);
        }

        if (isMounted) {
          setBalance?.(result.balance);
          setSelectedCurrency?.(result.currency || 'USD');
          setTradeStatus('Trade Started – Connecting WS');
          connectWs(result.qbot_session_id || '');
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setTradeStatus('Failed to start');
          setErrorMessage(err.message || 'Could not start trading session');
        }
      }
    };

    startBot();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [selectedStock, amount, timeRange, stopLoss, takeProfit, connectWs, setBalance, setSelectedCurrency]);

  // ───────────────────────────────────────────────
  // Chart setup + auto-resize
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 480,
      layout: {
        background: { type: ColorType.Solid, color: '#0f1117' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f2937', visible: true },
        horzLines: { color: '#1f2937', visible: true },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#64748b', width: 1 },
        horzLine: { color: '#64748b', width: 1 },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    seriesRef.current = candlestickSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        chart.applyOptions({ width: entries[0].contentRect.width });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // ───────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────
  return (
    <div className="trading-page-container">
      <div className="trading-header">
        <h1>{selectedStock}/USDT</h1>
        <div className={`status-badge ${tradeStatus.toLowerCase().includes('live') || tradeStatus.toLowerCase().includes('active') ? 'active' : 'inactive'}`}>
          {tradeStatus}
        </div>
      </div>

      {errorMessage && (
        <div className="error-box">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      <div className="chart-section">
        <div className="chart-container" ref={chartContainerRef}>
          {tradeStatus === 'Initializing...' && (
            <div className="chart-loading-overlay">
              Establishing secure connection...
            </div>
          )}
        </div>
      </div>

      <div className="history-section">
        <h2>Trade History</h2>
        <div className="table-wrapper">
          <table className="trade-history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Side</th>
                <th>Price</th>
                <th>Amount</th>
                <th>PnL</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-row">
                    Waiting for trades...
                  </td>
                </tr>
              ) : (
                tableData.map((trade, index) => (
                  <tr key={index}>
                    <td>{trade.time}</td>
                    <td className={trade.type === 'buy' ? 'buy' : 'sell'}>
                      {trade.type.toUpperCase()}
                    </td>
                    <td>${Number(trade.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</td>
                    <td>{trade.amount}</td>
                    <td className={trade.pnl >= 0 ? 'profit' : 'loss'}>
                      {trade.pnl >= 0 ? '+' : ''}{Number(trade.pnl).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TradingPage;