import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatAssistant from './components/ChatAssistant';
import HomePage from './pages/HomePage';
import TradingPage from './pages/TradingPage';
import AnalysisPage from './pages/AnalysisPage';
import './App.css';

function App() {
  const [balance, setBalance] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasLoadedBefore, setHasLoadedBefore] = useState(false);

  useEffect(() => {
    // Check localStorage for previous load
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      setHasLoadedBefore(true);
    }

    // API call to backend for cookies/session ID
    fetch('/api/session', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('sessionId', data.sessionId); // Store for future checks
        setHasLoadedBefore(true); // Update if new session
      })
      .catch(err => console.error('Session API error:', err));

    // Fetch balance (shared across pages)
    fetch('/api/balance', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setBalance(data.balance))
      .catch(err => console.error('Balance API error:', err));
  }, []);

  return (
    <Router>
      <div className={`app ${isChatOpen ? 'chat-open' : ''}`}>
        <Navbar balance={balance} />
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