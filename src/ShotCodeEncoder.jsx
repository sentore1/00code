import React, { useState, useRef, useEffect } from 'react';

const ShotCodeEncoder = () => {
  const [mode, setMode] = useState('encode');
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [decodeConfidence, setDecodeConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const decodeCanvasRef = useRef(null);

  // Compression
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
    const dict = new Map();
    let dictSize = 256;
    for (let i = 0; i < 256; i++) {
      dict.set(i, String.fromCharCode(i));
    }
    const codes = compressed.split('').map(c => c.charCodeAt(0));
    if (codes.length === 0) return '';
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

  const textToBinary = (text) => {
    return text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  };

  const binaryToText = (binary) => {
    const chars = [];
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substring(i, i + 8);
      if (byte.length === 8) {
        const charCode = parseInt(byte, 2);
        if (charCode > 0 && charCode < 256) {
          chars.push(String.fromCharCode(charCode));
        }
      }
    }
    return chars.join('');
  };

  const calculateConfidence = (text) => {
    if (!text || text.length === 0) return 0;
    
    let readableChars = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
        readableChars++;
      }
    }
    
    return Math.round((readableChars / text.length) * 100);
  };

  const generatePattern = () => {
    if (!inputText || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 1600;
    canvas.width = size;
    canvas.height = size;
    
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Compress text
    let processedText = inputText.length > 20 ? compress(inputText) : inputText;
    let binary = textToBinary(processedText);
    
    // LARGER segments for better readability
    const rings = 60;
    const segments = 180;
    const outerRadius = size / 2 - 60;
    const bullseyeRadius = outerRadius * 0.12;
    const ringWidth = (outerRadius - bullseyeRadius * 1.4) / rings;
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Black bullseye center
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, bullseyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // White inner ring
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, bullseyeRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Black outer border (thick)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Timing patterns (alternating black/white every 10 rings)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    for (let i = 10; i < rings; i += 10) {
      const radius = bullseyeRadius * 1.4 + i * ringWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Encode data: BINARY ONLY
    let bitIndex = 0;
    for (let ring = rings - 1; ring >= 0 && bitIndex < binary.length; ring--) {
      const innerRadius = bullseyeRadius * 1.4 + ring * ringWidth;
      const outerRingRadius = bullseyeRadius * 1.4 + (ring + 1) * ringWidth;
      
      for (let seg = 0; seg < segments && bitIndex < binary.length; seg++) {
        const angleStart = (seg / segments) * Math.PI * 2 - Math.PI / 2;
        const angleEnd = ((seg + 1) / segments) * Math.PI * 2 - Math.PI / 2;
        
        const bit = binary[bitIndex];
        bitIndex++;
        
        if (bit === '1') {
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(centerX, centerY, outerRingRadius, angleStart, angleEnd);
          ctx.arc(centerX, centerY, innerRadius, angleEnd, angleStart, true);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    
    // Position markers (larger and more visible)
    const markerRadius = outerRadius * 0.08;
    const markerDist = outerRadius - markerRadius * 2;
    [0, Math.PI * 2/3, Math.PI * 4/3].forEach(angle => {
      const mx = centerX + markerDist * Math.cos(angle);
      const my = centerY + markerDist * Math.sin(angle);
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(mx, my, markerRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(mx, my, markerRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(mx, my, markerRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const decodeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = decodeCanvasRef.current;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          try {
            const result = decodePattern(ctx, img.width, img.height);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => reject('Failed to load image');
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const findCenter = (ctx, width, height) => {
    // Find the bullseye center by looking for the darkest region
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const getPixel = (x, y) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return 255;
      const i = (y * width + x) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3;
    };
    
    // Search in center region
    let bestX = width / 2;
    let bestY = height / 2;
    let minBrightness = 255;
    
    const searchRadius = Math.min(width, height) * 0.3;
    const step = 10;
    
    for (let y = height / 2 - searchRadius; y < height / 2 + searchRadius; y += step) {
      for (let x = width / 2 - searchRadius; x < width / 2 + searchRadius; x += step) {
        let totalBrightness = 0;
        let count = 0;
        
        // Sample 5x5 area
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            totalBrightness += getPixel(x + dx, y + dy);
            count++;
          }
        }
        
        const avgBrightness = totalBrightness / count;
        if (avgBrightness < minBrightness) {
          minBrightness = avgBrightness;
          bestX = x;
          bestY = y;
        }
      }
    }
    
    return { x: bestX, y: bestY };
  };

  const decodePattern = (ctx, width, height) => {
    // Find center
    const center = findCenter(ctx, width, height);
    const centerX = center.x;
    const centerY = center.y;
    
    const size = Math.min(width, height);
    const outerRadius = size / 2 - 60;
    const bullseyeRadius = outerRadius * 0.12;
    
    const rings = 60;
    const segments = 180;
    const ringWidth = (outerRadius - bullseyeRadius * 1.4) / rings;
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const getPixel = (x, y) => {
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= width || py < 0 || py >= height) return 255;
      const i = (py * width + px) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3;
    };
    
    // Calculate threshold using Otsu's method
    let histogram = new Array(256).fill(0);
    let totalPixels = 0;
    
    for (let ring = 5; ring < rings; ring += 5) {
      const midRadius = bullseyeRadius * 1.4 + ring * ringWidth + ringWidth / 2;
      for (let seg = 0; seg < segments; seg += 15) {
        const angle = (seg / segments) * Math.PI * 2 - Math.PI / 2;
        const px = centerX + midRadius * Math.cos(angle);
        const py = centerY + midRadius * Math.sin(angle);
        const brightness = Math.round(getPixel(px, py));
        histogram[brightness]++;
        totalPixels++;
      }
    }
    
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];
    
    let sumB = 0, wB = 0, wF = 0, maxVariance = 0, threshold = 128;
    
    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      wF = totalPixels - wB;
      if (wF === 0) break;
      
      sumB += t * histogram[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const variance = wB * wF * (mB - mF) * (mB - mF);
      
      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = t;
      }
    }
    
    let binary = '';
    
    // Decode with larger sampling area
    for (let ring = rings - 1; ring >= 0; ring--) {
      const innerRadius = bullseyeRadius * 1.4 + ring * ringWidth;
      const outerRingRadius = bullseyeRadius * 1.4 + (ring + 1) * ringWidth;
      const midRadius = (innerRadius + outerRingRadius) / 2;
      
      for (let seg = 0; seg < segments; seg++) {
        const angleStart = (seg / segments) * Math.PI * 2 - Math.PI / 2;
        const angleEnd = ((seg + 1) / segments) * Math.PI * 2 - Math.PI / 2;
        const angleMid = (angleStart + angleEnd) / 2;
        
        // Sample 25 points (5x5 grid) per segment
        let blackCount = 0;
        let whiteCount = 0;
        
        for (let r = 0; r < 5; r++) {
          const sampleRadius = innerRadius + (outerRingRadius - innerRadius) * (r / 4);
          for (let a = 0; a < 5; a++) {
            const angleOffset = (angleEnd - angleStart) * ((a / 4) - 0.5) * 0.8;
            const sampleAngle = angleMid + angleOffset;
            const px = centerX + sampleRadius * Math.cos(sampleAngle);
            const py = centerY + sampleRadius * Math.sin(sampleAngle);
            const brightness = getPixel(px, py);
            
            if (brightness < threshold) {
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
    
    // Convert to text
    let text = binaryToText(binary);
    let confidence = calculateConfidence(text);
    
    // Try decompression
    if (confidence > 15) {
      try {
        const decompressed = decompress(text);
        const decompressedConfidence = calculateConfidence(decompressed);
        if (decompressed && decompressed.length > 0 && decompressedConfidence > confidence) {
          text = decompressed;
          confidence = decompressedConfidence;
        }
      } catch (e) {}
    }
    
    // Clean up
    text = text.replace(/\0/g, '');
    if (confidence > 70) {
      text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    }
    
    return { text, confidence };
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsProcessing(true);
    setDecodedText('Decoding...');
    setDecodeConfidence(0);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const result = await decodeImage(file);
      
      if (result.confidence < 70) {
        setDecodedText(`⚠️ Confidence: ${result.confidence}%\n\n${result.text}`);
      } else {
        setDecodedText(result.text || 'No data found');
      }
      setDecodeConfidence(result.confidence);
    } catch (error) {
      setDecodedText(`❌ Error: ${error.message || error}\n\nMake sure this is a ShotCode image (PNG format)`);
      setDecodeConfidence(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `shotcode-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const testEncodeDecode = async () => {
    if (!inputText || !canvasRef.current) return;
    
    setTestMode(true);
    setDecodedText('Testing encode/decode cycle...');
    
    try {
      // Get the canvas as image
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      
      // Decode it immediately
      const img = new Image();
      img.onload = async () => {
        const testCanvas = decodeCanvasRef.current;
        testCanvas.width = img.width;
        testCanvas.height = img.height;
        const ctx = testCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        try {
          const result = decodePattern(ctx, img.width, img.height);
          setDecodedText(`✅ Test Result:\n\nOriginal: ${inputText}\n\nDecoded: ${result.text}\n\nConfidence: ${result.confidence}%\n\nMatch: ${inputText === result.text ? 'YES ✓' : 'NO ✗'}`);
          setDecodeConfidence(result.confidence);
        } catch (error) {
          setDecodedText(`❌ Test failed: ${error.message}`);
        }
      };
      img.src = dataUrl;
    } catch (error) {
      setDecodedText(`❌ Test error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (inputText && mode === 'encode') generatePattern();
  }, [inputText, mode]);

  const maxChars = Math.floor((60 * 180) / 8); // ~1350 chars

  return (
    <div className="encoder-container">
      <div className="mode-switch">
        <button 
          className={mode === 'encode' ? 'active' : ''}
          onClick={() => setMode('encode')}
        >
          Encode
        </button>
        <button 
          className={mode === 'decode' ? 'active' : ''}
          onClick={() => setMode('decode')}
        >
          Decode
        </button>
      </div>

      {mode === 'encode' ? (
        <div className="encode-section">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Enter text to encode (max ~${maxChars} chars)\n\nBinary encoding with timing patterns for accurate decoding`}
            maxLength={maxChars}
            rows={10}
          />
          <div className="char-count">{inputText.length} / {maxChars}</div>
          
          {inputText && (
            <div className="canvas-wrapper">
              <canvas ref={canvasRef} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button className="download-btn" onClick={downloadImage}>
                  Download PNG
                </button>
                <button 
                  className="download-btn" 
                  onClick={testEncodeDecode}
                  style={{ background: '#2563eb' }}
                >
                  Test Decode
                </button>
              </div>
              
              {testMode && decodedText && (
                <div className="decoded-output" style={{ marginTop: '20px' }}>
                  <h3>Test Results:</h3>
                  <pre>{decodedText}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="decode-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button 
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Upload ShotCode Image'}
          </button>
          
          {decodedText && (
            <div className="decoded-output">
              <h3>
                Decoded Text 
                {decodeConfidence > 0 && (
                  <span style={{ 
                    marginLeft: '10px', 
                    fontSize: '14px',
                    color: decodeConfidence >= 80 ? '#4ade80' : 
                           decodeConfidence >= 60 ? '#fbbf24' : '#ef4444'
                  }}>
                    ({decodeConfidence}% confidence)
                  </span>
                )}
              </h3>
              <pre>{decodedText}</pre>
            </div>
          )}
          
          <canvas ref={decodeCanvasRef} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  );
};

export default ShotCodeEncoder;
