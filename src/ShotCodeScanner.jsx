import React, { useState, useRef, useEffect } from 'react';

const ShotCodeScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [decodedText, setDecodedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const CONFIG = {
    rings: 240,
    segments: 360,
    canvasSize: 14400,
    outerRadius: 7150,
    innerRadius: 200,
    useCompression: true,
    errorCorrection: 0.3
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

  const removeErrorCorrection = (binary) => {
    let result = '';
    let corrected = 0;
    for (let i = 0; i < binary.length; i += 8) {
      const chunk = binary.substring(i, i + 8);
      if (chunk.length < 8) break;
      const data = chunk.substring(0, 7);
      const parity = chunk[7];
      const ones = (data.match(/1/g) || []).length;
      const expectedParity = ones % 2 === 0 ? '0' : '1';
      if (parity !== expectedParity) corrected++;
      result += data;
    }
    if (corrected > 0) {
      console.log('Errors detected:', corrected);
    }
    return result;
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

  const decode = (ctx, width, height) => {
    const { rings, segments, outerRadius, innerRadius } = CONFIG;
    
    const center = width / 2;
    const scale = width / CONFIG.canvasSize;
    const scaledOuter = outerRadius * scale;
    const scaledInner = innerRadius * scale;
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
    
    let binary = '';
    let confidenceSum = 0;
    let segmentCount = 0;
    
    for (let ring = rings - 1; ring >= 0; ring--) {
      const r1 = scaledInner + ring * ringWidth;
      const r2 = scaledInner + (ring + 1) * ringWidth;
      
      for (let seg = 0; seg < segments; seg++) {
        const a1 = (seg / segments) * Math.PI * 2;
        const a2 = ((seg + 1) / segments) * Math.PI * 2;
        
        let blackCount = 0;
        let whiteCount = 0;
        const gridSize = 15;
        
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
        
        binary += blackCount > whiteCount ? '1' : '0';
      }
    }
    
    const avgConfidence = (confidenceSum / segmentCount) * 100;
    
    const lengthBits = binary.substring(0, 16);
    const textLength = parseInt(lengthBits, 2);
    
    if (textLength > 15000 || textLength === 0) {
      throw new Error('Invalid length: ' + textLength);
    }
    
    const dataBitsWithEC = binary.substring(16);
    const dataBits = removeErrorCorrection(dataBitsWithEC);
    const decodedCompressed = binaryToText(dataBits.substring(0, textLength * 8));
    const decoded = CONFIG.useCompression ? decompress(decodedCompressed) : decodedCompressed;
    
    return { text: decoded, confidence: avgConfidence };
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      try {
        const result = decode(ctx, canvas.width, canvas.height);
        if (result.confidence > 70) {
          setDecodedText(result.text);
          setConfidence(Math.round(result.confidence));
          setError('');
          stopScanning();
        }
      } catch (err) {
        // Silent fail during scanning
      }
    }
  };

  const startScanning = async () => {
    try {
      setError('');
      setDecodedText('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setScanning(true);
      
      scanIntervalRef.current = setInterval(scanFrame, 500);
      
    } catch (err) {
      setError('Camera access denied: ' + err.message);
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ShotCode Scanner</h1>
      <p style={styles.subtitle}>Point your camera at a ShotCode to scan it</p>
      
      {!scanning && !decodedText && (
        <div style={styles.instructions}>
          <div style={styles.iconContainer}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <p style={styles.instructionText}>Ready to scan</p>
          <button onClick={startScanning} style={styles.button}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Start Camera
          </button>
        </div>
      )}
      
      {scanning && (
        <div style={styles.scanArea}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={styles.video}
          />
          <div style={styles.overlay}>
            <div style={styles.scanBox} />
            <p style={styles.scanText}>Scanning...</p>
          </div>
          <button onClick={stopScanning} style={styles.stopButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <rect x="6" y="6" width="12" height="12" />
            </svg>
            Stop Camera
          </button>
        </div>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {error && (
        <div style={styles.error}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ marginRight: '8px' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}
      
      {decodedText && (
        <div style={styles.result}>
          <div style={styles.successIcon}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="16 8 10 14 8 12" />
            </svg>
          </div>
          <h2 style={styles.resultTitle}>Decoded Successfully!</h2>
          <div style={styles.confidence}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Confidence: {confidence}%
          </div>
          <div style={styles.textBox}>
            {decodedText}
          </div>
          <button onClick={() => {
            setDecodedText('');
            setConfidence(0);
          }} style={styles.button}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '60px 40px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    minHeight: '100vh',
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
    marginBottom: '50px',
    fontSize: '18px'
  },
  instructions: {
    textAlign: 'center',
    padding: '60px 40px',
    background: '#f8f9fa',
    borderRadius: '16px',
    border: '1px solid #e0e0e0'
  },
  iconContainer: {
    marginBottom: '24px'
  },
  instructionText: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '24px'
  },
  button: {
    padding: '16px 32px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  scanArea: {
    position: 'relative',
    width: '100%',
    background: '#000',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
  },
  video: {
    width: '100%',
    height: 'auto',
    display: 'block'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  scanBox: {
    width: '80%',
    maxWidth: '350px',
    aspectRatio: '1',
    border: '4px solid #3b82f6',
    borderRadius: '50%',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
    position: 'relative'
  },
  scanText: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '600',
    marginTop: '24px',
    textShadow: '0 2px 8px rgba(0,0,0,0.8)'
  },
  stopButton: {
    position: 'absolute',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '14px 28px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
    pointerEvents: 'auto'
  },
  error: {
    padding: '20px',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '12px',
    marginTop: '24px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '15px',
    fontWeight: '500',
    border: '1px solid #fecaca'
  },
  result: {
    padding: '40px',
    background: '#f8f9fa',
    borderRadius: '16px',
    marginTop: '30px',
    textAlign: 'center',
    border: '1px solid #e0e0e0'
  },
  successIcon: {
    marginBottom: '20px'
  },
  resultTitle: {
    fontSize: '28px',
    color: '#1a1a1a',
    marginBottom: '16px',
    fontWeight: '700'
  },
  confidence: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#ffffff',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#10b981',
    marginBottom: '24px',
    border: '1px solid #e0e0e0'
  },
  textBox: {
    padding: '24px',
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    marginBottom: '24px',
    fontFamily: 'monospace',
    fontSize: '15px',
    maxHeight: '300px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    textAlign: 'left',
    color: '#333'
  }
};

export default ShotCodeScanner;
