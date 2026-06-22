import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MissionPin } from '../services/maps';
import { pinColor } from '../services/maps';

type Props = {
  pin: MissionPin;
  onPress?: () => void;
};

export function MissionCard({ pin, onPress }: Props) {
  const pct = Math.round(pin.progress * 100);
  const color = pinColor(pin.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={styles.title} numberOfLines={1}>
          {pin.title}
        </Text>
        <Text style={[styles.pct, { color }]}>{pct}%</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>

      <Text style={styles.status}>
        {pin.status.charAt(0).toUpperCase() + pin.status.slice(1)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#222',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  pct: {
    fontSize: 14,
    fontWeight: '700',
  },
  track: {
    height: 6,
    backgroundColor: '#222',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  status: {
    color: '#666',
    fontSize: 12,
  },
});
