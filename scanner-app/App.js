import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';

const CONFIG = {
  rings: 240,
  segments: 360,
  canvasSize: 14400,
  outerRadius: 7150,
  innerRadius: 200,
  useCompression: true,
  errorCorrection: 0.3
};

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [decodedText, setDecodedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const cameraRef = useRef(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

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
    for (let i = 0; i < binary.length; i += 8) {
      const chunk = binary.substring(i, i + 8);
      if (chunk.length < 8) break;
      result += chunk.substring(0, 7);
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

  const decode = (imageData, width, height) => {
    const { rings, segments, outerRadius, innerRadius } = CONFIG;
    
    const center = width / 2;
    const scale = width / CONFIG.canvasSize;
    const scaledOuter = outerRadius * scale;
    const scaledInner = innerRadius * scale;
    const ringWidth = (scaledOuter - scaledInner) / rings;
    
    const getPixel = (x, y) => {
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || px >= width || py < 0 || py >= height) return 255;
      const i = (py * width + px) * 4;
      return (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
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
        const gridSize = 10; // Reduced for mobile performance
        
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

  const scanCode = async () => {
    if (!cameraRef.current || scanningRef.current) return;
    
    scanningRef.current = true;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        skipProcessing: true
      });
      
      // Note: In production, you'd need to process the image
      // This is a simplified version - you'd need react-native-image-processing
      // or similar library to get pixel data
      
      Alert.alert('Info', 'Image captured. Processing would happen here with proper image library.');
      
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      scanningRef.current = false;
    }
  };

  const startScanning = () => {
    setScanning(true);
    setDecodedText('');
    setConfidence(0);
    
    // Auto-scan every 2 seconds
    const interval = setInterval(() => {
      if (scanningRef.current === false) {
        scanCode();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  };

  const stopScanning = () => {
    setScanning(false);
    scanningRef.current = false;
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <Text style={styles.subtext}>Please enable camera permission in settings</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>ShotCode Scanner</Text>
      </View>

      {!scanning && !decodedText && (
        <View style={styles.startContainer}>
          <Text style={styles.instructions}>
            Point your camera at a ShotCode to scan it
          </Text>
          <TouchableOpacity style={styles.button} onPress={startScanning}>
            <Text style={styles.buttonText}>Start Scanning</Text>
          </TouchableOpacity>
        </View>
      )}

      {scanning && (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={Camera.Constants.Type.back}
            ratio="16:9"
          >
            <View style={styles.overlay}>
              <View style={styles.scanBox} />
              <Text style={styles.scanText}>Hold steady...</Text>
            </View>
          </Camera>
          
          <TouchableOpacity style={styles.stopButton} onPress={stopScanning}>
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {decodedText && (
        <ScrollView style={styles.resultContainer}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>✓ Decoded Successfully!</Text>
            <Text style={styles.confidence}>
              Confidence: {confidence}%
            </Text>
            <View style={styles.textBox}>
              <ScrollView>
                <Text style={styles.decodedText}>{decodedText}</Text>
              </ScrollView>
            </View>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => {
                setDecodedText('');
                setConfidence(0);
              }}
            >
              <Text style={styles.buttonText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructions: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#3b82f6',
    borderRadius: 125,
  },
  scanText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  stopButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  resultContainer: {
    flex: 1,
  },
  resultCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 10,
  },
  confidence: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  textBox: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    maxHeight: 400,
    marginBottom: 20,
  },
  decodedText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  text: {
    fontSize: 18,
    color: '#fff',
  },
  subtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
});
