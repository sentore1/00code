import React, { useState } from 'react';
import ShotCodeV2 from './ShotCodeV2';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={darkMode ? 'dark' : 'light'}>
      <div className="app-container">
        <header className="app-header">
          <h1>ShotCode</h1>
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>
        <ShotCodeV2 />
      </div>
    </div>
  );
}

export default App;
