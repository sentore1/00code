import React, { useState } from 'react';
import ShotCodeV2 from './ShotCodeV2';
import ShotCodeScanner from './ShotCodeScanner';
import AdaptiveShotCode from './AdaptiveShotCode';
import ImigogoShapeCode from './ImigogoShapeCode';
import DualLayerCode from './DualLayerCode';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [mode, setMode] = useState('dual'); // 'encode', 'scan', 'adaptive', 'imigongo', or 'dual'

  return (
    <div className={darkMode ? 'dark' : 'light'}>
      <div className="app-container">
        <header className="app-header">
          <h1>ShotCode</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setMode('dual')}
              style={{
                padding: '8px 16px',
                background: mode === 'dual' ? '#8B4513' : 'transparent',
                color: mode === 'dual' ? 'white' : '#999',
                border: '1px solid #444',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Dual Layer (10K)
            </button>
            <button
              onClick={() => setMode('imigongo')}
              style={{
                padding: '8px 16px',
                background: mode === 'imigongo' ? '#8B4513' : 'transparent',
                color: mode === 'imigongo' ? 'white' : '#999',
                border: '1px solid #444',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Imigongo (5K)
            </button>
            <button
              onClick={() => setMode('adaptive')}
              style={{
                padding: '8px 16px',
                background: mode === 'adaptive' ? '#3b82f6' : 'transparent',
                color: mode === 'adaptive' ? 'white' : '#999',
                border: '1px solid #444',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Adaptive
            </button>
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
              Circular
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
        {mode === 'dual' ? <DualLayerCode /> : mode === 'imigongo' ? <ImigogoShapeCode /> : mode === 'adaptive' ? <AdaptiveShotCode /> : mode === 'encode' ? <ShotCodeV2 /> : <ShotCodeScanner />}
      </div>
    </div>
  );
}

export default App;
