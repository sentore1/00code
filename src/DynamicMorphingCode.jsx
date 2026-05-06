import { useState, useRef, useEffect } from 'react';

const DynamicMorphingCode = () => {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [morphShape, setMorphShape] = useState('diamond');
  const [rotationAngle, setRotationAngle] = useState(0);
  const [activeTab, setActiveTab] = useState('encode'); // New state for tabs
  const [isGenerated, setIsGenerated] = useState(false); // Track if code is generated
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const SHAPE_TYPES = ['diamond', 'triangle', 'hexagon', 'chevron'];

  const CONFIG = {
    canvasSize: 2000,
    useCompression: true,
    rings: 50,
    innerRadius: 150,
    outerRadius: 950
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
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    
    for (let i = 0; i < bytes.length; i++) {
      binary += bytes[i].toString(2).padStart(8, '0');
    }
    return binary;
  };

  const binaryToText = (binary) => {
    let bytes = [];
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substring(i, i + 8);
      if (byte.length === 8) {
        bytes.push(parseInt(byte, 2));
      }
    }
    
    try {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(new Uint8Array(bytes));
    } catch (e) {
      console.error('UTF-8 decode error:', e);
      return '';
    }
  };

  const decodeLengthWithRedundancy = (binary) => {
    if (binary.length < 48) return 0;
    const len1 = parseInt(binary.substring(0, 16), 2);
    const len2 = parseInt(binary.substring(16, 32), 2);
    const len3 = parseInt(binary.substring(32, 48), 2);
    
    if (len1 === len2) return len1;
    if (len1 === len3) return len1;
    if (len2 === len3) return len2;
    
    const lengths = [len1, len2, len3].sort((a, b) => a - b);
    return lengths[1];
  };

  // Draw different shapes based on morphShape parameter
  const drawShape = (ctx, x, y, angle, size, bit, shapeType) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.fillStyle = bit === '1' ? '#000000' : '#FFFFFF';
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 0.5;

    if (shapeType === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size, 0);
      ctx.closePath();
    } else if (shapeType === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.866, size * 0.5);
      ctx.lineTo(-size * 0.866, size * 0.5);
      ctx.closePath();
    } else if (shapeType === 'hexagon') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const hAngle = (Math.PI / 3) * i;
        const hx = size * Math.cos(hAngle);
        const hy = size * Math.sin(hAngle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
    } else if (shapeType === 'chevron') {
      ctx.beginPath();
      ctx.moveTo(-size, -size);
      ctx.lineTo(0, 0);
      ctx.lineTo(size, -size);
      ctx.lineTo(size, size);
      ctx.lineTo(-size, size);
      ctx.closePath();
    }

    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  const encode = () => {
    if (!inputText || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { canvasSize } = CONFIG;
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    ctx.imageSmoothingEnabled = false;
    
    console.log('=== DYNAMIC MORPHING CODE ENCODING ===');
    console.log('Text:', inputText.substring(0, 50));
    console.log('Scan count:', scanCount);
    console.log('Shape:', morphShape);
    console.log('Rotation:', rotationAngle, 'degrees');
    
    const textToEncode = CONFIG.useCompression ? compress(inputText) : inputText;
    const binary = textToBinary(textToEncode);
    
    const encoder = new TextEncoder();
    const bytes = encoder.encode(textToEncode);
    const lengthBits = bytes.length.toString(2).padStart(16, '0');
    const lengthBitsRedundant = lengthBits + lengthBits + lengthBits;
    
    // Add scan count to metadata (8 bits)
    const scanCountBits = (scanCount % 256).toString(2).padStart(8, '0');
    
    // Add shape type to metadata (3 bits)
    const shapeIndex = SHAPE_TYPES.indexOf(morphShape);
    const shapeBits = shapeIndex.toString(2).padStart(3, '0');
    
    let fullBinary = lengthBitsRedundant + scanCountBits + shapeBits + binary;
    
    // Calculate total capacity and add padding
    const { rings, innerRadius, outerRadius } = CONFIG;
    const ringWidth = (outerRadius - innerRadius) / rings;
    let totalCapacity = 0;
    
    for (let ring = rings - 1; ring >= 0; ring--) {
      const r = innerRadius + ring * ringWidth + ringWidth / 2;
      const circumference = 2 * Math.PI * r;
      const shapeSize = ringWidth * 0.4;
      const numShapes = Math.floor(circumference / (shapeSize * 2.2));
      totalCapacity += numShapes;
    }
    
    // Add alternating padding to fill remaining space
    if (fullBinary.length < totalCapacity) {
      const paddingNeeded = totalCapacity - fullBinary.length;
      console.log('Adding padding:', paddingNeeded, 'bits');
      for (let i = 0; i < paddingNeeded; i++) {
        fullBinary += (i % 2).toString();
      }
    }
    
    console.log('Total capacity:', totalCapacity);
    console.log('Total bits:', fullBinary.length);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    const center = canvasSize / 2;
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(center, center, 130, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw encoded data with morphing (ringWidth already calculated above)
    let bitIndex = 0;
    
    for (let ring = rings - 1; ring >= 0 && bitIndex < fullBinary.length; ring--) {
      const r = innerRadius + ring * ringWidth + ringWidth / 2;
      const circumference = 2 * Math.PI * r;
      const shapeSize = ringWidth * 0.4;
      const numShapes = Math.floor(circumference / (shapeSize * 2.2));
      
      for (let i = 0; i < numShapes && bitIndex < fullBinary.length; i++) {
        const angle = (i / numShapes) * Math.PI * 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        const bit = fullBinary[bitIndex];
        
        // Apply rotation based on scan count
        const rotatedAngle = angle + Math.PI / 2 + (rotationAngle * Math.PI / 180);
        
        drawShape(ctx, x, y, rotatedAngle, shapeSize, bit, morphShape);
        
        bitIndex++;
      }
    }
    
    // Draw outer border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(center, center, 960, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add metadata text at bottom
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Scan #${scanCount} | Shape: ${morphShape}`, center, canvasSize - 30);
    
    console.log('Encoded with morphing');
  };

  const decodeLayer = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const getPixel = (x, y) => {
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= width || py < 0 || py >= height) return 255;
      const i = (py * width + px) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3;
    };
    
    const center = width / 2;
    const scale = width / CONFIG.canvasSize;
    
    let blackSamples = [];
    let whiteSamples = [];
    
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const r = 65 * scale;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      blackSamples.push(getPixel(x, y));
    }
    
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const r = 970 * scale;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      whiteSamples.push(getPixel(x, y));
    }
    
    const avgBlack = blackSamples.reduce((a, b) => a + b, 0) / blackSamples.length;
    const avgWhite = whiteSamples.reduce((a, b) => a + b, 0) / whiteSamples.length;
    const threshold = (avgBlack + avgWhite) / 2;
    
    console.log('Threshold:', threshold.toFixed(1));
    
    let binary = '';
    const { rings, innerRadius, outerRadius } = CONFIG;
    const scaledInner = innerRadius * scale;
    const scaledOuter = outerRadius * scale;
    const ringWidth = (scaledOuter - scaledInner) / rings;
    
    for (let ring = rings - 1; ring >= 0; ring--) {
      const r = scaledInner + ring * ringWidth + ringWidth / 2;
      const circumference = 2 * Math.PI * r;
      const shapeSize = ringWidth * 0.4;
      const numShapes = Math.floor(circumference / (shapeSize * 2.2));
      
      for (let i = 0; i < numShapes; i++) {
        const angle = (i / numShapes) * Math.PI * 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        
        let blackCount = 0;
        let whiteCount = 0;
        const sampleRadius = shapeSize * 0.5;
        const gridSize = 15;
        
        for (let gx = 0; gx < gridSize; gx++) {
          for (let gy = 0; gy < gridSize; gy++) {
            const dx = (gx - gridSize/2) * (sampleRadius * 2 / gridSize);
            const dy = (gy - gridSize/2) * (sampleRadius * 2 / gridSize);
            const brightness = getPixel(x + dx, y + dy);
            
            if (brightness < threshold) blackCount++;
            else whiteCount++;
          }
        }
        
        binary += blackCount > whiteCount ? '1' : '0';
      }
    }
    
    console.log('Total bits decoded:', binary.length);
    
    // Decode length
    const byteLength = decodeLengthWithRedundancy(binary);
    console.log('Byte length:', byteLength);
    
    if (byteLength > 12000 || byteLength === 0) {
      console.error('Invalid byte length');
      return { text: '', scanCount: 0, shape: 'unknown' };
    }
    
    // Decode scan count (8 bits after 48-bit length header)
    const scanCountBits = binary.substring(48, 56);
    const decodedScanCount = parseInt(scanCountBits, 2);
    
    // Decode shape type (3 bits after scan count)
    const shapeBits = binary.substring(56, 59);
    const decodedShapeIndex = parseInt(shapeBits, 2);
    const decodedShape = SHAPE_TYPES[decodedShapeIndex] || 'unknown';
    
    // Decode data (after 59 bits of metadata)
    const dataBits = binary.substring(59, 59 + byteLength * 8);
    const decodedCompressed = binaryToText(dataBits);
    const decoded = CONFIG.useCompression ? decompress(decodedCompressed) : decodedCompressed;
    
    console.log('Decoded text:', decoded.substring(0, 50));
    console.log('Decoded scan count:', decodedScanCount);
    console.log('Decoded shape:', decodedShape);
    
    return { text: decoded, scanCount: decodedScanCount, shape: decodedShape };
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
          const result = decodeLayer(ctx, img.width, img.height);
          setDecodedText(result.text);
          
          // Auto-increment scan count and change shape
          const newScanCount = result.scanCount + 1;
          setScanCount(newScanCount);
          
          // Cycle through shapes
          const nextShapeIndex = (SHAPE_TYPES.indexOf(result.shape) + 1) % SHAPE_TYPES.length;
          setMorphShape(SHAPE_TYPES[nextShapeIndex]);
          
          // Rotate by 45 degrees each scan
          setRotationAngle((result.scanCount * 45) % 360);
          
          alert(
            `✓ Decoded Successfully!\n\n` +
            `Text: ${result.text.substring(0, 50)}${result.text.length > 50 ? '...' : ''}\n` +
            `Scan Count: ${result.scanCount}\n` +
            `Shape: ${result.shape}\n\n` +
            `Next scan will use:\n` +
            `Shape: ${SHAPE_TYPES[nextShapeIndex]}\n` +
            `Rotation: ${((newScanCount * 45) % 360)}°`
          );
        } catch (error) {
          console.error('Decode error:', error);
          setDecodedText('[ERROR: ' + error.message + ']');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const testDecode = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const result = decodeLayer(ctx, canvas.width, canvas.height);
    const match = inputText === result.text;
    
    alert(
      `Original: ${inputText.length} chars\n` +
      `Decoded: ${result.text.length} chars\n\n` +
      `Match: ${match ? 'YES ✓' : 'NO ✗'}\n` +
      `Scan Count: ${result.scanCount}\n` +
      `Shape: ${result.shape}`
    );
  };

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `morphing-code-scan${scanCount}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const simulateScan = () => {
    // Simulate scanning by incrementing scan count and changing shape
    const newScanCount = scanCount + 1;
    setScanCount(newScanCount);
    
    const nextShapeIndex = (SHAPE_TYPES.indexOf(morphShape) + 1) % SHAPE_TYPES.length;
    setMorphShape(SHAPE_TYPES[nextShapeIndex]);
    
    setRotationAngle((newScanCount * 45) % 360);
  };

  useEffect(() => {
    // Only encode when explicitly triggered, not on every text change
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dynamic Morphing Code</h1>
      <p style={styles.subtitle}>Code changes shape & rotation with each scan</p>

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

      {/* Encode Tab Content */}
      {activeTab === 'encode' && (
        <>
          <div style={styles.inputSection}>
            <label style={styles.label}>Enter Your Message (up to 5,000 characters):</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              maxLength={5000}
              style={styles.textarea}
            />
            <div style={styles.charCount}>{inputText.length} / 5,000 characters</div>
            
            <button 
              onClick={encode} 
              disabled={!inputText}
              style={{
                ...styles.button,
                marginTop: '16px',
                opacity: inputText ? 1 : 0.5,
                cursor: inputText ? 'pointer' : 'not-allowed'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              Generate Code
            </button>
          </div>

          {canvasRef.current && canvasRef.current.width > 0 && (
            <div style={styles.canvasSection}>
              <div style={styles.metadata}>
                <div style={styles.metadataItem}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>Scan Count: <strong>{scanCount}</strong></span>
                </div>
                <div style={styles.metadataItem}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Shape: <strong>{morphShape}</strong></span>
                </div>
                <div style={styles.metadataItem}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Rotation: <strong>{rotationAngle}°</strong></span>
                </div>
              </div>
              
              <canvas ref={canvasRef} style={styles.canvas} />
              
              <div style={styles.buttonGroup}>
                <button onClick={download} style={styles.button}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                <button onClick={testDecode} style={{ ...styles.button, background: '#f59e0b' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Test Decode
                </button>
                <button onClick={simulateScan} style={{ ...styles.button, background: '#10b981' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Simulate Scan
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Decode Tab Content */}
      {activeTab === 'decode' && (
        <div style={styles.decodeSection}>
          <h3 style={styles.sectionTitle}>Scan Code Image</h3>
          <p style={styles.decodeDescription}>Upload a Dynamic Morphing Code image to decode the message</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button onClick={() => fileInputRef.current?.click()} style={styles.uploadButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
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
  metadata: {
    display: 'flex',
    gap: '24px',
    justifyContent: 'center',
    padding: '24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)'
  },
  metadataItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'white',
    fontSize: '15px',
    fontWeight: '500'
  },
  canvasSection: {
    textAlign: 'center',
    marginBottom: '50px',
    background: '#f8f9fa',
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid #e0e0e0'
  },
  canvas: {
    border: '3px solid #3b82f6',
    borderRadius: '16px',
    maxWidth: '100%',
    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)'
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

export default DynamicMorphingCode;
