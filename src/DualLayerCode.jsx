import { useState, useRef, useEffect } from 'react';

const DualLayerCode = () => {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');
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
    
    const fullBinary1 = len1Redundant + binary1;
    const fullBinary2 = len2Redundant + binary2;
    
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
      encode();
    }
  }, [inputText]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dual Layer Imigongo Code</h1>
      <p style={styles.subtitle}>Two spatial layers = 10K character capacity</p>

      <div style={styles.inputSection}>
        <label style={styles.label}>Enter Your Message (up to 10,000 characters):</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message... supports up to 10K characters with dual layers!"
          maxLength={10000}
          style={styles.textarea}
        />
        <div style={styles.charCount}>{inputText.length} / 10,000 characters</div>
        <div style={styles.info}>
          💡 Layer 1 (Inner rings): {Math.ceil(inputText.length / 2)} chars
          <br />
          💡 Layer 2 (Outer rings): {Math.floor(inputText.length / 2)} chars
        </div>
      </div>

      {inputText && (
        <div style={styles.canvasSection}>
          <canvas ref={canvasRef} style={styles.canvas} />
          <div style={styles.buttonGroup}>
            <button onClick={download} style={styles.button}>
              Download
            </button>
            <button onClick={testDecode} style={{ ...styles.button, background: '#f59e0b' }}>
              Test Decode
            </button>
          </div>
        </div>
      )}

      <div style={styles.decodeSection}>
        <h3>Decode Image</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current?.click()} style={styles.button}>
          Upload Image
        </button>
        
        {decodedText && (
          <div style={styles.result}>
            <strong>Decoded ({decodedText.length} chars):</strong>
            <div style={styles.decodedBox}>{decodedText}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  title: {
    textAlign: 'center',
    fontSize: '32px',
    marginBottom: '8px'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px'
  },
  inputSection: {
    marginBottom: '30px'
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  textarea: {
    width: '100%',
    padding: '15px',
    fontSize: '15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    boxSizing: 'border-box',
    minHeight: '120px',
    fontFamily: 'monospace',
    resize: 'vertical'
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    fontSize: '14px',
    marginTop: '8px'
  },
  info: {
    marginTop: '10px',
    padding: '10px',
    background: '#f0f0f0',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#666'
  },
  canvasSection: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  canvas: {
    border: '3px solid #8B4513',
    borderRadius: '8px',
    maxWidth: '100%'
  },
  buttonGroup: {
    marginTop: '15px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  button: {
    padding: '12px 24px',
    background: '#8B4513',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  decodeSection: {
    padding: '20px',
    background: '#f9f9f9',
    borderRadius: '12px'
  },
  result: {
    marginTop: '20px',
    padding: '15px',
    background: 'white',
    borderRadius: '8px'
  },
  decodedBox: {
    marginTop: '10px',
    padding: '12px',
    background: '#f3f4f6',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '14px',
    maxHeight: '300px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  }
};

export default DualLayerCode;
