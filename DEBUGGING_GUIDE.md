# Debugging Guide - Advanced Morphing Code Decoding

## What I Fixed

The decoding issue was in the **color detection logic**. The previous version was trying to count individual color channels, but the new version:

1. **Samples the shape area** with a 9×9 grid (instead of 15×15)
2. **Averages RGB values** for each sample point
3. **Detects dominant color** by comparing R, G, B channels
4. **Converts to 3-bit value** (0-7) based on which channels are dominant

## How to Test

### Step 1: Open Browser Console
1. Press `F12` to open Developer Tools
2. Go to "Console" tab
3. You'll see detailed encoding/decoding logs

### Step 2: Generate a Code
1. Click "Advanced (20K)" tab
2. Enter a short test message: `"Hello"`
3. Watch the console for encoding logs:
   ```
   === ENCODING ===
   Text: Hello
   Colors: RGB
   Byte length: 5
   Total bits: 123
   Encoded successfully
   ```

### Step 3: Test Decode
1. Click "Test Decode" button
2. Watch the console for decoding logs:
   ```
   === DECODING ===
   Image size: 2000 x 2000
   Scale: 1.00
   Ring width: 16.00
   Total bits decoded: 123
   Length candidates: 5 5 5
   Decoded byte length: 5
   Scan count: 0
   Shape: diamond
   Uses colors: true
   Data bits length: 40 (expected 40)
   Decoded text length: 5
   Decoded text preview: Hello
   ```

### Step 4: Check for Errors
If you see errors like:
```
[ERROR: Invalid length 0]
[ERROR: Invalid length 65535]
```

This means the length header wasn't decoded correctly. Check:
1. Are the first 48 bits being read?
2. Are they all the same value (redundancy)?
3. Is the binary string long enough?

## Common Issues & Solutions

### Issue 1: "Invalid length 0"
**Cause**: Length header not being read correctly
**Solution**: 
- Check if binary string is long enough (should be > 100 bits)
- Verify first 48 bits are being extracted
- Check console for "Length candidates"

### Issue 2: "Invalid length 65535"
**Cause**: Binary string is all 1s (white image)
**Solution**:
- Check if code is being drawn (should see black center circle)
- Verify canvas is rendering
- Check if shapes are visible

### Issue 3: Decoded text is garbage
**Cause**: Color detection not working
**Solution**:
- Disable RGB colors (toggle off)
- Try with black/white only first
- Check if colors are being drawn correctly

### Issue 4: Decoded text is empty
**Cause**: Data bits not being extracted
**Solution**:
- Check "Data bits length" in console
- Should match "expected" value
- If not, length header is wrong

## Testing Strategy

### Test 1: Simple Black/White (No Colors)
```
1. Uncheck "RGB Color Encoding"
2. Enter: "Hi"
3. Click "Test Decode"
4. Should decode perfectly
```

### Test 2: With RGB Colors
```
1. Check "RGB Color Encoding"
2. Enter: "Hi"
3. Click "Test Decode"
4. Should decode perfectly
```

### Test 3: Longer Text
```
1. Check both options
2. Enter: "Hello World! This is a test."
3. Click "Test Decode"
4. Should decode perfectly
```

### Test 4: Upload Image
```
1. Generate a code
2. Download it
3. Upload the image
4. Should decode automatically
```

## Console Output Interpretation

### Encoding Output
```
=== ENCODING ===
Text: Hello                          ← Your input text
Colors: RGB                          ← Color mode
Byte length: 5                       ← Compressed size
Total bits: 123                      ← Total bits to encode
Encoded successfully                 ← Success indicator
```

### Decoding Output
```
=== DECODING ===
Image size: 2000 x 2000             ← Image dimensions
Scale: 1.00                         ← Scaling factor
Ring width: 16.00                   ← Ring spacing
Total bits decoded: 123             ← Bits extracted
Length candidates: 5 5 5            ← Redundant headers (should match)
Decoded byte length: 5              ← Extracted length
Scan count: 0                       ← Scan counter
Shape: diamond                      ← Shape type
Uses colors: true                   ← Color mode
Data bits length: 40 (expected 40)  ← Data extraction check
Decoded text length: 5              ← Final text length
Decoded text preview: Hello         ← Decoded text
```

## Key Metrics to Check

### 1. Binary Length
- Should be: `48 (length) + 8 (scan) + 3 (shape) + 2 (features) + data`
- Example: `48 + 8 + 3 + 2 + 40 = 101 bits` for "Hello"

### 2. Length Redundancy
- All three 16-bit values should match
- If they don't, majority voting picks the most common

### 3. Data Bits
- Should be exactly: `byteLength * 8`
- Example: `5 bytes * 8 = 40 bits`

### 4. Decoded Text
- Should match original input exactly
- If not, there's a decoding error

## Advanced Debugging

### Enable Detailed Logging
Add this to the console:
```javascript
// Check first 100 bits
console.log('First 100 bits:', binary.substring(0, 100));

// Check metadata
console.log('Length bits:', binary.substring(0, 48));
console.log('Scan bits:', binary.substring(48, 56));
console.log('Shape bits:', binary.substring(56, 59));
console.log('Feature bits:', binary.substring(59, 61));

// Check data
console.log('Data bits:', binary.substring(61, 61 + 40));
```

### Verify Color Detection
```javascript
// In decoding, check color values
console.log('Color value:', colorValue); // Should be 0-7
console.log('RGB:', avgR, avgG, avgB);  // Should show color channels
```

### Check Shape Sampling
```javascript
// Verify shape positions
console.log('Ring:', ring);
console.log('Radius:', r);
console.log('Shapes in ring:', numShapes);
console.log('Shape position:', x, y);
```

## Expected Results

### For "Hello" (5 bytes)
```
Encoding:
- Byte length: 5
- Binary length: 48 + 8 + 3 + 2 + 40 = 101 bits
- Shapes needed: 101 / 3 = 34 shapes (with RGB)

Decoding:
- Should extract exactly 101 bits
- Length header: 5 5 5 (all match)
- Data bits: 40 bits
- Decoded: "Hello"
```

### For "Hello World!" (12 bytes)
```
Encoding:
- Byte length: 12
- Binary length: 48 + 8 + 3 + 2 + 96 = 157 bits
- Shapes needed: 157 / 3 = 53 shapes (with RGB)

Decoding:
- Should extract exactly 157 bits
- Length header: 12 12 12 (all match)
- Data bits: 96 bits
- Decoded: "Hello World!"
```

## If Still Not Working

1. **Check the console logs** - they tell you exactly what's happening
2. **Try black/white first** - disable RGB colors
3. **Use short text** - "Hi" or "Test"
4. **Check image rendering** - can you see the code?
5. **Verify canvas size** - should be 2000×2000

## Next Steps

Once decoding works:
1. Test with longer text
2. Test with special characters
3. Test with different languages
4. Test with RGB colors enabled
5. Test with multi-layer encoding

---

**The key is to watch the console logs. They show exactly what's being encoded and decoded.**
