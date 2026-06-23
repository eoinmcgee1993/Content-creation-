import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from './src/services/stripe';
import { MapScreen } from './src/screens/MapScreen';
import { ScannerScreen } from './src/screens/Scanner';
import { MissionDashboard } from './src/screens/MissionDashboard';

type Tab = 'map' | 'scan' | 'missions';

export default function App() {
  const [tab, setTab] = useState<Tab>('map');

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <SafeAreaView style={styles.root}>
        <View style={styles.screen}>
          {tab === 'map' && <MapScreen />}
          {tab === 'scan' && <ScannerScreen />}
          {tab === 'missions' && <MissionDashboard />}
        </View>

        <View style={styles.tabBar}>
          <TabButton label="Map" icon="🗺" active={tab === 'map'} onPress={() => setTab('map')} />
          <TabButton label="Scan" icon="📷" active={tab === 'scan'} onPress={() => setTab('scan')} />
          <TabButton label="Missions" icon="🎯" active={tab === 'missions'} onPress={() => setTab('missions')} />
        </View>
      </SafeAreaView>
    </StripeProvider>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      {active && <View style={styles.tabIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  screen: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderColor: '#1a1a1a',
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    position: 'relative',
  },
  tabIcon: { fontSize: 20 },
  tabLabel: { color: '#555', fontSize: 11, marginTop: 3 },
  tabLabelActive: { color: '#FF6835' },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: '#FF6835',
    borderRadius: 1,
  },
});
