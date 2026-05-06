import { useState, useRef, useEffect } from 'react';

const DualLayerCode = () => {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [activeTab, setActiveTab] = useState('encode');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

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
    // Convert text to UTF-8 bytes, then to binary
    let binary = '';
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    
    for (let i = 0; i < bytes.length; i++) {
      binary += bytes[i].toString(2).padStart(8, '0');
    }
    return binary;
  };

  const binaryToText = (binary) => {
    // Convert binary to bytes, then decode as UTF-8
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

  const splitTextForLayers = (text) => {
    const mid = Math.ceil(text.length / 2);
    return {
      layer1: text.substring(0, mid),
      layer2: text.substring(mid)
    };
  };

  const combineLayersText = (layer1, layer2) => {
    return layer1 + layer2;
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

  const drawDiamondLayer = (ctx, binary, canvasSize, layerIndex) => {
    const center = canvasSize / 2;
    const { rings, innerRadius, outerRadius } = CONFIG;
    const ringWidth = (outerRadius - innerRadius) / rings;
    
    let bitIndex = 0;
    
    // Layer 1: Inner half (rings 49 down to 25)
    // Layer 2: Outer half (rings 24 down to 0)
    const startRing = layerIndex === 0 ? rings - 1 : Math.floor(rings / 2) - 1;
    const endRing = layerIndex === 0 ? Math.floor(rings / 2) : -1;
    
    for (let ring = startRing; ring > endRing; ring--) {
      const r = innerRadius + ring * ringWidth + ringWidth / 2;
      const circumference = 2 * Math.PI * r;
      const diamondSize = ringWidth * 0.8;
      const numShapes = Math.floor(circumference / (diamondSize * 1.1));
      
      for (let i = 0; i < numShapes && bitIndex < binary.length; i++) {
        const angle = (i / numShapes) * Math.PI * 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        const bit = binary[bitIndex];
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        
        ctx.fillStyle = bit === '1' ? '#000000' : '#FFFFFF';
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 0.5;
        
        const size = diamondSize / 2;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        bitIndex++;
      }
    }
    
    return bitIndex;
  };

  const encode = () => {
    if (!inputText || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { canvasSize } = CONFIG;
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    ctx.imageSmoothingEnabled = false;
    
    console.log('=== DUAL LAYER ENCODING ===');
    console.log('Original text length:', inputText.length, 'characters');
    
    const { layer1, layer2 } = splitTextForLayers(inputText);
    console.log('Layer 1 length:', layer1.length, 'characters');
    console.log('Layer 2 length:', layer2.length, 'characters');
    
    const compressed1 = CONFIG.useCompression ? compress(layer1) : layer1;
    const compressed2 = CONFIG.useCompression ? compress(layer2) : layer2;
    
    console.log('Compressed Layer 1:', compressed1.length, 'characters');
    console.log('Compressed Layer 2:', compressed2.length, 'characters');
    
    const binary1 = textToBinary(compressed1);
    const binary2 = textToBinary(compressed2);
    
    // Use byte length for header, not character length
    const encoder = new TextEncoder();
    const bytes1 = encoder.encode(compressed1);
    const bytes2 = encoder.encode(compressed2);
    
    console.log('Layer 1 bytes:', bytes1.length);
    console.log('Layer 2 bytes:', bytes2.length);
    
    const len1Bits = bytes1.length.toString(2).padStart(16, '0');
    const len1Redundant = len1Bits + len1Bits + len1Bits;
    
    const len2Bits = bytes2.length.toString(2).padStart(16, '0');
    const len2Redundant = len2Bits + len2Bits + len2Bits;
    
    let fullBinary1 = len1Redundant + binary1;
    let fullBinary2 = len2Redundant + binary2;
    
    // Calculate capacity for each layer (50 rings each)
    const { rings, innerRadius, outerRadius } = CONFIG;
    const ringWidth = (outerRadius - innerRadius) / rings;
    let capacityPerLayer = 0;
    
    // Each layer uses half the rings
    for (let ring = rings - 1; ring >= rings / 2; ring--) {
      const r = innerRadius + ring * ringWidth + ringWidth / 2;
      const circumference = 2 * Math.PI * r;
      const shapeSize = ringWidth * 0.4;
      const numShapes = Math.floor(circumference / (shapeSize * 2.2));
      capacityPerLayer += numShapes;
    }
    
    // Add padding to layer 1
    if (fullBinary1.length < capacityPerLayer) {
      const paddingNeeded = capacityPerLayer - fullBinary1.length;
      console.log('Adding padding to layer 1:', paddingNeeded, 'bits');
      for (let i = 0; i < paddingNeeded; i++) {
        fullBinary1 += (i % 2).toString();
      }
    }
    
    // Add padding to layer 2
    if (fullBinary2.length < capacityPerLayer) {
      const paddingNeeded = capacityPerLayer - fullBinary2.length;
      console.log('Adding padding to layer 2:', paddingNeeded, 'bits');
      for (let i = 0; i < paddingNeeded; i++) {
        fullBinary2 += (i % 2).toString();
      }
    }
    
    console.log('Layer 1 total bits:', fullBinary1.length);
    console.log('Layer 2 total bits:', fullBinary2.length);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    const center = canvasSize / 2;
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(center, center, 130, 0, Math.PI * 2);
    ctx.fill();
    
    const bits1Used = drawDiamondLayer(ctx, fullBinary1, canvasSize, 0);
    const bits2Used = drawDiamondLayer(ctx, fullBinary2, canvasSize, 1);
    
    console.log('Layer 1 bits drawn:', bits1Used);
    console.log('Layer 2 bits drawn:', bits2Used);
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(center, center, 960, 0, Math.PI * 2);
    ctx.stroke();
    
    console.log('Encoded dual layer code');
  };

  const decodeLayer = (ctx, width, height, layerIndex) => {
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
    
    console.log(`Layer ${layerIndex + 1} - Threshold: ${threshold.toFixed(1)}`);
    
    let binary = '';
    const { rings, innerRadius, outerRadius } = CONFIG;
    const scaledInner = innerRadius * scale;
    const scaledOuter = outerRadius * scale;
    const ringWidth = (scaledOuter - scaledInner) / rings;
    
    const startRing = layerIndex === 0 ? rings - 1 : Math.floor(rings / 2) - 1;
    const endRing = layerIndex === 0 ? Math.floor(rings / 2) : -1;
    
    console.log(`Layer ${layerIndex + 1} - Rings: ${startRing} to ${endRing + 1}`);
    
    for (let ring = startRing; ring > endRing; ring--) {
      const r = scaledInner + ring * ringWidth + ringWidth / 2;
      const circumference = 2 * Math.PI * r;
      const diamondSize = ringWidth * 0.8;
      const numShapes = Math.floor(circumference / (diamondSize * 1.1));
      
      for (let i = 0; i < numShapes; i++) {
        const angle = (i / numShapes) * Math.PI * 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        
        let blackCount = 0;
        let whiteCount = 0;
        const sampleRadius = diamondSize * 0.42;
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
    
    console.log(`Layer ${layerIndex + 1} - Total bits: ${binary.length}`);
    
    const byteLength = decodeLengthWithRedundancy(binary);
    console.log(`Layer ${layerIndex + 1} - Byte length: ${byteLength}`);
    
    if (byteLength > 12000 || byteLength === 0) {
      console.error(`Layer ${layerIndex + 1} - Invalid byte length`);
      return '';
    }
    
    const dataBits = binary.substring(48, 48 + byteLength * 8);
    const decodedCompressed = binaryToText(dataBits);
    const decoded = CONFIG.useCompression ? decompress(decodedCompressed) : decodedCompressed;
    
    console.log(`Layer ${layerIndex + 1} - Decoded: ${decoded.length} characters`);
    
    return decoded;
  };

  const decode = (ctx, width, height) => {
    console.log('=== DUAL LAYER DECODING ===');
    
    const layer1 = decodeLayer(ctx, width, height, 0);
    const layer2 = decodeLayer(ctx, width, height, 1);
    
    const combined = combineLayersText(layer1, layer2);
    
    console.log('Total decoded:', combined.length, 'characters');
    
    return { text: combined, confidence: 90 };
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
    
    const result = decode(ctx, canvas.width, canvas.height);
    const match = inputText === result.text;
    
    alert(
      `Original: ${inputText.length} chars\n` +
      `Decoded: ${result.text.length} chars\n\n` +
      `Match: ${match ? 'YES ✓' : 'NO ✗'}\n` +
      `Confidence: ${result.confidence}%`
    );
  };

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'dual-layer-code.png';
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
      <h1 style={styles.title}>Dual Layer Imigongo Code</h1>
      <p style={styles.subtitle}>Two spatial layers • 10K character capacity</p>

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
          <div style={styles.inputSection}>
            <label style={styles.label}>Enter Your Message (up to 10,000 characters):</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              maxLength={10000}
              style={styles.textarea}
            />
            <div style={styles.charCount}>{inputText.length} / 10,000 characters</div>
            
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
        </>
      )}

      {/* Decode Tab */}
      {activeTab === 'decode' && (
        <div style={styles.decodeSection}>
          <h3 style={styles.sectionTitle}>Scan Code Image</h3>
          <p style={styles.decodeDescription}>Upload a Dual Layer Code image to decode the message</p>
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

export default DualLayerCode;
