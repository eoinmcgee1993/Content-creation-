import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Modal, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { PATTAYA_REGION, DUMMY_PATTAYA_PINS, MissionPin, pinColor } from '../services/maps';
import { MissionCard } from '../components/MissionCard';

export function MapScreen() {
  const [selectedPin, setSelectedPin] = useState<MissionPin | null>(null);
  const pins = DUMMY_PATTAYA_PINS;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SOI DOG PRO</Text>
        <Text style={styles.subtitle}>Pattaya Mission Grid</Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={PATTAYA_REGION}
        mapType="standard"
        userInterfaceStyle="dark"
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={pin.coordinate}
            pinColor={pinColor(pin.status)}
            onPress={() => setSelectedPin(pin)}
          >
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{pin.title}</Text>
                <Text style={styles.calloutPct}>
                  {Math.round(pin.progress * 100)}% funded
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Bottom sheet for selected mission */}
      <Modal
        visible={!!selectedPin}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPin(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedPin(null)}
        />
        {selectedPin && (
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Mission Detail</Text>
            <MissionCard pin={selectedPin} />
            <TouchableOpacity
              style={styles.donateBtn}
              onPress={() => setSelectedPin(null)}
            >
              <Text style={styles.donateBtnText}>Donate to This Mission</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0a0a0a',
  },
  title: { color: '#00e5ff', fontSize: 20, fontWeight: '800', letterSpacing: 1.5 },
  subtitle: { color: '#666', fontSize: 12, marginTop: 2 },
  map: { flex: 1 },
  callout: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#00e5ff',
    minWidth: 140,
  },
  calloutTitle: { color: '#fff', fontSize: 13, fontWeight: '600' },
  calloutPct: { color: '#00e5ff', fontSize: 12, marginTop: 4 },
  modalBackdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: '#222',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { color: '#666', fontSize: 12, marginBottom: 8, letterSpacing: 1 },
  donateBtn: {
    backgroundColor: '#00e5ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  donateBtnText: { color: '#0a0a0a', fontWeight: '700', fontSize: 16 },
});
