import { Mission } from './supabase';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

// Pattaya, Thailand — primary mission zone
export const PATTAYA_REGION: MapRegion = {
  latitude: 12.9236,
  longitude: 100.8825,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export type MissionPin = {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title: string;
  progress: number; // 0–1
  status: Mission['status'];
};

export function missionsToMapPins(missions: Mission[]): MissionPin[] {
  return missions.map((m) => ({
    id: m.id,
    coordinate: { latitude: m.lat, longitude: m.lng },
    title: m.title,
    progress: m.target_amount > 0 ? m.current_raised / m.target_amount : 0,
    status: m.status,
  }));
}

export function pinColor(status: Mission['status']): string {
  switch (status) {
    case 'active':
      return '#00A6FB';
    case 'completed':
      return '#00c853';
    case 'paused':
      return '#888888';
  }
}

// Dummy dataset for UI testing — bypasses real GPS/DB
export const DUMMY_PATTAYA_PINS: MissionPin[] = [
  {
    id: 'dummy-1',
    coordinate: { latitude: 12.9236, longitude: 100.8825 },
    title: 'Soi 6 Rescue Point',
    progress: 0.72,
    status: 'active',
  },
  {
    id: 'dummy-2',
    coordinate: { latitude: 12.9315, longitude: 100.8741 },
    title: 'Beach Road Feeding Station',
    progress: 0.45,
    status: 'active',
  },
  {
    id: 'dummy-3',
    coordinate: { latitude: 12.9182, longitude: 100.8863 },
    title: 'Dark Side Shelter',
    progress: 1.0,
    status: 'completed',
  },
  {
    id: 'dummy-4',
    coordinate: { latitude: 12.9401, longitude: 100.8798 },
    title: 'North Pattaya Vet Run',
    progress: 0.2,
    status: 'active',
  },
  {
    id: 'dummy-5',
    coordinate: { latitude: 12.9089, longitude: 100.8912 },
    title: 'Jomtien Spay Clinic',
    progress: 0.6,
    status: 'active',
  },
];
