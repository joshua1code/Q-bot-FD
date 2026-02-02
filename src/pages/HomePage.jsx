  // // src/pages/HomePage.jsx
  // import React, { useState, useEffect } from 'react';
  // import { useNavigate } from 'react-router-dom';
  // import './HomePage.css';

  // const API_BASE = 'https://qbot.mooo.com/api/trade'; // base path from your cURL

  // function HomePage() {
  //   const [stocks, setStocks] = useState([]);
  //   const [loadingStocks, setLoadingStocks] = useState(true);
  //   const [fetchError, setFetchError] = useState(null);

  //   const [selectedStock, setSelectedStock] = useState('');
  //   const [amount, setAmount] = useState('');
  //   const [stopLoss, setStopLoss] = useState('');
  //   const [takeProfit, setTakeProfit] = useState('');
  //   const [timeRange, setTimeRange] = useState('');

  //   const navigate = useNavigate();

  //   // Fetch available stocks from real backend endpoint
  //   useEffect(() => {
  //     const fetchStocks = async () => {
  //       try {
  //         setLoadingStocks(true);
  //         setFetchError(null);

  //         const response = await fetch(`${API_BASE}/stocks`, {
  //           method: 'GET',
  //           credentials: 'include',           // ← sends cookies (including session_id) automatically
  //           headers: {
  //             'Accept': 'application/json',
  //             // If cookie is NOT sent automatically, uncomment and use this instead:
  //             // 'Cookie': 'session_id=999914be1a7418bbcdefa24c16b64883'
  //           },
  //         });

  //         if (!response.ok) {
  //           throw new Error(`Failed to load assets - ${response.status} ${response.statusText}`);
  //         }

  //         const data = await response.json();

  //         // Handle different possible response shapes
  //         let stockList = [];

  //         if (Array.isArray(data)) {
  //           // Case 1: direct array of strings ["AAPL", "TSLA", ...]
  //           if (typeof data[0] === 'string') {
  //             stockList = data;
  //           }
  //           // Case 2: array of objects [{symbol: "..."}, ...]
  //           else if (data[0]?.symbol) {
  //             stockList = data.map(item => item.symbol);
  //           }
  //           // Case 3: maybe wrapped → data.stocks or data.assets
  //           else if (data.stocks || data.assets) {
  //             const nested = data.stocks || data.assets;
  //             stockList = Array.isArray(nested) ? nested.map(s => s.symbol || s) : [];
  //           }
  //         } else if (data && typeof data === 'object') {
  //           // Single object with list inside
  //           stockList = (data.symbols || data.assets || []).map(s => s.symbol || s);
  //         }

  //         if (stockList.length === 0) {
  //           throw new Error('No valid stock symbols found in response');
  //         }

  //         setStocks(stockList);

  //       } catch (err) {
  //         console.error('Fetch stocks failed:', err);
  //         setFetchError(err.message || 'Could not load available markets. Please check your session.');
  //       } finally {
  //         setLoadingStocks(false);
  //       }
  //     };

  //     fetchStocks();
  //   }, []);

  //   const handleStartTrade = () => {
  //     if (!selectedStock || !amount || Number(amount) <= 0) {
  //       alert('Please select an asset and enter a valid amount');
  //       return;
  //     }

  //     navigate('/trading', {
  //       state: {
  //         selectedStock,
  //         amount: Number(amount),
  //         stopLoss: stopLoss ? Number(stopLoss) : undefined,
  //         takeProfit: takeProfit ? Number(takeProfit) : undefined,
  //         timeRange,
  //       },
  //     });
  //   };

  //   return (
  //     <div className="home-page">
  //       <div className="hero-summary">
  //         <h1>Start Trading</h1>
  //         <p className="tagline">
  //           Simple. Fast. Powerful.<br />
  //           Trade stocks, crypto & forex with smart risk controls.
  //         </p>
  //         <div className="summary-text">
  //           <p>
  //             Our platform gives you real-time market access, automated take-profit & stop-loss,
  //             and clean performance analytics — built for both beginners and experienced traders.
  //           </p>
  //         </div>
  //       </div>

  //       <div className="trade-card">
  //         <h2>New Trade</h2>

  //         <div className="form-group">
  //           <label>Asset</label>
  //           {loadingStocks ? (
  //             <div className="loading-select">Loading available assets...</div>
  //           ) : fetchError ? (
  //             <div className="error-select">
  //               {fetchError}
  //               <br />
  //               <small>(Session may have expired — try logging in again)</small>
  //             </div>
  //           ) : stocks.length === 0 ? (
  //             <div className="empty-select">No assets available at the moment</div>
  //           ) : (
  //             <select
  //               value={selectedStock}
  //               onChange={(e) => setSelectedStock(e.target.value)}
  //             >
  //               <option value="">Select market...</option>
  //               {stocks.map((symbol) => (
  //                 <option key={symbol} value={symbol}>
  //                   {symbol}
  //                 </option>
  //               ))}
  //             </select>
  //           )}
  //         </div>

  //         <div className="form-group">
  //           <label>Amount (USD)</label>
  //           <input
  //             type="number"
  //             placeholder="100.00"
  //             value={amount}
  //             onChange={(e) => setAmount(e.target.value)}
  //             min="10"
  //             step="0.01"
  //           />
  //         </div>

  //         <div className="form-row">
  //           <div className="form-group half">
  //             <label>Stop Loss</label>
  //             <input
  //               type="number"
  //               placeholder="—"
  //               value={stopLoss}
  //               onChange={(e) => setStopLoss(e.target.value)}
  //             />
  //           </div>
  //           <div className="form-group half">
  //             <label>Take Profit</label>
  //             <input
  //               type="number"
  //               placeholder="—"
  //               value={takeProfit}
  //               onChange={(e) => setTakeProfit(e.target.value)}
  //             />
  //           </div>
  //         </div>

  //         <div className="form-group">
  //           <label>Duration</label>
  //           <select
  //             value={timeRange}
  //             onChange={(e) => setTimeRange(e.target.value)}
  //           >
  //             <option value="">Select duration...</option>
  //             <option value="5m">5 minutes</option>
  //             <option value="15m">15 minutes</option>
  //             <option value="1h">1 hour</option>
  //             <option value="4h">4 hours</option>
  //             <option value="1d">1 day</option>
  //           </select>
  //         </div>

  //         <button
  //           className="start-trade-btn"
  //           onClick={handleStartTrade}
  //           disabled={loadingStocks || fetchError || !selectedStock || !amount}
  //         >
  //           {loadingStocks ? 'Loading...' : 'Start Trade'}
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // export default HomePage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../App.css';

const API_BASE = 'https://qbot.mooo.com/api/trade';

/* ================================
   FRAMER MOTION VARIANTS
================================ */
const heroVariants = {
  hidden: {
    opacity: 0,
    x: -60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.9,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.18,
    },
  },
};

const heroItem = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
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

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoadingStocks(true);
        setFetchError(null);

        const response = await fetch(`${API_BASE}/stocks`, {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to load assets');
        }

        const data = await response.json();
        const stockList = Array.isArray(data)
          ? data.map(s => s.symbol || s)
          : [];

        setStocks(stockList);
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
        timeRange,
      },
    });
  };

  return (
    <div className="home-page">
      <div className="home-container">

        {/* ================================
           HERO SUMMARY (ANIMATED)
        ================================ */}
        <motion.div
          className="hero-summary"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={heroItem}>
            Start Trading
          </motion.h1>

          <motion.p className="tagline" variants={heroItem}>
            Simple. Fast. Powerful.<br />
            Trade stocks, crypto & forex with smart risk controls.
          </motion.p>

          <motion.div className="summary-text" variants={heroItem}>
            <p>
              Our platform gives you real-time market access, automated take-profit &
              stop-loss, and clean performance analytics — built for both beginners
              and experienced traders.
            </p>
          </motion.div>
        </motion.div>

        {/* ================================
           TRADE CARD (STATIC)
        ================================ */}
        <div className="trade-card">
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
        </div>

      </div>
    </div>
  );
}

export default HomePage;
