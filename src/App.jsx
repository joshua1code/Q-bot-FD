import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import TradingPage from './pages/TradingPage';
import AnalysisPage from './pages/AnalysisPage';
import ChatAssistant from './components/ChatAssistant';
import API_BASE_URL from './Constants';
import './App.css';

function App() {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState(null);
  const [currencies, setCurrencies] = useState([]);
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

        // build dropdown dynamically
        setCurrencies([
          { code: data.currency, symbol: data.currency === 'NGN' ? '₦' : '$' },
          ...(data.currency !== 'USD'
            ? [{ code: 'USD', symbol: '$' }]
            : []),
          ...(data.currency !== 'NGN'
            ? [{ code: 'NGN', symbol: '₦' }]
            : []),
        ]);
      } catch (err) {
        console.error(err);
      }
    };

    initAccount();
  }, []);

  if (!currency) return null; // wait for session

  return (
    <Router>
      <div className={`app ${isChatOpen ? 'chat-open' : ''}`}>
        <Navbar
          balance={balance}
          currencies={currencies}
          selectedCurrency={currency}
          setSelectedCurrency={setCurrency}
        />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/trading" element={<TradingPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
          </Routes>
        </main>

        <ChatAssistant isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
      </div>
    </Router>
  );
}

export default App;
