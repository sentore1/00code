import { useState, useRef, useEffect } from 'react';

const ImigogoShapeCode = () => {
  const [inputText, setInputText] = useState('');
  const [shapePattern, setShapePattern] = useState('diamond');
  const [decodedText, setDecodedText] = useState('');
  const [activeTab, setActiveTab] = useState('encode');
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
      `Match: ${match ? 'YES âœ“' : 'NO âœ—'}\n` +
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
      // Only encode when explicitly triggered
    }
  }, [inputText, shapePattern]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated]   = useState(false);
  const [previewUrl, setPreviewUrl]     = useState('');
  const [decodeError, setDecodeError]   = useState('');
  const [decodeInfo, setDecodeInfo]     = useState(null);
  const [isDecoding, setIsDecoding]     = useState(false);

  const darkMode = false; // inherits from shell; kept for token reuse
  const t = {
    bg:'#ffffff', text:'#000000', textMuted:'#666', textDim:'#999',
    inputBg:'#ffffff', inputBorder:'#d1d5db', inputText:'#111',
    btnBg:'#000000', btnText:'#ffffff',
    tabActive:'#000000', tabInactive:'#aaa', tabBorder:'#e5e5e5',
    stepLabel:'#999', border:'#e5e5e5', chipBg:'#f0f0f0', chipText:'#555',
    uploadBorder:'#d1d5db', errorBg:'#fff5f5', errorBorder:'#fecaca', errorText:'#dc2626',
    resultBg:'#f8f8f8', decodedBg:'#ffffff',
  };

  const wrapEncode = () => {
    if (!inputText || !canvasRef.current) return;
    setIsGenerating(true);
    setTimeout(() => {
      encode();
      setPreviewUrl(canvasRef.current.toDataURL('image/png'));
      setIsGenerated(true);
      setIsGenerating(false);
    }, 50);
  };

  const wrapFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsDecoding(true); setDecodedText(''); setDecodeError(''); setDecodeInfo(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
        try {
          const result = decode(ctx, img.width, img.height);
          setDecodedText(result.text);
          setDecodeInfo({ chars: result.text.length, confidence: Math.round(result.confidence) });
        } catch (err) { setDecodeError(err.message); }
        setIsDecoding(false);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file); e.target.value = '';
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${t.tabBorder}`, marginBottom:'32px' }}>
        {[['encode','ENCODE'],['decode','DECODE IMAGE']].map(([key,label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding:'10px 0', marginRight:'28px', background:'transparent', border:'none',
            borderBottom: activeTab===key ? `2px solid ${t.tabActive}` : '2px solid transparent',
            color: activeTab===key ? t.tabActive : t.tabInactive,
            fontSize:'13px', fontWeight:'600', letterSpacing:'0.04em',
            cursor:'pointer', marginBottom:'-1px',
          }}>{label}</button>
        ))}
      </div>

      {/* â”€â”€ ENCODE â”€â”€ */}
      {activeTab === 'encode' && (
        <>
          {/* Shape selector */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
            <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:t.stepLabel }}>01</span>
            <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:t.stepLabel }}>SELECT PATTERN</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px', marginBottom:'28px' }}>
            {Object.entries(SHAPE_PATTERNS).map(([key, pattern]) => (
              <button key={key} onClick={() => setShapePattern(key)} style={{
                padding:'10px 12px', border:`2px solid ${shapePattern===key ? t.tabActive : t.border}`,
                borderRadius:'8px', background: shapePattern===key ? t.tabActive : t.inputBg,
                color: shapePattern===key ? t.btnText : t.text,
                cursor:'pointer', textAlign:'left',
              }}>
                <div style={{ fontSize:'12px', fontWeight:'700', marginBottom:'2px' }}>{pattern.name}</div>
                <div style={{ fontSize:'10px', opacity:0.7 }}>{pattern.description}</div>
              </button>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
            <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:t.stepLabel }}>02</span>
            <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:t.stepLabel }}>ENCODE MESSAGE</span>
          </div>
          <textarea value={inputText} onChange={e => setInputText(e.target.value)}
            placeholder="Type your secret message..." maxLength={5000}
            style={{ width:'100%', minHeight:'160px', padding:'16px', fontSize:'14px', lineHeight:'1.6',
              background:t.inputBg, color:t.inputText, border:`1px solid ${t.inputBorder}`,
              borderRadius:'8px', resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
          />
          <div style={{ textAlign:'right', fontSize:'12px', color:t.textDim, margin:'6px 0 24px' }}>
            {inputText.length} / 5,000 characters
          </div>
          <canvas ref={canvasRef} style={{ display:'none' }} />
          <button onClick={wrapEncode} disabled={!inputText||isGenerating} style={{
            width:'100%', padding:'18px 24px',
            background:(!inputText||isGenerating)?'#e0e0e0':t.btnBg,
            color:(!inputText||isGenerating)?t.textDim:t.btnText,
            border:'none', borderRadius:'0', fontSize:'13px', fontWeight:'700',
            letterSpacing:'0.08em', textTransform:'uppercase',
            cursor:(!inputText||isGenerating)?'not-allowed':'pointer',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <span style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              {isGenerating && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
              {isGenerating ? 'Generating...' : 'Generate Code'}
            </span>
            {!isGenerating && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
          </button>

          {isGenerated && previewUrl && (
            <div style={{ marginTop:'32px', borderTop:`1px solid ${t.border}`, paddingTop:'24px' }}>
              <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
                <span style={{ padding:'3px 10px', background:t.chipBg, color:t.chipText, borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>
                  Pattern: {SHAPE_PATTERNS[shapePattern].name}
                </span>
              </div>
              <img src={previewUrl} alt="Imigongo code preview"
                style={{ width:'100%', borderRadius:'8px', border:`1px solid ${t.border}`, display:'block', marginBottom:'16px' }} />
              <button onClick={download} style={{
                padding:'9px 18px', background:'transparent', color:t.text,
                border:`1px solid ${t.border}`, borderRadius:'8px', fontSize:'13px',
                fontWeight:'500', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'6px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            </div>
          )}
        </>
      )}

      {/* â”€â”€ DECODE â”€â”€ */}
      {activeTab === 'decode' && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
            <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:t.stepLabel }}>01</span>
            <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:t.stepLabel }}>UPLOAD IMAGE</span>
          </div>
          <div onClick={() => fileInputRef.current?.click()} style={{
            border:`2px dashed ${t.uploadBorder}`, borderRadius:'8px', padding:'40px 24px',
            display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer',
            background:t.inputBg, marginBottom:'24px', textAlign:'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={t.textDim} strokeWidth="1.5" style={{ marginBottom:'10px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <p style={{ margin:'0 0 4px', fontSize:'13px', fontWeight:'600', color:t.text }}>Click to upload image</p>
            <p style={{ margin:0, fontSize:'12px', color:t.textDim }}>PNG, JPG, WEBP</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={wrapFileUpload} style={{ display:'none' }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={isDecoding} style={{
            width:'100%', padding:'18px 24px',
            background:isDecoding?'#e0e0e0':t.btnBg, color:isDecoding?t.textDim:t.btnText,
            border:'none', borderRadius:'0', fontSize:'13px', fontWeight:'700',
            letterSpacing:'0.08em', textTransform:'uppercase',
            cursor:isDecoding?'not-allowed':'pointer',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <span style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              {isDecoding && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
              {isDecoding ? 'Decoding...' : 'Decode Image'}
            </span>
            {!isDecoding && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
          </button>

          {decodeError && (
            <div style={{ marginTop:'20px', padding:'14px 16px', background:t.errorBg, border:`1px solid ${t.errorBorder}`, borderRadius:'6px', color:t.errorText, fontSize:'13px', display:'flex', gap:'8px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {decodeError}
            </div>
          )}
          {decodedText && !decodeError && (
            <div style={{ marginTop:'24px', padding:'20px', background:t.resultBg, border:`1px solid ${t.border}`, borderRadius:'8px' }}>
              {decodeInfo && (
                <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
                  <span style={{ padding:'3px 10px', background:t.chipBg, color:t.chipText, borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>{decodeInfo.chars} chars</span>
                  <span style={{ padding:'3px 10px', background:t.chipBg, color:t.chipText, borderRadius:'20px', fontSize:'11px', fontWeight:'600' }}>{decodeInfo.confidence}% confidence</span>
                </div>
              )}
              <p style={{ margin:'0 0 8px', fontSize:'11px', fontWeight:'700', letterSpacing:'0.08em', color:t.textDim }}>DECODED MESSAGE</p>
              <div style={{ padding:'12px 14px', background:t.decodedBg, border:`1px solid ${t.border}`, borderRadius:'6px', fontFamily:'monospace', fontSize:'13px', lineHeight:'1.6', maxHeight:'200px', overflowY:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word', color:t.text }}>
                {decodedText}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImigogoShapeCode;
