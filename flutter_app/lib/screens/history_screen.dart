import 'package:flutter/material.dart';
import '../database/database_helper.dart';

/// History Screen
/// 
/// Displays:
/// - All previous scans
/// - Scan timeline
/// - Scan details
class HistoryScreen extends StatefulWidget {
  const HistoryScreen({Key? key}) : super(key: key);

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  late Future<List<Map<String, dynamic>>> _scansFuture;

  @override
  void initState() {
    super.initState();
    _scansFuture = DatabaseHelper().getAllScans();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _scansFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.history, size: 64, color: Colors.grey),
                SizedBox(height: 20),
                Text('No scan history yet'),
              ],
            ),
          );
        }

        final scans = snapshot.data!;

        return ListView.builder(
          itemCount: scans.length,
          itemBuilder: (context, index) {
            final scan = scans[index];
            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: ListTile(
                leading: const Icon(Icons.qr_code_2),
                title: Text('Scan #${scan['scanNumber']}'),
                subtitle: Text(scan['timestamp'] ?? ''),
                trailing: const Icon(Icons.arrow_forward),
                onTap: () {
                  _showScanDetails(context, scan);
                },
              ),
            );
          },
        );
      },
    );
  }

  /// Show scan details in a dialog
  void _showScanDetails(BuildContext context, Map<String, dynamic> scan) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Scan #${scan['scanNumber']}'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Time: ${scan['timestamp']}'),
              const SizedBox(height: 16),
              const Text(
                'Execution Results:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              for (final entry in (scan['execution'] as Map? ?? {}).entries)
                Text('${entry.key}: ${entry.value}'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
