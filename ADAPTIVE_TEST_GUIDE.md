# Adaptive ShotCode Testing Guide

## How to Test Encoding/Decoding

### Step 1: Encode a Test Message
1. Open the Adaptive ShotCode page
2. Type a simple test message: `Hello World!`
3. Click "Generate Code"
4. You should see a circular code appear

### Step 2: Test Decode (Same Page)
1. Click the "Test Decode" button
2. Open browser console (F12) to see detailed logs
3. You should see:
   - Which density is being tried
   - Success message with "✓✓✓ PERFECT MATCH"
   - Confidence score
   - Match confirmation

### Step 3: Test with Downloaded Image
1. Click "Download" to save the code as PNG
2. Switch to "Decode Image" tab
3. Click "Upload Image" and select the downloaded PNG
4. You should see the decoded message

## Common Issues

### Issue: "Could not decode - no density level matched"
**Causes:**
- Trying to decode a non-ShotCode image
- Image quality too low
- Wrong image format

**Solution:**
- Make sure you're uploading an actual Adaptive ShotCode image
- Use the "Test Decode" button first to verify encoding works
- Check console logs for specific errors

### Issue: Density index mismatch
**Causes:**
- Image was resized or compressed
- Image was screenshot instead of original
- Encoding/decoding logic mismatch

**Solution:**
- Use original PNG file, not screenshots
- Don't resize or compress the image
- Use "Download" button to get original file

## Console Log Interpretation

### Good decode:
```
--- Trying Tiny (index 0) ---
Configuration: 60 rings × 90 segments
Header density index: 0
Text length: 12
Confidence: 98.5%
✓✓✓ PERFECT MATCH! Density index matches.
```

### Failed decode:
```
--- Trying Tiny (index 0) ---
✗ Error: Invalid text length: 45678
```

## Testing Different Densities

1. **Tiny (675B)**: Type 10-50 characters
2. **Small (2700B)**: Type 100-500 characters  
3. **Medium (6075B)**: Type 1000-2000 characters
4. **Large (10800B)**: Type 3000-5000 characters
5. **Huge (16875B)**: Type 8000+ characters

## Manual Density Selection

You can manually select a density by clicking the capacity buttons:
- Click "Tiny", "Small", "Medium", "Large", or "Huge"
- The selected density will be highlighted
- Generate code with that specific density
- Useful for testing specific configurations
