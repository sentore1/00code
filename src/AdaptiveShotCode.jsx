import { useState, useRef, useEffect } from 'react';

const AdaptiveShotCode = () => {
  const [inputText, setInputText] = useState('');
  const [codeConfig, setCodeConfig] = useState(null);
  const [decodedText, setDecodedText] = useState('');
  const [activeTab, setActiveTab] = useState('encode');
  const [codeGenerated, setCodeGenerated] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

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
    console.log('Configuration:', rings, 'rings ×', segments, 'segments');
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
      console.log(`Configuration: ${density.rings} rings × ${density.segments} segments`);
      console.log(`Total capacity: ${density.rings * density.segments} bits`);
      
      try {
        const result = decodeWithDensity(ctx, width, height, density, getPixel, center, scale);
        
        console.log(`✓ Decode succeeded!`);
        console.log(`  Header density index: ${result.densityIndex}`);
        console.log(`  Text length from header: ${result.textLength}`);
        console.log(`  Actual decoded length: ${result.text.length}`);
        console.log(`  Confidence: ${result.confidence.toFixed(1)}%`);
        console.log(`  Text preview: "${result.text.substring(0, 50)}..."`);
        
        allAttempts.push({ success: true, density: density.name, result });
        
        // Check if density index matches
        if (result.densityIndex === i) {
          console.log(`✓✓✓ PERFECT MATCH! Density index matches.`);
          return result; // Return immediately on perfect match
        } else {
          console.log(`⚠ Density mismatch (expected ${i}, got ${result.densityIndex})`);
          // Still keep it as a candidate if text looks valid
          if (result.text.length > 0 && result.text.length === result.textLength) {
            validResults.push({ ...result, indexMatch: false, expectedIndex: i });
          }
        }
      } catch (err) {
        console.log(`✗ Failed with error: ${err.message}`);
        allAttempts.push({ success: false, density: density.name, error: err.message });
      }
    }
    
    // If no perfect match, try to find the best candidate
    if (validResults.length > 0) {
      console.log(`\n⚠ No perfect match found, but have ${validResults.length} candidates`);
      
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
      console.log(`⚠ Unusual density index: ${densityIndex}`);
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
          setDecodedText('[ERROR] ' + error.message + '\n\nTips:\n• Make sure this is an Adaptive ShotCode image\n• Try encoding and decoding a test message first\n• Check browser console for detailed logs');
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
        `${match ? '✓' : '✗'} DECODE ${match ? 'SUCCESS' : 'FAILED'}\n\n` +
        `Density: ${result.density}\n` +
        `Confidence: ${result.confidence.toFixed(1)}%\n\n` +
        `Original: ${inputText.length} chars\n` +
        `Decoded: ${result.text.length} chars\n\n` +
        `Match: ${match ? '✓ YES - Perfect!' : '✗ NO - Mismatch'}\n\n` +
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
        `✗ DECODE FAILED\n\n` +
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

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Adaptive ShotCode</h1>
      <p style={styles.subtitle}>Code automatically grows with your data</p>

      {/* Tab Navigation */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('encode')}
          style={{
            ...styles.tab,
            ...(activeTab === 'encode' ? styles.activeTab : styles.inactiveTab)
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Encode Message
        </button>
        <button
          onClick={() => setActiveTab('decode')}
          style={{
            ...styles.tab,
            ...(activeTab === 'decode' ? styles.activeTab : styles.inactiveTab)
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Decode Image
        </button>
      </div>

      {/* Encode Tab */}
      {activeTab === 'encode' && (
        <>
          <div style={styles.densityBar}>
            {DENSITY_LEVELS.map((level, idx) => (
              <button
                key={level.name}
                onClick={() => setCodeConfig({ ...level, index: idx })}
                style={{
                  ...styles.densityLevel,
                  background: codeConfig?.index === idx ? level.color : '#f8f9fa',
                  color: codeConfig?.index === idx ? 'white' : '#666',
                  border: `2px solid ${codeConfig?.index === idx ? level.color : '#e0e0e0'}`,
                  cursor: 'pointer'
                }}
              >
                <div style={styles.densityName}>{level.name}</div>
                <div style={styles.densityCapacity}>{level.capacity}B</div>
              </button>
            ))}
          </div>

          <div style={styles.inputSection}>
            <label style={styles.label}>Enter Text (code will adapt automatically):</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Start typing... watch the code grow!"
              maxLength={20000}
              style={styles.textarea}
            />
            <div style={styles.charCount}>{inputText.length} characters</div>
            
            <button 
              onClick={encode} 
              disabled={!inputText}
              style={{
                ...styles.button,
                marginTop: '16px',
                opacity: inputText ? 1 : 0.5,
                cursor: inputText ? 'pointer' : 'not-allowed',
                transition: 'none',
                transform: 'none'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="10" />
              </svg>
              Generate Code
            </button>
          </div>

          {codeGenerated && (
            <div style={styles.canvasSection}>
              <canvas ref={canvasRef} style={styles.canvas} />
              <div style={styles.buttonGroup}>
                <button onClick={download} style={styles.button}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                <button onClick={testDecode} style={{ ...styles.button, background: '#f59e0b' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Test Decode
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Decode Tab */}
      {activeTab === 'decode' && (
        <div style={styles.decodeSection}>
          <h3 style={styles.sectionTitle}>Scan Code Image</h3>
          <p style={styles.decodeDescription}>Upload an Adaptive ShotCode image to decode the message</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button onClick={() => fileInputRef.current?.click()} style={styles.uploadButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Image
          </button>
          
          {decodedText && (
            <div style={styles.result}>
              <strong>Decoded ({decodedText.length} chars):</strong>
              <div style={styles.decodedBox}>{decodedText}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '60px 40px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    background: '#ffffff'
  },
  title: {
    textAlign: 'center',
    fontSize: '42px',
    marginBottom: '12px',
    color: '#1a1a1a',
    fontWeight: '700'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '40px',
    fontSize: '18px'
  },
  tabContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '40px',
    justifyContent: 'center',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '0'
  },
  tab: {
    padding: '16px 32px',
    border: 'none',
    borderBottom: '3px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '-2px'
  },
  activeTab: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6'
  },
  inactiveTab: {
    color: '#666',
    borderBottomColor: 'transparent'
  },
  densityBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    justifyContent: 'center'
  },
  densityLevel: {
    padding: '6px 12px',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '10px',
    transition: 'all 0.3s',
    fontWeight: '600',
    minWidth: '70px'
  },
  densityName: {
    fontWeight: '700',
    marginBottom: '2px',
    fontSize: '11px'
  },
  densityCapacity: {
    fontSize: '9px',
    opacity: 0.9
  },
  currentDensity: {
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '12px',
    marginBottom: '24px',
    border: '3px solid',
    textAlign: 'center',
    fontSize: '15px'
  },
  usage: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#666'
  },
  inputSection: {
    marginBottom: '50px',
    background: '#f8f9fa',
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid #e0e0e0'
  },
  label: {
    display: 'block',
    marginBottom: '14px',
    fontWeight: '600',
    fontSize: '16px',
    color: '#333'
  },
  textarea: {
    width: '100%',
    padding: '18px',
    fontSize: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    boxSizing: 'border-box',
    minHeight: '140px',
    fontFamily: 'monospace',
    resize: 'vertical',
    transition: 'border-color 0.2s',
    outline: 'none',
    background: '#ffffff'
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    fontSize: '14px',
    marginTop: '10px'
  },
  canvasSection: {
    textAlign: 'center',
    marginBottom: '50px',
    background: '#ffffff',
    padding: '32px',
    borderRadius: '0',
    border: 'none'
  },
  canvas: {
    border: 'none',
    maxWidth: '100%'
  },
  buttonGroup: {
    marginTop: '24px',
    display: 'flex',
    gap: '14px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  button: {
    padding: '14px 28px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  uploadButton: {
    padding: '16px 32px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  decodeSection: {
    padding: '48px 32px',
    background: '#f8f9fa',
    borderRadius: '16px',
    marginBottom: '30px',
    border: '1px solid #e0e0e0',
    textAlign: 'center',
    minHeight: '400px'
  },
  sectionTitle: {
    marginTop: '0',
    marginBottom: '12px',
    fontSize: '28px',
    fontWeight: '600',
    color: '#333'
  },
  decodeDescription: {
    color: '#666',
    fontSize: '16px',
    marginBottom: '32px'
  },
  result: {
    marginTop: '32px',
    padding: '24px',
    background: '#ffffff',
    borderRadius: '10px',
    textAlign: 'left',
    border: '1px solid #e0e0e0'
  },
  decodedBox: {
    marginTop: '14px',
    padding: '18px',
    background: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    fontFamily: 'monospace',
    fontSize: '14px',
    maxHeight: '250px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  }
};

export default AdaptiveShotCode;
