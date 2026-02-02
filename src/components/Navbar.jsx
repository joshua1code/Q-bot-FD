import React from 'react';
import logo from '../assets/trading-bot-logo.png'; // adjust path if needed
import '../App.css';

function Navbar({ balance, currencies, selectedCurrency, setSelectedCurrency }) {
  const currentSymbol = currencies.find(c => c.code === selectedCurrency)?.symbol || '$';

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
        {/* Currency dropdown - before balance */}
        <select
          className="currency-dropdown"
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
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