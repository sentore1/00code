import { useState, useRef } from 'react';

const NavBar = ({ mode, onModeChange, modes, darkMode, onDarkModeToggle }) => {
  const [open, setOpen] = useState(false);
  const currentLabel = modes?.find(m => m.value === mode)?.label ?? 'Dual (10K)';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
      <div style={{ position:'relative' }}>
        <button onClick={()=>setOpen(o=>!o)} style={{
          display:'flex', alignItems:'center', gap:'10px', padding:'8px 14px',
          background:'#ffffff', color:'#111', border:'1px solid #d1d5db',
          borderRadius:'10px', fontSize:'13px', fontWeight:'500', cursor:'pointer',
          outline:'none', minWidth:'130px', justifyContent:'space-between',
          boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <span>{currentLabel}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {open && (
          <>
            <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, zIndex:98 }}/>
            <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:99, background:'#fff', border:'1px solid #e5e5e5', borderRadius:'10px', overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', minWidth:'160px' }}>
              {(modes||[]).map(m=>(
                <button key={m.value} onClick={()=>{ onModeChange?.(m.value); setOpen(false); }} style={{
                  display:'block', width:'100%', textAlign:'left', padding:'10px 16px',
                  border:'none', outline:'none', cursor:'pointer',
                  background: m.value===mode ? '#f4f4f4' : '#fff',
                  color:'#111', fontSize:'13px', fontWeight: m.value===mode ? '600' : '400',
                }}
                  onMouseEnter={e=>{ e.currentTarget.style.background='#f4f4f4'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background = m.value===mode?'#f4f4f4':'#fff'; }}
                >{m.label}</button>
              ))}
            </div>
          </>
        )}
      </div>
      <button onClick={onDarkModeToggle} aria-label="Toggle theme" style={{
        width:'38px', height:'38px', border:'none', borderRadius:'8px',
        background: darkMode?'#ffffff':'#111111', color: darkMode?'#111111':'#ffffff',
        display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
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

const DualLayerCode = ({ darkMode, onDarkModeToggle, mode, onModeChange, modes }) => {
  const [inputText, setInputText]   = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [decodeError, setDecodeError] = useState('');
  const [decodeInfo, setDecodeInfo]   = useState(null);
  const [isDecoding, setIsDecoding]   = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated]   = useState(false);
  const [previewUrl, setPreviewUrl]     = useState('');
  const [activeTab, setActiveTab]       = useState('encode');
  const canvasRef   = useRef(null);
  const fileInputRef = useRef(null);

  const CONFIG = {
    canvasSize: 2000, useCompression: true,
    rings: 50, innerRadius: 150, outerRadius: 950,
  };

  // ── helpers ──────────────────────────────────────────────────────────────
  const compress = (text) => {
    let result = '', i = 0;
    while (i < text.length) {
      if (text[i] === ' ') {
        let c = 1;
        while (i + c < text.length && text[i + c] === ' ' && c < 255) c++;
        result += c >= 3 ? '\x01' + String.fromCharCode(c) : ' '.repeat(c);
        i += c;
      } else result += text[i++];
    }
    return result;
  };
  const decompress = (s) => {
    let r = '', i = 0;
    while (i < s.length) {
      if (s.charCodeAt(i) === 1) { r += ' '.repeat(s.charCodeAt(i + 1)); i += 2; }
      else r += s[i++];
    }
    return r;
  };
  const textToBinary = (text) =>
    Array.from(new TextEncoder().encode(text)).map(b => b.toString(2).padStart(8,'0')).join('');
  const binaryToText = (bin) => {
    const bytes = [];
    for (let i = 0; i + 8 <= bin.length; i += 8) bytes.push(parseInt(bin.substring(i, i+8), 2));
    try { return new TextDecoder('utf-8').decode(new Uint8Array(bytes)); } catch { return ''; }
  };
  const decodeLengthWithRedundancy = (b) => {
    if (b.length < 48) return 0;
    const [l1,l2,l3] = [parseInt(b.substring(0,16),2), parseInt(b.substring(16,32),2), parseInt(b.substring(32,48),2)];
    if (l1===l2||l1===l3) return l1; if (l2===l3) return l2;
    return [l1,l2,l3].sort((a,b)=>a-b)[1];
  };

  const drawDiamondLayer = (ctx, binary, canvasSize, layerIndex) => {
    const center = canvasSize / 2;
    const { rings, innerRadius, outerRadius } = CONFIG;
    const ringWidth = (outerRadius - innerRadius) / rings;
    const startRing = layerIndex === 0 ? rings - 1 : Math.floor(rings / 2) - 1;
    const endRing   = layerIndex === 0 ? Math.floor(rings / 2) : -1;
    let bitIndex = 0;
    for (let ring = startRing; ring > endRing; ring--) {
      const r = innerRadius + ring * ringWidth + ringWidth / 2;
      const diamondSize = ringWidth * 0.8;
      const numShapes = Math.floor((2 * Math.PI * r) / (diamondSize * 1.1));
      for (let i = 0; i < numShapes && bitIndex < binary.length; i++) {
        const angle = (i / numShapes) * Math.PI * 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        ctx.save();
        ctx.translate(x, y); ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = binary[bitIndex] === '1' ? '#000000' : '#FFFFFF';
        ctx.strokeStyle = '#555555'; ctx.lineWidth = 0.5;
        const s = diamondSize / 2;
        ctx.beginPath();
        ctx.moveTo(0,-s); ctx.lineTo(s,0); ctx.lineTo(0,s); ctx.lineTo(-s,0);
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        bitIndex++;
      }
    }
    return bitIndex;
  };

  const encode = () => {
    if (!inputText || !canvasRef.current) return;
    setIsGenerating(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const { canvasSize, rings, innerRadius, outerRadius } = CONFIG;
      canvas.width = canvasSize; canvas.height = canvasSize;
      ctx.imageSmoothingEnabled = false;

      const mid = Math.ceil(inputText.length / 2);
      const layer1text = inputText.substring(0, mid);
      const layer2text = inputText.substring(mid);
      const c1 = CONFIG.useCompression ? compress(layer1text) : layer1text;
      const c2 = CONFIG.useCompression ? compress(layer2text) : layer2text;
      const bytes1 = new TextEncoder().encode(c1);
      const bytes2 = new TextEncoder().encode(c2);
      const lb1 = bytes1.length.toString(2).padStart(16,'0');
      const lb2 = bytes2.length.toString(2).padStart(16,'0');
      let fb1 = lb1+lb1+lb1 + textToBinary(c1);
      let fb2 = lb2+lb2+lb2 + textToBinary(c2);

      const ringWidth = (outerRadius - innerRadius) / rings;
      let cap = 0;
      for (let ring = rings-1; ring >= rings/2; ring--) {
        const r = innerRadius + ring*ringWidth + ringWidth/2;
        cap += Math.floor((2*Math.PI*r) / (ringWidth*0.8*1.1));
      }
      for (let i = fb1.length; i < cap; i++) fb1 += (i%2).toString();
      for (let i = fb2.length; i < cap; i++) fb2 += (i%2).toString();

      ctx.fillStyle = '#FFF'; ctx.fillRect(0,0,canvasSize,canvasSize);
      const center = canvasSize/2;
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(center,center,130,0,Math.PI*2); ctx.fill();
      drawDiamondLayer(ctx, fb1, canvasSize, 0);
      drawDiamondLayer(ctx, fb2, canvasSize, 1);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 15;
      ctx.beginPath(); ctx.arc(center,center,960,0,Math.PI*2); ctx.stroke();

      setPreviewUrl(canvas.toDataURL('image/png'));
      setIsGenerated(true); setIsGenerating(false);
    }, 50);
  };

  const decodeLayerFromCtx = (ctx, width, height, layerIndex) => {
    const { data } = ctx.getImageData(0,0,width,height);
    const px = (x,y) => { const p=Math.round(x),q=Math.round(y); if(p<0||p>=width||q<0||q>=height) return 255; const i=(q*width+p)*4; return (data[i]+data[i+1]+data[i+2])/3; };
    const center=width/2, scale=width/CONFIG.canvasSize;
    const bs=[],ws=[];
    for(let i=0;i<20;i++){const a=(i/20)*Math.PI*2; bs.push(px(center+65*scale*Math.cos(a),center+65*scale*Math.sin(a))); ws.push(px(center+970*scale*Math.cos(a),center+970*scale*Math.sin(a)));}
    const threshold=(bs.reduce((a,b)=>a+b,0)/20+ws.reduce((a,b)=>a+b,0)/20)/2;
    let binary='';
    const { rings,innerRadius,outerRadius } = CONFIG;
    const ri=innerRadius*scale, ro=outerRadius*scale, rw=(ro-ri)/rings;
    const startRing = layerIndex===0 ? rings-1 : Math.floor(rings/2)-1;
    const endRing   = layerIndex===0 ? Math.floor(rings/2) : -1;
    for(let ring=startRing;ring>endRing;ring--){
      const r=ri+ring*rw+rw/2, ds=rw*0.8;
      const n=Math.floor((2*Math.PI*r)/(ds*1.1));
      for(let i=0;i<n;i++){
        const angle=(i/n)*Math.PI*2,x=center+r*Math.cos(angle),y=center+r*Math.sin(angle);
        let bc=0,wc=0;
        for(let gx=0;gx<15;gx++) for(let gy=0;gy<15;gy++){const b=px(x+(gx-7.5)*(ds*0.42/7.5),y+(gy-7.5)*(ds*0.42/7.5)); b<threshold?bc++:wc++;}
        binary += bc>wc?'1':'0';
      }
    }
    const byteLength=decodeLengthWithRedundancy(binary);
    if(byteLength>12000||byteLength===0) throw new Error('Invalid layer data');
    const raw=binaryToText(binary.substring(48,48+byteLength*8));
    return CONFIG.useCompression?decompress(raw):raw;
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
          const l1=decodeLayerFromCtx(ctx,img.width,img.height,0);
          const l2=decodeLayerFromCtx(ctx,img.width,img.height,1);
          const combined=l1+l2;
          setDecodedText(combined); setDecodeInfo({chars:combined.length});
        } catch(err){ setDecodeError(err.message); }
        setIsDecoding(false);
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file); e.target.value='';
  };

  const download = () => {
    if(!previewUrl) return;
    const a=document.createElement('a'); a.download='dual-layer-code.png'; a.href=previewUrl; a.click();
  };


  // ── theme tokens (same as DynamicMorphingCode) ───────────────────────────
  const t = darkMode ? {
    bg:'#0f0f0f', panelBg:'#1a1a1a', rightBg:'#141414', border:'#2a2a2a',
    text:'#ffffff', textMuted:'#888888', textDim:'#555555',
    inputBg:'#0f0f0f', inputBorder:'#333333', inputText:'#ffffff',
    btnBg:'#ffffff', btnText:'#000000',
    previewBg:'#1f1f1f', chipBg:'#2a2a2a', chipText:'#aaaaaa',
    tabActive:'#ffffff', tabInactive:'#555555', tabBorder:'#2a2a2a',
    stepLabel:'#555555', sectionNum:'#555555', previewLabel:'#666666',
    timerBg:'#2a2a2a', timerText:'#aaaaaa',
    uploadBorder:'#333333', errorBg:'#2a0a0a', errorBorder:'#5a1a1a',
    errorText:'#ff6b6b', resultBg:'#1f1f1f', decodedBg:'#141414',
  } : {
    bg:'#ffffff', panelBg:'#ffffff', rightBg:'#f4f4f4', border:'#e5e5e5',
    text:'#000000', textMuted:'#666666', textDim:'#999999',
    inputBg:'#ffffff', inputBorder:'#d1d5db', inputText:'#111827',
    btnBg:'#000000', btnText:'#ffffff',
    previewBg:'#ffffff', chipBg:'#f0f0f0', chipText:'#555555',
    tabActive:'#000000', tabInactive:'#aaaaaa', tabBorder:'#e5e5e5',
    stepLabel:'#999999', sectionNum:'#999999', previewLabel:'#999999',
    timerBg:'#e8e8e8', timerText:'#555555',
    uploadBorder:'#d1d5db', errorBg:'#fff5f5', errorBorder:'#fecaca',
    errorText:'#dc2626', resultBg:'#f8f8f8', decodedBg:'#ffffff',
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:t.bg, fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ flex:'0 0 45%', maxWidth:'45%', padding:'40px 56px 80px', background:t.panelBg, display:'flex', flexDirection:'column' }}>

        {/* Logo */}
        <div style={{ marginBottom:'56px' }}>
          <span style={{ fontSize:'20px', fontWeight:'700', letterSpacing:'-0.03em', color:t.text }}>ocode</span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize:'48px', fontWeight:'800', lineHeight:'1.05', letterSpacing:'-0.03em', color:t.text, margin:'0 0 16px' }}>
          Dual Layer<br/>Imigongo<br/>Code
        </h1>
        <p style={{ fontSize:'15px', color:t.textMuted, margin:'0 0 48px', lineHeight:'1.5' }}>
          Two spatial layers &bull; 10K character capacity
        </p>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:`1px solid ${t.tabBorder}`, marginBottom:'32px' }}>
          {[['encode','ENCODE'],['decode','DECODE IMAGE']].map(([key,label])=>(
            <button key={key} onClick={()=>setActiveTab(key)} style={{
              padding:'10px 0', marginRight:'28px', background:'transparent', border:'none',
              borderBottom: activeTab===key ? `2px solid ${t.tabActive}` : '2px solid transparent',
              color: activeTab===key ? t.tabActive : t.tabInactive,
              fontSize:'13px', fontWeight:'600', letterSpacing:'0.04em',
              cursor:'pointer', marginBottom:'-1px', transition:'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {/* ── ENCODE ── */}
        {activeTab==='encode' && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:t.stepLabel }}>01</span>
              <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:t.stepLabel }}>ENCODE MESSAGE</span>
            </div>
            <textarea
              value={inputText} onChange={e=>setInputText(e.target.value)}
              placeholder="Type your secret message..." maxLength={10000}
              style={{ width:'100%', minHeight:'180px', padding:'16px', fontSize:'14px', lineHeight:'1.6',
                background:t.inputBg, color:t.inputText, border:`1px solid ${t.inputBorder}`,
                borderRadius:'8px', resize:'vertical', outline:'none', fontFamily:'inherit',
                boxSizing:'border-box' }}
            />
            <div style={{ textAlign:'right', fontSize:'12px', color:t.textDim, margin:'6px 0 24px' }}>
              {inputText.length} / 10,000 characters
            </div>
            <button onClick={encode} disabled={!inputText||isGenerating} style={{
              width:'100%', padding:'18px 24px',
              background:(!inputText||isGenerating)?(darkMode?'#2a2a2a':'#e0e0e0'):t.btnBg,
              color:(!inputText||isGenerating)?t.textDim:t.btnText,
              border:'none', borderRadius:'0', fontSize:'13px', fontWeight:'700',
              letterSpacing:'0.08em', textTransform:'uppercase',
              cursor:(!inputText||isGenerating)?'not-allowed':'pointer',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <span style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                {isGenerating && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                )}
                {isGenerating?'Generating...':'Generate Code'}
              </span>
              {!isGenerating && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </button>
            <canvas ref={canvasRef} style={{ display:'none' }}/>
          </>
        )}

        {/* ── DECODE ── */}
        {activeTab==='decode' && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:t.stepLabel }}>01</span>
              <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:t.stepLabel }}>UPLOAD IMAGE</span>
            </div>
            <div onClick={()=>fileInputRef.current?.click()} style={{
              border:`2px dashed ${t.uploadBorder}`, borderRadius:'8px', padding:'48px 24px',
              display:'flex', flexDirection:'column', alignItems:'center',
              cursor:'pointer', background:t.inputBg, marginBottom:'24px', textAlign:'center',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={t.textDim} strokeWidth="1.5" style={{ marginBottom:'12px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <p style={{ margin:'0 0 4px', fontSize:'13px', fontWeight:'600', color:t.text }}>Click to upload image</p>
              <p style={{ margin:0, fontSize:'12px', color:t.textDim }}>PNG, JPG, WEBP</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display:'none' }}/>
            <button onClick={()=>fileInputRef.current?.click()} disabled={isDecoding} style={{
              width:'100%', padding:'18px 24px',
              background:isDecoding?(darkMode?'#2a2a2a':'#e0e0e0'):t.btnBg,
              color:isDecoding?t.textDim:t.btnText,
              border:'none', borderRadius:'0', fontSize:'13px', fontWeight:'700',
              letterSpacing:'0.08em', textTransform:'uppercase',
              cursor:isDecoding?'not-allowed':'pointer',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <span style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                {isDecoding && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
                {isDecoding?'Decoding...':'Decode Image'}
              </span>
              {!isDecoding && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
            </button>

            {decodeError && (
              <div style={{ marginTop:'20px', padding:'14px 16px', background:t.errorBg, border:`1px solid ${t.errorBorder}`, borderRadius:'6px', color:t.errorText, fontSize:'13px', display:'flex', gap:'8px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {decodeError}
              </div>
            )}

            {decodedText && !decodeError && (
              <div style={{ marginTop:'24px', padding:'20px', background:t.resultBg, border:`1px solid ${t.border}`, borderRadius:'8px' }}>
                {decodeInfo && (
                  <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
                    <span style={{ padding:'3px 10px', background:t.chipBg, color:t.chipText, borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>{decodeInfo.chars} chars</span>
                  </div>
                )}
                <p style={{ margin:'0 0 8px', fontSize:'11px', fontWeight:'700', letterSpacing:'0.08em', color:t.textDim }}>DECODED MESSAGE</p>
                <div style={{ padding:'12px 14px', background:t.decodedBg, border:`1px solid ${t.border}`, borderRadius:'6px', fontFamily:'monospace', fontSize:'13px', lineHeight:'1.6', maxHeight:'200px', overflowY:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word', color:t.text }}>
                  {decodedText}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex:'1', background:t.rightBg, display:'flex', flexDirection:'column', padding:'40px 56px 80px', borderLeft:`1px solid ${t.border}` }}>

        {/* Section label */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'4px' }}>
            <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:t.sectionNum }}>02</span>
            <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:t.previewLabel }}>LIVE PREVIEW</span>
          </div>
          {/* Nav controls */}
          <NavBar mode={mode} onModeChange={onModeChange} modes={modes} darkMode={darkMode} onDarkModeToggle={onDarkModeToggle} />
        </div>

        {/* Preview */}
        <div style={{ flex:'1', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {isGenerated && previewUrl ? (
            <img src={previewUrl} alt="Dual layer code preview" style={{ maxWidth:'100%', maxHeight:'520px', borderRadius:'4px', background:'#fff', boxShadow: darkMode?'0 0 0 1px #2a2a2a':'0 0 0 1px #e5e5e5' }}/>
          ) : (
            <div style={{ width:'100%', maxWidth:'420px', aspectRatio:'1', background:darkMode?'#1a1a1a':'#ebebeb', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <p style={{ color:t.textDim, fontSize:'13px', textAlign:'center' }}>
                {isGenerating?'Generating...':'Generate a code to see the preview'}
              </p>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'32px', paddingTop:'20px', borderTop:`1px solid ${t.border}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:isGenerated?'#22c55e':(darkMode?'#333':'#ccc') }}/>
            <span style={{ fontSize:'12px', color:t.textMuted }}>{isGenerated?'Ready':'Waiting for input'}</span>
          </div>
          {isGenerated && (
            <button onClick={download} style={{ padding:'7px 14px', background:t.timerBg, color:t.timerText, border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
              Download
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default DualLayerCode;
