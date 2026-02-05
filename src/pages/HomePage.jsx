import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../App.css';

import API_BASE_URL from '../Constants';

const HERO_TITLE = 'Start Trading';
const HERO_TAGLINE = [
  'Simple. Fast. Powerful.',
  'Trade stocks, crypto & forex with smart risk controls.',
];

const HERO_PARAGRAPH =
  'Our platform gives you real-time market access, automated take-profit & stop-loss, and clean performance analytics — built for both beginners and experienced traders.';

const heroContainer = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.9,
      staggerChildren: 0.55,
    },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const tradeCardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.85, delay: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

function HomePage() {
  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [selectedStock, setSelectedStock] = useState(null); // object now
  const [amount, setAmount] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [timeRange, setTimeRange] = useState('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [heroDone, setHeroDone] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoadingStocks(true);
        setFetchError(null);

        const res = await fetch(`${API_BASE_URL}/api/trade/stocks`, {
          credentials: 'include',
        });

        if (!res.ok) throw new Error(`Failed to load assets (${res.status})`);

        const data = await res.json();

        const formatted = Array.isArray(data)
          ? data.map(item => ({
              symbol: item.symbol || item.code || item.ticker || '',
              name: item.name || item.fullName || item.symbol || '',
              logo: item.logo || item.icon || getFallbackLogo(item.symbol),
            })).filter(s => s.symbol)
          : [];

        setStocks(formatted);
      } catch (err) {
        console.error(err);
        setFetchError('Could not load markets. Please try again.');
      } finally {
        setLoadingStocks(false);
      }
    };

    fetchStocks();
  }, []);

  const getFallbackLogo = (symbol) => {
    const initial = symbol?.charAt(0)?.toUpperCase() || '?';
    const bg = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    return `https://ui-avatars.com/api/?name=${initial}&background=${bg}&color=fff&size=64`;
  };

  const isFormValid =
    selectedStock?.symbol &&
    amount &&
    Number(amount) > 0 &&
    timeRange;

  const handleStartTrade = () => {
    if (!isFormValid) {
      alert('Please select an asset, enter a valid amount, and choose a duration.');
      return;
    }

    navigate('/trading', {
      state: {
        selectedStock: selectedStock.symbol,
        stockName: selectedStock.name,
        amount: Number(amount),
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        takeProfit: takeProfit ? Number(takeProfit) : undefined,
        timeRange,
      },
    });
  };

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Hero Section */}
        <motion.div
          className="hero-summary"
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          onAnimationComplete={() => setHeroDone(true)}
        >
          <motion.h1 variants={heroItem}>{HERO_TITLE}</motion.h1>
          <motion.p className="tagline" variants={heroItem}>
            {HERO_TAGLINE.map((line, idx) => (
              <span key={idx}>
                {line}
                <br />
              </span>
            ))}
          </motion.p>
          <motion.div className="summary-text" variants={heroItem}>
            <p>{HERO_PARAGRAPH}</p>
          </motion.div>
        </motion.div>

        {/* Trade Card */}
        <AnimatePresence>
          {heroDone && (
            <motion.div
              className="trade-card"
              variants={tradeCardVariants}
              initial="hidden"
              animate="visible"
            >
              <h2>New Trade</h2>

              {/* Custom Dropdown with Logos */}
              <div className="form-group">
                <label>Asset</label>
                {loadingStocks ? (
                  <div className="loading-select">Loading markets...</div>
                ) : fetchError ? (
                  <div className="error-select">{fetchError}</div>
                ) : stocks.length === 0 ? (
                  <div className="error-select">No assets available</div>
                ) : (
                  <div className="custom-select-wrapper">
                    <div
                      className="custom-select-display"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      {selectedStock ? (
                        <>
                          <img
                            src={selectedStock.logo}
                            alt={selectedStock.symbol}
                            className="stock-logo"
                            onError={(e) => (e.target.src = getFallbackLogo(selectedStock.symbol))}
                          />
                          <span>{selectedStock.symbol} — {selectedStock.name}</span>
                        </>
                      ) : (
                        <span>Select asset...</span>
                      )}
                      <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                    </div>

                    {isDropdownOpen && (
                      <div className="custom-select-options">
                        {stocks.map((stock) => (
                          <div
                            key={stock.symbol}
                            className="custom-select-option"
                            onClick={() => {
                              setSelectedStock(stock);
                              setIsDropdownOpen(false);
                            }}
                          >
                            <img
                              src={stock.logo}
                              alt={stock.symbol}
                              className="stock-logo"
                              onError={(e) => (e.target.src = getFallbackLogo(stock.symbol))}
                            />
                            <span>
                              {stock.symbol} — {stock.name || stock.symbol}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="form-group">
                <label>Amount (USD)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="form-row">
                <div className="form-group half">
                  <label>Stop Loss (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="—"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                  />
                </div>
                <div className="form-group half">
                  <label>Take Profit (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="—"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="form-group">
                <label>Duration</label>
                <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                  <option value="">Select duration...</option>
                  <option value="5m">5 minutes</option>
                  <option value="15m">15 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="4h">4 hours</option>
                  <option value="1d">1 day</option>
                </select>
              </div>

              {/* Centered Start Trade Button */}
              <div className="button-center-wrapper">
                <button
                  className="start-trade-btn"
                  onClick={handleStartTrade}
                  disabled={!isFormValid}
                >
                  Start Trade
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default HomePage;