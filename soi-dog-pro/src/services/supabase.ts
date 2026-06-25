import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Mission = {
  id: string;
  lat: number;
  lng: number;
  target_amount: number;
  current_raised: number;
  status: 'active' | 'completed' | 'paused';
  title: string;
  description: string;
  created_at: string;
};

export type Log = {
  id: string;
  dog_verified_at: string;
  user_id: string;
  mission_id: string;
  photo_url: string;
  confidence_score: number;
};

export async function fetchActiveMissions(): Promise<Mission[]> {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchMissionById(id: string): Promise<Mission | null> {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function logDogVerification(log: Omit<Log, 'id'>): Promise<Log> {
  const { data, error } = await supabase
    .from('logs')
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMissionFunding(
  missionId: string,
  amount: number
): Promise<void> {
  const { error } = await supabase.rpc('increment_mission_funding', {
    mission_id: missionId,
    amount,
  });

  if (error) throw error;
}
