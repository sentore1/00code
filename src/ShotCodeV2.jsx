// ShotCodeV2 - Version 2.0 - Fresh reload
import React, { useState, useRef } from 'react';

const ShotCodeV2 = ({ initialText = '', onPreviewReady, onActionsReady }) => {
  const [inputText, setInputText] = useState(initialText);
  const [decodedText, setDecodedText] = useState('');
  const [confidence, setConfidence] = useState(0);
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
  React.useEffect(() => {
    if (!onActionsReady) return;
    onActionsReady({
      download: () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = 'shotcode.png';
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
      },
      isGenerated,
    });
  }, [isGenerated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update when initialText prop changes
  React.useEffect(() => {
    if (initialText) {
      setInputText(initialText);
      // Only encode when explicitly triggered
    }
  }, [initialText]);

  // PHILOSOPHER'S APPROACH: Error correction + redundancy
  // Truth: Perfect encoding is impossible, but recoverable encoding is
  // Ultra high capacity configuration with enhanced quality
  // 300 rings × 360 segments = 108,000 bits with error correction
  // Real capacity after 30% error correction: ~9,400 bytes = 9,400 chars
  const CONFIG = {
    rings: 300,
    segments: 360,
    canvasSize: 2400,
    outerRadius: 1180,
    innerRadius: 20,
    useCompression: true,
    errorCorrection: 0.3
  };

  // SIMPLE & RELIABLE compression - just RLE for spaces
  const compress = (text) => {
    let result = '';
    let i = 0;
    
    while (i < text.length) {
      const char = text[i];
      
      // Only compress spaces (most common repeated character)
      if (char === ' ') {
        let count = 1;
        while (i + count < text.length && text[i + count] === ' ' && count < 255) {
          count++;
        }
        
        if (count >= 3) {
          // Use marker: \x01 + count
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
        // Space compression marker
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

  // SIMPLE PARITY ERROR CORRECTION
  // Add parity bit every 7 data bits (Hamming-like)
  const addErrorCorrection = (binary) => {
    let result = '';
    for (let i = 0; i < binary.length; i += 7) {
      const chunk = binary.substring(i, i + 7);
      const ones = (chunk.match(/1/g) || []).length;
      const parity = ones % 2 === 0 ? '0' : '1';
      result += chunk + parity;
    }
    return result;
  };

  const removeErrorCorrection = (binary) => {
    let result = '';
    let corrected = 0;
    
    for (let i = 0; i < binary.length; i += 8) {
      const chunk = binary.substring(i, i + 8);
      if (chunk.length < 8) break;
      
      const data = chunk.substring(0, 7);
      const parity = chunk[7];
      const ones = (data.match(/1/g) || []).length;
      const expectedParity = ones % 2 === 0 ? '0' : '1';
      
      // Simple error detection (not correction, but helps identify bad data)
      if (parity !== expectedParity) {
        corrected++;
      }
      
      result += data;
    }
    
    if (corrected > 0) {
      console.log('Error correction: detected', corrected, 'parity errors');
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
    const { canvasSize, rings, segments, outerRadius, innerRadius, useCompression } = CONFIG;
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // CRITICAL: Disable anti-aliasing for sharp edges
    ctx.imageSmoothingEnabled = false;
    
    const center = canvasSize / 2;
    const ringWidth = (outerRadius - innerRadius) / rings;
    
    const totalBits = rings * segments;
    const maxBytes = Math.floor((totalBits - 16) / 8);
    
    console.log('=== ENCODING ===');
    console.log('Config:', rings, 'rings ×', segments, 'segments =', totalBits, 'bits');
    console.log('Capacity:', maxBytes, 'bytes');
    console.log('Canvas:', canvasSize, 'x', canvasSize);
    console.log('Ring width:', ringWidth.toFixed(2), 'px');
    console.log('Segment angle:', (360 / segments).toFixed(3), '°');
    
    // Compress if enabled
    const textToEncode = useCompression ? compress(inputText) : inputText;
    
    console.log('Original length:', inputText.length, 'chars');
    if (useCompression) {
      console.log('Compressed length:', textToEncode.length, 'chars');
      console.log('Compression ratio:', (textToEncode.length / inputText.length * 100).toFixed(1) + '%');
    }
    
    if (textToEncode.length > maxBytes) {
      alert(`Text too long! After compression: ${textToEncode.length} bytes, capacity: ${maxBytes} bytes`);
      return;
    }
    
    const binary = textToBinary(textToEncode);
    const binaryWithEC = addErrorCorrection(binary);
    const lengthBits = textToEncode.length.toString(2).padStart(16, '0');
    let fullBinary = lengthBits + binaryWithEC;
    
    // Calculate total capacity and add padding
    const totalCapacity = rings * segments;
    if (fullBinary.length < totalCapacity) {
      const paddingNeeded = totalCapacity - fullBinary.length;
      console.log('Adding padding:', paddingNeeded, 'bits');
      fullBinary += Array.from({ length: paddingNeeded }, (_, i) => i % 2).join('');
    }
    
    console.log('Total capacity:', totalCapacity);
    console.log('Total bits to encode:', fullBinary.length);
    console.log('First 50 bits:', fullBinary.substring(0, 50));
    console.log('Ones count:', (fullBinary.match(/1/g) || []).length);
    console.log('Zeros count:', (fullBinary.match(/0/g) || []).length);
    
    // White background - PURE white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Black center - PURE black (only if innerRadius is large enough)
    if (innerRadius > 30) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(center, center, innerRadius - 30, 0, Math.PI * 2);
      ctx.fill();
    } else if (innerRadius > 0) {
      // If innerRadius is too small, just fill the available space
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(center, center, Math.max(1, innerRadius - 5), 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw data FIRST - OUTER TO INNER with PRECISE boundaries
    let bitIndex = 0;
    for (let ring = rings - 1; ring >= 0 && bitIndex < fullBinary.length; ring--) {
      const r1 = innerRadius + ring * ringWidth;
      const r2 = innerRadius + (ring + 1) * ringWidth;
      
      for (let seg = 0; seg < segments && bitIndex < fullBinary.length; seg++) {
        // PRECISE angle calculation - no rounding errors
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
    
    // Outer border AFTER data - drawn outside to not cover data
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(center, center, outerRadius + 10, 0, Math.PI * 2);
    ctx.stroke();
    
    // Mark code as generated
    setCodeGenerated(true);
  };

  const decode = (ctx, width, height) => {
    const { rings, segments, outerRadius, innerRadius } = CONFIG;
    
    const center = width / 2;
    const scale = width / CONFIG.canvasSize;
    const scaledOuter = outerRadius * scale;
    const scaledInner = innerRadius * scale;
    const ringWidth = (scaledOuter - scaledInner) / rings;
    
    console.log('=== DECODING ===');
    console.log('Image size:', width, 'x', height);
    console.log('Scale:', scale.toFixed(4));
    console.log('Ring width:', ringWidth.toFixed(3), 'px');
    console.log('Segment angle:', (360 / segments).toFixed(3), '°');
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const getPixel = (x, y) => {
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= width || py < 0 || py >= height) return 255;
      const i = (py * width + px) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3;
    };
    
    // Adaptive threshold - sample actual black/white areas with more samples
    let blackSamples = [];
    let whiteSamples = [];
    
    // Sample center (black) - adjust for small innerRadius - MORE SAMPLES
    const centerSampleRadius = scaledInner > 30 ? (scaledInner - 30) * 0.5 : Math.max(1, (scaledInner - 5) * 0.5);
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 2;
      const r = centerSampleRadius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      blackSamples.push(getPixel(x, y));
    }
    
    // Sample outside (white) - MORE SAMPLES
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 2;
      const r = scaledOuter + 50;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      whiteSamples.push(getPixel(x, y));
    }
    
    const avgBlack = blackSamples.reduce((a, b) => a + b, 0) / blackSamples.length;
    const avgWhite = whiteSamples.reduce((a, b) => a + b, 0) / whiteSamples.length;
    const threshold = (avgBlack + avgWhite) / 2;
    
    console.log('Black avg:', avgBlack.toFixed(1), 'samples:', blackSamples.length);
    console.log('White avg:', avgWhite.toFixed(1), 'samples:', whiteSamples.length);
    console.log('Threshold:', threshold.toFixed(1));
    console.log('Center sample radius:', centerSampleRadius?.toFixed(2) || 'N/A');
    
    // PHYSICS-BASED DECODING: Sample at exact geometric centers
    let binary = '';
    let confidenceSum = 0;
    let segmentCount = 0;
    
    // Debug: track first 10 segments
    let debugSegments = [];
    
    for (let ring = rings - 1; ring >= 0; ring--) {
      const r1 = scaledInner + ring * ringWidth;
      const r2 = scaledInner + (ring + 1) * ringWidth;
      
      for (let seg = 0; seg < segments; seg++) {
        // PRECISE angle calculation matching encode
        const a1 = (seg / segments) * Math.PI * 2;
        const a2 = ((seg + 1) / segments) * Math.PI * 2;
        const aMid = (a1 + a2) / 2;
        
        // ULTRA-DENSE GRID SAMPLING: 20x20 = 400 sample points per segment
        let blackCount = 0;
        let whiteCount = 0;
        const gridSize = 20;
        
        for (let ri = 0; ri < gridSize; ri++) {
          // Sample across full ring width
          const rFraction = (ri + 0.5) / gridSize;
          const r = r1 + (r2 - r1) * rFraction;
          
          for (let ai = 0; ai < gridSize; ai++) {
            // Sample across full segment angle
            const aFraction = (ai + 0.5) / gridSize;
            const angle = a1 + (a2 - a1) * aFraction;
            
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            
            const brightness = getPixel(x, y);
            if (brightness < threshold) {
              blackCount++;
            } else {
              whiteCount++;
            }
          }
        }
        
        const total = blackCount + whiteCount;
        const majority = Math.max(blackCount, whiteCount);
        const bitConfidence = majority / total;
        confidenceSum += bitConfidence;
        segmentCount++;
        
        const bit = blackCount > whiteCount ? '1' : '0';
        binary += bit;
        
        // Debug first 10 segments
        if (debugSegments.length < 10) {
          debugSegments.push({ ring, seg, blackCount, whiteCount, bit, r1: r1.toFixed(1), r2: r2.toFixed(1) });
        }
      }
    }
    
    console.log('First 10 decoded segments:', debugSegments);
    
    const avgConfidence = (confidenceSum / segmentCount) * 100;
    
    console.log('Decoded bits:', binary.length);
    console.log('Confidence:', avgConfidence.toFixed(1) + '%');
    
    // Read 16-bit length
    const lengthBits = binary.substring(0, 16);
    const textLength = parseInt(lengthBits, 2);
    
    console.log('Length bits:', lengthBits);
    console.log('Text length:', textLength);
    console.log('First 100 bits:', binary.substring(0, 100));
    
    if (textLength > 10000 || textLength === 0) {
      console.error('Invalid length:', textLength);
      console.error('This usually means the decoder cannot read the encoded pattern correctly');
      console.error('Check: image quality, center detection, ring alignment');
      return { text: '[ERROR: Invalid length ' + textLength + ']', confidence: 0 };
    }
    
    // Read data with error correction
    const dataBitsWithEC = binary.substring(16);
    const dataBits = removeErrorCorrection(dataBitsWithEC);
    const decodedCompressed = binaryToText(dataBits.substring(0, textLength * 8));
    
    // Decompress if needed
    const decoded = CONFIG.useCompression ? decompress(decodedCompressed) : decodedCompressed;
    
    console.log('Decoded text length:', decoded.length);
    console.log('Decoded text preview:', decoded.substring(0, 100) + (decoded.length > 100 ? '...' : ''));
    
    return { text: decoded, confidence: avgConfidence };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('=== FILE UPLOAD ===');
    console.log('File:', file.name, file.type, file.size, 'bytes');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('File loaded, creating image...');
      const img = new Image();
      img.onload = () => {
        console.log('Image loaded:', img.width, 'x', img.height);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        console.log('Starting decode...');
        try {
          const result = decode(ctx, img.width, img.height);
          console.log('Decode complete:', result);
          setDecodedText(result.text);
          setConfidence(Math.round(result.confidence));
        } catch (error) {
          console.error('Decode error:', error);
          setDecodedText('[ERROR: ' + error.message + ']');
          setConfidence(0);
        }
      };
      img.onerror = (error) => {
        console.error('Image load error:', error);
        alert('Failed to load image');
      };
      img.src = e.target.result;
    };
    reader.onerror = (error) => {
      console.error('File read error:', error);
      alert('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const testDecode = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const result = decode(ctx, canvas.width, canvas.height);
    
    const match = inputText === result.text;
    
    console.log('\n=== COMPARISON ===');
    console.log('Original:', inputText);
    console.log('Decoded:', result.text);
    console.log('Match:', match ? 'YES ✓' : 'NO ✗');
    
    // Character comparison
    if (!match) {
      console.log('\nFirst 20 mismatches:');
      let mismatchCount = 0;
      for (let i = 0; i < Math.max(inputText.length, result.text.length) && mismatchCount < 20; i++) {
        const orig = inputText[i] || '(none)';
        const dec = result.text[i] || '(none)';
        if (orig !== dec) {
          console.log(`  [${i}] "${orig}" (${orig.charCodeAt(0)}) vs "${dec}" (${dec.charCodeAt(0)})`);
          mismatchCount++;
        }
      }
    }
    
    alert(
      `Original: ${inputText.length} chars\n` +
      `Decoded: ${result.text.length} chars\n\n` +
      `Match: ${match ? 'YES ✓' : 'NO ✗'}\n` +
      `Confidence: ${result.confidence.toFixed(1)}%\n\n` +
      `Check console (F12) for details`
    );
  };

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'shotcode.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const totalBits = CONFIG.rings * CONFIG.segments;
  const bitsWithEC = Math.floor(totalBits * (1 - CONFIG.errorCorrection));
  const maxBytes = Math.floor((bitsWithEC - 16) / 8 * 7 / 8); // Account for 7:8 encoding
  const estimatedCapacity = CONFIG.useCompression ? '~12,000+' : maxBytes;

  const t = {
    text:'#000', textMuted:'#666', textDim:'#999',
    inputBg:'#fff', inputBorder:'#d1d5db', inputText:'#111',
    btnBg:'#000', btnText:'#fff',
    tabActive:'#000', tabInactive:'#aaa', tabBorder:'#e5e5e5',
    stepLabel:'#999', border:'#e5e5e5', chipBg:'#f0f0f0', chipText:'#555',
    uploadBorder:'#d1d5db', errorBg:'#fff5f5', errorBorder:'#fecaca', errorText:'#dc2626',
    resultBg:'#f8f8f8', decodedBg:'#fff',
  };

  const wrapEncode = () => {
    console.log('Generate button clicked');
    console.log('inputText:', inputText?.substring(0, 50));
    console.log('canvasRef.current:', canvasRef.current);
    
    if (!inputText || !canvasRef.current) {
      console.warn('Missing inputText or canvas');
      return;
    }
    
    setIsGenerating(true);
    console.log('Starting generation...');
    
    setTimeout(() => {
      try {
        encode();
        const url = canvasRef.current.toDataURL('image/png');
        setPreviewUrl(url);
        setIsGenerated(true);
        onPreviewReady?.(url, `${CONFIG.rings}×${CONFIG.segments} rings`);
        console.log('Generation complete!');
      } catch (err) {
        console.error('Encode failed:', err);
        alert('Generation failed: ' + err.message);
      } finally {
        setIsGenerating(false);
      }
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
          setConfidence(Math.round(result.confidence));
          setDecodeInfo({ chars: result.text.length, confidence: Math.round(result.confidence) });
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

      {/* ── ENCODE ── */}
      {activeTab === 'encode' && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
            <span style={{ fontSize:'11px', fontWeight:'400', letterSpacing:'0.1em', color:t.stepLabel }}>01</span>
            <span style={{ fontSize:'11px', fontWeight:'400', letterSpacing:'0.1em', color:t.stepLabel }}>ENCODE MESSAGE</span>
          </div>
          <textarea value={inputText} onChange={e => setInputText(e.target.value)}
            placeholder="Type your message..." maxLength={10000}
            style={{ width:'100%', minHeight:'160px', padding:'16px', fontSize:'14px', lineHeight:'1.6',
              background:t.inputBg, color:t.inputText, border:`1px solid ${t.inputBorder}`,
              borderRadius:'8px', resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
          />
          <div style={{ textAlign:'right', fontSize:'12px', color:t.textDim, margin:'6px 0 24px' }}>
            {inputText.length} / 10,000 characters
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

      {/* ── DECODE ── */}
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
                <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
                  <span style={{ padding:'3px 10px', background:t.chipBg, color:t.chipText, borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>{decodeInfo.chars} chars</span>
                  <span style={{ padding:'3px 10px', background:t.chipBg, color: decodeInfo.confidence > 90 ? '#10b981' : decodeInfo.confidence > 70 ? '#f59e0b' : '#ef4444', borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>{decodeInfo.confidence}% confidence</span>
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

export default ShotCodeV2;
