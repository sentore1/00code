import { useState } from 'react';
import ShotCodeV2 from './ShotCodeV2';
import ShotCodeScanner from './ShotCodeScanner';
import AdaptiveShotCode from './AdaptiveShotCode';
import ImigogoShapeCode from './ImigogoShapeCode';
import DualLayerCode from './DualLayerCode';
import DynamicMorphingCode from './DynamicMorphingCode';
import AdvancedMorphingCode from './AdvancedMorphingCode';
import './App.css';

const MODES = [
  { value: 'advanced',  label: 'Advanced (30K)' },
  { value: 'morphing',  label: 'Morphing' },
  { value: 'dual',      label: 'Dual (10K)' },
  { value: 'imigongo',  label: 'Imigongo (5K)' },
  { value: 'adaptive',  label: 'Adaptive' },
  { value: 'encode',    label: 'Circular' },
  { value: 'scan',      label: 'Scan' },
];

// Pages that manage their own full split layout
const SELF_LAYOUT_MODES = ['morphing', 'dual'];

// Shared NavBar used both inside self-layout pages and in the shell
export const NavBar = ({ mode, onModeChange, darkMode, onDarkModeToggle }) => {
  const [open, setOpen] = useState(false);
  const current = MODES.find(m => m.value === mode)?.label ?? 'Select';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px',
          background: '#ffffff', color: '#111', border: '1px solid #d1d5db',
          borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          outline: 'none', minWidth: '140px', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}>
          <span>{current}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }}/>
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 99,
              background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px',
              overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '160px',
            }}>
              {MODES.map(m => (
                <button key={m.value} onClick={() => { onModeChange(m.value); setOpen(false); }} style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px',
                  border: 'none', outline: 'none', cursor: 'pointer',
                  background: m.value === mode ? '#f4f4f4' : '#fff',
                  color: '#111', fontSize: '13px', fontWeight: m.value === mode ? '600' : '400',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f4f4f4'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = m.value === mode ? '#f4f4f4' : '#fff'; }}
                >{m.label}</button>
              ))}
            </div>
          </>
        )}
      </div>
      <button onClick={onDarkModeToggle} aria-label="Toggle theme" style={{
        width: '38px', height: '38px', border: 'none', borderRadius: '8px',
        background: darkMode ? '#ffffff' : '#111111', color: darkMode ? '#111111' : '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        {darkMode ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>
    </div>
  );
};

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [mode, setMode]         = useState('morphing');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLabel, setPreviewLabel] = useState('');

  const toggleDark = () => setDarkMode(d => !d);

  const handlePreview = (url, label = '') => {
    setPreviewUrl(url);
    setPreviewLabel(label);
  };

  // Reset preview when mode changes
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setPreviewUrl('');
    setPreviewLabel('');
  };

  const t = {
    bg:       darkMode ? '#0f0f0f' : '#ffffff',
    rightBg:  darkMode ? '#141414' : '#f4f4f4',
    border:   darkMode ? '#2a2a2a' : '#e5e5e5',
    text:     darkMode ? '#ffffff' : '#000000',
    textMuted:darkMode ? '#888'    : '#666',
    textDim:  darkMode ? '#555'    : '#999',
  };

  // Morphing & Dual manage their own full layout
  if (mode === 'morphing') {
    return <DynamicMorphingCode darkMode={darkMode} onDarkModeToggle={toggleDark}
      mode={mode} onModeChange={handleModeChange} modes={MODES} />;
  }
  if (mode === 'dual') {
    return <DualLayerCode darkMode={darkMode} onDarkModeToggle={toggleDark}
      mode={mode} onModeChange={handleModeChange} modes={MODES} />;
  }

  // All other pages use the shared split shell
  const pageInfo = {
    advanced: { title: 'Advanced Morphing Code',     subtitle: 'Dynamic ring sections • Living data system • 30K capacity' },
    imigongo: { title: 'Imigongo Shape Code',         subtitle: 'Data encoded in geometric African patterns • 5K capacity' },
    adaptive: { title: 'Adaptive ShotCode',           subtitle: 'Code automatically grows with your data' },
    encode:   { title: 'Circular ShotCode',           subtitle: '240 rings × 360 segments • Ultra high capacity' },
    scan:     { title: 'ShotCode Scanner',            subtitle: 'Point your camera at a ShotCode to scan it' },
  };
  const info = pageInfo[mode] || { title: 'ocode', subtitle: '' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ flex: '0 0 55%', maxWidth: '55%', background: t.bg,
        display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Logo */}
        <div style={{ padding: '32px 56px 0' }}>
          <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.03em', color: t.text }}>
            ocode
          </span>
        </div>

        {/* Page title */}
        <div style={{ padding: '40px 56px 0' }}>
          <h1 style={{ fontSize: '40px', fontWeight: '800', lineHeight: '1.1',
            letterSpacing: '-0.025em', color: t.text, margin: '0 0 12px' }}>
            {info.title}
          </h1>
          <p style={{ fontSize: '14px', color: t.textMuted, margin: '0 0 40px' }}>
            {info.subtitle}
          </p>
        </div>

        {/* Component content */}
        <div style={{ flex: 1, padding: '0 56px 80px' }}>
          {mode === 'advanced' ? <AdvancedMorphingCode onPreviewReady={handlePreview} /> :
           mode === 'imigongo' ? <ImigogoShapeCode onPreviewReady={handlePreview} /> :
           mode === 'adaptive' ? <AdaptiveShotCode onPreviewReady={handlePreview} /> :
           mode === 'encode'   ? <ShotCodeV2 onPreviewReady={handlePreview} /> :
                                 <ShotCodeScanner />}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, background: t.rightBg, borderLeft: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column', padding: '32px 48px 80px' }}>

        {/* Nav top-right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <NavBar mode={mode} onModeChange={handleModeChange} darkMode={darkMode} onDarkModeToggle={toggleDark} />
        </div>

        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', color: t.textDim }}>02</span>
          <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', color: t.textMuted }}>LIVE PREVIEW</span>
        </div>

        {/* Preview or placeholder */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {previewUrl ? (
            <div style={{ width: '100%', maxWidth: '460px' }}>
              {previewLabel && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ padding: '3px 10px', background: darkMode ? '#2a2a2a' : '#f0f0f0',
                    color: darkMode ? '#aaa' : '#555', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                    {previewLabel}
                  </span>
                </div>
              )}
              <img src={previewUrl} alt="Generated code preview"
                style={{ width: '100%', borderRadius: '6px', display: 'block',
                  border: `1px solid ${t.border}`,
                  boxShadow: darkMode ? '0 0 0 1px #2a2a2a' : '0 2px 12px rgba(0,0,0,0.08)' }} />
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: '420px', aspectRatio: '1',
              background: darkMode ? '#1a1a1a' : '#e8e8e8', borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: t.textDim, fontSize: '13px', textAlign: 'center', lineHeight: '1.6', padding: '0 20px' }}>
                Generate a code to see the preview
              </p>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px',
          borderTop: `1px solid ${t.border}`, marginTop: '32px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%',
            background: previewUrl ? '#22c55e' : (darkMode ? '#333' : '#ccc'), marginRight: '8px' }}/>
          <span style={{ fontSize: '12px', color: t.textMuted }}>
            {previewUrl ? 'Ready' : 'Waiting for input'}
          </span>
        </div>
      </div>

    </div>
  );
}

export default App;
