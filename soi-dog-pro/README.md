# SOI DOG PRO

Crowdfunded rescue missions for stray dogs in Pattaya, Thailand.
AI verifies each dog photo. Stripe handles donations. Supabase stores everything.

## Stack

| Layer | Tech |
|---|---|
| Mobile | Expo (React Native + TypeScript) |
| Maps | react-native-maps (Google Maps) |
| AI | TensorFlow.js + MobileNet v2 |
| Backend | Supabase (Postgres + Edge Functions) |
| Payments | Stripe |
| Builds | EAS Build |

## Quick Start

1. **Clone and install**
   ```bash
   cd soi-dog-pro
   npm install
   ```

2. **Set secrets** — copy `.env.example` to `.env` and fill in:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

3. **Push Supabase schema**
   ```bash
   # Using Supabase CLI
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   # OR paste supabase/migrations/001_initial_schema.sql into the SQL editor
   ```

4. **Deploy the Edge Function**
   ```bash
   supabase functions deploy create-payment-intent
   # Set the Stripe secret key in the Supabase dashboard → Edge Functions → Secrets
   # Key: STRIPE_SECRET_KEY
   ```

5. **Start in dev mode**
   ```bash
   npx expo start
   ```

6. **Build for distribution**
   ```bash
   # Preview APK (Android)
   eas build --platform android --profile preview

   # Production (both platforms)
   eas build --platform all --profile production
   ```

## Project Structure

```
soi-dog-pro/
├── App.tsx                        # Root + tab navigation
├── app.json                       # Expo config
├── eas.json                       # EAS Build profiles
├── src/
│   ├── components/
│   │   ├── CaptureButton.tsx      # Camera shutter button
│   │   └── MissionCard.tsx        # Mission progress card
│   ├── hooks/
│   │   └── useClassifier.ts       # TF.js MobileNet dog classifier
│   ├── screens/
│   │   ├── Scanner.tsx            # Camera + AI verification UI
│   │   ├── MapScreen.tsx          # Google Maps mission grid
│   │   └── MissionDashboard.tsx   # Mission list + stats
│   └── services/
│       ├── supabase.ts            # DB client + typed queries
│       ├── maps.ts                # Map helpers + dummy data
│       └── stripe.ts              # Payment intent creator
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql # Full schema + seed data
    └── functions/
        └── create-payment-intent/ # Stripe PaymentIntent Edge Function
```

## Switching from Dummy Data to Live Data

In `MapScreen.tsx` and `MissionDashboard.tsx`, replace:
```ts
const pins = DUMMY_PATTAYA_PINS;
```
with:
```ts
const [pins, setPins] = useState<MissionPin[]>([]);
useEffect(() => {
  fetchActiveMissions().then((ms) => setPins(missionsToMapPins(ms)));
}, []);
```
