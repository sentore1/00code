import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'dart:convert';

/// SQLite database helper for storing scan records and history
/// 
/// Manages:
/// - Scan records (metadata, execution, insights)
/// - State history (how data evolves over time)
/// - Insights (AI-generated patterns and suggestions)
class DatabaseHelper {
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  static Database? _database;

  factory DatabaseHelper() {
    return _instance;
  }

  DatabaseHelper._internal();

  /// Get database instance (lazy initialization)
  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }

  /// Initialize database and create tables
  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'morphing_code.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createTables,
    );
  }

  /// Create all database tables
  Future<void> _createTables(Database db, int version) async {
    // Scans table - stores all scan records
    await db.execute('''
      CREATE TABLE scans (
        id TEXT PRIMARY KEY,
        scanNumber INTEGER,
        timestamp TEXT,
        deviceId TEXT,
        metadata TEXT,
        execution TEXT,
        aiInsights TEXT,
        decision TEXT,
        outcome TEXT,
        outcomeTime TEXT
      )
    ''');

    // State history table - tracks how state evolves
    await db.execute('''
      CREATE TABLE state_history (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        state TEXT,
        mutation TEXT,
        evolution TEXT
      )
    ''');

    // Insights table - stores AI-generated insights
    await db.execute('''
      CREATE TABLE insights (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        patterns TEXT,
        suggestions TEXT,
        insights TEXT,
        predictions TEXT
      )
    ''');

    print('Database tables created successfully');
  }

  /// Insert a scan record
  Future<void> insertScan(Map<String, dynamic> scan) async {
    final db = await database;
    
    // Convert maps to JSON strings for storage
    final scanData = {
      ...scan,
      'metadata': jsonEncode(scan['metadata'] ?? {}),
      'execution': jsonEncode(scan['execution'] ?? {}),
      'aiInsights': jsonEncode(scan['aiInsights'] ?? {}),
      'outcome': scan['outcome'] != null ? jsonEncode(scan['outcome']) : null,
    };
    
    await db.insert('scans', scanData);
    print('Scan inserted: ${scan['scanNumber']}');
  }

  /// Get all scans ordered by timestamp (newest first)
  Future<List<Map<String, dynamic>>> getAllScans() async {
    final db = await database;
    final result = await db.query(
      'scans',
      orderBy: 'timestamp DESC',
    );
    
    // Parse JSON strings back to maps
    return result.map((scan) {
      return {
        ...scan,
        'metadata': jsonDecode(scan['metadata'] as String? ?? '{}'),
        'execution': jsonDecode(scan['execution'] as String? ?? '{}'),
        'aiInsights': jsonDecode(scan['aiInsights'] as String? ?? '{}'),
        'outcome': scan['outcome'] != null 
          ? jsonDecode(scan['outcome'] as String) 
          : null,
      };
    }).toList();
  }

  /// Get latest scan
  Future<Map<String, dynamic>?> getLatestScan() async {
    final db = await database;
    final result = await db.query(
      'scans',
      orderBy: 'timestamp DESC',
      limit: 1,
    );
    
    if (result.isEmpty) return null;
    
    final scan = result.first;
    return {
      ...scan,
      'metadata': jsonDecode(scan['metadata'] as String? ?? '{}'),
      'execution': jsonDecode(scan['execution'] as String? ?? '{}'),
      'aiInsights': jsonDecode(scan['aiInsights'] as String? ?? '{}'),
      'outcome': scan['outcome'] != null 
        ? jsonDecode(scan['outcome'] as String) 
        : null,
    };
  }

  /// Insert state record
  Future<void> insertState(Map<String, dynamic> state) async {
    final db = await database;
    
    final stateData = {
      ...state,
      'state': jsonEncode(state['state'] ?? {}),
      'mutation': jsonEncode(state['mutation'] ?? {}),
      'evolution': jsonEncode(state['evolution'] ?? {}),
    };
    
    await db.insert('state_history', stateData);
  }

  /// Get state history
  Future<List<Map<String, dynamic>>> getStateHistory() async {
    final db = await database;
    final result = await db.query(
      'state_history',
      orderBy: 'timestamp DESC',
    );
    
    return result.map((record) {
      return {
        ...record,
        'state': jsonDecode(record['state'] as String? ?? '{}'),
        'mutation': jsonDecode(record['mutation'] as String? ?? '{}'),
        'evolution': jsonDecode(record['evolution'] as String? ?? '{}'),
      };
    }).toList();
  }

  /// Insert insight record
  Future<void> insertInsight(Map<String, dynamic> insight) async {
    final db = await database;
    
    final insightData = {
      ...insight,
      'patterns': jsonEncode(insight['patterns'] ?? []),
      'suggestions': jsonEncode(insight['suggestions'] ?? []),
      'insights': jsonEncode(insight['insights'] ?? []),
      'predictions': jsonEncode(insight['predictions'] ?? []),
    };
    
    await db.insert('insights', insightData);
  }

  /// Get all insights
  Future<List<Map<String, dynamic>>> getAllInsights() async {
    final db = await database;
    final result = await db.query(
      'insights',
      orderBy: 'timestamp DESC',
    );
    
    return result.map((record) {
      return {
        ...record,
        'patterns': jsonDecode(record['patterns'] as String? ?? '[]'),
        'suggestions': jsonDecode(record['suggestions'] as String? ?? '[]'),
        'insights': jsonDecode(record['insights'] as String? ?? '[]'),
        'predictions': jsonDecode(record['predictions'] as String? ?? '[]'),
      };
    }).toList();
  }

  /// Get scan count
  Future<int> getScanCount() async {
    final db = await database;
    final result = await db.rawQuery('SELECT COUNT(*) as count FROM scans');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  /// Clear all data (for testing)
  Future<void> clearAll() async {
    final db = await database;
    await db.delete('scans');
    await db.delete('state_history');
    await db.delete('insights');
    print('Database cleared');
  }
}
