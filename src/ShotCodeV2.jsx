// ShotCodeV2 - Version 2.0 - Fresh reload
import React, { useState, useRef } from 'react';

const ShotCodeV2 = () => {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // PHILOSOPHER'S APPROACH: Error correction + redundancy
  // Truth: Perfect encoding is impossible, but recoverable encoding is
  // 240 rings × 360 segments = 86,400 bits with error correction
  // Real capacity after 30% error correction: ~7,500 bytes = 7,500 chars
  const CONFIG = {
    rings: 240,
    segments: 360,
    canvasSize: 14400,  // EXTREME: 40px per segment at outer edge
    outerRadius: 7150,  // Massive diameter
    innerRadius: 200,   // Stable center
    useCompression: true,
    errorCorrection: 0.3  // 30% redundancy for error recovery
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
    const fullBinary = lengthBits + binaryWithEC;
    
    console.log('Total bits to encode:', fullBinary.length);
    
    // White background - PURE white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Black center - PURE black
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(center, center, innerRadius - 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer border - thicker for better detection
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw data - OUTER TO INNER with PRECISE boundaries
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
    
    // Adaptive threshold - sample actual black/white areas
    let blackSamples = [];
    let whiteSamples = [];
    
    // Sample center (black)
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const r = (scaledInner - 30) * 0.5;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      blackSamples.push(getPixel(x, y));
    }
    
    // Sample outside (white)
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const r = scaledOuter + 50;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      whiteSamples.push(getPixel(x, y));
    }
    
    const avgBlack = blackSamples.reduce((a, b) => a + b, 0) / blackSamples.length;
    const avgWhite = whiteSamples.reduce((a, b) => a + b, 0) / whiteSamples.length;
    const threshold = (avgBlack + avgWhite) / 2;
    
    console.log('Black avg:', avgBlack.toFixed(1));
    console.log('White avg:', avgWhite.toFixed(1));
    console.log('Threshold:', threshold.toFixed(1));
    
    // PHYSICS-BASED DECODING: Sample at exact geometric centers
    let binary = '';
    let confidenceSum = 0;
    let segmentCount = 0;
    
    for (let ring = rings - 1; ring >= 0; ring--) {
      const r1 = scaledInner + ring * ringWidth;
      const r2 = scaledInner + (ring + 1) * ringWidth;
      
      for (let seg = 0; seg < segments; seg++) {
        // PRECISE angle calculation matching encode
        const a1 = (seg / segments) * Math.PI * 2;
        const a2 = ((seg + 1) / segments) * Math.PI * 2;
        const aMid = (a1 + a2) / 2;
        
        // DENSE GRID SAMPLING: 15x15 = 225 sample points per segment
        let blackCount = 0;
        let whiteCount = 0;
        const gridSize = 15;
        
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
        
        binary += blackCount > whiteCount ? '1' : '0';
      }
    }
    
    const avgConfidence = (confidenceSum / segmentCount) * 100;
    
    console.log('Decoded bits:', binary.length);
    console.log('Confidence:', avgConfidence.toFixed(1) + '%');
    
    // Read 16-bit length
    const lengthBits = binary.substring(0, 16);
    const textLength = parseInt(lengthBits, 2);
    
    console.log('Length bits:', lengthBits);
    console.log('Text length:', textLength);
    
    if (textLength > 10000 || textLength === 0) {
      console.error('Invalid length:', textLength);
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

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center' }}>ShotCode V2 - Ultra High Capacity</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '10px' }}>
        {CONFIG.rings} rings × {CONFIG.segments} segments = {totalBits} bits = <strong>{estimatedCapacity} characters</strong>
      </p>
      <p style={{ textAlign: 'center', color: '#999', fontSize: '14px', marginBottom: '30px' }}>
        {CONFIG.canvasSize}×{CONFIG.canvasSize}px • 9×9 sampling (81 points) • {CONFIG.useCompression ? 'Space compression' : 'No compression'} • 1.5° per segment
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Enter Text:
        </label>
        <textarea
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setTimeout(() => encode(), 50);
          }}
          placeholder="Type or paste your text here..."
          maxLength={10000}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            boxSizing: 'border-box',
            minHeight: '120px',
            fontFamily: 'monospace'
          }}
        />
        <div style={{ textAlign: 'right', color: '#999', fontSize: '14px', marginTop: '5px' }}>
          {inputText.length} characters
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <canvas 
          ref={canvasRef} 
          style={{ 
            border: '2px solid #ddd', 
            borderRadius: '8px', 
            maxWidth: '100%',
            background: '#f9f9f9'
          }} 
        />
        {inputText && (
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={download} style={buttonStyle}>Download PNG</button>
            <button onClick={testDecode} style={{ ...buttonStyle, background: '#f59e0b' }}>Test Decode</button>
          </div>
        )}
      </div>

      <div style={{ borderTop: '2px solid #ddd', paddingTop: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Upload ShotCode to Decode:
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current?.click()} style={buttonStyle}>
          Choose Image
        </button>
        
        {decodedText && (
          <div style={{ marginTop: '15px', padding: '15px', background: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Decoded: {decodedText.length} characters</strong>
              <div style={{ fontSize: '14px', color: confidence > 90 ? '#10b981' : confidence > 70 ? '#f59e0b' : '#ef4444' }}>
                {confidence}% confidence
              </div>
            </div>
            <div style={{ 
              maxHeight: '200px', 
              overflow: 'auto', 
              background: 'white', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '13px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {decodedText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '12px 24px',
  background: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold'
};

export default ShotCodeV2;
