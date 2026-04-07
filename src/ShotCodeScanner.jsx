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
      
      {!scanning && !decodedText && (
        <div style={styles.instructions}>
          <p>Point your camera at a ShotCode to scan it</p>
          <button onClick={startScanning} style={styles.button}>
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
            Stop
          </button>
        </div>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
      
      {decodedText && (
        <div style={styles.result}>
          <h2 style={styles.resultTitle}>Decoded Successfully!</h2>
          <div style={styles.confidence}>
            Confidence: {confidence}%
          </div>
          <div style={styles.textBox}>
            {decodedText}
          </div>
          <button onClick={() => {
            setDecodedText('');
            setConfidence(0);
          }} style={styles.button}>
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px'
  },
  instructions: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  button: {
    padding: '15px 30px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px'
  },
  scanArea: {
    position: 'relative',
    width: '100%',
    background: '#000'
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
    maxWidth: '300px',
    aspectRatio: '1',
    border: '3px solid #3b82f6',
    borderRadius: '50%',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
  },
  scanText: {
    color: 'white',
    fontSize: '18px',
    marginTop: '20px',
    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
  },
  stopButton: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  error: {
    padding: '15px',
    background: '#fee',
    color: '#c00',
    borderRadius: '8px',
    marginTop: '20px'
  },
  result: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginTop: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  resultTitle: {
    color: '#10b981',
    marginBottom: '10px'
  },
  confidence: {
    color: '#666',
    marginBottom: '15px',
    fontSize: '14px'
  },
  textBox: {
    background: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    maxHeight: '300px',
    overflow: 'auto',
    marginBottom: '20px',
    fontSize: '14px',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  }
};

export default ShotCodeScanner;
