import React, { useState } from 'react';
import ShotCodeV2 from './ShotCodeV2';
import ShotCodeScanner from './ShotCodeScanner';
import AdaptiveShotCode from './AdaptiveShotCode';
import ImigogoShapeCode from './ImigogoShapeCode';
import DualLayerCode from './DualLayerCode';
import DynamicMorphingCode from './DynamicMorphingCode';
import AdvancedMorphingCode from './AdvancedMorphingCode';
import SimpleMorphingCode from './SimpleMorphingCode';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [mode, setMode] = useState('advanced'); // Default to advanced

  return (
    <div className={darkMode ? 'dark' : 'light'}>
      <div className="app-container">
        <header className="app-header">
          <h1>ShotCode</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setMode('advanced')}
              style={{
                padding: '8px 16px',
                background: mode === 'advanced' ? '#9333ea' : 'transparent',
                color: mode === 'advanced' ? 'white' : '#999',
                border: '1px solid #444',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Advanced (20K)
            </button>
            <button
              onClick={() => setMode('simple')}
              style={{
                padding: '8px 16px',
                background: mode === 'simple' ? '#f59e0b' : 'transparent',
                color: mode === 'simple' ? 'white' : '#999',
                border: '1px solid #444',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Simple (5K)
            </button>
            <button
              onClick={() => setMode('morphing')}
              style={{
                padding: '8px 16px',
                background: mode === 'morphing' ? '#10b981' : 'transparent',
                color: mode === 'morphing' ? 'white' : '#999',
                border: '1px solid #444',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Morphing
            </button>
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
              Dual (10K)
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
        {mode === 'grid' ? <GridCode /> : mode === 'advanced' ? <AdvancedMorphingCode /> : mode === 'simple' ? <SimpleMorphingCode /> : mode === 'morphing' ? <DynamicMorphingCode /> : mode === 'dual' ? <DualLayerCode /> : mode === 'imigongo' ? <ImigogoShapeCode /> : mode === 'adaptive' ? <AdaptiveShotCode /> : mode === 'encode' ? <ShotCodeV2 /> : <ShotCodeScanner />}
      </div>
    </div>
  );
}

export default App;
