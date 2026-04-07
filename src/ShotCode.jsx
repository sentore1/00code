import React, { useState, useRef } from 'react';

const ShotCode = () => {
  const [inputText, setInputText] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // STEP 1: Text to binary
  const textToBinary = (text) => {
    let binary = '';
    for (let i = 0; i < text.length; i++) {
      binary += text.charCodeAt(i).toString(2).padStart(8, '0');
    }
    return binary;
  };

  // STEP 2: Binary to text
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

  // STEP 3: Encode
  const encode = () => {
    if (!inputText || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 800;
    canvas.width = size;
    canvas.height = size;
    
    const binary = textToBinary(inputText);
    
    // Add 8-bit length header (0-255 chars)
    const lengthBits = inputText.length.toString(2).padStart(8, '0');
    const fullBinary = lengthBits + binary;
    
    console.log('Text length:', inputText.length);
    console.log('Length bits:', lengthBits);
    console.log('Total bits:', fullBinary.length);
    
    // BIGGER SEGMENTS: 10 rings, 10 segments = 100 bits = 11 chars (with 8-bit header)
    const rings = 10;
    const segments = 10;
    const center = size / 2;
    const outerR = 350;
    const innerR = 80; // Increased from 50 to give more space from center
    const ringW = (outerR - innerR) / rings;
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Black center (smaller than innerR to leave gap)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(center, center, innerR - 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Black border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(center, center, outerR, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw data
    let bitIndex = 0;
    for (let ring = rings - 1; ring >= 0 && bitIndex < fullBinary.length; ring--) {
      const r1 = innerR + ring * ringW;
      const r2 = innerR + (ring + 1) * ringW;
      
      for (let seg = 0; seg < segments && bitIndex < fullBinary.length; seg++) {
        const a1 = (seg / segments) * Math.PI * 2;
        const a2 = ((seg + 1) / segments) * Math.PI * 2;
        
        if (fullBinary[bitIndex] === '1') {
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(center, center, r2, a1, a2);
          ctx.arc(center, center, r1, a2, a1, true);
          ctx.closePath();
          ctx.fill();
        }
        bitIndex++;
      }
    }
  };

  // STEP 4: Decode
  const decode = (ctx, width, height) => {
    const rings = 10;
    const segments = 10;
    const center = width / 2;
    const outerR = 350 * (width / 800);
    const innerR = 80 * (width / 800); // Match encoder's innerR
    const ringW = (outerR - innerR) / rings;
    
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
    for (let ring = rings - 1; ring >= 0; ring--) {
      const r1 = innerR + ring * ringW;
      const r2 = innerR + (ring + 1) * ringW;
      
      for (let seg = 0; seg < segments; seg++) {
        const angleStart = (seg / segments) * Math.PI * 2;
        const angleEnd = ((seg + 1) / segments) * Math.PI * 2;
        const angleMid = (angleStart + angleEnd) / 2;
        
        // Sample 9 points in a 3x3 grid
        let blackCount = 0;
        let whiteCount = 0;
        
        for (let ri = 0; ri < 3; ri++) {
          const r = r1 + (r2 - r1) * (ri / 2);
          for (let ai = 0; ai < 3; ai++) {
            const angleOffset = (angleEnd - angleStart) * ((ai / 2) - 0.5) * 0.7;
            const angle = angleMid + angleOffset;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            
            const brightness = getPixel(x, y);
            if (brightness < 128) {
              blackCount++;
            } else {
              whiteCount++;
            }
          }
        }
        
        // Majority vote
        binary += blackCount > whiteCount ? '1' : '0';
      }
    }
    
    console.log('Decoded binary:', binary);
    
    // Read length from first 8 bits
    const lengthBits = binary.substring(0, 8);
    const textLength = parseInt(lengthBits, 2);
    
    console.log('Length bits:', lengthBits);
    console.log('Text length:', textLength);
    
    // Read only the exact number of bits needed
    const dataBits = binary.substring(8, 8 + textLength * 8);
    
    console.log('Data bits:', dataBits);
    console.log('Data bits length:', dataBits.length);
    
    const decoded = binaryToText(dataBits);
    console.log('Decoded text:', decoded);
    
    return decoded;
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
        
        const result = decode(ctx, img.width, img.height);
        setDecodedText(result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const testDecode = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    console.log('=== ENCODING ===');
    const encodedBinary = inputText.length.toString(2).padStart(8, '0') + textToBinary(inputText);
    console.log('Encoded binary:', encodedBinary);
    console.log('Encoded length:', encodedBinary.length, 'bits');
    
    console.log('\n=== DECODING ===');
    const result = decode(ctx, canvas.width, canvas.height);
    
    console.log('\n=== COMPARISON ===');
    console.log('Original:', inputText);
    console.log('Decoded:', result);
    console.log('Match:', inputText === result ? 'YES ✓' : 'NO ✗');
    
    // Character by character comparison
    console.log('\nCharacter comparison:');
    for (let i = 0; i < Math.max(inputText.length, result.length); i++) {
      const orig = inputText[i] || '(none)';
      const dec = result[i] || '(none)';
      const match = orig === dec ? '✓' : '✗';
      console.log(`  [${i}] "${orig}" vs "${dec}" ${match}`);
    }
    
    alert(`Original: "${inputText}"\n\nDecoded: "${result}"\n\nMatch: ${inputText === result ? 'YES ✓' : 'NO ✗'}\n\nCheck console (F12) for detailed comparison`);
  };

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'shotcode.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center' }}>ShotCode - Fresh Start</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        10 rings × 10 segments = 100 bits = <strong>11 characters max</strong> (with 8-bit header)
        <br />
        <span style={{ fontSize: '14px', color: '#999' }}>Each segment is 36° - much easier to read!</span>
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Enter Text (max 11 chars):
        </label>
        <input
          type="text"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setTimeout(encode, 10);
          }}
          placeholder="Type something short..."
          maxLength={11}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ textAlign: 'right', color: '#999', fontSize: '14px', marginTop: '5px' }}>
          {inputText.length} / 11
        </div>
      </div>

      {inputText && (
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <canvas ref={canvasRef} style={{ border: '2px solid #ddd', borderRadius: '8px', maxWidth: '100%' }} />
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={download} style={buttonStyle}>Download</button>
            <button onClick={testDecode} style={{ ...buttonStyle, background: '#f59e0b' }}>Test Decode</button>
          </div>
        </div>
      )}

      <div style={{ borderTop: '2px solid #ddd', paddingTop: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Upload ShotCode to Decode:
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current?.click()} style={buttonStyle}>
          Choose Image
        </button>
        
        {decodedText && (
          <div style={{ marginTop: '15px', padding: '15px', background: '#f3f4f6', borderRadius: '8px' }}>
            <strong>Decoded:</strong> {decodedText}
          </div>
        )}
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '12px 24px',
  background: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold'
};

export default ShotCode;
