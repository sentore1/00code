import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [decodedText, setDecodedText] = useState('');

  const openWebScanner = async () => {
    const url = 'https://sentore1.github.io/00code/'; // Your GitHub Pages URL
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open web scanner');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      Alert.alert('Info', 'For best results, use the web scanner at https://sentore1.github.io/00code/');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>ShotCode Scanner</Text>
        <Text style={styles.subtitle}>Scan codes with up to 12,000 characters</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.infoText}>
          This app uses your device camera to scan ShotCodes.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={openWebScanner}>
          <Text style={styles.buttonText}>🌐 Open Web Scanner</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>or</Text>

        <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
          <Text style={styles.buttonText}>📁 Choose from Gallery</Text>
        </TouchableOpacity>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>How to scan:</Text>
          <Text style={styles.instructionText}>1. Tap "Open Web Scanner"</Text>
          <Text style={styles.instructionText}>2. Allow camera access</Text>
          <Text style={styles.instructionText}>3. Point at ShotCode</Text>
          <Text style={styles.instructionText}>4. Hold steady until decoded</Text>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>💡 Tips for best results:</Text>
          <Text style={styles.tipText}>• Ensure good lighting</Text>
          <Text style={styles.tipText}>• Hold phone steady</Text>
          <Text style={styles.tipText}>• Center the code in frame</Text>
          <Text style={styles.tipText}>• Keep code flat (not curved)</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ShotCode V2 • Ultra High Capacity</Text>
        <Text style={styles.footerSubtext}>Supports up to 12,000+ characters</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  secondaryButton: {
    backgroundColor: '#4b5563',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  orText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginVertical: 10,
  },
  instructions: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 15,
    color: '#ccc',
    marginBottom: 8,
    paddingLeft: 10,
  },
  tips: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 6,
    paddingLeft: 10,
  },
  footer: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    color: '#999',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
});
