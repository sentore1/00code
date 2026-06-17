import { useState, useRef, useEffect } from 'react';

const AdaptiveShotCode = ({ onPreviewReady, onActionsReady }) => {
  const [inputText, setInputText] = useState('');
  const [codeConfig, setCodeConfig] = useState(null);
  const [densityOpen, setDensityOpen] = useState(false);
  const [decodedText, setDecodedText] = useState('');
  const [activeTab, setActiveTab] = useState('encode');
  const [codeGenerated, setCodeGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated]   = useState(false);
  const [previewUrl, setPreviewUrl]     = useState('');
  const [decodeError, setDecodeError]   = useState('');
  const [decodeInfo, setDecodeInfo]     = useState(null);
  const [isDecoding, setIsDecoding]     = useState(false);
  const [isDragOver, setIsDragOver]     = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Expose download action to parent (App.jsx) for bottom-right status bar
  useEffect(() => {
    if (!onActionsReady) return;
    onActionsReady({
      download: () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `adaptive-shotcode-${codeConfig?.name || 'code'}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
      },
      isGenerated,
    });
  }, [isGenerated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ADAPTIVE CONFIGURATIONS - Code grows with data
  const DENSITY_LEVELS = [
    { name: 'Small', rings: 120, segments: 180, capacity: 2700, color: '#3b82f6' },
    { name: 'Medium', rings: 180, segments: 270, capacity: 6075, color: '#3b82f6' },
    { name: 'Large', rings: 240, segments: 360, capacity: 10800, color: '#3b82f6' },
    { name: 'Huge', rings: 300, segments: 450, capacity: 16875, color: '#3b82f6' }
  ];

  const CONFIG = {
    canvasSize: 1200,
    outerRadius: 580,
    innerRadius: 50,
    useCompression: true
  };

  // Automatically select optimal density based on text length
  const selectOptimalDensity = (textLength) => {
    // Account for compression (estimate 70% of original size for text with spaces)
    const estimatedCompressed = Math.ceil(textLength * 0.7);
    
    for (let i = 0; i < DENSITY_LEVELS.length; i++) {
      const level = DENSITY_LEVELS[i];
      const availableBytes = Math.floor((level.rings * level.segments - 16) / 8 * 0.875); // Account for error correction
      
      if (estimatedCompressed <= availableBytes) {
        return { ...level, index: i };
      }
    }
    
    // If too large, return largest
    return { ...DENSITY_LEVELS[DENSITY_LEVELS.length - 1], index: DENSITY_LEVELS.length - 1 };
  };

  const compress = (text) => {
    let result = '';
    let i = 0;
    
    while (i < text.length) {
      const char = text[i];
      
      if (char === ' ') {
        let count = 1;
        while (i + count < text.length && text[i + count] === ' ' && count < 255) {
          count++;
        }
        
        if (count >= 3) {
          result += '\x01' + String.fromCharCode(count);
          i += count;
        } else {
          result += ' '.repeat(count);
          i += count;
        }
      } else {
        result += char;
        i++;
      }
    }
    
    return result;
  };

  const decompress = (compressed) => {
    let result = '';
    let i = 0;
    
    while (i < compressed.length) {
      if (compressed.charCodeAt(i) === 1) {
        const count = compressed.charCodeAt(i + 1);
        result += ' '.repeat(count);
        i += 2;
      } else {
        result += compressed[i];
        i++;
      }
    }
    
    return result;
  };

  const textToBinary = (text) => {
    let binary = '';
    for (let i = 0; i < text.length; i++) {
      binary += text.charCodeAt(i).toString(2).padStart(8, '0');
    }
    return binary;
  };

  const binaryToText = (binary) => {
    let text = '';
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substring(i, i + 8);
      if (byte.length === 8) {
        text += String.fromCharCode(parseInt(byte, 2));
      }
    }
    return text;
  };

  const encode = () => {
    if (!inputText || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Use manually selected density or auto-select optimal density
    const density = codeConfig || selectOptimalDensity(inputText.length);
    if (!codeConfig) {
      setCodeConfig(density);
    }
    
    const { rings, segments } = density;
    const { canvasSize, outerRadius, innerRadius } = CONFIG;
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    ctx.imageSmoothingEnabled = false;
    
    const center = canvasSize / 2;
    const ringWidth = (outerRadius - innerRadius) / rings;
    
    console.log('=== ADAPTIVE ENCODING ===');
    console.log('Text length:', inputText.length);
    console.log('Selected density:', density.name);
    console.log('Configuration:', rings, 'rings Ã—', segments, 'segments');
    console.log('Capacity:', density.capacity, 'bytes');
    
    // Compress
    const textToEncode = CONFIG.useCompression ? compress(inputText) : inputText;
    console.log('Compressed length:', textToEncode.length);
    
    const binary = textToBinary(textToEncode);
    const lengthBits = textToEncode.length.toString(2).padStart(16, '0');
    const densityBits = density.index.toString(2).padStart(3, '0');
    let fullBinary = lengthBits + densityBits + binary;
    
    // Calculate total capacity and add padding
    const totalCapacity = rings * segments;
    if (fullBinary.length < totalCapacity) {
      const paddingNeeded = totalCapacity - fullBinary.length;
      console.log('Adding padding:', paddingNeeded, 'bits');
      for (let i = 0; i < paddingNeeded; i++) {
        fullBinary += (i % 2).toString();
      }
    }
    
    console.log('Total capacity:', totalCapacity);
    console.log('Total bits:', fullBinary.length);
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Black center
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(center, center, innerRadius - 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Colored border to indicate density
    ctx.strokeStyle = density.color;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw data
    let bitIndex = 0;
    for (let ring = rings - 1; ring >= 0 && bitIndex < fullBinary.length; ring--) {
      const r1 = innerRadius + ring * ringWidth;
      const r2 = innerRadius + (ring + 1) * ringWidth;
      
      for (let seg = 0; seg < segments && bitIndex < fullBinary.length; seg++) {
        const a1 = (seg / segments) * Math.PI * 2;
        const a2 = ((seg + 1) / segments) * Math.PI * 2;
        
        if (fullBinary[bitIndex] === '1') {
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(center, center, r2, a1, a2);
          ctx.arc(center, center, r1, a2, a1, true);
          ctx.closePath();
          ctx.fill();
        }
        
        bitIndex++;
      }
    }
    
    console.log('Encoded', bitIndex, 'bits');
    
    // Mark code as generated
    setCodeGenerated(true);
  };

  const decode = (ctx, width, height) => {
    console.log('=== ADAPTIVE DECODING ===');
    console.log('Image size:', width, 'x', height);
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const getPixel = (x, y) => {
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= width || py < 0 || py >= height) return 255;
      const i = (py * width + px) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3;
    };
    
    // Detect center by finding the black circle
    const center = { x: width / 2, y: height / 2 };
    console.log('Center:', center);
    
    // Calculate scale based on image size
    const scale = width / CONFIG.canvasSize;
    console.log('Scale:', scale);
    
    // Try each density level and collect all valid results
    const validResults = [];
    const allAttempts = [];
    
    for (let i = 0; i < DENSITY_LEVELS.length; i++) {
      const density = DENSITY_LEVELS[i];
      console.log(`\n--- Trying ${density.name} (index ${i}) ---`);
      console.log(`Configuration: ${density.rings} rings Ã— ${density.segments} segments`);
      console.log(`Total capacity: ${density.rings * density.segments} bits`);
      
      try {
        const result = decodeWithDensity(ctx, width, height, density, getPixel, center, scale);
        
        console.log(`âœ“ Decode succeeded!`);
        console.log(`  Header density index: ${result.densityIndex}`);
        console.log(`  Text length from header: ${result.textLength}`);
        console.log(`  Actual decoded length: ${result.text.length}`);
        console.log(`  Confidence: ${result.confidence.toFixed(1)}%`);
        console.log(`  Text preview: "${result.text.substring(0, 50)}..."`);
        
        allAttempts.push({ success: true, density: density.name, result });
        
        // Check if density index matches
        if (result.densityIndex === i) {
          console.log(`âœ“âœ“âœ“ PERFECT MATCH! Density index matches.`);
          return result; // Return immediately on perfect match
        } else {
          console.log(`âš  Density mismatch (expected ${i}, got ${result.densityIndex})`);
          // Still keep it as a candidate if text looks valid
          if (result.text.length > 0 && result.text.length === result.textLength) {
            validResults.push({ ...result, indexMatch: false, expectedIndex: i });
          }
        }
      } catch (err) {
        console.log(`âœ— Failed with error: ${err.message}`);
        allAttempts.push({ success: false, density: density.name, error: err.message });
      }
    }
    
    // If no perfect match, try to find the best candidate
    if (validResults.length > 0) {
      console.log(`\nâš  No perfect match found, but have ${validResults.length} candidates`);
      
      // Sort by confidence
      validResults.sort((a, b) => b.confidence - a.confidence);
      const best = validResults[0];
      
      console.log(`Using best candidate: ${best.density} (confidence: ${best.confidence.toFixed(1)}%)`);
      console.log(`Note: Density index was ${best.densityIndex}, expected ${best.expectedIndex}`);
      
      return best;
    }
    
    console.error('\n=== DECODE FAILED ===');
    console.error('No valid results from any density level');
    console.error('All attempts:', allAttempts);
    throw new Error('Could not decode - no density level matched');
  };

  const decodeWithDensity = (ctx, width, height, density, getPixel, center, scale) => {
    const { rings, segments } = density;
    
    const scaledOuter = CONFIG.outerRadius * scale;
    const scaledInner = CONFIG.innerRadius * scale;
    const ringWidth = (scaledOuter - scaledInner) / rings;
    
    let binary = '';
    let confidenceSum = 0;
    let segmentCount = 0;
    
    // Read from outermost ring to innermost (same as encoding)
    for (let ring = rings - 1; ring >= 0; ring--) {
      const r1 = scaledInner + ring * ringWidth;
      const r2 = scaledInner + (ring + 1) * ringWidth;
      
      for (let seg = 0; seg < segments; seg++) {
        const angleStart = (seg / segments) * Math.PI * 2;
        const angleEnd = ((seg + 1) / segments) * Math.PI * 2;
        
        // Sample multiple points in this segment
        let blackCount = 0;
        let whiteCount = 0;
        const samples = 7; // Increased samples for better accuracy
        
        for (let s = 0; s < samples; s++) {
          const angle = angleStart + (angleEnd - angleStart) * ((s + 0.5) / samples);
          const r = r1 + (r2 - r1) * 0.5; // Middle of ring
          
          const x = center.x + r * Math.cos(angle);
          const y = center.y + r * Math.sin(angle);
          
          const brightness = getPixel(x, y);
          if (brightness < 128) {
            blackCount++;
          } else {
            whiteCount++;
          }
        }
        
        const bit = blackCount > whiteCount ? '1' : '0';
        binary += bit;
        
        const confidence = Math.max(blackCount, whiteCount) / samples;
        confidenceSum += confidence;
        segmentCount++;
      }
    }
    
    const avgConfidence = (confidenceSum / segmentCount) * 100;
    
    // Parse header
    if (binary.length < 19) {
      throw new Error(`Insufficient bits: ${binary.length}`);
    }
    
    const lengthBits = binary.substring(0, 16);
    const textLength = parseInt(lengthBits, 2);
    
    if (textLength === 0 || textLength > 20000) {
      throw new Error(`Invalid text length: ${textLength}`);
    }
    
    const densityBits = binary.substring(16, 19);
    const densityIndex = parseInt(densityBits, 2);
    
    // Don't throw error on invalid density index, just note it
    if (densityIndex < 0 || densityIndex >= DENSITY_LEVELS.length) {
      console.log(`âš  Unusual density index: ${densityIndex}`);
    }
    
    // Extract data
    const dataBitsNeeded = textLength * 8;
    const totalBitsNeeded = 19 + dataBitsNeeded;
    
    if (binary.length < totalBitsNeeded) {
      throw new Error(`Not enough data: need ${totalBitsNeeded}, have ${binary.length}`);
    }
    
    const dataBits = binary.substring(19, 19 + dataBitsNeeded);
    
    let decoded;
    try {
      const decodedCompressed = binaryToText(dataBits);
      decoded = CONFIG.useCompression ? decompress(decodedCompressed) : decodedCompressed;
    } catch (err) {
      throw new Error(`Text decode failed: ${err.message}`);
    }
    
    return {
      text: decoded,
      textLength,
      confidence: avgConfidence,
      density: density.name,
      densityIndex
    };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        try {
          const result = decode(ctx, img.width, img.height);
          setDecodedText(result.text);
          setCodeConfig(DENSITY_LEVELS[result.densityIndex]);
        } catch (error) {
          console.error('Decode error:', error);
          setDecodedText('[ERROR] ' + error.message + '\n\nTips:\nâ€¢ Make sure this is an Adaptive ShotCode image\nâ€¢ Try encoding and decoding a test message first\nâ€¢ Check browser console for detailed logs');
        }
      };
      img.onerror = () => {
        setDecodedText('[ERROR] Failed to load image file');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      setDecodedText('[ERROR] Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const testDecode = () => {
    if (!canvasRef.current) {
      alert('No canvas found!');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    console.clear();
    console.log('========================================');
    console.log('STARTING TEST DECODE');
    console.log('Canvas size:', canvas.width, 'x', canvas.height);
    console.log('Input text:', inputText);
    console.log('Input text length:', inputText.length);
    console.log('Code config:', codeConfig);
    console.log('========================================');
    
    // Quick sanity check - read a few pixels
    const testPixels = [];
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(canvas.width * (i + 1) / 6);
      const y = canvas.height / 2;
      const imageData = ctx.getImageData(x, y, 1, 1);
      const brightness = (imageData.data[0] + imageData.data[1] + imageData.data[2]) / 3;
      testPixels.push({ x, y, brightness: brightness.toFixed(0) });
    }
    console.log('Sample pixels:', testPixels);
    
    try {
      const result = decode(ctx, canvas.width, canvas.height);
      const match = inputText === result.text;
      
      console.log('\n========================================');
      console.log('TEST DECODE COMPLETE');
      console.log('========================================');
      console.log('Match:', match);
      console.log('Original length:', inputText.length);
      console.log('Decoded length:', result.text.length);
      
      if (!match) {
        console.log('\nOriginal text:');
        console.log(inputText);
        console.log('\nDecoded text:');
        console.log(result.text);
        
        // Find first difference
        for (let i = 0; i < Math.max(inputText.length, result.text.length); i++) {
          if (inputText[i] !== result.text[i]) {
            console.log(`\nFirst difference at position ${i}:`);
            console.log(`  Original: "${inputText[i]}" (code ${inputText.charCodeAt(i)})`);
            console.log(`  Decoded:  "${result.text[i]}" (code ${result.text.charCodeAt(i)})`);
            break;
          }
        }
      }
      
      const message = 
        `${match ? 'âœ“' : 'âœ—'} DECODE ${match ? 'SUCCESS' : 'FAILED'}\n\n` +
        `Density: ${result.density}\n` +
        `Confidence: ${result.confidence.toFixed(1)}%\n\n` +
        `Original: ${inputText.length} chars\n` +
        `Decoded: ${result.text.length} chars\n\n` +
        `Match: ${match ? 'âœ“ YES - Perfect!' : 'âœ— NO - Mismatch'}\n\n` +
        (match ? 'The code can be read correctly!' : 'Check browser console (F12) for details');
      
      alert(message);
    } catch (error) {
      console.error('\n========================================');
      console.error('TEST DECODE ERROR');
      console.error('========================================');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      alert(
        `âœ— DECODE FAILED\n\n` +
        `Error: ${error.message}\n\n` +
        `Check browser console (F12) for detailed logs.\n` +
        `Make sure you clicked "Generate Code" first!`
      );
    }
  };

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `adaptive-shotcode-${codeConfig?.name || 'code'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    if (inputText) {
      // Only encode when explicitly triggered
    }
  }, [inputText]);

  const t = {
    bg:'#ffffff', text:'#000000', textMuted:'#666', textDim:'#999',
    inputBg:'#ffffff', inputBorder:'#d1d5db', inputText:'#111',
    btnBg:'#000000', btnText:'#ffffff',
    tabActive:'#000000', tabInactive:'#aaa', tabBorder:'#e5e5e5',
    stepLabel:'#999', border:'#e5e5e5', chipBg:'#f0f0f0', chipText:'#555',
    uploadBorder:'#d1d5db', errorBg:'#fff5f5', errorBorder:'#fecaca', errorText:'#dc2626',
    resultBg:'#f8f8f8', decodedBg:'#ffffff',
  };

  const wrapEncode = () => {
    if (!inputText || !canvasRef.current) return;
    setIsGenerating(true);
    setTimeout(() => {
      encode();
      const url = canvasRef.current.toDataURL('image/png');
      setPreviewUrl(url);
      setIsGenerated(true);
      setIsGenerating(false);
      onPreviewReady?.(url, codeConfig ? `${codeConfig.name} density` : '');
    }, 50);
  };

  const wrapFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsDecoding(true); setDecodedText(''); setDecodeError(''); setDecodeInfo(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
        try {
          const result = decode(ctx, img.width, img.height);
          setDecodedText(result.text);
          setDecodeInfo({ chars: result.text.length, density: result.density, confidence: Math.round(result.confidence) });
          setCodeConfig(DENSITY_LEVELS[result.densityIndex]);
        } catch (err) { setDecodeError(err.message); }
        setIsDecoding(false);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file); e.target.value = '';
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${t.tabBorder}`, marginBottom:'32px' }}>
        {[['encode','ENCODE'],['decode','DECODE IMAGE']].map(([key,label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding:'10px 0', marginRight:'28px', background:'transparent', border:'none',
            borderBottom: activeTab===key ? `2px solid ${t.tabActive}` : '2px solid transparent',
            color: activeTab===key ? t.tabActive : t.tabInactive,
            fontSize:'13px', fontWeight:'500', letterSpacing:'0.04em',
            cursor:'pointer', marginBottom:'-1px',
          }}>{label}</button>
        ))}
      </div>

      {/* â”€â”€ ENCODE â”€â”€ */}
      {activeTab === 'encode' && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
            <span style={{ fontSize:'11px', fontWeight:'400', letterSpacing:'0.1em', color:t.stepLabel }}>01</span>
            <span style={{ fontSize:'11px', fontWeight:'400', letterSpacing:'0.1em', color:t.stepLabel }}>SELECT DENSITY</span>
          </div>
          <div style={{ position:'relative', marginBottom:'28px' }}>
            <button onClick={() => setDensityOpen(o => !o)} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              width:'100%', padding:'10px 14px', border:`1px solid ${t.border}`,
              borderRadius:'8px', background:t.inputBg, color:t.text,
              fontSize:'13px', fontWeight:'500', cursor:'pointer', outline:'none',
              fontFamily:'inherit',
            }}>
              <span>{codeConfig ? `${codeConfig.name} — ${codeConfig.capacity.toLocaleString()}B` : 'Auto (select density)'}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {densityOpen && (
              <>
                <div onClick={() => setDensityOpen(false)} style={{ position:'fixed', inset:0, zIndex:98 }}/>
                <div style={{
                  position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:99,
                  background:t.inputBg, border:`1px solid ${t.border}`, borderRadius:'8px',
                  overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
                }}>
                  <button onClick={() => { setCodeConfig(null); setDensityOpen(false); }} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    width:'100%', padding:'10px 14px', border:'none', outline:'none',
                    background: codeConfig === null ? (t.border) : t.inputBg,
                    color:t.text, fontSize:'13px', cursor:'pointer', fontFamily:'inherit',
                  }}>
                    <span style={{ fontWeight:'500' }}>Auto</span>
                    <span style={{ fontSize:'11px', opacity:0.6 }}>adapts to text</span>
                  </button>
                  {DENSITY_LEVELS.map((level, idx) => (
                    <button key={level.name} onClick={() => { setCodeConfig({ ...level, index: idx }); setDensityOpen(false); }} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      width:'100%', padding:'10px 14px', border:'none', outline:'none',
                      background: codeConfig?.index === idx ? t.border : t.inputBg,
                      color:t.text, fontSize:'13px', cursor:'pointer', fontFamily:'inherit',
                    }}>
                      <span style={{ fontWeight:'500' }}>{level.name}</span>
                      <span style={{ fontSize:'11px', opacity:0.6 }}>{level.capacity.toLocaleString()}B</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
            <span style={{ fontSize:'11px', fontWeight:'400', letterSpacing:'0.1em', color:t.stepLabel }}>02</span>
            <span style={{ fontSize:'11px', fontWeight:'400', letterSpacing:'0.1em', color:t.stepLabel }}>ENCODE MESSAGE</span>
          </div>
          <textarea value={inputText} onChange={e => setInputText(e.target.value)}
            placeholder="Start typing... code adapts automatically" maxLength={20000}
            style={{ width:'100%', minHeight:'160px', padding:'16px', fontSize:'14px', lineHeight:'1.6',
              background:t.inputBg, color:t.inputText, border:`1px solid ${t.inputBorder}`,
              borderRadius:'8px', resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
          />
          <div style={{ textAlign:'right', fontSize:'12px', color:t.textDim, margin:'6px 0 24px' }}>
            {inputText.length} / 20,000 characters
          </div>
          <canvas ref={canvasRef} style={{ display:'none' }} />
          <button onClick={wrapEncode} disabled={!inputText||isGenerating} style={{
            width:'100%', padding:'18px 24px',
            background:(!inputText||isGenerating)?'#e0e0e0':t.btnBg,
            color:(!inputText||isGenerating)?t.textDim:t.btnText,
            border:'none', borderRadius:'0', fontSize:'13px', fontWeight:'600',
            letterSpacing:'0.08em', textTransform:'uppercase',
            cursor:(!inputText||isGenerating)?'not-allowed':'pointer',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <span style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              {isGenerating && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
              {isGenerating ? 'Generating...' : 'Generate Code'}
            </span>
            {!isGenerating && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
          </button>

          {isGenerated && (
            <div style={{ marginTop:'20px', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#22c55e', flexShrink:0 }}/>
              <span style={{ fontSize:'12px', color:'#666' }}>Code generated — preview on the right</span>
            </div>
          )}
        </>
      )}

      {/* â”€â”€ DECODE â”€â”€ */}
      {activeTab === 'decode' && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
            <span style={{ fontSize:'11px', fontWeight:'400', letterSpacing:'0.1em', color:t.stepLabel }}>01</span>
            <span style={{ fontSize:'11px', fontWeight:'400', letterSpacing:'0.1em', color:t.stepLabel }}>UPLOAD IMAGE</span>
          </div>
          <div onClick={() => fileInputRef.current?.click()}
            onDragOver={e=>{ e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={()=>setIsDragOver(false)}
            onDrop={e=>{ e.preventDefault(); setIsDragOver(false); const file=e.dataTransfer.files[0]; if(file&&file.type.startsWith('image/')) wrapFileUpload({target:{files:[file],value:''}});}}
            style={{
            border:`2px dashed ${isDragOver?'#000000':t.uploadBorder}`, borderRadius:'8px', padding:'40px 24px',
            display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer',
            background:isDragOver?'#f0f0f0':t.inputBg, marginBottom:'24px', textAlign:'center',
            transition:'border-color 0.15s, background 0.15s',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isDragOver?'#000000':t.textDim} strokeWidth="1.5" style={{ marginBottom:'10px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <p style={{ margin:'0 0 4px', fontSize:'13px', fontWeight:'600', color:t.text }}>
              {isDragOver ? 'Drop image here' : 'Click or drag & drop image'}
            </p>
            <p style={{ margin:0, fontSize:'12px', color:t.textDim }}>PNG, JPG, WEBP</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={wrapFileUpload} style={{ display:'none' }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={isDecoding} style={{
            width:'100%', padding:'18px 24px',
            background:isDecoding?'#e0e0e0':t.btnBg, color:isDecoding?t.textDim:t.btnText,
            border:'none', borderRadius:'0', fontSize:'13px', fontWeight:'600',
            letterSpacing:'0.08em', textTransform:'uppercase',
            cursor:isDecoding?'not-allowed':'pointer',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <span style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              {isDecoding && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
              {isDecoding ? 'Decoding...' : 'Decode Image'}
            </span>
            {!isDecoding && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
          </button>

          {decodeError && (
            <div style={{ marginTop:'20px', padding:'14px 16px', background:t.errorBg, border:`1px solid ${t.errorBorder}`, borderRadius:'6px', color:t.errorText, fontSize:'13px', display:'flex', gap:'8px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {decodeError}
            </div>
          )}
          {decodedText && !decodeError && (
            <div style={{ marginTop:'24px', padding:'20px', background:t.resultBg, border:`1px solid ${t.border}`, borderRadius:'8px' }}>
              {decodeInfo && (
                <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' }}>
                  <span style={{ padding:'3px 10px', background:t.chipBg, color:t.chipText, borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>{decodeInfo.chars} chars</span>
                  {decodeInfo.density && <span style={{ padding:'3px 10px', background:t.chipBg, color:t.chipText, borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>{decodeInfo.density}</span>}
                  <span style={{ padding:'3px 10px', background:t.chipBg, color:t.chipText, borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>{decodeInfo.confidence}% confidence</span>
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
  );
};

export default AdaptiveShotCode;
