import 'package:flutter/material.dart';
import '../database/database_helper.dart';

/// Insights Screen
/// 
/// Displays:
/// - AI-generated insights
/// - Patterns identified
/// - Suggestions
/// - Predictions
class InsightsScreen extends StatefulWidget {
  const InsightsScreen({Key? key}) : super(key: key);

  @override
  State<InsightsScreen> createState() => _InsightsScreenState();
}

class _InsightsScreenState extends State<InsightsScreen> {
  late Future<List<Map<String, dynamic>>> _insightsFuture;

  @override
  void initState() {
    super.initState();
    _insightsFuture = DatabaseHelper().getAllInsights();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _insightsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lightbulb, size: 64, color: Colors.grey),
                SizedBox(height: 20),
                Text('No insights yet'),
                SizedBox(height: 10),
                Text(
                  'Insights will appear after scanning codes',
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
          );
        }

        final insights = snapshot.data!;

        return ListView.builder(
          itemCount: insights.length,
          itemBuilder: (context, index) {
            final insight = insights[index];
            final suggestions = insight['suggestions'] as List? ?? [];

            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Insights from ${insight['timestamp']}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (suggestions.isNotEmpty) ...[
                      const Text(
                        'Suggestions:',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      for (final suggestion in suggestions)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle,
                                  size: 16, color: Colors.green),
                              const SizedBox(width: 8),
                              Expanded(child: Text(suggestion.toString())),
                            ],
                          ),
                        ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
