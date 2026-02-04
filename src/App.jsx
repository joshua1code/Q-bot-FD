import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatAssistant from './components/ChatAssistant';
import HomePage from './pages/HomePage';
import TradingPage from './pages/TradingPage';
import AnalysisPage from './pages/AnalysisPage';
import './App.css';

import API_BASE_URL from './Constants';

function App() {
  const [balance, setBalance] = useState(0);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasLoadedBefore, setHasLoadedBefore] = useState(false);

  useEffect(() => {
    setCurrencies([
      { code: 'USD', symbol: '$' },
      { code: 'NGN', symbol: '₦' }
    ]);

    const reqHeaders = {};
    reqHeaders['Content-Type'] = 'application/json';
    reqHeaders['Accept'] = 'application/json';

    fetch(`${API_BASE_URL}/api/account`, {
      credentials: 'include',
      headers: reqHeaders
    })
    .then(res => {
      if (!res.ok) throw new Error('Account fetch failed');
      return res.json();
    })
    .then(data => {
      setBalance(data.balance);
      setSelectedCurrency(data.currency);
    })
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
