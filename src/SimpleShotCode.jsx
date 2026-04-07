import React, { useState, useRef } from 'react';

const SimpleShotCode = () => {
  const [mode, setMode] = useState('encode');
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [useCompression, setUseCompression] = useState(false);
  const [capacity, setCapacity] = useState('small');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Capacity configurations - gradually increasing
  const configs = {
    tiny: { rings: 15, segments: 30, name: 'Tiny (56 chars)' },
    small: { rings: 20, segments: 40, name: 'Small (100 chars)' },
    medium: { rings: 25, segments: 50, name: 'Medium (156 chars)' },
    large: { rings: 30, segments: 60, name: 'Large (225 chars)' },
    xlarge: { rings: 35, segments: 70, name: 'X-Large (306 chars)' },
    xxlarge: { rings: 40, segments: 80, name: 'XX-Large (400 chars)' },
    huge: { rings: 45, segments: 90, name: 'Huge (506 chars)' },
    massive: { rings: 50, segments: 100, name: 'Massive (625 chars)' },
    ultra: { rings: 55, segments: 110, name: 'Ultra (756 chars)' },
    extreme: { rings: 60, segments: 120, name: 'Extreme (900 chars)' },
    maximum: { rings: 70, segments: 140, name: 'Maximum (1225 chars)' },
    insane: { rings: 80, segments: 160, name: 'Insane (1600 chars)' }
  };

  const config = configs[capacity];
  const maxBits = config.rings * config.segments;
  const maxChars = Math.floor(maxBits / 8);
  
  // Calculate effective capacity with compression
  const effectiveMaxChars = useCompression ? Math.floor(maxChars * 1.6) : maxChars;

  // LZW Compression
  const compress = (text) => {
    const dict = new Map();
    let dictSize = 256;
    for (let i = 0; i < 256; i++) {
      dict.set(String.fromCharCode(i), i);
    }
    let w = '';
    const result = [];
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const wc = w + c;
      if (dict.has(wc)) {
        w = wc;
      } else {
        result.push(dict.get(w));
        if (dictSize < 4096) dict.set(wc, dictSize++);
        w = c;
      }
    }
    if (w !== '') result.push(dict.get(w));
    return result.map(n => String.fromCharCode(Math.min(n, 65535))).join('');
  };

  const decompress = (compressed) => {
    if (!compressed || compressed.length === 0) return '';
    const dict = new Map();
    let dictSize = 256;
    for (let i = 0; i < 256; i++) {
      dict.set(i, String.fromCharCode(i));
    }
    const codes = compressed.split('').map(c => c.charCodeAt(0));
    let w = String.fromCharCode(codes[0]);
    let result = w;
    for (let i = 1; i < codes.length; i++) {
      const k = codes[i];
      let entry;
      if (dict.has(k)) {
        entry = dict.get(k);
      } else if (k === dictSize) {
        entry = w + w[0];
      } else {
        return result;
      }
      result += entry;
      if (dictSize < 4096) dict.set(dictSize++, w + entry[0]);
      w = entry;
    }
    return result;
  };

  // STEP 1: Convert text to binary
  const textToBinary = (text) => {
    let binary = '';
    for (let i = 0; i < text.length; i++) {
      const byte = text.charCodeAt(i).toString(2).padStart(8, '0');
      binary += byte;
    }
    return binary;
  };

  // STEP 2: Convert binary to text
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

  // Add metadata header: 16 bits for text length + 8 bits for checksum
  const addMetadata = (binary, originalLength) => {
    // Store original text length (16 bits = up to 65535 chars)
    const lengthBits = originalLength.toString(2).padStart(16, '0');
    
    // Calculate simple checksum (8 bits)
    let checksum = 0;
    for (let i = 0; i < binary.length; i += 8) {
      const byte = parseInt(binary.substring(i, i + 8), 2);
      checksum = (checksum + byte) % 256;
    }
    const checksumBits = checksum.toString(2).padStart(8, '0');
    
    // Header: length (16) + checksum (8) + data
    return lengthBits + checksumBits + binary;
  };

  // Extract metadata and validate
  const extractMetadata = (binary) => {
    if (binary.length < 24) {
      return { valid: false, length: 0, checksum: 0, data: '' };
    }
    
    const lengthBits = binary.substring(0, 16);
    const checksumBits = binary.substring(16, 24);
    const dataBits = binary.substring(24);
    
    const expectedLength = parseInt(lengthBits, 2);
    const expectedChecksum = parseInt(checksumBits, 2);
    
    // Calculate actual checksum
    let actualChecksum = 0;
    for (let i = 0; i < dataBits.length; i += 8) {
      const byte = parseInt(dataBits.substring(i, i + 8), 2);
      actualChecksum = (actualChecksum + byte) % 256;
    }
    
    const valid = actualChecksum === expectedChecksum;
    
    return {
      valid,
      expectedLength,
      checksum: expectedChecksum,
      data: dataBits.substring(0, expectedLength * 8) // Only take expected length
    };
  };

  // STEP 3: Encode - Draw pattern
  const encode = () => {
    if (!inputText || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 1200; // Larger canvas for better resolution
    canvas.width = size;
    canvas.height = size;
    
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Apply compression if enabled
    let processedText = inputText;
    let originalLength = inputText.length;
    
    if (useCompression && inputText.length > 20) {
      processedText = compress(inputText);
      console.log('Compressed:', inputText.length, '→', processedText.length, 'chars');
    }
    
    // Convert text to binary
    const dataBinary = textToBinary(processedText);
    
    // Add metadata header (length + checksum)
    const binary = addMetadata(dataBinary, originalLength);
    
    console.log('Original length:', originalLength);
    console.log('Binary length:', binary.length, 'bits (including 24-bit header)');
    console.log('Data bits:', dataBinary.length);
    
    const { rings, segments } = config;
    const outerRadius = 550;
    const innerRadius = 60;
    const ringWidth = (outerRadius - innerRadius) / rings;
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Black center circle
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // White inner circle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Black outer border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Timing patterns
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    for (let i = 10; i < rings; i += 10) {
      const r = innerRadius + i * ringWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw data: 1 bit per segment (BLACK = 1, WHITE = 0)
    let bitIndex = 0;
    
    // Go from OUTER to INNER
    for (let ring = rings - 1; ring >= 0 && bitIndex < binary.length; ring--) {
      const r1 = innerRadius + ring * ringWidth;
      const r2 = innerRadius + (ring + 1) * ringWidth;
      
      for (let seg = 0; seg < segments && bitIndex < binary.length; seg++) {
        const angle1 = (seg / segments) * Math.PI * 2;
        const angle2 = ((seg + 1) / segments) * Math.PI * 2;
        
        const bit = binary[bitIndex];
        bitIndex++;
        
        // If bit is 1, draw BLACK segment
        if (bit === '1') {
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(centerX, centerY, r2, angle1, angle2);
          ctx.arc(centerX, centerY, r1, angle2, angle1, true);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    
    // Position markers
    const markerRadius = outerRadius * 0.07;
    const markerDist = outerRadius - markerRadius * 1.5;
    const markerAngles = [0, Math.PI * 2/3, Math.PI * 4/3];
    
    markerAngles.forEach(angle => {
      const mx = centerX + markerDist * Math.cos(angle);
      const my = centerY + markerDist * Math.sin(angle);
      
      // Black outer
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(mx, my, markerRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // White middle
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(mx, my, markerRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      // Black center
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(mx, my, markerRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    console.log('Encoded', bitIndex, 'bits (including header)');
  };

  // STEP 4: Decode - Read pattern
  const decode = (ctx, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    const { rings, segments } = config;
    const outerRadius = 550 * (width / 1200); // Scale to image size
    const innerRadius = 60 * (width / 1200);
    const ringWidth = (outerRadius - innerRadius) / rings;
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const getPixel = (x, y) => {
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= width || py < 0 || py >= height) return 255;
      const i = (py * width + px) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3; // Average RGB
    };
    
    let binary = '';
    
    // Adaptive sampling based on segment density
    const segmentDensity = segments / rings;
    let samplesPerSegment;
    
    if (segments <= 50) {
      samplesPerSegment = 5;  // Low density: 5 samples
    } else if (segments <= 80) {
      samplesPerSegment = 9;  // Medium density: 9 samples
    } else if (segments <= 120) {
      samplesPerSegment = 13; // High density: 13 samples
    } else {
      samplesPerSegment = 25; // Very high density: 25 samples (5×5 grid)
    }
    
    // Read from OUTER to INNER (same as encoding)
    for (let ring = rings - 1; ring >= 0; ring--) {
      const r1 = innerRadius + ring * ringWidth;
      const r2 = innerRadius + (ring + 1) * ringWidth;
      const rMid = (r1 + r2) / 2;
      
      for (let seg = 0; seg < segments; seg++) {
        const angleStart = (seg / segments) * Math.PI * 2;
        const angleEnd = ((seg + 1) / segments) * Math.PI * 2;
        const angleMid = (angleStart + angleEnd) / 2;
        
        // ADAPTIVE: More samples for high-density patterns
        let blackCount = 0;
        let whiteCount = 0;
        
        if (samplesPerSegment === 25) {
          // 25-point grid (5×5) for very high density
          const radialPoints = 5;
          const angularPoints = 5;
          
          for (let ri = 0; ri < radialPoints; ri++) {
            const r = r1 + (r2 - r1) * (ri / (radialPoints - 1));
            for (let ai = 0; ai < angularPoints; ai++) {
              const angleOffset = (angleEnd - angleStart) * ((ai / (angularPoints - 1)) - 0.5) * 0.8;
              const angle = angleMid + angleOffset;
              const x = centerX + r * Math.cos(angle);
              const y = centerY + r * Math.sin(angle);
              const brightness = getPixel(x, y);
              
              if (brightness < 128) {
                blackCount++;
              } else {
                whiteCount++;
              }
            }
          }
        } else if (samplesPerSegment === 13) {
          // 13-point sampling for high density
          const radialPoints = 4;
          const angularPoints = 3;
          
          for (let ri = 0; ri < radialPoints; ri++) {
            const r = r1 + (r2 - r1) * (ri / (radialPoints - 1));
            for (let ai = 0; ai < angularPoints; ai++) {
              const angleOffset = (angleEnd - angleStart) * ((ai / (angularPoints - 1)) - 0.5) * 0.7;
              const angle = angleMid + angleOffset;
              const x = centerX + r * Math.cos(angle);
              const y = centerY + r * Math.sin(angle);
              const brightness = getPixel(x, y);
              
              if (brightness < 128) {
                blackCount++;
              } else {
                whiteCount++;
              }
            }
          }
          
          // Add center point
          const x = centerX + rMid * Math.cos(angleMid);
          const y = centerY + rMid * Math.sin(angleMid);
          const brightness = getPixel(x, y);
          if (brightness < 128) blackCount++; else whiteCount++;
          
        } else if (samplesPerSegment === 9) {
          // 9-point grid sampling for medium density
          const radialPoints = 3;
          const angularPoints = 3;
          
          for (let ri = 0; ri < radialPoints; ri++) {
            const r = r1 + (r2 - r1) * (ri / (radialPoints - 1));
            for (let ai = 0; ai < angularPoints; ai++) {
              const angleOffset = (angleEnd - angleStart) * ((ai / (angularPoints - 1)) - 0.5) * 0.7;
              const angle = angleMid + angleOffset;
              const x = centerX + r * Math.cos(angle);
              const y = centerY + r * Math.sin(angle);
              const brightness = getPixel(x, y);
              
              if (brightness < 128) {
                blackCount++;
              } else {
                whiteCount++;
              }
            }
          }
        } else {
          // 5-point sampling for lower density
          const samplePoints = [
            { r: rMid, a: angleMid },
            { r: rMid - ringWidth * 0.25, a: angleMid },
            { r: rMid + ringWidth * 0.25, a: angleMid },
            { r: rMid, a: angleMid - (angleEnd - angleStart) * 0.3 },
            { r: rMid, a: angleMid + (angleEnd - angleStart) * 0.3 }
          ];
          
          for (const point of samplePoints) {
            const x = centerX + point.r * Math.cos(point.a);
            const y = centerY + point.r * Math.sin(point.a);
            const brightness = getPixel(x, y);
            
            if (brightness < 128) {
              blackCount++;
            } else {
              whiteCount++;
            }
          }
        }
        
        // Majority vote
        const bit = blackCount > whiteCount ? '1' : '0';
        binary += bit;
      }
    }
    
    console.log('Decoded binary length:', binary.length, 'bits');
    console.log('Used', samplesPerSegment, 'samples per segment');
    
    // Extract metadata and validate
    const metadata = extractMetadata(binary);
    
    console.log('Metadata valid:', metadata.valid);
    console.log('Expected length:', metadata.expectedLength, 'chars');
    console.log('Checksum match:', metadata.valid ? '✓' : '✗');
    
    if (!metadata.valid) {
      console.warn('⚠️ Checksum mismatch! Data may be corrupted.');
    }
    
    // Convert binary to text (only the expected length)
    let text = binaryToText(metadata.data);
    
    // Try decompression if enabled
    if (useCompression) {
      try {
        const decompressed = decompress(text);
        console.log('Decompressed:', text.length, '→', decompressed.length, 'chars');
        text = decompressed;
      } catch (e) {
        console.log('Decompression failed, using raw text');
      }
    }
    
    // Return with validation info
    return {
      text: text,
      valid: metadata.valid,
      expectedLength: metadata.expectedLength
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
          if (result.valid) {
            setDecodedText(result.text);
          } else {
            setDecodedText(`⚠️ Warning: Checksum failed\n\n${result.text}\n\n(Data may be corrupted)`);
          }
        } catch (error) {
          setDecodedText('Error: ' + error.message);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'shotcode.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const testDecode = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const result = decode(ctx, canvas.width, canvas.height);
    const match = inputText === result.text;
    setDecodedText(`Original: "${inputText}"\n\nDecoded: "${result.text}"\n\nMatch: ${match ? '✓ YES' : '✗ NO'}\nChecksum: ${result.valid ? '✓ Valid' : '✗ Invalid'}`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center' }}>ShotCode - Gradual Capacity</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '10px' }}>
        {config.rings} rings × {config.segments} segments = {maxBits} bits = {maxChars} characters
        {useCompression && <span style={{ color: '#10b981', fontWeight: 'bold' }}> (with compression: ~{effectiveMaxChars} chars)</span>}
      </p>
      <p style={{ textAlign: 'center', color: '#999', fontSize: '14px', marginBottom: '20px' }}>
        💡 Start with Tiny/Small, test it works perfectly, then gradually increase
      </p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '10px', color: '#333' }}>Select Capacity Level:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '15px' }}>
          {Object.entries(configs).map(([key, cfg]) => {
            const chars = Math.floor((cfg.rings * cfg.segments) / 8);
            const isRecommended = key === 'small' || key === 'medium' || key === 'large';
            return (
              <button
                key={key}
                onClick={() => setCapacity(key)}
                style={{
                  padding: '10px 8px',
                  background: capacity === key ? '#3b82f6' : isRecommended ? '#f0fdf4' : '#f9fafb',
                  color: capacity === key ? 'white' : '#1f2937',
                  border: capacity === key ? '2px solid #3b82f6' : isRecommended ? '2px solid #10b981' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: capacity === key ? 'bold' : 'normal',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{cfg.name.split('(')[0]}</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>{chars} chars</div>
                {isRecommended && <div style={{ fontSize: '10px', color: '#10b981', marginTop: '2px' }}>✓ Recommended</div>}
              </button>
            );
          })}
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useCompression}
              onChange={(e) => setUseCompression(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
              📦 Enable LZW Compression (40-60% smaller)
            </span>
          </label>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <button 
          onClick={() => setMode('encode')}
          style={{
            padding: '10px 30px',
            background: mode === 'encode' ? '#3b82f6' : '#e5e7eb',
            color: mode === 'encode' ? 'white' : 'black',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          Encode
        </button>
        <button 
          onClick={() => setMode('decode')}
          style={{
            padding: '10px 30px',
            background: mode === 'decode' ? '#10b981' : '#e5e7eb',
            color: mode === 'decode' ? 'white' : 'black',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          Decode
        </button>
      </div>

      {mode === 'encode' ? (
        <div>
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setTimeout(encode, 10);
            }}
            placeholder={`Enter text (max ${maxChars} chars)\n\nStart with something short like "Hello World"`}
            maxLength={maxChars}
            rows={6}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '16px',
              fontFamily: 'monospace',
              borderRadius: '8px',
              border: '2px solid #d1d5db',
              marginBottom: '10px',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ textAlign: 'right', marginBottom: '20px', color: '#6b7280' }}>
            {inputText.length} / {maxChars} characters
          </div>
          
          {inputText && (
            <div style={{ textAlign: 'center' }}>
              <canvas 
                ref={canvasRef} 
                style={{ 
                  maxWidth: '100%', 
                  border: '2px solid #d1d5db', 
                  borderRadius: '8px',
                  background: 'white'
                }} 
              />
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  onClick={downloadImage} 
                  style={{ 
                    padding: '12px 24px', 
                    background: '#10b981', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  Download PNG
                </button>
                <button 
                  onClick={testDecode} 
                  style={{ 
                    padding: '12px 24px', 
                    background: '#f59e0b', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  Test Decode
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '18px'
            }}
          >
            Upload ShotCode Image
          </button>
          
          {decodedText && (
            <div style={{ 
              marginTop: '20px', 
              padding: '20px', 
              background: '#f3f4f6', 
              borderRadius: '8px',
              border: '2px solid #d1d5db'
            }}>
              <h3 style={{ marginTop: 0 }}>Decoded Text:</h3>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'monospace', 
                fontSize: '14px',
                background: 'white',
                padding: '15px',
                borderRadius: '4px'
              }}>
                {decodedText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleShotCode;
