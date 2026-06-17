# Length Header Corruption - Debug Guide

## Your Error

```
[ERROR: Insufficient data bits - need 229691, have 98100]
```

### What This Means

- **Decoder claims data needs**: 229,691 bits (28,711 bytes!)
- **Actually available**: 98,100 bits (12,262 bytes)
- **Problem**: The length header (first 48 bits) is being decoded incorrectly

### Why 229,691 is Impossible

With 150 rings and ~12,200 total shapes:
- **Maximum capacity**: ~12,200 bits
- **Maximum data bits**: 12,200 - 59 (header) = 12,141 bits
- **Maximum bytes**: 12,141 / 8 = 1,517 bytes

**229,691 bits would need**: 229,691 / 8 = **28,711 bytes** (19× more than capacity!)

## Root Cause Analysis

### Theory 1: Bit Inversion (Most Likely)
The decoder is reading **inverted bits** - black as white, white as black.

**Example:**
```
Encoded:  000000101010 (length = 42 bytes)
Decoded:  111111010101 (inverted)
         = 65,365 (garbage!)
```

### Theory 2: Threshold Too High/Low
The brightness threshold is wrong, causing random bit flips.

**Example:**
```
True black: 25  (but threshold = 200)
Read as: WHITE ❌ (because 25 < 200 is false)
```

### Theory 3: Wrong Sampling Location
Reading pixels from wrong part of image (outside data rings).

## Diagnostic Steps

### Step 1: Check Encoding Console

When you **generated** the code, what did the console say?

Look for:
```
=== ENCODING ===
Text: [your text]
Byte length: ???  ← What's this number?
Total capacity: ???  ← And this?
First 100 bits: 000000101010...  ← Copy this!
```

**Share these values!**

### Step 2: Check Decoding Console

When you **decoded** the image, what did it say?

Look for:
```
=== DECODING ===
Black avg: ???  ← What's this?
White avg: ???  ← And this?
Threshold: ???
First 100 bits: ???  ← Copy this!
```

**Key question**: Do the "First 100 bits" match between encoding and decoding?

### Step 3: Compare First 48 Bits

**Encoding (what was written):**
```
First 48 bits: 000000101010000000101010000000101010
               ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
               Length copy 1    Length copy 2    Length copy 3
```

**Decoding (what was read):**
```
First 48 bits: ????????????????????????????????????????????
```

**Are they the same?** If not, the bits are being read incorrectly.

### Step 4: Check Threshold Values

**Expected ranges:**
- Black average: 20-50 (dark)
- White average: 200-250 (bright)
- Contrast: 150-230 (high contrast)
- Threshold: 110-150 (middle)

**Your values:**
- Black avg: ??? ← Fill this in
- White avg: ??? ← Fill this in
- Contrast: ??? ← Fill this in
- Threshold: ??? ← Fill this in

**Check these:**
- ❌ If black > white: Bits are inverted!
- ❌ If contrast < 50: Image quality too low
- ❌ If threshold < 100 or > 200: Threshold calculation wrong

## Fixes Applied

### Fix 1: Auto-Detect Bit Inversion
```javascript
if (avgBlack > avgWhite) {
  console.warn('⚠️ BLACK AND WHITE APPEAR INVERTED!');
  // Swap them
  const temp = avgBlack;
  avgBlack = avgWhite;
  avgWhite = temp;
}
```

**This will auto-correct if bits are being read backwards.**

### Fix 2: Fallback Length
```javascript
// Calculate maximum possible bytes
const maxPossibleBytes = Math.floor((binary.length - 59) / 8);

// If decoded length is impossible, use maximum instead
if (byteLength > maxPossibleBytes) {
  console.error('Length header corrupted!');
  byteLength = maxPossibleBytes;  // Use fallback
}
```

**This will try to decode as much as possible even if header is wrong.**

### Fix 3: Enhanced Logging
```javascript
console.log('First 48 bits (length header):', binary.substring(0, 48));
console.log('Length candidates (raw):', len1, len2, len3);
console.log('Maximum possible bytes:', maxPossibleBytes);
```

**This shows what's happening at each step.**

## How to Test

### Test 1: Re-generate and Decode
1. **Open browser console** (F12)
2. **Encode** a simple message: `"Test"`
3. **Copy the encoding console output** (especially "First 100 bits")
4. **Decode** the generated image
5. **Copy the decoding console output** (especially "First 100 bits")
6. **Compare them** - do they match?

### Test 2: Check for Warnings
Look for these in console:
```
⚠️ BLACK AND WHITE APPEAR INVERTED!
⚠️ LOW CONTRAST WARNING: 45
Length header claims 28711 bytes but only 1517 bytes possible!
```

**Any of these?** Share the message!

### Test 3: Manual Bit Check
From encoding console, get:
```
Byte length: 42
First 48 bits: 000000101010000000101010000000101010
```

From decoding console, get:
```
First 48 bits: ???
```

**Convert first 16 bits to decimal:**
```javascript
// In browser console
parseInt('0000001010100000', 2)  // Should equal byte length
```

**Does it match?**

## Expected Console Output (Good)

```
=== ENCODING ===
Byte length: 42
First 100 bits: 000000101010000000101010000000101010000110000110000101010...

=== DECODING ===
Black avg: 25.3
White avg: 247.8
Contrast: 222.5
Threshold: 136.6
First 48 bits (length header): 000000101010000000101010000000101010
Length candidates (raw): 42 42 42  ← All three match!
Decoded byte length (after voting): 42
Maximum possible bytes (from available bits): 1517
Required bits (header + data): 395
Available bits: 12234
✅ UTF-8 decode successful
```

## Your Console Output (Bad)

Please share:
```
=== ENCODING ===
Byte length: ???
First 100 bits: ???

=== DECODING ===
Black avg: ???
White avg: ???
Contrast: ???
Threshold: ???
First 48 bits (length header): ???
Length candidates (raw): ??? ??? ???
Decoded byte length (after voting): 229691 ← This is wrong!
Maximum possible bytes (from available bits): 98100
```

## Quick Diagnosis

### If you see:
```
Length candidates (raw): 229691 229691 229691
```
**Meaning**: All three copies decoded to same wrong value.
**Cause**: Systematic bit reading error (threshold, inversion, or sampling wrong)

### If you see:
```
Length candidates (raw): 42 229691 4983
```
**Meaning**: All three copies different!
**Cause**: Random bit errors, low quality image, or noise

### If you see:
```
Black avg: 200.5
White avg: 55.2
⚠️ BLACK AND WHITE APPEAR INVERTED!
```
**Meaning**: Bits are being read backwards
**Fix**: Applied automatically, should work now

### If you see:
```
Contrast: 23.5
⚠️ LOW CONTRAST WARNING
```
**Meaning**: Image too dark/light, or wrong image format
**Fix**: Re-generate with high quality PNG

## Possible Solutions

### Solution 1: Clear Image
1. Make sure you're decoding the **exact same image** you just generated
2. Don't screenshot, don't resize, don't compress
3. Use the **Download** button, then upload that exact file

### Solution 2: Regenerate Code
1. **Delete** the old generated image
2. **Clear browser cache** (Ctrl+Shift+Del)
3. **Reload page** (Ctrl+F5)
4. **Generate again** with simple text
5. **Try decoding immediately**

### Solution 3: Try Different Text
1. Start with: `"ABC"`
2. Encode and decode
3. If works, try longer text
4. Find where it breaks

### Solution 4: Check Image Format
1. Right-click generated image → "Save image as..."
2. **Must be PNG**, not JPEG or WEBP
3. If not PNG, the canvas export is wrong

## What to Share

To help debug, please share:

1. **Encoding console output** (complete)
2. **Decoding console output** (complete)
3. **Input text** you tried to encode
4. **Image format** (PNG? JPEG?)
5. **Image size** (should be 3000×3000)
6. **Browser and version** (Chrome 120? Firefox 121?)

With this info, I can pinpoint the exact issue!

---

**Most likely cause**: The decoder is reading inverted bits or using wrong threshold. The new auto-detection should fix this. Try again and share the new console output!
