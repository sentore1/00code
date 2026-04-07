import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Alert, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const openWebScanner = async () => {
    const url = 'https://sentore1.github.io/00code/';
    
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open browser. Please visit: https://sentore1.github.io/00code/');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open web scanner');
    }
  };

  const showInstructions = () => {
    Alert.alert(
      'How to Scan',
      '1. Tap "Open Web Scanner"\n2. Allow camera access in browser\n3. Point at ShotCode\n4. Hold steady until decoded\n\nTips:\n• Good lighting\n• Hold phone steady\n• Center the code\n• Keep code flat',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>ShotCode Scanner</Text>
        <Text style={styles.subtitle}>Ultra High Capacity Barcode</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Scan ShotCodes</Text>
          <Text style={styles.cardText}>
            This app opens the web scanner which provides full camera support and can decode codes with up to 12,000 characters.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={openWebScanner}>
          <Text style={styles.buttonIcon}>🌐</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Open Web Scanner</Text>
            <Text style={styles.buttonSubtext}>Recommended</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={showInstructions}>
          <Text style={styles.buttonIcon}>ℹ️</Text>
          <Text style={styles.buttonText}>How to Scan</Text>
        </TouchableOpacity>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>✨ Features</Text>
          <View style={styles.featuresList}>
            <Text style={styles.featureItem}>• Scan codes up to 12,000 characters</Text>
            <Text style={styles.featureItem}>• Real-time camera scanning</Text>
            <Text style={styles.featureItem}>• Error correction built-in</Text>
            <Text style={styles.featureItem}>• Upload images from gallery</Text>
            <Text style={styles.featureItem}>• Download codes as PNG</Text>
            <Text style={styles.featureItem}>• Works with printed or screen codes</Text>
          </View>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>💡 Scanning Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>✓ Ensure good lighting</Text>
            <Text style={styles.tipItem}>✓ Hold phone steady</Text>
            <Text style={styles.tipItem}>✓ Center code in frame</Text>
            <Text style={styles.tipItem}>✓ Keep code flat (not curved)</Text>
            <Text style={styles.tipItem}>✓ Try different distances</Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>About ShotCode</Text>
          <Text style={styles.infoText}>
            ShotCode is a circular barcode system that can store much more data than traditional QR codes. It uses 240 concentric rings with 360 segments each, providing ultra-high capacity storage.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ShotCode V2</Text>
        <Text style={styles.footerSubtext}>240 rings × 360 segments = 86,400 bits</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#3b82f6',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  secondaryButton: {
    backgroundColor: '#334155',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  buttonContent: {
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonSubtext: {
    color: '#93c5fd',
    fontSize: 12,
    marginTop: 2,
  },
  features: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  tips: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    marginBottom: 15,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 12,
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  info: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerSubtext: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
});
