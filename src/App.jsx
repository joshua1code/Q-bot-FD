import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // Added Link
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import TradingPage from './pages/TradingPage';
import AnalysisPage from './pages/AnalysisPage';
import ChatAssistant from './pages/ChatAssistant';
import { API_BASE_URL } from './Constants';
import './App.css';

function App() {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  
  // Note: isChatOpen state is kept for the Assistant component logic, 
  // but we are using routing for navigation now.
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const initAccount = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/account`, {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!res.ok) throw new Error('Account fetch failed');

        const data = await res.json();
        setBalance(data.balance);
        setCurrency(data.currency);

        setCurrencies([
          { code: data.currency, symbol: data.currency === 'NGN' ? '₦' : '$' },
          ...(data.currency !== 'USD' ? [{ code: 'USD', symbol: '$' }] : []),
          ...(data.currency !== 'NGN' ? [{ code: 'NGN', symbol: '₦' }] : []),
        ]);
      } catch (err) {
        console.error(err);
      }
    };

    initAccount();
  }, []);

  if (!currency) return null;

  return (
    <Router>
      <div className={`app ${isChatOpen ? 'chat-open' : ''}`}>
        <Navbar
          balance={balance}
          setBalance={setBalance}
          currencies={currencies}
          selectedCurrency={currency}
          setSelectedCurrency={setCurrency}
        />

        {/* Floating Chat Button on the Left */}
        <Link to="/chat" className="floating-chat-btn">
          <span>💬</span>
        </Link>

        <main className="main-content">
          <Routes>
            {/* HomePage is now the default landing route */}
            <Route path="/" element={<HomePage />} />
            <Route path="/trading" element={
              <TradingPage 
                balance={balance}
                setBalance={setBalance}
                selectedCurrency={currency}
                setSelectedCurrency={setCurrency}
              />
            } />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/chat" element={<ChatAssistant isOpen={true} setIsOpen={setIsChatOpen} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;