import 'package:flutter/material.dart';
import 'screens/scanner_screen.dart';
import 'screens/results_screen.dart';
import 'screens/history_screen.dart';
import 'screens/insights_screen.dart';

void main() {
  runApp(const MorphingCodeApp());
}

/// Main application widget
/// 
/// Provides the root MaterialApp with navigation between 4 screens:
/// 1. Scanner - Scan morphing codes with camera
/// 2. Results - View latest scan results
/// 3. History - View all previous scans
/// 4. Insights - View AI-generated insights
class MorphingCodeApp extends StatelessWidget {
  const MorphingCodeApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Morphing Code Scanner',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
        brightness: Brightness.dark,
      ),
      home: const MainScreen(),
    );
  }
}

/// Main screen with bottom navigation
/// 
/// Manages navigation between 4 screens using BottomNavigationBar
class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const ScannerScreen(),
    const ResultsScreen(),
    const HistoryScreen(),
    const InsightsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Morphing Code Scanner'),
        elevation: 0,
        centerTitle: true,
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.camera),
            label: 'Scan',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assessment),
            label: 'Results',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'History',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.lightbulb),
            label: 'Insights',
          ),
        ],
      ),
    );
  }
}
