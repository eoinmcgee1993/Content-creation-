import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';

type Props = {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function CaptureButton({ onPress, loading = false, disabled = false }: Props) {
  return (
    <TouchableOpacity
      style={[styles.outer, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color="#0a0a0a" size="small" />
        ) : (
          <View style={styles.dot} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  inner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0a0a0a',
  },
  disabled: {
    opacity: 0.4,
  },
});
