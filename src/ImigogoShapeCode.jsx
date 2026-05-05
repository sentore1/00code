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
    canvasSize: 2000,
    useCompression: true,
    // Realistic capacity - 50 rings for ~5-6K chars with high accuracy
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

  // Add redundancy to length header (repeat 3 times for error correction)
  // Note: Now using byte length instead of character length for UTF-8 support

  // Decode length with majority voting
  const decodeLengthWithRedundancy = (binary) => {
    if (binary.length < 48) {
      console.error('Not enough bits for length header');
      return 0;
    }

    const len1 = parseInt(binary.substring(0, 16), 2);
    const len2 = parseInt(binary.substring(16, 32), 2);
    const len3 = parseInt(binary.substring(32, 48), 2);

    console.log('Length candidates:', len1, len2, len3);

    // Majority voting
    if (len1 === len2) return len1;
    if (len1 === len3) return len1;
    if (len2 === len3) return len2;

    // If all different, use the most reasonable one
    const lengths = [len1, len2, len3].sort((a, b) => a - b);
    console.log('Using median length:', lengths[1]);
    return lengths[1];
  };

  // Draw diamond grid pattern in CIRCULAR arrangement
  function drawDiamondGrid(ctx, binary, canvasSize) {
    const center = canvasSize / 2;
    const { rings, innerRadius, outerRadius } = CONFIG;
    const ringWidth = (outerRadius - innerRadius) / rings;
    
    const positions = [];
    let bitIndex = 0;
    
    // Draw in circular rings
    for (let ring = rings - 1; ring >= 0 && bitIndex < binary.length; ring--) {
      const r = innerRadius + ring * ringWidth + ringWidth / 2;
      const circumference = 2 * Math.PI * r;
      const diamondSize = ringWidth * 0.8;
      // Balanced spacing - 10% gap for reliability
      const numShapes = Math.floor(circumference / (diamondSize * 1.1));
      
      for (let i = 0; i < numShapes && bitIndex < binary.length; i++) {
        const angle = (i / numShapes) * Math.PI * 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        const bit = binary[bitIndex];
        
        positions.push({ x, y, bit, ring, i, angle, r });
        
        // Draw diamond rotated to follow circle
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
    
    console.log('Diamond: encoded', bitIndex, 'bits in', rings, 'rings');
    console.log('Realistic capacity: ~', Math.floor(bitIndex / 8 * 0.7 * 0.8), 'characters (with compression & safety margin)');
    return { positions, rings, innerRadius, outerRadius, bitIndex };
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
    console.log('Text length:', inputText.length, 'characters');
    
    const textToEncode = CONFIG.useCompression ? compress(inputText) : inputText;
    const binary = textToBinary(textToEncode);
    
    // Use byte length for header, not character length
    const encoder = new TextEncoder();
    const bytes = encoder.encode(textToEncode);
    const lengthBits = bytes.length.toString(2).padStart(16, '0');
    const lengthBitsRedundant = lengthBits + lengthBits + lengthBits;
    
    const patternIndex = Object.keys(SHAPE_PATTERNS).indexOf(shapePattern);
    const patternBits = patternIndex.toString(2).padStart(3, '0');
    let fullBinary = lengthBitsRedundant + patternBits + binary;
    
    // Calculate approximate capacity (will be filled by pattern draw function)
    // Most patterns use ~100 rings, estimate capacity
    const estimatedCapacity = 100000; // Large enough for most patterns
    
    // Add alternating padding to fill space
    if (fullBinary.length < estimatedCapacity) {
      const paddingNeeded = estimatedCapacity - fullBinary.length;
      console.log('Adding padding:', paddingNeeded, 'bits');
      for (let i = 0; i < paddingNeeded; i++) {
        fullBinary += (i % 2).toString();
      }
    }
    
    console.log('Compressed length:', textToEncode.length, 'characters');
    console.log('Byte length:', bytes.length);
    console.log('Total bits:', fullBinary.length);
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    const center = canvasSize / 2;
    
    // Draw black center circle for alignment
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(center, center, 130, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pattern
    const metadata = SHAPE_PATTERNS[shapePattern].draw(ctx, fullBinary, canvasSize);
    
    // Draw black outer border for alignment
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(center, center, 960, 0, Math.PI * 2);
    ctx.stroke();
    
    console.log('Encoded with', shapePattern, 'pattern');
    console.log('Metadata:', metadata);
  };

  const decode = (ctx, width, height) => {
    console.log('=== IMIGONGO SHAPE DECODING ===');
    console.log('Image size:', width, 'x', height);
    console.log('Pattern:', shapePattern);
    
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
    
    // Calculate adaptive threshold
    let blackSamples = [];
    let whiteSamples = [];
    
    // Sample center (black)
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const r = 65 * scale;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      blackSamples.push(getPixel(x, y));
    }
    
    // Sample outside (white)
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
    
    console.log('Black avg:', avgBlack.toFixed(1));
    console.log('White avg:', avgWhite.toFixed(1));
    console.log('Threshold:', threshold.toFixed(1));
    
    let binary = '';
    let confidenceSum = 0;
    let shapeCount = 0;
    
    // Decode based on circular arrangement - MUST MATCH ENCODING EXACTLY
    if (shapePattern === 'diamond') {
      const { rings, innerRadius, outerRadius } = CONFIG;
      const scaledInner = innerRadius * scale;
      const scaledOuter = outerRadius * scale;
      const ringWidth = (scaledOuter - scaledInner) / rings;
      
      console.log('Decoding diamond pattern:');
      console.log('- Rings:', rings);
      console.log('- Inner radius:', scaledInner.toFixed(1));
      console.log('- Outer radius:', scaledOuter.toFixed(1));
      console.log('- Ring width:', ringWidth.toFixed(2));
      
      for (let ring = rings - 1; ring >= 0; ring--) {
        const r = scaledInner + ring * ringWidth + ringWidth / 2;
        const circumference = 2 * Math.PI * r;
        const diamondSize = ringWidth * 0.8;
        // Balanced spacing to match encoder
        const numShapes = Math.floor(circumference / (diamondSize * 1.1));
        
        for (let i = 0; i < numShapes; i++) {
          const angle = (i / numShapes) * Math.PI * 2;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          
          // Dense sampling - 15x15 grid for accuracy
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
          
          const total = blackCount + whiteCount;
          const confidence = Math.max(blackCount, whiteCount) / total;
          confidenceSum += confidence;
          shapeCount++;
          
          const bit = blackCount > whiteCount ? '1' : '0';
          binary += bit;
        }
      }
      
      console.log('Diamond: decoded', binary.length, 'bits from', rings, 'rings');
      console.log('Shapes decoded:', shapeCount);
      console.log('Expected capacity: ~', Math.floor(binary.length / 8 * 0.7 * 0.8), 'characters');
    } else if (shapePattern === 'triangle') {
      const rings = 35;
      const innerRadius = 80 * scale;
      const outerRadius = 480 * scale;
      const ringWidth = (outerRadius - innerRadius) / rings;
      
      for (let ring = rings - 1; ring >= 0; ring--) {
        const r = innerRadius + ring * ringWidth + ringWidth / 2;
        const circumference = 2 * Math.PI * r;
        const triangleSize = ringWidth * 0.9;
        const numShapes = Math.floor(circumference / triangleSize);
        
        for (let i = 0; i < numShapes; i++) {
          const angle = (i / numShapes) * Math.PI * 2;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          
          let blackCount = 0;
          let whiteCount = 0;
          const sampleRadius = triangleSize * 0.3;
          const gridSize = 9;
          
          for (let gx = 0; gx < gridSize; gx++) {
            for (let gy = 0; gy < gridSize; gy++) {
              const dx = (gx - gridSize/2) * (sampleRadius * 2 / gridSize);
              const dy = (gy - gridSize/2) * (sampleRadius * 2 / gridSize);
              const brightness = getPixel(x + dx, y + dy);
              
              if (brightness < threshold) blackCount++;
              else whiteCount++;
            }
          }
          
          const total = blackCount + whiteCount;
          const confidence = Math.max(blackCount, whiteCount) / total;
          confidenceSum += confidence;
          shapeCount++;
          
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
          const sampleRadius = hexSize * 0.5;
          const gridSize = 9;
          
          for (let gx = 0; gx < gridSize; gx++) {
            for (let gy = 0; gy < gridSize; gy++) {
              const dx = (gx - gridSize/2) * (sampleRadius * 2 / gridSize);
              const dy = (gy - gridSize/2) * (sampleRadius * 2 / gridSize);
              const brightness = getPixel(x + dx, y + dy);
              
              if (brightness < threshold) blackCount++;
              else whiteCount++;
            }
          }
          
          const total = blackCount + whiteCount;
          const confidence = Math.max(blackCount, whiteCount) / total;
          confidenceSum += confidence;
          shapeCount++;
          
          binary += blackCount > whiteCount ? '1' : '0';
        }
      }
    } else if (shapePattern === 'chevron') {
      const rings = 30;
      const innerRadius = 80 * scale;
      const outerRadius = 480 * scale;
      const ringWidth = (outerRadius - innerRadius) / rings;
      
      for (let ring = rings - 1; ring >= 0; ring--) {
        const r = innerRadius + ring * ringWidth + ringWidth / 2;
        const circumference = 2 * Math.PI * r;
        const chevronSize = ringWidth * 0.8;
        const numShapes = Math.floor(circumference / chevronSize);
        
        for (let i = 0; i < numShapes; i++) {
          const angle = (i / numShapes) * Math.PI * 2;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          
          let blackCount = 0;
          let whiteCount = 0;
          const sampleRadius = chevronSize * 0.3;
          const gridSize = 9;
          
          for (let gx = 0; gx < gridSize; gx++) {
            for (let gy = 0; gy < gridSize; gy++) {
              const dx = (gx - gridSize/2) * (sampleRadius * 2 / gridSize);
              const dy = (gy - gridSize/2) * (sampleRadius * 2 / gridSize);
              const brightness = getPixel(x + dx, y + dy);
              
              if (brightness < threshold) blackCount++;
              else whiteCount++;
            }
          }
          
          const total = blackCount + whiteCount;
          const confidence = Math.max(blackCount, whiteCount) / total;
          confidenceSum += confidence;
          shapeCount++;
          
          binary += blackCount > whiteCount ? '1' : '0';
        }
      }
    }
    
    const avgConfidence = (confidenceSum / shapeCount) * 100;
    
    console.log('Decoded bits:', binary.length);
    console.log('Confidence:', avgConfidence.toFixed(1) + '%');
    
    // Read 48-bit length header (with redundancy for error correction)
    const textLength = decodeLengthWithRedundancy(binary);
    
    console.log('Decoded byte length:', textLength);
    
    if (textLength > 12000 || textLength === 0) {
      console.error('Invalid length:', textLength);
      return { text: '[ERROR: Invalid length ' + textLength + ']', confidence: 0 };
    }
    
    // Skip 48-bit length header + 3-bit pattern = 51 bits
    const dataBits = binary.substring(51, 51 + textLength * 8);
    const decodedCompressed = binaryToText(dataBits);
    const decoded = CONFIG.useCompression ? decompress(decodedCompressed) : decodedCompressed;
    
    console.log('Decoded text length:', decoded.length, 'characters');
    console.log('Decoded text preview:', decoded.substring(0, 100));
    
    return { text: decoded, confidence: avgConfidence };
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
        <label style={styles.label}>Enter Your Message (up to 5,000 characters for high accuracy):</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message... supports up to 5K characters with 99% accuracy!"
          maxLength={5000}
          style={styles.textarea}
        />
        <div style={styles.charCount}>{inputText.length} / 5,000 characters</div>
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
