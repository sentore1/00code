/// Extracts structured data from binary bits
/// 
/// Converts raw binary data into structured chunks:
/// - Metadata (scan tracking, device info)
/// - Formulas (executable logic)
/// - State (current values)
/// - Data (primary dataset)
/// - Evolution (predictions)
/// - History (scan log)
class ChunkExtractor {
  /// Parse metadata bits into structured data
  /// 
  /// Metadata structure (368 bits):
  /// - Version (8 bits)
  /// - Type (8 bits)
  /// - Scan counter (16 bits)
  /// - Last scan time (32 bits)
  /// - Device ID (64 bits)
  /// - Location (64 bits)
  /// - History index (32 bits)
  /// - Checksum (16 bits)
  /// - Reserved (128 bits)
  Map<String, dynamic> extractMetadata(List<int> bits) {
    if (bits.length < 48) {
      return {'error': 'Not enough bits for metadata'};
    }

    return {
      'version': _bitsToInt(bits.sublist(0, 8)),
      'type': _bitsToInt(bits.sublist(8, 16)),
      'scanCounter': _bitsToInt(bits.sublist(16, 32)),
      'lastScanTime': _bitsToInt(bits.sublist(32, 64)),
      'deviceId': _bitsToInt(bits.sublist(64, 128)),
      'location': _bitsToInt(bits.sublist(128, 192)),
      'historyIndex': _bitsToInt(bits.sublist(192, 224)),
      'checksum': _bitsToInt(bits.sublist(224, 240)),
    };
  }

  /// Parse formula bits into structured data
  /// 
  /// Formula structure (576 bits):
  /// - Yield prediction (64 bits)
  /// - Cost analysis (64 bits)
  /// - Profit simulation (64 bits)
  /// - Route optimization (64 bits)
  /// - Inventory balance (64 bits)
  /// - Time estimation (64 bits)
  /// - Sales forecast (64 bits)
  /// - Pricing strategy (64 bits)
  /// - Demand analysis (64 bits)
  Map<String, dynamic> extractFormulas(List<int> bits) {
    if (bits.length < 576) {
      return {'error': 'Not enough bits for formulas'};
    }

    return {
      'yieldPrediction': _bitsToInt(bits.sublist(0, 64)),
      'costAnalysis': _bitsToInt(bits.sublist(64, 128)),
      'profitSimulation': _bitsToInt(bits.sublist(128, 192)),
      'routeOptimization': _bitsToInt(bits.sublist(192, 256)),
      'inventoryBalance': _bitsToInt(bits.sublist(256, 320)),
      'timeEstimation': _bitsToInt(bits.sublist(320, 384)),
      'salesForecast': _bitsToInt(bits.sublist(384, 448)),
      'pricingStrategy': _bitsToInt(bits.sublist(448, 512)),
      'demandAnalysis': _bitsToInt(bits.sublist(512, 576)),
    };
  }

  /// Parse state bits into structured data
  /// 
  /// State structure (200 bits):
  /// - Value 1 (32 bits)
  /// - Value 2 (32 bits)
  /// - Value 3 (32 bits)
  /// - Context flags (24 bits)
  /// - Confidence (16 bits)
  /// - Last update (32 bits)
  /// - State hash (32 bits)
  Map<String, dynamic> extractState(List<int> bits) {
    if (bits.length < 200) {
      return {'error': 'Not enough bits for state'};
    }

    return {
      'value1': _bitsToInt(bits.sublist(0, 32)),
      'value2': _bitsToInt(bits.sublist(32, 64)),
      'value3': _bitsToInt(bits.sublist(64, 96)),
      'contextFlag1': _bitsToInt(bits.sublist(96, 104)),
      'contextFlag2': _bitsToInt(bits.sublist(104, 112)),
      'contextFlag3': _bitsToInt(bits.sublist(112, 120)),
      'confidence': _bitsToInt(bits.sublist(120, 136)),
      'lastUpdate': _bitsToInt(bits.sublist(136, 168)),
      'stateHash': _bitsToInt(bits.sublist(168, 200)),
    };
  }

  /// Parse evolution bits into structured data
  /// 
  /// Evolution structure (288 bits):
  /// - Next hour prediction (32 bits)
  /// - Next day prediction (32 bits)
  /// - Next week prediction (32 bits)
  /// - Mutation 1 (32 bits)
  /// - Mutation 2 (32 bits)
  /// - Mutation 3 (32 bits)
  /// - Confidence 1 (16 bits)
  /// - Confidence 2 (16 bits)
  /// - Reserved (64 bits)
  Map<String, dynamic> extractEvolution(List<int> bits) {
    if (bits.length < 288) {
      return {'error': 'Not enough bits for evolution'};
    }

    return {
      'nextHourPrediction': _bitsToInt(bits.sublist(0, 32)),
      'nextDayPrediction': _bitsToInt(bits.sublist(32, 64)),
      'nextWeekPrediction': _bitsToInt(bits.sublist(64, 96)),
      'mutation1': _bitsToInt(bits.sublist(96, 128)),
      'mutation2': _bitsToInt(bits.sublist(128, 160)),
      'mutation3': _bitsToInt(bits.sublist(160, 192)),
      'confidence1': _bitsToInt(bits.sublist(192, 208)),
      'confidence2': _bitsToInt(bits.sublist(208, 224)),
    };
  }

  /// Convert bit list to integer
  /// 
  /// Reads bits from left to right, treating as big-endian binary
  /// Example: [0,1,0,0,1,0,0,1] = 73
  int _bitsToInt(List<int> bits) {
    int value = 0;
    for (int i = 0; i < bits.length; i++) {
      value = (value << 1) | bits[i];
    }
    return value;
  }
}
