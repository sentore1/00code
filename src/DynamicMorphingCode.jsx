import { useState, useRef, useEffect } from 'react';

const DynamicMorphingCode = () => {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [morphShape, setMorphShape] = useState('diamond');
  const [rotationAngle, setRotationAngle] = useState(0);
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
    if (inputText) {
      encode();
    }
  }, [inputText, scanCount, morphShape, rotationAngle]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dynamic Morphing Code</h1>
      <p style={styles.subtitle}>Code changes shape & rotation with each scan</p>

      <div style={styles.inputSection}>
        <label style={styles.label}>Enter Your Message:</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          maxLength={5000}
          style={styles.textarea}
        />
        <div style={styles.charCount}>{inputText.length} / 5,000 characters</div>
      </div>

      {inputText && (
        <div style={styles.canvasSection}>
          <div style={styles.metadata}>
            <div>📊 Scan Count: <strong>{scanCount}</strong></div>
            <div>🔷 Shape: <strong>{morphShape}</strong></div>
            <div>🔄 Rotation: <strong>{rotationAngle}°</strong></div>
          </div>
          
          <canvas ref={canvasRef} style={styles.canvas} />
          
          <div style={styles.buttonGroup}>
            <button onClick={download} style={styles.button}>
              Download
            </button>
            <button onClick={testDecode} style={{ ...styles.button, background: '#f59e0b' }}>
              Test Decode
            </button>
            <button onClick={simulateScan} style={{ ...styles.button, background: '#10b981' }}>
              Simulate Scan
            </button>
          </div>
        </div>
      )}

      <div style={styles.decodeSection}>
        <h3>Scan Code Image</h3>
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
            <strong>Decoded:</strong>
            <div style={styles.decodedBox}>{decodedText}</div>
          </div>
        )}
      </div>

      <div style={styles.infoSection}>
        <h3>How It Works</h3>
        <ul>
          <li>✓ Each scan increments the scan counter</li>
          <li>✓ Shape cycles: Diamond → Triangle → Hexagon → Chevron</li>
          <li>✓ Code rotates 45° with each scan</li>
          <li>✓ Same data, different visual appearance</li>
          <li>✓ Use "Simulate Scan" to preview next version</li>
        </ul>
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
    minHeight: '100px',
    fontFamily: 'monospace',
    resize: 'vertical'
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    fontSize: '14px',
    marginTop: '8px'
  },
  metadata: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    padding: '15px',
    background: '#f0f0f0',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '16px'
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
    justifyContent: 'center',
    flexWrap: 'wrap'
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
    borderRadius: '12px',
    marginBottom: '20px'
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
    maxHeight: '200px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  infoSection: {
    padding: '20px',
    background: '#e8f5e9',
    borderRadius: '12px',
    marginTop: '20px'
  }
};

export default DynamicMorphingCode;
