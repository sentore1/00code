import { useState, useRef } from 'react';

const MorphingDropdown = ({ mode, onModeChange, modes, darkMode, onDarkModeToggle }) => {
  const [open, setOpen] = useState(false);
  const currentLabel = modes?.find(m => m.value === mode)?.label ?? 'Morphing';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Pill dropdown — always white */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px',
            background: '#ffffff', color: '#111111', border: '1px solid #d1d5db',
            borderRadius: '10px', fontSize: '13px', fontWeight: '500',
            cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap',
            minWidth: '130px', justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <span>{currentLabel}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 99,
              background: '#ffffff', border: '1px solid #e5e5e5',
              borderRadius: '10px', overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '160px',
            }}>
              {(modes || []).map(m => (
                <button key={m.value}
                  onClick={() => { onModeChange?.(m.value); setOpen(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 16px', border: 'none', outline: 'none',
                    background: m.value === mode ? '#f4f4f4' : '#ffffff',
                    color: '#111', fontSize: '13px',
                    fontWeight: m.value === mode ? '500' : '400', cursor: 'pointer',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f4f4f4'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = m.value === mode ? '#f4f4f4' : '#ffffff'; }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Dark mode toggle */}
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

const DynamicMorphingCode = ({ darkMode, onDarkModeToggle, mode, onModeChange, modes }) => {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [decodeError, setDecodeError] = useState('');
  const [decodeInfo, setDecodeInfo] = useState(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [morphShape, setMorphShape] = useState('diamond');
  const [rotationAngle, setRotationAngle] = useState(0);
  const [activeTab, setActiveTab] = useState('encode');
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const SHAPE_TYPES = ['diamond', 'triangle', 'hexagon', 'chevron'];
  const CONFIG = {
    canvasSize: 2000,
    useCompression: true,
    rings: 50,
    innerRadius: 150,
    outerRadius: 950,
  };

  // ── helpers ──────────────────────────────────────────────────────────────
  const compress = (text) => {
    let result = '', i = 0;
    while (i < text.length) {
      if (text[i] === ' ') {
        let count = 1;
        while (i + count < text.length && text[i + count] === ' ' && count < 255) count++;
        result += count >= 3 ? '\x01' + String.fromCharCode(count) : ' '.repeat(count);
        i += count;
      } else { result += text[i++]; }
    }
    return result;
  };

  const decompress = (c) => {
    let result = '', i = 0;
    while (i < c.length) {
      if (c.charCodeAt(i) === 1) { result += ' '.repeat(c.charCodeAt(i + 1)); i += 2; }
      else { result += c[i++]; }
    }
    return result;
  };

  const textToBinary = (text) => {
    const bytes = new TextEncoder().encode(text);
    return Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join('');
  };

  const binaryToText = (binary) => {
    const bytes = [];
    for (let i = 0; i + 8 <= binary.length; i += 8)
      bytes.push(parseInt(binary.substring(i, i + 8), 2));
    try { return new TextDecoder('utf-8').decode(new Uint8Array(bytes)); } catch { return ''; }
  };

  const decodeLengthWithRedundancy = (b) => {
    if (b.length < 48) return 0;
    const [l1, l2, l3] = [parseInt(b.substring(0,16),2), parseInt(b.substring(16,32),2), parseInt(b.substring(32,48),2)];
    if (l1===l2||l1===l3) return l1;
    if (l2===l3) return l2;
    return [l1,l2,l3].sort((a,b)=>a-b)[1];
  };

  const drawShape = (ctx, x, y, angle, size, bit, shapeType) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle);
    ctx.fillStyle = bit === '1' ? '#000000' : '#FFFFFF';
    ctx.strokeStyle = '#555'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    if (shapeType === 'diamond') {
      ctx.moveTo(0,-size); ctx.lineTo(size,0); ctx.lineTo(0,size); ctx.lineTo(-size,0);
    } else if (shapeType === 'triangle') {
      ctx.moveTo(0,-size); ctx.lineTo(size*.866,size*.5); ctx.lineTo(-size*.866,size*.5);
    } else if (shapeType === 'hexagon') {
      for (let i=0;i<6;i++){const a=(Math.PI/3)*i; i===0?ctx.moveTo(size*Math.cos(a),size*Math.sin(a)):ctx.lineTo(size*Math.cos(a),size*Math.sin(a));}
    } else if (shapeType === 'chevron') {
      ctx.moveTo(-size,-size); ctx.lineTo(0,0); ctx.lineTo(size,-size); ctx.lineTo(size,size); ctx.lineTo(-size,size);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  };

  const encode = (overrides = {}) => {
    if (!inputText || !canvasRef.current) return;
    // Allow simulateScan to pass new values directly, bypassing async state
    const useScanCount    = overrides.scanCount    !== undefined ? overrides.scanCount    : scanCount;
    const useMorphShape   = overrides.morphShape   !== undefined ? overrides.morphShape   : morphShape;
    const useRotation     = overrides.rotationAngle !== undefined ? overrides.rotationAngle : rotationAngle;
    const isSimulate      = overrides._simulate === true;
    if (isSimulate) setIsSimulating(true); else setIsGenerating(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const { canvasSize, rings, innerRadius, outerRadius } = CONFIG;
      canvas.width = canvasSize; canvas.height = canvasSize;
      ctx.imageSmoothingEnabled = false;

      const textToEncode = CONFIG.useCompression ? compress(inputText) : inputText;
      const bytes = new TextEncoder().encode(textToEncode);
      const lb = bytes.length.toString(2).padStart(16,'0');
      const scanCountBits = (useScanCount%256).toString(2).padStart(8,'0');
      const shapeBits = SHAPE_TYPES.indexOf(useMorphShape).toString(2).padStart(3,'0');
      let fullBinary = lb+lb+lb + scanCountBits + shapeBits + textToBinary(textToEncode);

      const ringWidth = (outerRadius - innerRadius) / rings;
      let totalCapacity = 0;
      for (let ring=rings-1; ring>=0; ring--) {
        const r = innerRadius + ring*ringWidth + ringWidth/2;
        totalCapacity += Math.floor((2*Math.PI*r) / (ringWidth*0.4*2.2));
      }
      for (let i=fullBinary.length; i<totalCapacity; i++) fullBinary += (i%2).toString();

      ctx.fillStyle='#FFF'; ctx.fillRect(0,0,canvasSize,canvasSize);
      const center = canvasSize/2;
      ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(center,center,130,0,Math.PI*2); ctx.fill();

      let bitIndex=0;
      for (let ring=rings-1; ring>=0 && bitIndex<fullBinary.length; ring--) {
        const r = innerRadius + ring*ringWidth + ringWidth/2;
        const shapeSize = ringWidth*0.4;
        const numShapes = Math.floor((2*Math.PI*r) / (shapeSize*2.2));
        for (let i=0; i<numShapes && bitIndex<fullBinary.length; i++) {
          const angle = (i/numShapes)*Math.PI*2;
          drawShape(ctx, center+r*Math.cos(angle), center+r*Math.sin(angle),
            angle+Math.PI/2+(useRotation*Math.PI/180), shapeSize, fullBinary[bitIndex], useMorphShape);
          bitIndex++;
        }
      }
      ctx.strokeStyle='#000'; ctx.lineWidth=15;
      ctx.beginPath(); ctx.arc(center,center,960,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='#333'; ctx.font='bold 24px Arial'; ctx.textAlign='center';
      ctx.fillText(`Scan #${useScanCount} | Shape: ${useMorphShape}`, center, canvasSize-30);

      setPreviewUrl(canvas.toDataURL('image/png'));
      setIsGenerated(true);
      if (isSimulate) setIsSimulating(false); else setIsGenerating(false);
    }, 50);
  };

  const decodeLayer = (ctx, width, height) => {
    const { data } = ctx.getImageData(0, 0, width, height);
    const px = (x,y) => { const p=Math.round(x), q=Math.round(y); if(p<0||p>=width||q<0||q>=height) return 255; const i=(q*width+p)*4; return (data[i]+data[i+1]+data[i+2])/3; };
    const center=width/2, scale=width/CONFIG.canvasSize;
    const bs=[],ws=[];
    for(let i=0;i<20;i++){const a=(i/20)*Math.PI*2; bs.push(px(center+65*scale*Math.cos(a),center+65*scale*Math.sin(a))); ws.push(px(center+970*scale*Math.cos(a),center+970*scale*Math.sin(a)));}
    const threshold=(bs.reduce((a,b)=>a+b,0)/20 + ws.reduce((a,b)=>a+b,0)/20)/2;
    let binary='';
    const { rings,innerRadius,outerRadius } = CONFIG;
    const ri=innerRadius*scale, ro=outerRadius*scale, rw=(ro-ri)/rings;
    for(let ring=rings-1;ring>=0;ring--){
      const r=ri+ring*rw+rw/2, ss=rw*0.4;
      const n=Math.floor((2*Math.PI*r)/(ss*2.2));
      for(let i=0;i<n;i++){
        const angle=(i/n)*Math.PI*2, x=center+r*Math.cos(angle), y=center+r*Math.sin(angle);
        let bc=0,wc=0;
        for(let gx=0;gx<15;gx++) for(let gy=0;gy<15;gy++){const b=px(x+(gx-7.5)*(ss/7.5),y+(gy-7.5)*(ss/7.5)); b<threshold?bc++:wc++;}
        binary += bc>wc?'1':'0';
      }
    }
    const byteLength=decodeLengthWithRedundancy(binary);
    if(byteLength>12000||byteLength===0) throw new Error('Invalid data — is this a Dynamic Morphing Code image?');
    const decScanCount=parseInt(binary.substring(48,56),2);
    const decShape=SHAPE_TYPES[parseInt(binary.substring(56,59),2)]||'unknown';
    const raw=binaryToText(binary.substring(59,59+byteLength*8));
    return { text: CONFIG.useCompression?decompress(raw):raw, scanCount:decScanCount, shape:decShape };
  };

  const handleFileUpload = (e) => {
    const file=e.target.files[0]; if(!file) return;
    setIsDecoding(true); setDecodedText(''); setDecodeError(''); setDecodeInfo(null);
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const img=new Image();
      img.onload=()=>{
        const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
        const ctx=c.getContext('2d'); ctx.drawImage(img,0,0);
        try {
          const result=decodeLayer(ctx,img.width,img.height);
          setDecodedText(result.text); setDecodeInfo({scanCount:result.scanCount,shape:result.shape,chars:result.text.length});
          const ns=result.scanCount+1; setScanCount(ns);
          const ni=(SHAPE_TYPES.indexOf(result.shape)+1)%SHAPE_TYPES.length; setMorphShape(SHAPE_TYPES[ni]);
          setRotationAngle((result.scanCount*45)%360);
        } catch(err){ setDecodeError(err.message); }
        setIsDecoding(false);
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file); e.target.value='';
  };

  const download = () => {
    if(!previewUrl) return;
    const a=document.createElement('a'); a.download=`morphing-code-scan${scanCount}.png`; a.href=previewUrl; a.click();
  };

  const simulateScan = () => {
    if (!isGenerated) return; // nothing to simulate yet
    const ns = scanCount + 1;
    const ni = (SHAPE_TYPES.indexOf(morphShape) + 1) % SHAPE_TYPES.length;
    const newShape = SHAPE_TYPES[ni];
    const newRotation = (ns * 45) % 360;
    // Update state for display
    setScanCount(ns);
    setMorphShape(newShape);
    setRotationAngle(newRotation);
    // Immediately regenerate with new values (state updates are async so pass directly)
    encode({ scanCount: ns, morphShape: newShape, rotationAngle: newRotation, _simulate: true });
  };


  // ── theme tokens ─────────────────────────────────────────────────────────
  const t = darkMode ? {
    bg:         '#0f0f0f',
    panelBg:    '#1a1a1a',
    rightBg:    '#141414',
    border:     '#2a2a2a',
    text:       '#ffffff',
    textMuted:  '#888888',
    textDim:    '#555555',
    inputBg:    '#0f0f0f',
    inputBorder:'#333333',
    inputText:  '#ffffff',
    inputPlaceholder: '#444444',
    btnBg:      '#ffffff',
    btnText:    '#000000',
    previewBg:  '#1f1f1f',
    chipBg:     '#2a2a2a',
    chipText:   '#aaaaaa',
    tabActive:  '#ffffff',
    tabInactive:'#555555',
    tabBorder:  '#2a2a2a',
    stepLabel:  '#555555',
    sectionNum: '#555555',
    previewLabel:'#666666',
    timerBg:    '#2a2a2a',
    timerText:  '#aaaaaa',
    uploadBorder:'#333333',
    errorBg:    '#2a0a0a',
    errorBorder:'#5a1a1a',
    errorText:  '#ff6b6b',
    resultBg:   '#1f1f1f',
    decodedBg:  '#141414',
  } : {
    bg:         '#ffffff',
    panelBg:    '#ffffff',
    rightBg:    '#f4f4f4',
    border:     '#e5e5e5',
    text:       '#000000',
    textMuted:  '#666666',
    textDim:    '#999999',
    inputBg:    '#ffffff',
    inputBorder:'#d1d5db',
    inputText:  '#111827',
    inputPlaceholder: '#9ca3af',
    btnBg:      '#000000',
    btnText:    '#ffffff',
    previewBg:  '#ffffff',
    chipBg:     '#f0f0f0',
    chipText:   '#555555',
    tabActive:  '#000000',
    tabInactive:'#aaaaaa',
    tabBorder:  '#e5e5e5',
    stepLabel:  '#999999',
    sectionNum: '#999999',
    previewLabel:'#999999',
    timerBg:    '#e8e8e8',
    timerText:  '#555555',
    uploadBorder:'#d1d5db',
    errorBg:    '#fff5f5',
    errorBorder:'#fecaca',
    errorText:  '#dc2626',
    resultBg:   '#f8f8f8',
    decodedBg:  '#ffffff',
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background: t.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ flex:'0 0 45%', maxWidth:'45%', padding:'16px 56px 80px', background: t.panelBg, display:'flex', flexDirection:'column' }}>

        {/* Logo — top of left panel */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '20px', fontWeight: '500', letterSpacing: '-0.03em', color: t.text,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            ocode
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize:'56px', fontWeight:'700', lineHeight:'1.0', letterSpacing:'-0.03em', color: t.text, margin:'0 0 16px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
          Dynamic<br/>Morphing<br/>Code
        </h1>
        <p style={{ fontSize:'15px', color: t.textMuted, margin:'0 0 56px', lineHeight:'1.5' }}>
          Code changes shape &amp; rotation with each scan.
        </p>

        {/* Tab switcher */}
        <div style={{ display:'flex', gap:'0', borderBottom:`1px solid ${t.tabBorder}`, marginBottom:'36px' }}>
          {[['encode','encode'], ['decode','decode image']].map(([key, label]) => (
            <button key={key} onClick={()=>setActiveTab(key)} style={{
              padding:'10px 0', marginRight:'28px', background:'transparent', border:'none',
              borderBottom: activeTab===key ? `2px solid ${t.tabActive}` : '2px solid transparent',
              color: activeTab===key ? t.tabActive : t.tabInactive,
              fontSize:'13px', fontWeight:'600', letterSpacing:'0.04em', textTransform:'uppercase',
              cursor:'pointer', marginBottom:'-1px', transition:'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── ENCODE PANEL ── */}
        {activeTab === 'encode' && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color: t.stepLabel }}>01</span>
              <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color: t.stepLabel }}>ENCODE MESSAGE</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e)=>setInputText(e.target.value)}
              placeholder="Type your secret message..."
              maxLength={5000}
              style={{
                width:'100%', minHeight:'180px', padding:'16px', fontSize:'14px', lineHeight:'1.6',
                background: t.inputBg, color: t.inputText, border:`1px solid ${t.inputBorder}`,
                borderRadius:'8px', resize:'vertical', outline:'none', fontFamily:'inherit',
                boxSizing:'border-box', transition:'border-color 0.15s',
              }}
            />
            <div style={{ textAlign:'right', fontSize:'12px', color: t.textDim, margin:'6px 0 24px' }}>
              {inputText.length} / 5,000 characters
            </div>
            <button
              onClick={encode}
              disabled={!inputText || isGenerating}
              style={{
                width:'100%', padding:'18px 24px', background: (!inputText||isGenerating) ? (darkMode?'#2a2a2a':'#e0e0e0') : t.btnBg,
                color: (!inputText||isGenerating) ? t.textDim : t.btnText,
                border:'none', borderRadius:'0', fontSize:'13px', fontWeight:'700',
                letterSpacing:'0.08em', textTransform:'uppercase', cursor: (!inputText||isGenerating)?'not-allowed':'pointer',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                transition:'all 0.15s',
              }}
            >
              <span style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                {isGenerating && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                )}
                {isGenerating ? 'Generating...' : 'Generate Code'}
              </span>
              {!isGenerating && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </button>
            {/* hidden canvas */}
            <canvas ref={canvasRef} style={{ display:'none' }} />
          </>
        )}

        {/* ── DECODE PANEL ── */}
        {activeTab === 'decode' && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color: t.stepLabel }}>01</span>
              <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color: t.stepLabel }}>UPLOAD IMAGE</span>
            </div>
            <div
              onClick={()=>fileInputRef.current?.click()}
              onDragOver={e=>{ e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={()=>setIsDragOver(false)}
              onDrop={e=>{ e.preventDefault(); setIsDragOver(false); const file=e.dataTransfer.files[0]; if(file&&file.type.startsWith('image/')) handleFileUpload({target:{files:[file],value:''}});}}
              style={{
                border:`2px dashed ${isDragOver ? (darkMode?'#ffffff':'#000000') : t.uploadBorder}`,
                borderRadius:'8px', padding:'48px 24px',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                cursor:'pointer', background: isDragOver ? (darkMode?'#1f1f1f':'#f0f0f0') : t.inputBg,
                marginBottom:'24px', transition:'border-color 0.15s, background 0.15s',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isDragOver?(darkMode?'#ffffff':'#000000'):t.textDim} strokeWidth="1.5" style={{ marginBottom:'12px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <p style={{ margin:'0 0 4px', fontSize:'13px', fontWeight:'600', color: t.text }}>
                {isDragOver ? 'Drop image here' : 'Click or drag & drop image'}
              </p>
              <p style={{ margin:0, fontSize:'12px', color: t.textDim }}>PNG, JPG, WEBP</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display:'none' }} />
            <button
              onClick={()=>fileInputRef.current?.click()}
              disabled={isDecoding}
              style={{
                width:'100%', padding:'18px 24px', background: isDecoding ? (darkMode?'#2a2a2a':'#e0e0e0') : t.btnBg,
                color: isDecoding ? t.textDim : t.btnText,
                border:'none', borderRadius:'0', fontSize:'13px', fontWeight:'700',
                letterSpacing:'0.08em', textTransform:'uppercase', cursor: isDecoding?'not-allowed':'pointer',
                display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all 0.15s',
              }}
            >
              <span style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                {isDecoding && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                )}
                {isDecoding ? 'Decoding...' : 'Decode Image'}
              </span>
              {!isDecoding && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </button>

            {decodeError && (
              <div style={{ marginTop:'20px', padding:'14px 16px', background: t.errorBg, border:`1px solid ${t.errorBorder}`, borderRadius:'6px', color: t.errorText, fontSize:'13px', display:'flex', gap:'8px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0, marginTop:'1px' }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {decodeError}
              </div>
            )}

            {decodedText && !decodeError && (
              <div style={{ marginTop:'24px', padding:'20px', background: t.resultBg, border:`1px solid ${t.border}`, borderRadius:'8px' }}>
                {decodeInfo && (
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'14px' }}>
                    {[`Scan #${decodeInfo.scanCount}`, `Shape: ${decodeInfo.shape}`, `${decodeInfo.chars} chars`].map(chip => (
                      <span key={chip} style={{ padding:'3px 10px', background: t.chipBg, color: t.chipText, borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>{chip}</span>
                    ))}
                  </div>
                )}
                <p style={{ margin:'0 0 8px', fontSize:'11px', fontWeight:'700', letterSpacing:'0.08em', color: t.textDim }}>DECODED MESSAGE</p>
                <div style={{ padding:'12px 14px', background: t.decodedBg, border:`1px solid ${t.border}`, borderRadius:'6px', fontFamily:'monospace', fontSize:'13px', lineHeight:'1.6', maxHeight:'200px', overflowY:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word', color: t.text }}>
                  {decodedText}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex:'1', background: t.rightBg, display:'flex', flexDirection:'column', padding:'16px 56px 80px', borderLeft:`1px solid ${t.border}` }}>

        {/* Top row: nav controls right-aligned */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'24px' }}>
          {/* Dropdown pill */}
          <MorphingDropdown
            mode={mode} onModeChange={onModeChange} modes={modes}
            darkMode={darkMode} onDarkModeToggle={onDarkModeToggle}
          />
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px' }}>
          <span style={{ fontSize:'11px', fontWeight:'400', letterSpacing:'0.1em', color: t.sectionNum }}>02</span>
          <span style={{ fontSize:'11px', fontWeight:'400', letterSpacing:'0.1em', color: t.previewLabel }}>LIVE MORPHING PREVIEW</span>
        </div>

        <div style={{ flex:'1', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {isGenerated && previewUrl ? (
            <img src={previewUrl} alt="Morphing code preview" style={{ maxWidth:'100%', maxHeight:'520px', borderRadius:'4px', background:'#fff', boxShadow: darkMode ? '0 0 0 1px #2a2a2a' : '0 0 0 1px #e5e5e5' }} />
          ) : (
            <div style={{ width:'100%', maxWidth:'420px', aspectRatio:'1', background: darkMode?'#1a1a1a':'#ebebeb', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <p style={{ color: t.textDim, fontSize:'13px', textAlign:'center', lineHeight:'1.6' }}>
                {isGenerating ? 'Generating...' : 'Generate a code to see the preview'}
              </p>
            </div>
          )}
        </div>

        {/* status bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'32px', paddingTop:'20px', borderTop:`1px solid ${t.border}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: isGenerated ? '#22c55e' : (darkMode?'#333':'#ccc') }} />
            <span style={{ fontSize:'12px', color: t.textMuted }}>
              {isGenerated ? 'Ready' : 'Waiting for input'}
            </span>
          </div>
          {isGenerated && (
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={download} style={{ padding:'7px 14px', background: t.chipBg, color: t.chipText, border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                Download
              </button>
              <button onClick={simulateScan} disabled={isSimulating} style={{ padding:'7px 14px', background: t.chipBg, color: t.chipText, border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor: isSimulating ? 'not-allowed' : 'pointer', opacity: isSimulating ? 0.6 : 1 }}>
                {isSimulating ? 'Simulating...' : 'Simulate Scan'}
              </button>
              <span style={{ padding:'7px 14px', background: t.timerBg, color: t.timerText, borderRadius:'6px', fontSize:'12px', fontWeight:'600' }}>
                Scan #{scanCount}
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default DynamicMorphingCode;
