/// Represents a single scan record
/// 
/// Stores all information about a scan including:
/// - Metadata (scan number, timestamp, device)
/// - Execution results (formulas executed, results)
/// - AI insights (patterns, suggestions, predictions)
class ScanRecord {
  final String id;
  final int scanNumber;
  final DateTime timestamp;
  final String deviceId;
  final Map<String, dynamic> metadata;
  final Map<String, dynamic> execution;
  final Map<String, dynamic> aiInsights;
  final String? decision;
  final Map<String, dynamic>? outcome;
  final DateTime? outcomeTime;

  ScanRecord({
    required this.id,
    required this.scanNumber,
    required this.timestamp,
    required this.deviceId,
    required this.metadata,
    required this.execution,
    required this.aiInsights,
    this.decision,
    this.outcome,
    this.outcomeTime,
  });

  /// Convert to JSON for database storage
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'scanNumber': scanNumber,
      'timestamp': timestamp.toIso8601String(),
      'deviceId': deviceId,
      'metadata': metadata,
      'execution': execution,
      'aiInsights': aiInsights,
      'decision': decision,
      'outcome': outcome,
      'outcomeTime': outcomeTime?.toIso8601String(),
    };
  }

  /// Create from JSON
  factory ScanRecord.fromJson(Map<String, dynamic> json) {
    return ScanRecord(
      id: json['id'],
      scanNumber: json['scanNumber'],
      timestamp: DateTime.parse(json['timestamp']),
      deviceId: json['deviceId'],
      metadata: json['metadata'],
      execution: json['execution'],
      aiInsights: json['aiInsights'],
      decision: json['decision'],
      outcome: json['outcome'],
      outcomeTime: json['outcomeTime'] != null 
        ? DateTime.parse(json['outcomeTime']) 
        : null,
    );
  }
}
