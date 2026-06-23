import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { CaptureButton } from '../components/CaptureButton';
import { useClassifier } from '../hooks/useClassifier';

type ScanResult = {
  isDog: boolean;
  confidence: number;
  label: string;
} | null;

export function ScannerScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const { ready, loading: modelLoading, error: modelError, classifyImage } = useClassifier();

  function flashOverlay(isDog: boolean) {
    Animated.sequence([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }

  async function handleCapture() {
    if (!cameraRef.current || scanning || !ready) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo) throw new Error('No photo captured');

      const { isDog, confidence, topLabel } = await classifyImage(photo.uri);
      setResult({ isDog, confidence, label: topLabel });
      flashOverlay(isDog);

      if (!isDog) {
        Alert.alert(
          'Not a Dog',
          `Detected: "${topLabel}" (${Math.round(confidence * 100)}% confidence).\n\nPlease photograph a dog to log a mission.`,
          [{ text: 'Try Again' }]
        );
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permText}>Camera permission is required to scan dogs.</Text>
        <Text style={styles.permBtn} onPress={requestPermission}>
          Grant Permission
        </Text>
      </SafeAreaView>
    );
  }

  const overlayColor = result?.isDog ? 'rgba(0,200,83,0.3)' : 'rgba(255,0,0,0.3)';

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* AI status badge */}
        <View style={styles.badge}>
          <View style={[styles.badgeDot, { backgroundColor: ready ? '#FF6835' : '#888888' }]} />
          <Text style={styles.badgeText}>
            {modelLoading ? 'Loading AI…' : modelError ? 'AI Error' : 'AI Ready'}
          </Text>
        </View>

        {/* Scan frame corners */}
        <View style={styles.frameContainer}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Flash overlay on result */}
        <Animated.View
          style={[styles.flashOverlay, { opacity: overlayOpacity, backgroundColor: overlayColor }]}
          pointerEvents="none"
        />

        {/* Result label */}
        {result && (
          <View style={[styles.resultBanner, { borderColor: result.isDog ? '#00c853' : '#ff1744' }]}>
            <Text style={[styles.resultText, { color: result.isDog ? '#00c853' : '#ff1744' }]}>
              {result.isDog ? '✓ DOG VERIFIED' : '✗ NOT A DOG'}
            </Text>
            <Text style={styles.resultSub}>
              {result.label} · {Math.round(result.confidence * 100)}%
            </Text>
          </View>
        )}
      </CameraView>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <Text style={styles.instruction}>
          Point at a dog and capture to verify
        </Text>
        <CaptureButton
          onPress={handleCapture}
          loading={scanning}
          disabled={!ready || modelLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  camera: { flex: 1 },
  permText: { color: '#fff', textAlign: 'center', marginTop: 40, fontSize: 16 },
  permBtn: { color: '#FF6835', textAlign: 'center', marginTop: 20, fontSize: 16 },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 12 },
  frameContainer: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '30%',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FF6835',
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  flashOverlay: { ...StyleSheet.absoluteFillObject },
  resultBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  resultText: { fontSize: 18, fontWeight: '700' },
  resultSub: { color: '#aaa', fontSize: 12, marginTop: 4 },
  controls: {
    backgroundColor: '#0a0a0a',
    paddingVertical: 24,
    alignItems: 'center',
    gap: 16,
  },
  instruction: { color: '#666', fontSize: 13 },
});
