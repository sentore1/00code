import { useState, useRef, useEffect } from 'react';

const ImigogoShapeCode = () => {
  const [inputText, setInputText] = useState('');
  const [shapePattern, setShapePattern] = useState('diamond');
  const [decodedText, setDecodedText] = useState('');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Imigongo-inspired geometric shapes
  const SHAPE_PATTERNS = {
    diamond: {
      name: 'Diamond Grid',
      description: 'Traditional Imigongo diamond pattern',
      draw: drawDiamondGrid
    },
    triangle: {
      name: 'Triangle Mosaic',
      description: 'Triangular tessellation',
      draw: drawTriangleGrid
    },
    hexagon: {
      name: 'Hexagon Pattern',
      description: 'Honeycomb structure',
      draw: drawHexagonGrid
    },
    chevron: {
      name: 'Chevron Waves',
      description: 'V-shaped patterns',
      draw: drawChevronGrid
    }
  };

  const CONFIG = {
    canvasSize: 1000,
    useCompression: true
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

  // Draw diamond grid pattern in CIRCULAR arrangement
  function drawDiamondGrid(ctx, binary, canvasSize) {
    const center = canvasSize / 2;
    const rings = 30;
    const innerRadius = 80;
    const outerRadius = 480;
    const ringWidth = (outerRadius - innerRadius) / rings;
    
    const positions = [];
    let bitIndex = 0;
    
    // Draw in circular rings
    for (let ring = rings - 1; ring >= 0 && bitIndex < binary.length; ring--) {
      const r = innerRadius + ring * ringWidth + ringWidth / 2;
      const circumference = 2 * Math.PI * r;
      const diamondSize = ringWidth * 0.8;
      const numShapes = Math.floor(circumference / diamondSize);
      
      for (let i = 0; i < numShapes && bitIndex < binary.length; i++) {
        const angle = (i / numShapes) * Math.PI * 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        const bit = binary[bitIndex];
        
        positions.push({ x, y, bit, ring, i });
        
        // Draw diamond rotated to follow circle
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        
        ctx.fillStyle = bit === '1' ? '#000000' : '#FFFFFF';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        
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
    
    return { positions, rings, innerRadius, outerRadius };
  }

  // Draw triangle pattern in CIRCULAR arrangement
  function drawTriangleGrid(ctx, binary, canvasSize) {
    const center = canvasSize / 2;
    const rings = 35;
    const innerRadius = 80;
    const outerRadius = 480;
    const ringWidth = (outerRadius - innerRadius) / rings;
    
    const positions = [];
    let bitIndex = 0;
    
    for (let ring = rings - 1; ring >= 0 && bitIndex < binary.length; ring--) {
      const r = innerRadius + ring * ringWidth + ringWidth / 2;
      const circumference = 2 * Math.PI * r;
      const triangleSize = ringWidth * 0.9;
      const numShapes = Math.floor(circumference / triangleSize);
      
      for (let i = 0; i < numShapes && bitIndex < binary.length; i++) {
        const angle = (i / numShapes) * Math.PI * 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        const bit = binary[bitIndex];
        
        positions.push({ x, y, bit, ring, i });
        
        // Draw triangle pointing outward
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        ctx.fillStyle = bit === '1' ? '#000000' : '#FFFFFF';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        
        const size = triangleSize / 2;
        const pointOut = i % 2 === 0;
        
        ctx.beginPath();
        if (pointOut) {
          ctx.moveTo(size, 0);
          ctx.lineTo(-size/2, size);
          ctx.lineTo(-size/2, -size);
        } else {
          ctx.moveTo(-size, 0);
          ctx.lineTo(size/2, size);
          ctx.lineTo(size/2, -size);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        
        bitIndex++;
      }
    }
    
    return { positions, rings, innerRadius, outerRadius };
  }

  // Draw hexagon pattern in CIRCULAR arrangement
  function drawHexagonGrid(ctx, binary, canvasSize) {
    const center = canvasSize / 2;
    const rings = 32;
    const innerRadius = 80;
    const outerRadius = 480;
    const ringWidth = (outerRadius - innerRadius) / rings;
    
    const positions = [];
    let bitIndex = 0;
    
    for (let ring = rings - 1; ring >= 0 && bitIndex < binary.length; ring--) {
      const r = innerRadius + ring * ringWidth + ringWidth / 2;
      const circumference = 2 * Math.PI * r;
      const hexSize = ringWidth * 0.7;
      const numShapes = Math.floor(circumference / (hexSize * 1.5));
      
      for (let i = 0; i < numShapes && bitIndex < binary.length; i++) {
        const angle = (i / numShapes) * Math.PI * 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        const bit = binary[bitIndex];
        
        positions.push({ x, y, bit, ring, i });
        
        // Draw hexagon
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        ctx.fillStyle = bit === '1' ? '#000000' : '#FFFFFF';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const hexAngle = (Math.PI / 3) * j;
          const hx = hexSize * Math.cos(hexAngle);
          const hy = hexSize * Math.sin(hexAngle);
          if (j === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        
        bitIndex++;
      }
    }
    
    return { positions, rings, innerRadius, outerRadius };
  }

  // Draw chevron pattern in CIRCULAR arrangement
  function drawChevronGrid(ctx, binary, canvasSize) {
    const center = canvasSize / 2;
    const rings = 30;
    const innerRadius = 80;
    const outerRadius = 480;
    const ringWidth = (outerRadius - innerRadius) / rings;
    
    const positions = [];
    let bitIndex = 0;
    
    for (let ring = rings - 1; ring >= 0 && bitIndex < binary.length; ring--) {
      const r = innerRadius + ring * ringWidth + ringWidth / 2;
      const circumference = 2 * Math.PI * r;
      const chevronSize = ringWidth * 0.8;
      const numShapes = Math.floor(circumference / chevronSize);
      
      for (let i = 0; i < numShapes && bitIndex < binary.length; i++) {
        const angle = (i / numShapes) * Math.PI * 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        const bit = binary[bitIndex];
        
        positions.push({ x, y, bit, ring, i });
        
        // Draw chevron (V shape) following the circle
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        
        ctx.fillStyle = bit === '1' ? '#000000' : '#FFFFFF';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        
        const size = chevronSize / 2;
        ctx.beginPath();
        ctx.moveTo(-size, -size);
        ctx.lineTo(0, 0);
        ctx.lineTo(size, -size);
        ctx.lineTo(size, size);
        ctx.lineTo(-size, size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        
        bitIndex++;
      }
    }
    
    return { positions, rings, innerRadius, outerRadius };
  }

  const encode = () => {
    if (!inputText || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { canvasSize } = CONFIG;
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    ctx.imageSmoothingEnabled = false;
    
    console.log('=== IMIGONGO SHAPE ENCODING ===');
    console.log('Pattern:', SHAPE_PATTERNS[shapePattern].name);
    console.log('Text length:', inputText.length);
    
    const textToEncode = CONFIG.useCompression ? compress(inputText) : inputText;
    const binary = textToBinary(textToEncode);
    const lengthBits = textToEncode.length.toString(2).padStart(16, '0');
    const patternIndex = Object.keys(SHAPE_PATTERNS).indexOf(shapePattern);
    const patternBits = patternIndex.toString(2).padStart(3, '0');
    const fullBinary = lengthBits + patternBits + binary;
    
    console.log('Compressed length:', textToEncode.length);
    console.log('Total bits:', fullBinary.length);
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Draw pattern
    const metadata = SHAPE_PATTERNS[shapePattern].draw(ctx, fullBinary, canvasSize);
    
    console.log('Encoded with', shapePattern, 'pattern');
    console.log('Metadata:', metadata);
  };

  const decode = (ctx, width, height) => {
    console.log('=== IMIGONGO SHAPE DECODING ===');
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
    
    const center = width / 2;
    const scale = width / CONFIG.canvasSize;
    
    let binary = '';
    
    // Decode based on circular arrangement
    if (shapePattern === 'diamond' || shapePattern === 'chevron') {
      const rings = 30;
      const innerRadius = 80 * scale;
      const outerRadius = 480 * scale;
      const ringWidth = (outerRadius - innerRadius) / rings;
      
      for (let ring = rings - 1; ring >= 0; ring--) {
        const r = innerRadius + ring * ringWidth + ringWidth / 2;
        const circumference = 2 * Math.PI * r;
        const shapeSize = ringWidth * 0.8;
        const numShapes = Math.floor(circumference / shapeSize);
        
        for (let i = 0; i < numShapes; i++) {
          const angle = (i / numShapes) * Math.PI * 2;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          
          // Sample center of shape
          let blackCount = 0;
          let whiteCount = 0;
          const sampleSize = Math.max(3, shapeSize * 0.3);
          
          for (let dx = -sampleSize; dx <= sampleSize; dx += 2) {
            for (let dy = -sampleSize; dy <= sampleSize; dy += 2) {
              const brightness = getPixel(x + dx, y + dy);
              if (brightness < 128) blackCount++;
              else whiteCount++;
            }
          }
          
          binary += blackCount > whiteCount ? '1' : '0';
        }
      }
    } else if (shapePattern === 'triangle') {
      const rings = 35;
      const innerRadius = 80 * scale;
      const outerRadius = 480 * scale;
      const ringWidth = (outerRadius - innerRadius) / rings;
      
      for (let ring = rings - 1; ring >= 0; ring--) {
        const r = innerRadius + ring * ringWidth + ringWidth / 2;
        const circumference = 2 * Math.PI * r;
        const shapeSize = ringWidth * 0.9;
        const numShapes = Math.floor(circumference / shapeSize);
        
        for (let i = 0; i < numShapes; i++) {
          const angle = (i / numShapes) * Math.PI * 2;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          
          let blackCount = 0;
          let whiteCount = 0;
          const sampleSize = Math.max(3, shapeSize * 0.3);
          
          for (let dx = -sampleSize; dx <= sampleSize; dx += 2) {
            for (let dy = -sampleSize; dy <= sampleSize; dy += 2) {
              const brightness = getPixel(x + dx, y + dy);
              if (brightness < 128) blackCount++;
              else whiteCount++;
            }
          }
          
          binary += blackCount > whiteCount ? '1' : '0';
        }
      }
    } else if (shapePattern === 'hexagon') {
      const rings = 32;
      const innerRadius = 80 * scale;
      const outerRadius = 480 * scale;
      const ringWidth = (outerRadius - innerRadius) / rings;
      
      for (let ring = rings - 1; ring >= 0; ring--) {
        const r = innerRadius + ring * ringWidth + ringWidth / 2;
        const circumference = 2 * Math.PI * r;
        const hexSize = ringWidth * 0.7;
        const numShapes = Math.floor(circumference / (hexSize * 1.5));
        
        for (let i = 0; i < numShapes; i++) {
          const angle = (i / numShapes) * Math.PI * 2;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          
          let blackCount = 0;
          let whiteCount = 0;
          const sampleSize = Math.max(3, hexSize * 0.5);
          
          for (let dx = -sampleSize; dx <= sampleSize; dx += 2) {
            for (let dy = -sampleSize; dy <= sampleSize; dy += 2) {
              const brightness = getPixel(x + dx, y + dy);
              if (brightness < 128) blackCount++;
              else whiteCount++;
            }
          }
          
          binary += blackCount > whiteCount ? '1' : '0';
        }
      }
    }
    
    console.log('Decoded bits:', binary.length);
    
    // Read header
    const lengthBits = binary.substring(0, 16);
    const textLength = parseInt(lengthBits, 2);
    
    console.log('Text length:', textLength);
    
    if (textLength > 5000 || textLength === 0) {
      return { text: '[ERROR: Invalid length ' + textLength + ']', confidence: 0 };
    }
    
    const patternBits = binary.substring(16, 19);
    const dataBits = binary.substring(19, 19 + textLength * 8);
    const decodedCompressed = binaryToText(dataBits);
    const decoded = CONFIG.useCompression ? decompress(decodedCompressed) : decodedCompressed;
    
    console.log('Decoded text:', decoded);
    
    return { text: decoded, confidence: 90 };
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
      `Pattern: ${SHAPE_PATTERNS[shapePattern].name}\n\n` +
      `Original: ${inputText.length} chars\n` +
      `Decoded: ${result.text.length} chars\n\n` +
      `Match: ${match ? 'YES ✓' : 'NO ✗'}\n` +
      `Confidence: ${result.confidence}%`
    );
  };

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `imigongo-${shapePattern}-code.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    if (inputText) {
      encode();
    }
  }, [inputText, shapePattern]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Imigongo Shape Code</h1>
      <p style={styles.subtitle}>Data encoded in geometric African patterns</p>

      <div style={styles.patternGrid}>
        {Object.entries(SHAPE_PATTERNS).map(([key, pattern]) => (
          <button
            key={key}
            onClick={() => setShapePattern(key)}
            style={{
              ...styles.patternButton,
              background: shapePattern === key ? '#8B4513' : '#f3f4f6',
              color: shapePattern === key ? 'white' : '#333',
              border: `3px solid ${shapePattern === key ? '#8B4513' : '#ddd'}`
            }}
          >
            <div style={styles.patternName}>{pattern.name}</div>
            <div style={styles.patternDesc}>{pattern.description}</div>
          </button>
        ))}
      </div>

      <div style={styles.inputSection}>
        <label style={styles.label}>Enter Your Message:</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          maxLength={2000}
          style={styles.textarea}
        />
        <div style={styles.charCount}>{inputText.length} / 2000 characters</div>
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
            <strong>Decoded:</strong>
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
  patternGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  patternButton: {
    padding: '20px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  patternName: {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '6px'
  },
  patternDesc: {
    fontSize: '13px',
    opacity: 0.9
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
    maxHeight: '200px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  }
};

export default ImigogoShapeCode;
