import React, { useState, useRef, useEffect } from 'react';

const ShotCodeEncoder = () => {
  const [mode, setMode] = useState('encode');
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const decodeCanvasRef = useRef(null);

  // LZW Compression
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
    if (!compressed || compressed.length === 0) return '';
    const dict = new Map();
    let dictSize = 256;
    for (let i = 0; i < 256; i++) {
      dict.set(i, String.fromCharCode(i));
    }
    const codes = compressed.split('').map(c => c.charCodeAt(0));
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
    return text.split('').map(char => 
      char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');
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
    let readable = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
        readable++;
      }
    }
    return Math.round((readable / text.length) * 100);
  };

  // FIXED CONFIGURATION - No guessing needed
  const CONFIG = {
    rings: 40,
    segments: 120,
    bitsPerSegment: 2  // 4 gray levels (00, 01, 10, 11)
  };

  const generatePattern = () => {
    if (!inputText || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 1400;
    canvas.width = size;
    canvas.height = size;
    
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Compress
    let processedText = inputText.length > 20 ? compress(inputText) : inputText;
    let binary = textToBinary(processedText);
    
    const { rings, segments, bitsPerSegment } = CONFIG;
    const outerRadius = size / 2 - 60;
    const bullseyeRadius = outerRadius * 0.10;
    const ringWidth = (outerRadius - bullseyeRadius * 1.3) / rings;
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Black bullseye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, bullseyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // White center
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, bullseyeRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Black outer border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Encode data: OUTER to INNER
    let bitIndex = 0;
    for (let ring = rings - 1; ring >= 0 && bitIndex < binary.length; ring--) {
      const innerRadius = bullseyeRadius * 1.3 + ring * ringWidth;
      const outerRingRadius = bullseyeRadius * 1.3 + (ring + 1) * ringWidth;
      
      for (let seg = 0; seg < segments && bitIndex < binary.length; seg++) {
        const angleStart = (seg / segments) * Math.PI * 2 - Math.PI / 2;
        const angleEnd = ((seg + 1) / segments) * Math.PI * 2 - Math.PI / 2;
        
        // Read bits
        let segmentValue = 0;
        for (let b = 0; b < bitsPerSegment && bitIndex < binary.length; b++) {
          segmentValue = (segmentValue << 1) | parseInt(binary[bitIndex]);
          bitIndex++;
        }
        
        if (segmentValue > 0) {
          // Map to grayscale: 0=white, 1=light gray, 2=dark gray, 3=black
          const maxValue = (1 << bitsPerSegment) - 1;
          const intensity = segmentValue / maxValue;
          const grayValue = Math.floor(255 - intensity * 255);
          
          ctx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
          ctx.beginPath();
          ctx.arc(centerX, centerY, outerRingRadius, angleStart, angleEnd);
          ctx.arc(centerX, centerY, innerRadius, angleEnd, angleStart, true);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    
    // Position markers
    const markerRadius = outerRadius * 0.06;
    const markerDist = outerRadius - markerRadius * 1.8;
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

  const decodePattern = (ctx, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    const { rings, segments, bitsPerSegment } = CONFIG;
    const size = Math.min(width, height);
    const outerRadius = size / 2 - 60;
    const bullseyeRadius = outerRadius * 0.10;
    const ringWidth = (outerRadius - bullseyeRadius * 1.3) / rings;
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const getPixel = (x, y) => {
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= width || py < 0 || py >= height) return 255;
      const i = (py * width + px) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3;
    };
    
    let binary = '';
    
    // Decode: OUTER to INNER (same as encoding)
    for (let ring = rings - 1; ring >= 0; ring--) {
      const innerRadius = bullseyeRadius * 1.3 + ring * ringWidth;
      const outerRingRadius = bullseyeRadius * 1.3 + (ring + 1) * ringWidth;
      
      for (let seg = 0; seg < segments; seg++) {
        const angleStart = (seg / segments) * Math.PI * 2 - Math.PI / 2;
        const angleEnd = ((seg + 1) / segments) * Math.PI * 2 - Math.PI / 2;
        const angleMid = (angleStart + angleEnd) / 2;
        
        // Sample 9 points
        let samples = [];
        for (let r = 0; r < 3; r++) {
          const sampleRadius = innerRadius + (outerRingRadius - innerRadius) * (r / 2);
          for (let a = 0; a < 3; a++) {
            const angleOffset = (angleEnd - angleStart) * ((a / 2) - 0.5) * 0.7;
            const sampleAngle = angleMid + angleOffset;
            const px = centerX + sampleRadius * Math.cos(sampleAngle);
            const py = centerY + sampleRadius * Math.sin(sampleAngle);
            samples.push(getPixel(px, py));
          }
        }
        
        // Median
        samples.sort((a, b) => a - b);
        const brightness = samples[Math.floor(samples.length / 2)];
        
        // Reverse grayscale mapping
        const intensity = (255 - brightness) / 255;
        const maxValue = (1 << bitsPerSegment) - 1;
        const segmentValue = Math.round(intensity * maxValue);
        
        const bitString = segmentValue.toString(2).padStart(bitsPerSegment, '0');
        binary += bitString;
      }
    }
    
    // Convert to text
    let text = binaryToText(binary);
    let conf = calculateConfidence(text);
    
    // Try decompress
    if (conf > 20) {
      try {
        const decompressed = decompress(text);
        const decompConf = calculateConfidence(decompressed);
        if (decompressed && decompressed.length > 0 && decompConf > conf) {
          text = decompressed;
          conf = decompConf;
        }
      } catch (e) {}
    }
    
    // Clean
    text = text.replace(/\0/g, '');
    if (conf > 70) {
      text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    }
    
    return { text, confidence: conf };
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsProcessing(true);
    setDecodedText('Decoding...');
    setConfidence(0);
    
    try {
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
            setDecodedText(result.text || 'No data found');
            setConfidence(result.confidence);
          } catch (error) {
            setDecodedText(`Error: ${error.message}`);
            setConfidence(0);
          } finally {
            setIsProcessing(false);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setDecodedText(`Error: ${error.message}`);
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
    
    setIsProcessing(true);
    setDecodedText('Testing...');
    
    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      
      const img = new Image();
      img.onload = () => {
        const testCanvas = decodeCanvasRef.current;
        testCanvas.width = img.width;
        testCanvas.height = img.height;
        const ctx = testCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        try {
          const result = decodePattern(ctx, img.width, img.height);
          const match = inputText === result.text;
          setDecodedText(`Original: ${inputText}\n\nDecoded: ${result.text}\n\nMatch: ${match ? '✓ YES' : '✗ NO'}`);
          setConfidence(result.confidence);
        } catch (error) {
          setDecodedText(`Test failed: ${error.message}`);
        } finally {
          setIsProcessing(false);
        }
      };
      img.src = dataUrl;
    } catch (error) {
      setDecodedText(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (inputText && mode === 'encode') generatePattern();
  }, [inputText, mode]);

  const maxChars = Math.floor((CONFIG.rings * CONFIG.segments * CONFIG.bitsPerSegment) / 8);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>ShotCode Encoder/Decoder</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <button 
          onClick={() => setMode('encode')}
          style={{
            padding: '10px 30px',
            background: mode === 'encode' ? '#6366f1' : '#e5e7eb',
            color: mode === 'encode' ? 'white' : 'black',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Encode
        </button>
        <button 
          onClick={() => setMode('decode')}
          style={{
            padding: '10px 30px',
            background: mode === 'decode' ? '#10b981' : '#e5e7eb',
            color: mode === 'decode' ? 'white' : 'black',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Decode
        </button>
      </div>

      {mode === 'encode' ? (
        <div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Enter text (max ${maxChars} chars)\n\nConfig: ${CONFIG.rings} rings × ${CONFIG.segments} segments × ${CONFIG.bitsPerSegment} bits`}
            maxLength={maxChars}
            rows={8}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '14px',
              fontFamily: 'monospace',
              borderRadius: '8px',
              border: '2px solid #d1d5db',
              marginBottom: '10px'
            }}
          />
          <div style={{ textAlign: 'right', marginBottom: '20px', color: '#6b7280' }}>
            {inputText.length} / {maxChars} characters
          </div>
          
          {inputText && (
            <div style={{ textAlign: 'center' }}>
              <canvas ref={canvasRef} style={{ maxWidth: '100%', border: '1px solid #d1d5db', borderRadius: '8px' }} />
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={downloadImage} style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Download PNG
                </button>
                <button onClick={testEncodeDecode} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Test Decode
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '20px',
              background: isProcessing ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {isProcessing ? 'Processing...' : 'Upload ShotCode Image'}
          </button>
          
          {decodedText && (
            <div style={{ marginTop: '20px', padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '10px' }}>
                Decoded Text 
                {confidence > 0 && (
                  <span style={{ 
                    marginLeft: '10px', 
                    fontSize: '14px',
                    color: confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#ef4444'
                  }}>
                    ({confidence}% confidence)
                  </span>
                )}
              </h3>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px' }}>
                {decodedText}
              </pre>
            </div>
          )}
        </div>
      )}
      
      <canvas ref={decodeCanvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ShotCodeEncoder;
