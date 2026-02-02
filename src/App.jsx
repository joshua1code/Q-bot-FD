import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatAssistant from './components/ChatAssistant';
import HomePage from './pages/HomePage';
import TradingPage from './pages/TradingPage';
import AnalysisPage from './pages/AnalysisPage';
import './App.css';

function App() {
  const [balance, setBalance] = useState(0);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasLoadedBefore, setHasLoadedBefore] = useState(false);

  useEffect(() => {
    // Check if site was loaded before
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      setHasLoadedBefore(true);
    }

    // 1. Session / cookie initialization
    fetch('https://qbot.mooo.com/api/account', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('sessionId', data.sessionId);
        setHasLoadedBefore(true);
      })
      .catch(err => console.error('Session API error:', err));

    // 2. Fetch full account details (balance + more)
    fetch('https://qbot.mooo.com/api/account', {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    })
      .then(res => {
        if (!res.ok) throw new Error('Account fetch failed');
        return res.json();
      })
      .then(data => {
        setBalance(data.balance || 0);
        // If your /api/account returns more user info, you can store it here
        console.log('Account details loaded:', data);
      })
      .catch(err => console.error('Account details error:', err));

    // 3. Fetch currencies (your endpoint or fallback)
    fetch('/api/currencies', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const list = data.currencies || [
          { code: 'USD', symbol: '$' },
          { code: 'EUR', symbol: '€' },
          { code: 'GBP', symbol: '£' },
          { code: 'NGN', symbol: '₦' },
        ];
        setCurrencies(list);
        if (!selectedCurrency) setSelectedCurrency(list[0]?.code || 'USD');
      })
      .catch(() => {
        // Fallback if endpoint fails
        setCurrencies([
          { code: 'USD', symbol: '$' },
          { code: 'EUR', symbol: '€' },
          { code: 'GBP', symbol: '£' },
        ]);
      });
  }, []);

  return (
    <Router>
      <div className={`app ${isChatOpen ? 'chat-open' : ''}`}>
        <Navbar
          balance={balance}
          currencies={currencies}
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
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