# Advanced Morphing Code - Decoding Flow Diagram

## Encoding Flow (What Gets Written)

```
Input Text: "Hi"
    ↓
UTF-8 Encode: [0x48, 0x69] = 2 bytes
    ↓
Create Metadata:
  - Byte Length: 2
  - Shape: diamond (0)
  - Scan Count: 0
    ↓
Build Binary String:
  [48 bits: length header with redundancy]
  [3 bits: shape type]
  [8 bits: scan count]
  [16 bits: data for "Hi"]
    ↓
Draw on Canvas:
  - 50 rings
  - ~360 segments per ring
  - Each segment = 1 bit (black or white shape)
    ↓
Output: PNG Image
```

## Detailed Bit Structure

```
Bit Positions:
┌─────────────────────────────────────────────────────────────┐
│ 0-15   │ 16-31  │ 32-47  │ 48-50 │ 51-58 │ 59+             │
├─────────────────────────────────────────────────────────────┤
│ Len 1  │ Len 2  │ Len 3  │ Shape │ Scan  │ Data            │
│ (16b)  │ (16b)  │ (16b)  │ (3b)  │ (8b)  │ (N×8 bits)      │
└─────────────────────────────────────────────────────────────┘

Example for "Hi" (2 bytes):
┌─────────────────────────────────────────────────────────────┐
│ 0000000000000010 │ 0000000000000010 │ 0000000000000010 │ 000 │ 00000000 │ 01001000 01101001 │
├─────────────────────────────────────────────────────────────┤
│ Length = 2      │ Length = 2      │ Length = 2      │ Dia │ Scan=0   │ H=0x48   I=0x69   │
└─────────────────────────────────────────────────────────────┘
```

## Decoding Flow (What Gets Read)

```
Input: PNG Image
    ↓
Extract Pixel Data
    ↓
Calculate Threshold:
  - Sample center (black): avg ~10
  - Sample outside (white): avg ~245
  - Threshold: (10 + 245) / 2 = 127.5
    ↓
Read Bits from Rings:
  For each ring (50 total):
    For each segment (~360 total):
      Sample 15×15 grid of pixels
      Count black vs white pixels
      If black > white: bit = '1'
      If white > black: bit = '0'
    ↓
Binary String: [18,059 bits total]
    ↓
Extract Length Header (bits 0-47):
  Read 3 copies: [len1, len2, len3]
  Majority voting: if 2+ match, use that value
  Result: 2 bytes
    ↓
Validate Length:
  If length > 5000 or length == 0: ERROR
  Otherwise: Continue
    ↓
Extract Metadata (bits 48-58):
  Shape bits (48-50): 000 = diamond
  Scan bits (51-58): 00000000 = 0
    ↓
Extract Data (bits 59-74):
  Read 2×8 = 16 bits
  Convert to bytes: [0x48, 0x69]
    ↓
UTF-8 Decode: [0x48, 0x69] = "Hi"
    ↓
Output: "Hi"
```

## Error Detection Points

```
┌─ Encoding ─────────────────────────────────────────────────┐
│                                                             │
│  Input Text → UTF-8 Encode → Binary String → Draw Shapes  │
│                                                             │
│  Validation:                                                │
│  ✓ Text length < 5000 chars                                │
│  ✓ UTF-8 bytes < 5000 bytes                                │
│  ✓ Binary length matches expected                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ Decoding ─────────────────────────────────────────────────┐
│                                                             │
│  Image → Extract Bits → Decode Length → Validate → Output │
│                              ↓                              │
│                         ERROR CHECK 1:                      │
│                    Length candidates match?                 │
│                    (11, 11, 11) ✓ or (57061, 12345, 9999) ✗│
│                              ↓                              │
│                         ERROR CHECK 2:                      │
│                    Length in valid range?                   │
│                    (0 < length ≤ 5000) ✓ or ✗              │
│                              ↓                              │
│                         ERROR CHECK 3:                      │
│                    Enough data bits?                        │
│                    (59 + length×8 ≤ total) ✓ or ✗          │
│                              ↓                              │
│                         ERROR CHECK 4:                      │
│                    Valid UTF-8?                             │
│                    (Decoder succeeds) ✓ or ✗               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Morphing Features

```
Scan 0:
  Shape: Diamond (000)
  Rotation: 0°
  Counter: 0
  ↓ (User scans code)
  
Scan 1:
  Shape: Triangle (001)
  Rotation: 45°
  Counter: 1
  ↓ (User scans code)
  
Scan 2:
  Shape: Hexagon (010)
  Rotation: 90°
  Counter: 2
  ↓ (User scans code)
  
Scan 3:
  Shape: Chevron (011)
  Rotation: 135°
  Counter: 3
  ↓ (User scans code)
  
Scan 4:
  Shape: Diamond (000) [cycles back]
  Rotation: 180°
  Counter: 4
```

## Console Output Example

```
=== ENCODING ===
Text: Hello World
Byte length: 11
Length bits (redundant): 000000000000101100000000000000101100000000000000101
Pattern bits: 000
Scan count bits: 00000000
Total bits: 18059
First 100 bits: 000000000000101100000000000000101100000000000000101000000000001001000001100101011...
Encoded successfully

=== DECODING ===
Image size: 2000 x 2000
Black avg: 10.5
White avg: 245.3
Threshold: 127.9
Decoding with:
- Rings: 50
- Inner radius: 150.0
- Outer radius: 950.0
- Ring width: 16.00
Total bits decoded: 18059
First 100 bits: 000000000000101100000000000000101100000000000000101000000000001001000001100101011...
Length candidates: 11, 11, 11
Decoded byte length: 11
Shape bits: 000 -> index: 0 -> shape: diamond
Scan count bits: 00000000 -> count: 0
Data bits length: 88 (expected 88)
Decoded text length: 11
Decoded text preview: Hello World
```

## Comparison: Before vs After Fix

### Before Fix (BROKEN)
```
Encoding:
  Byte length: 11 ✓
  Length bits: 000000000000101100000000000000101100000000000000101 ✓
  
Decoding:
  Read bits: 000000000000101100000000000000101100000000000000101... ✓
  Length candidates: 57061, 12345, 9999 ✗ CORRUPTED!
  Error: [ERROR: Invalid length 57061]
  
Result: FAIL ✗
```

### After Fix (WORKING)
```
Encoding:
  Byte length: 11 ✓
  Length bits: 000000000000101100000000000000101100000000000000101 ✓
  
Decoding:
  Read bits: 000000000000101100000000000000101100000000000000101... ✓
  Length candidates: 11, 11, 11 ✓ CORRECT!
  Decoded byte length: 11 ✓
  
Result: PASS ✓
```

## Key Insight

The fix ensures that:
1. **Encoding** writes the correct byte length in the first 48 bits
2. **Decoding** reads those same 48 bits correctly
3. **Majority voting** on the 3 redundant copies ensures accuracy
4. **Metadata extraction** happens at the correct bit positions (48-50 for shape, 51-58 for scan)
5. **Data extraction** starts at bit 59 with the correct byte length

This alignment between encoder and decoder is critical for reliable decoding.
