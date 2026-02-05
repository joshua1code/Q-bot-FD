import React, { useState } from 'react';
import logo from '../assets/trading-bot-logo.png';
import API_BASE_URL from '../Constants';
import '../App.css';

function Navbar({ balance, setBalance, currencies, selectedCurrency, setSelectedCurrency }) {
  const [loading, setLoading] = useState(false);

  const symbol =
    currencies.find(c => c.code === selectedCurrency)?.symbol || '';

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    if (newCurrency === selectedCurrency) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/account/currency`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ currency: newCurrency }),
      });

      if (!res.ok) throw new Error('Currency update failed');

      const data = await res.json();

      setBalance(data.balance);
      setSelectedCurrency(data.currency);
    } catch (err) {
      console.error(err);
      alert('Session expired. Refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="logo-container">
        <img src={logo} alt="Trading Bot Logo" className="navbar-logo" />
        <span className="app-name">TRADING BOT</span>
      </div>

      <div className="navbar-right">
        <select
          className="currency-dropdown"
          value={selectedCurrency}
          onChange={handleCurrencyChange}
          disabled={loading}
        >
          {currencies.map(cur => (
            <option key={cur.code} value={cur.code}>
              {cur.code}
            </option>
          ))}
        </select>

        <div className="balance">
          Balance: {symbol}{balance.toFixed(2)}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
