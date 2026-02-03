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
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) setHasLoadedBefore(true);

    fetch('https://qbot.mooo.com/api/account', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('sessionId', data.sessionId);
        setHasLoadedBefore(true);
      })
      .catch(err => console.error('Session API error:', err));

    fetch('https://qbot.mooo.com/api/account', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then(res => {
        if (!res.ok) throw new Error('Account fetch failed');
        return res.json();
      })
      .then(data => setBalance(data.balance || 0))
      .catch(err => console.error('Account details error:', err));

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
        setSelectedCurrency(list[0]?.code || 'USD');
      })
      .catch(() => {
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
