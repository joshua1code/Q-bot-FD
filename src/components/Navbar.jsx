import React from 'react';
import '../App.css'

function Navbar({ balance }) {
  return (
    <nav className="navbar">
      <div className="app-name">Trading App</div>
      <div className="balance">Balance: ${balance.toFixed(2)}</div>
    </nav>
  );
}

export default Navbar;