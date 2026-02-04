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

/* ================================
   HERO (AI RESPONSE STYLE)
================================ */
const heroContainer = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.9,   // AI thinking pause
      staggerChildren: 0.55 // calm line-by-line reveal
    }
  }
};

const heroItem = {
  hidden: {
    opacity: 0,
    y: 14
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1] // premium easing
    }
  }
};

/* ================================
   TRADE CARD
================================ */
const tradeCardVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.96
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.85,
      delay: 0.35, // waits after hero finishes
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

function HomePage() {
  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [selectedStock, setSelectedStock] = useState('');
  const [amount, setAmount] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [timeRange, setTimeRange] = useState('');

  const [heroDone, setHeroDone] = useState(false);

  const navigate = useNavigate();

  /* ================================
     FETCH STOCKS
  ================================ */
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoadingStocks(true);
        setFetchError(null);

        const response = await fetch(`${API_BASE_URL}/api/trade/stocks`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to load assets');

        const data = await response.json();
        setStocks(Array.isArray(data) ? data.map(s => s.symbol || s) : []);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoadingStocks(false);
      }
    };

    fetchStocks();
  }, []);

  const handleStartTrade = () => {
    if (!selectedStock || !amount || Number(amount) <= 0) {
      alert('Please select an asset and enter a valid amount');
      return;
    }

    navigate('/trading', {
      state: {
        selectedStock,
        amount: Number(amount),
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        takeProfit: takeProfit ? Number(takeProfit) : undefined,
        timeRange
      }
    });
  };

  return (
    <div className="home-page">
      <div className="home-container">

        {/* ================================
           HERO SUMMARY (AI RESPONSE)
        ================================ */}
        <motion.div
          className="hero-summary"
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          onAnimationComplete={() => setHeroDone(true)}
        >
          <motion.h1 variants={heroItem}>
            {HERO_TITLE}
          </motion.h1>

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

        {/* ================================
           TRADE CARD (AFTER HERO)
        ================================ */}
        <AnimatePresence>
          {heroDone && (
            <motion.div
              className="trade-card"
              variants={tradeCardVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <h2>New Trade</h2>

              <div className="form-group">
                <label>Asset</label>
                {loadingStocks ? (
                  <div className="loading-select">Loading assets...</div>
                ) : fetchError ? (
                  <div className="error-select">{fetchError}</div>
                ) : (
                  <select
                    value={selectedStock}
                    onChange={(e) => setSelectedStock(e.target.value)}
                  >
                    <option value="">Select market...</option>
                    {stocks.map(symbol => (
                      <option key={symbol} value={symbol}>
                        {symbol}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label>Amount (USD)</label>
                <input
                  type="number"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Stop Loss</label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="—"
                  />
                </div>

                <div className="form-group half">
                  <label>Take Profit</label>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="—"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Duration</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="">Select duration...</option>
                  <option value="5m">5 minutes</option>
                  <option value="15m">15 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="4h">4 hours</option>
                  <option value="1d">1 day</option>
                </select>
              </div>

              <button className="start-trade-btn" onClick={handleStartTrade}>
                Start Trade
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default HomePage;
