import React, { useState } from 'react';
import logo from '../assets/trading-bot-logo.png';
import '../App.css';

function Navbar({ balance, currencies, selectedCurrency, setSelectedCurrency }) {
  const [loading, setLoading] = useState(false);

  const currentSymbol =
    currencies.find(c => c.code === selectedCurrency)?.symbol || '$';

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;

    // Update UI immediately
    setSelectedCurrency(newCurrency);
    setLoading(true);

    try {
      const res = await fetch('https://qbot.mooo.com/api/account/currency', {
        method: 'POST',
        credentials: 'include', // REQUIRED for session cookie
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          currency: newCurrency,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update currency');
      }

      // Optional: read backend response
      // const data = await res.json();
      // console.log('Currency updated:', data);

    } catch (err) {
      console.error(err);
      alert('Currency update failed');

      // Optional rollback if backend fails
      // setSelectedCurrency(selectedCurrency);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="logo-container">
        <img
          src={logo}
          alt="Trading Bot Logo"
          className="navbar-logo"
        />
        <span className="app-name">TRADING BOT</span>
      </div>

      <div className="navbar-right">
        {/* Currency dropdown */}
        <select
          className="currency-dropdown"
          value={selectedCurrency}
          onChange={handleCurrencyChange}
          disabled={loading}
        >
          {currencies.map((cur) => (
            <option key={cur.code} value={cur.code}>
              {cur.code} ({cur.symbol})
            </option>
          ))}
        </select>

        {/* Balance */}
        <div className="balance">
          Balance: {currentSymbol}{balance.toFixed(2)}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
