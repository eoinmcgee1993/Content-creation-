import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MissionPin, missionsToMapPins } from '../services/maps';
import { fetchActiveMissions } from '../services/supabase';
import { MissionCard } from '../components/MissionCard';

export function MissionDashboard() {
  const [pins, setPins] = useState<MissionPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const missions = await fetchActiveMissions();
      setPins(missionsToMapPins(missions));
    } catch (err) {
      console.error('Failed to load missions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const totalMissions = pins.length;
  const activeMissions = pins.filter((p) => p.status === 'active').length;
  const avgFunding = pins.length
    ? Math.round((pins.reduce((s, p) => s + p.progress, 0) / pins.length) * 100)
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#FF6835" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MISSIONS</Text>
        <Text style={styles.subtitle}>Pattaya · Active Operations</Text>
      </View>

      {/* Summary stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalMissions}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#FF6835' }]}>{activeMissions}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#00c853' }]}>{avgFunding}%</Text>
          <Text style={styles.statLabel}>Avg Funded</Text>
        </View>
      </View>

      <FlatList
        data={pins}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MissionCard pin={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor="#FF6835"
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No missions found.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { color: '#FF6835', fontSize: 20, fontWeight: '800', letterSpacing: 1.5 },
  subtitle: { color: '#666', fontSize: 12, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#1a1a1a',
    gap: 24,
  },
  stat: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '700' },
  statLabel: { color: '#555', fontSize: 11, marginTop: 2 },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  empty: { color: '#555', textAlign: 'center', marginTop: 40 },
});
