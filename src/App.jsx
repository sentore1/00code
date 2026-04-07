import React, { useState } from 'react';
import ShotCodeV2 from './ShotCodeV2';
import ShotCodeScanner from './ShotCodeScanner';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [mode, setMode] = useState('encode'); // 'encode' or 'scan'

  return (
    <div className={darkMode ? 'dark' : 'light'}>
      <div className="app-container">
        <header className="app-header">
          <h1>ShotCode</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setMode('encode')}
              style={{
                padding: '8px 16px',
                background: mode === 'encode' ? '#3b82f6' : 'transparent',
                color: mode === 'encode' ? 'white' : '#999',
                border: '1px solid #444',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Encode
            </button>
            <button
              onClick={() => setMode('scan')}
              style={{
                padding: '8px 16px',
                background: mode === 'scan' ? '#3b82f6' : 'transparent',
                color: mode === 'scan' ? 'white' : '#999',
                border: '1px solid #444',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Scan
            </button>
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>
        {mode === 'encode' ? <ShotCodeV2 /> : <ShotCodeScanner />}
      </div>
    </div>
  );
}

export default App;
