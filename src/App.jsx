import React, { useState } from 'react';
import ShotCodeV2 from './ShotCodeV2';
import ShotCodeScanner from './ShotCodeScanner';
import AdaptiveShotCode from './AdaptiveShotCode';
import ImigogoShapeCode from './ImigogoShapeCode';
import DualLayerCode from './DualLayerCode';
import DynamicMorphingCode from './DynamicMorphingCode';
import AdvancedMorphingCode from './AdvancedMorphingCode';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [mode, setMode] = useState('advanced'); // Default to advanced

  return (
    <div className={darkMode ? 'dark' : 'light'}>
      <div className="app-container">
        <header className="app-header">
          <h1>00code</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setMode('advanced')}
              style={{
                padding: '8px 16px',
                background: mode === 'advanced' ? '#3b82f6' : 'transparent',
                color: mode === 'advanced' ? 'white' : '#999',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              Advanced (30K)
            </button>
            <button
              onClick={() => setMode('morphing')}
              style={{
                padding: '8px 16px',
                background: mode === 'morphing' ? '#3b82f6' : 'transparent',
                color: mode === 'morphing' ? 'white' : '#999',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              Morphing
            </button>
            <button
              onClick={() => setMode('dual')}
              style={{
                padding: '8px 16px',
                background: mode === 'dual' ? '#3b82f6' : 'transparent',
                color: mode === 'dual' ? 'white' : '#999',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              Dual (10K)
            </button>
            <button
              onClick={() => setMode('imigongo')}
              style={{
                padding: '8px 16px',
                background: mode === 'imigongo' ? '#3b82f6' : 'transparent',
                color: mode === 'imigongo' ? 'white' : '#999',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
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
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
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
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
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
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              Scan
            </button>
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {darkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </header>
        {mode === 'grid' ? <GridCode /> : mode === 'advanced' ? <AdvancedMorphingCode /> : mode === 'morphing' ? <DynamicMorphingCode /> : mode === 'dual' ? <DualLayerCode /> : mode === 'imigongo' ? <ImigogoShapeCode /> : mode === 'adaptive' ? <AdaptiveShotCode /> : mode === 'encode' ? <ShotCodeV2 /> : <ShotCodeScanner />}
      </div>
    </div>
  );
}

export default App;
