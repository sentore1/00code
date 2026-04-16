import { useState, useRef, useEffect } from 'react';

const AfricanArtCode = () => {
  const [inputText, setInputText] = useState('');
  const [artStyle, setArtStyle] = useState('imigongo');
  const [decodedText, setDecodedText] = useState('');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // African Art Styles
  const ART_STYLES = {
    imigongo: {
      name: 'Imigongo (Rwanda)',
      description: 'Geometric patterns with bold colors',
      colors: {
        bg: '#F5E6D3',      // Cream
        fg: '#8B4513',      // Brown
        accent1: '#DC143C', // Red
        accent2: '#FFD700', // Gold
        accent3: '#000000'  // Black
      },
      pattern: 'geometric'
    },
    adinkra: {
      name: 'Adinkra (Ghana)',
      description: 'Symbolic patterns',
      colors: {
        bg: '#FFF8DC',      // Cornsilk
        fg: '#8B0000',      // Dark red
        accent1: '#FFD700', // Gold
        accent2: '#000000', // Black
        accent3: '#CD853F'  // Peru
      },
      pattern: 'symbolic'
    },
    kente: {
      name: 'Kente (Ghana)',
      description: 'Woven strip patterns',
      colors: {
        bg: '#FFFACD',      // Lemon
        fg: '#006400',      // Dark green
        accent1: '#FFD700', // Gold
        accent2: '#FF4500', // Orange red
        accent3: '#000000'  // Black
      },
      pattern: 'strips'
    },
    mudcloth: {
      name: 'Bògòlanfini (Mali)',
      description: 'Mud cloth patterns',
      colors: {
        bg: '#F5DEB3',      // Wheat
        fg: '#3E2723',      // Dark brown
        accent1: '#000000', // Black
        accent2: '#8B4513', // Saddle brown
        accent3: '#D2691E'  // Chocolate
      },
      pattern: 'organic'
    },
    ndebele: {
      name: 'Ndebele (South Africa)',
      description: 'Bold geometric designs',
      colors: {
        bg: '#FFFFFF',      // White
        fg: '#FF1493',      // Deep pink
        accent1: '#00CED1', // Turquoise
        accent2: '#FFD700', // Gold
        accent3: '#000000'  // Black
      },
      pattern: 'bold'
    }
  };

  const CONFIG = {
    rings: 180,
    segments: 270,
    canvasSize: 1200,
    outerRadius: 580,
    innerRadius: 80,
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

  // Draw Imigongo-style geometric patterns
  const drawImigogoPattern = (ctx, x, y, size, bit, colors) => {
    const patterns = [
      // Pattern 0: Diamond
      () => {
        ctx.fillStyle = bit === '1' ? colors.accent1 : colors.bg;
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x + size/2, y);
        ctx.lineTo(x, y + size/2);
        ctx.lineTo(x - size/2, y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = colors.fg;
        ctx.lineWidth = 1;
        ctx.stroke();
      },
      // Pattern 1: Triangle
      () => {
        ctx.fillStyle = bit === '1' ? colors.accent2 : colors.bg;
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x + size/2, y + size/2);
        ctx.lineTo(x - size/2, y + size/2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = colors.fg;
        ctx.lineWidth = 1;
        ctx.stroke();
      },
      // Pattern 2: Circle
      () => {
        ctx.fillStyle = bit === '1' ? colors.accent3 : colors.bg;
        ctx.beginPath();
        ctx.arc(x, y, size/2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.fg;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    ];
    
    const patternIndex = Math.floor(Math.random() * patterns.length);
    patterns[patternIndex]();
  };

  // Draw Kente-style strip patterns
  const drawKentePattern = (ctx, x, y, width, height, bit, colors) => {
    const stripeCount = 3;
    const stripeHeight = height / stripeCount;
    
    for (let i = 0; i < stripeCount; i++) {
      if (bit === '1') {
        ctx.fillStyle = i % 2 === 0 ? colors.accent1 : colors.accent2;
      } else {
        ctx.fillStyle = i % 2 === 0 ? colors.bg : colors.fg;
      }
      ctx.fillRect(x - width/2, y - height/2 + i * stripeHeight, width, stripeHeight);
    }
    
    // Add decorative lines
    ctx.strokeStyle = colors.accent3;
    ctx.lineWidth = 1;
    for (let i = 0; i <= stripeCount; i++) {
      ctx.beginPath();
      ctx.moveTo(x - width/2, y - height/2 + i * stripeHeight);
      ctx.lineTo(x + width/2, y - height/2 + i * stripeHeight);
      ctx.stroke();
    }
  };

  // Draw Ndebele-style bold geometric
  const drawNdebelePattern = (ctx, x, y, size, bit, colors) => {
    if (bit === '1') {
      // Bold colored square
      ctx.fillStyle = colors.accent1;
      ctx.fillRect(x - size/2, y - size/2, size, size);
      
      // Inner square
      ctx.fillStyle = colors.accent2;
      ctx.fillRect(x - size/3, y - size/3, size * 2/3, size * 2/3);
    } else {
      // White with border
      ctx.fillStyle = colors.bg;
      ctx.fillRect(x - size/2, y - size/2, size, size);
    }
    
    // Bold border
    ctx.strokeStyle = colors.accent3;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - size/2, y - size/2, size, size);
  };

  // Draw Mudcloth organic patterns
  const drawMudclothPattern = (ctx, x, y, size, bit, colors) => {
    ctx.fillStyle = bit === '1' ? colors.fg : colors.bg;
    
    // Organic shapes
    ctx.beginPath();
    const points = 6;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const radius = size/2 * (0.7 + Math.random() * 0.3);
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    
    // Add texture dots
    if (bit === '1') {
      ctx.fillStyle = colors.accent1;
      for (let i = 0; i < 3; i++) {
        const dx = (Math.random() - 0.5) * size/2;
        const dy = (Math.random() - 0.5) * size/2;
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Draw African art patterns in the segments
  const drawAfricanSegment = (ctx, center, r1, r2, a1, a2, bit, style, ring, seg) => {
    const aMid = (a1 + a2) / 2;
    const rMid = (r1 + r2) / 2;
    
    // Base segment color
    if (bit === '1') {
      ctx.fillStyle = '#000000';
    } else {
      ctx.fillStyle = '#FFFFFF';
    }
    
    ctx.beginPath();
    ctx.arc(center, center, r2, a1, a2);
    ctx.arc(center, center, r1, a2, a1, true);
    ctx.closePath();
    ctx.fill();
    
    // Add African art patterns ON TOP of the segments
    if (bit === '1') {
      // Imigongo-style geometric decorations
      const patternType = (ring + seg) % 4;
      
      switch (patternType) {
        case 0: // Diamond pattern
          ctx.strokeStyle = style.colors.accent1;
          ctx.lineWidth = 2;
          const x1 = center + rMid * Math.cos(aMid);
          const y1 = center + rMid * Math.sin(aMid);
          const size = (r2 - r1) * 0.4;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1 - size);
          ctx.lineTo(x1 + size, y1);
          ctx.lineTo(x1, y1 + size);
          ctx.lineTo(x1 - size, y1);
          ctx.closePath();
          ctx.stroke();
          break;
          
        case 1: // Zigzag pattern
          ctx.strokeStyle = style.colors.accent2;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const steps = 3;
          for (let i = 0; i <= steps; i++) {
            const a = a1 + (a2 - a1) * (i / steps);
            const r = i % 2 === 0 ? r1 : r2;
            const x = center + r * Math.cos(a);
            const y = center + r * Math.sin(a);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          break;
          
        case 2: // Dots pattern
          ctx.fillStyle = style.colors.accent1;
          const numDots = 3;
          for (let i = 0; i < numDots; i++) {
            const a = a1 + (a2 - a1) * ((i + 0.5) / numDots);
            const r = r1 + (r2 - r1) * 0.5;
            const x = center + r * Math.cos(a);
            const y = center + r * Math.sin(a);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
          
        case 3: // Cross-hatch pattern
          ctx.strokeStyle = style.colors.accent2;
          ctx.lineWidth = 1.5;
          
          // Radial lines
          const x2 = center + r1 * Math.cos(aMid);
          const y2 = center + r1 * Math.sin(aMid);
          const x3 = center + r2 * Math.cos(aMid);
          const y3 = center + r2 * Math.sin(aMid);
          
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.stroke();
          break;
      }
    }
  };

  const encode = () => {
    if (!inputText || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { rings, segments, canvasSize, outerRadius, innerRadius } = CONFIG;
    const style = ART_STYLES[artStyle];
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    ctx.imageSmoothingEnabled = false;
    
    const center = canvasSize / 2;
    const ringWidth = (outerRadius - innerRadius) / rings;
    
    console.log('=== AFRICAN ART ENCODING ===');
    console.log('Style:', style.name);
    console.log('Text length:', inputText.length);
    
    const textToEncode = CONFIG.useCompression ? compress(inputText) : inputText;
    const binary = textToBinary(textToEncode);
    const lengthBits = textToEncode.length.toString(2).padStart(16, '0');
    const styleIndex = Object.keys(ART_STYLES).indexOf(artStyle);
    const styleBits = styleIndex.toString(2).padStart(3, '0');
    const fullBinary = lengthBits + styleBits + binary;
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Black center with African pattern
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(center, center, innerRadius - 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Add center decoration (like Imigongo sun)
    ctx.strokeStyle = style.colors.accent1;
    ctx.lineWidth = 3;
    const centerRays = 8;
    for (let i = 0; i < centerRays; i++) {
      const angle = (i / centerRays) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(center + (innerRadius - 40) * Math.cos(angle), 
                 center + (innerRadius - 40) * Math.sin(angle));
      ctx.lineTo(center + (innerRadius - 25) * Math.cos(angle), 
                 center + (innerRadius - 25) * Math.sin(angle));
      ctx.stroke();
    }
    
    // Black outer border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Encode data with African art patterns
    let bitIndex = 0;
    for (let ring = rings - 1; ring >= 0 && bitIndex < fullBinary.length; ring--) {
      const r1 = innerRadius + ring * ringWidth;
      const r2 = innerRadius + (ring + 1) * ringWidth;
      
      for (let seg = 0; seg < segments && bitIndex < fullBinary.length; seg++) {
        const a1 = (seg / segments) * Math.PI * 2;
        const a2 = ((seg + 1) / segments) * Math.PI * 2;
        
        const bit = fullBinary[bitIndex];
        
        // Draw segment with African art decoration
        drawAfricanSegment(ctx, center, r1, r2, a1, a2, bit, style, ring, seg);
        
        bitIndex++;
      }
    }
    
    console.log('Encoded', bitIndex, 'bits with African art patterns');
  };

  const decode = (ctx, width, height) => {
    console.log('=== AFRICAN ART DECODING ===');
    console.log('Image size:', width, 'x', height);
    
    const { rings, segments } = CONFIG;
    const scale = width / CONFIG.canvasSize;
    const center = width / 2;
    const scaledOuter = CONFIG.outerRadius * scale;
    const scaledInner = CONFIG.innerRadius * scale;
    const ringWidth = (scaledOuter - scaledInner) / rings;
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const getPixel = (x, y) => {
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= width || py < 0 || py >= height) return 255;
      const i = (py * width + px) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3;
    };
    
    // Adaptive threshold
    let blackSamples = [];
    let whiteSamples = [];
    
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const r = (scaledInner - 30) * 0.5;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      blackSamples.push(getPixel(x, y));
    }
    
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
    
    let binary = '';
    let confidenceSum = 0;
    let segmentCount = 0;
    
    // Decode by sampling the BASE color of each segment (ignore decorative patterns)
    for (let ring = rings - 1; ring >= 0; ring--) {
      const r1 = scaledInner + ring * ringWidth;
      const r2 = scaledInner + (ring + 1) * ringWidth;
      
      for (let seg = 0; seg < segments; seg++) {
        const a1 = (seg / segments) * Math.PI * 2;
        const a2 = ((seg + 1) / segments) * Math.PI * 2;
        
        let blackCount = 0;
        let whiteCount = 0;
        const gridSize = 9;
        
        // Sample across the entire segment
        for (let ri = 0; ri < gridSize; ri++) {
          const rFraction = (ri + 0.5) / gridSize;
          const r = r1 + (r2 - r1) * rFraction;
          
          for (let ai = 0; ai < gridSize; ai++) {
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
        
        // Majority voting - if more pixels are black, it's a 1
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
    
    // Read 3-bit style (skip for now)
    const styleBits = binary.substring(16, 19);
    const styleIndex = parseInt(styleBits, 2);
    const styleNames = Object.keys(ART_STYLES);
    const detectedStyle = styleNames[styleIndex] || 'unknown';
    
    console.log('Style bits:', styleBits);
    console.log('Detected style:', detectedStyle);
    
    // Read data
    const dataBits = binary.substring(19, 19 + textLength * 8);
    const decodedCompressed = binaryToText(dataBits);
    
    // Decompress if needed
    const decoded = CONFIG.useCompression ? decompress(decodedCompressed) : decodedCompressed;
    
    console.log('Decoded text length:', decoded.length);
    console.log('Decoded text preview:', decoded.substring(0, 100) + (decoded.length > 100 ? '...' : ''));
    
    return { 
      text: decoded, 
      confidence: avgConfidence,
      style: detectedStyle
    };
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
          
          // Update art style to match detected style
          if (result.style && ART_STYLES[result.style]) {
            setArtStyle(result.style);
          }
        } catch (error) {
          console.error('Decode error:', error);
          setDecodedText('[ERROR: ' + error.message + ']');
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
      `Style: ${ART_STYLES[artStyle].name}\n\n` +
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
    link.download = `african-art-code-${artStyle}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    if (inputText) {
      encode();
    }
  }, [inputText, artStyle]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🌍 African Art Code</h1>
      <p style={styles.subtitle}>Data encoded in traditional African patterns</p>

      <div style={styles.styleGrid}>
        {Object.entries(ART_STYLES).map(([key, style]) => (
          <button
            key={key}
            onClick={() => setArtStyle(key)}
            style={{
              ...styles.styleButton,
              background: artStyle === key ? style.colors.accent1 : '#f3f4f6',
              color: artStyle === key ? 'white' : '#333',
              border: `3px solid ${artStyle === key ? style.colors.fg : '#ddd'}`
            }}
          >
            <div style={styles.styleName}>{style.name}</div>
            <div style={styles.styleDesc}>{style.description}</div>
            <div style={styles.colorPalette}>
              {Object.values(style.colors).slice(0, 5).map((color, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '20px',
                    height: '20px',
                    background: color,
                    border: '1px solid #999',
                    borderRadius: '3px'
                  }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      <div style={styles.inputSection}>
        <label style={styles.label}>Enter Your Message:</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message to encode in African art..."
          maxLength={5000}
          style={styles.textarea}
        />
        <div style={styles.charCount}>{inputText.length} characters</div>
      </div>

      {inputText && (
        <div style={styles.canvasSection}>
          <canvas ref={canvasRef} style={styles.canvas} />
          <div style={styles.info}>
            <strong>Style:</strong> {ART_STYLES[artStyle].name}
            <br />
            <strong>Pattern:</strong> {ART_STYLES[artStyle].description}
          </div>
          <div style={styles.buttonGroup}>
            <button onClick={download} style={styles.button}>
              Download Artwork
            </button>
            <button onClick={testDecode} style={{ ...styles.button, background: '#f59e0b' }}>
              Test Decode
            </button>
          </div>
        </div>
      )}

      <div style={styles.decodeSection}>
        <h3 style={{ color: '#8B4513' }}>Decode African Art Code</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current?.click()} style={styles.button}>
          Upload Image to Decode
        </button>
        
        {decodedText && (
          <div style={styles.result}>
            <strong>Decoded Text:</strong>
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
    maxWidth: '1100px',
    margin: '0 auto',
    background: 'linear-gradient(135deg, #FFF8DC 0%, #F5DEB3 100%)',
    minHeight: '100vh'
  },
  title: {
    textAlign: 'center',
    fontSize: '36px',
    marginBottom: '8px',
    color: '#8B4513'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px',
    fontSize: '16px'
  },
  styleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  styleButton: {
    padding: '20px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'left'
  },
  styleName: {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '6px'
  },
  styleDesc: {
    fontSize: '13px',
    opacity: 0.9,
    marginBottom: '10px'
  },
  colorPalette: {
    display: 'flex',
    gap: '5px',
    marginTop: '10px'
  },
  inputSection: {
    marginBottom: '30px',
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: 'bold',
    color: '#8B4513'
  },
  textarea: {
    width: '100%',
    padding: '15px',
    fontSize: '15px',
    border: '2px solid #D2691E',
    borderRadius: '8px',
    boxSizing: 'border-box',
    minHeight: '120px',
    fontFamily: 'Georgia, serif',
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
    background: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },
  canvas: {
    border: '5px solid #8B4513',
    borderRadius: '12px',
    maxWidth: '100%',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
  },
  info: {
    marginTop: '20px',
    padding: '15px',
    background: '#FFF8DC',
    borderRadius: '8px',
    textAlign: 'left',
    color: '#8B4513',
    fontSize: '14px',
    lineHeight: '1.8'
  },
  buttonGroup: {
    marginTop: '20px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  button: {
    padding: '15px 30px',
    background: '#8B4513',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    transition: 'all 0.3s'
  }
};

export default AfricanArtCode;

  // Add missing styles
  styles.decodedBox = {
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
  };
  
  styles.decodeSection = {
    marginTop: '30px',
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  };
  
  styles.result = {
    marginTop: '20px',
    padding: '15px',
    background: '#FFF8DC',
    borderRadius: '8px',
    border: '2px solid #8B4513'
  };
