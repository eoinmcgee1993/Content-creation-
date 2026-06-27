# SOI DOG PRO — Google Play Store Submission Kit

Everything you need to publish the AAB. Fill these into Play Console as you go.

---

## 0. The build artifact

- **File:** `soi-dog-pro/dist/soi-dog-pro-production.aab` (51 MB, AAB / app bundle)
- **Package name:** `com.soidogpro.app`
- **Version:** 1.0.0 (versionCode 2)
- **Signing:** Managed by EAS (Expo). Google Play App Signing will re-sign on upload — that's expected and fine.

---

## 1. Create / open the app in Play Console

1. Go to https://play.google.com/console (one-time $25 developer registration if you haven't).
2. **Create app** → Name: `SOI DOG PRO` → Default language: English (US) → App, Free.
3. Accept the declarations.

---

## 2. Upload paths (pick one)

### A) Manual upload (simplest)
1. Play Console → **Testing → Internal testing** (recommended first) or **Production → Create new release**.
2. Upload `dist/soi-dog-pro-production.aab`.
3. Add release notes (see §6), Save → Review → Roll out.

### B) Automated via EAS Submit
1. Play Console → **Setup → API access** → link a Google Cloud project → create a **service account** with the *Service Account User* role, grant it **Admin (all permissions)** or at least *Release manager* in Play Console → Users & permissions.
2. Download the service account **JSON key**.
3. Save it as `soi-dog-pro/google-service-account.json` (already gitignored — never commit it).
4. Run:
   ```
   cd soi-dog-pro
   EXPO_TOKEN=<your-token> npx eas-cli submit --platform android --profile production --path dist/soi-dog-pro-production.aab
   ```
   Note: EAS Submit requires the app to already exist in Play Console with at least one manual upload completed first (Google's API can't create the very first release).

---

## 3. Store listing (Main store listing)

**App name:** SOI DOG PRO

**Short description (max 80 chars):**
> Fund & verify street-dog rescue missions in Pattaya — scan, donate, track impact.

**Full description (max 4000 chars):**
> SOI DOG PRO turns compassion into action for Pattaya's street dogs.
>
> Every dog on the streets of Pattaya deserves food, care, and a chance. SOI DOG PRO connects you directly to live rescue missions on an interactive map — see exactly where help is needed, fund the missions that move you, and watch your impact grow in real time.
>
> HOW IT WORKS
> • MAP — Open the Pattaya mission grid. Each pin is a real rescue mission with a funding goal and live progress.
> • SCAN — Point your camera at a dog. On-device AI verifies the sighting and logs it to a mission — no internet round-trip, your photo stays on your phone.
> • FUND — Back a mission securely. Track how close each one is to its goal and see completed rescues.
>
> WHY IT MATTERS
> Pattaya is home to thousands of street dogs. Coordinated, transparent funding gets the right help to the right place fast. SOI DOG PRO makes every contribution visible and accountable.
>
> FEATURES
> • Live, map-based rescue missions across Pattaya
> • On-device AI dog verification (private — runs on your phone)
> • Secure donations
> • Real-time funding progress and mission history
>
> Join the pack. Help us clear the soi, one dog at a time.

**App category:** Lifestyle (alt: Social)
**Tags:** charity, animals, donation

**Contact details:**
- Email: eoinmcgee1993@gmail.com
- Website: https://soi-dog-pro.netlify.app
- Privacy policy URL: **REQUIRED** — host one (see §7). Suggested: https://soi-dog-pro.netlify.app/privacy

---

## 4. Graphics assets (you must supply these)

| Asset | Spec | Status |
|---|---|---|
| App icon | 512×512 PNG, 32-bit | Derive from `assets/logo.png` (already 1024×1024 — downscale to 512) |
| Feature graphic | 1024×500 PNG/JPG | **TODO** — needed for listing |
| Phone screenshots | min 2, 1080×1920-ish, PNG/JPG | **TODO** — capture from the app (Map / Scan / Missions tabs) |
| (optional) 7" & 10" tablet shots | | optional |

Tip: install the APK build (`63cff593...`) on a device/emulator and screenshot the three tabs.

---

## 5. Content rating questionnaire

- App category: Reference / Lifestyle (no violence, no user-generated public content of concern).
- Contains ads: **No** (unless you add them).
- Expected result: **Everyone / PEGI 3**.

---

## 6. Release notes (first release)

> First release of SOI DOG PRO. Discover live street-dog rescue missions across Pattaya on an interactive map, verify sightings with on-device AI, and fund the missions that matter.

---

## 7. Data safety form (required before publishing)

Declare the following based on the current app:

- **Location:** Collected — *Approximate & precise location*. Purpose: App functionality (showing nearby missions). Not shared with third parties. Optional / not required for app use? Required for map features.
- **Camera / Photos:** The camera is used for on-device AI verification. Photos are **processed on-device** and not transmitted — declare "not collected" if you don't upload them (current code classifies locally). If you later store photos to Supabase (`logs.photo_url`), declare Photos as *Collected, app functionality*.
- **Financial info (donations):** Payments handled by Stripe — declare per Stripe's processor relationship; the app itself does not store card data.
- **Identifiers / app activity:** Supabase logs (`user_id`, verification events) — declare *Collected, app functionality* if user accounts exist.
- **Encryption in transit:** Yes (HTTPS/Supabase/Stripe).
- **Data deletion:** Provide a way to request deletion (email is acceptable for now).

⚠️ Be accurate here — Google audits this against actual app behavior. The current app: requests location + camera, talks to Supabase (HTTPS) and Stripe.

---

## 8. Pre-launch checklist

- [ ] Privacy policy URL live (blocker)
- [ ] Feature graphic created (blocker for listing)
- [ ] ≥2 phone screenshots (blocker)
- [ ] 512×512 icon uploaded
- [ ] Data safety form completed (blocker)
- [ ] Content rating completed (blocker)
- [ ] `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` set as EAS env vars and a fresh production build made (current build has placeholders)
- [ ] `STRIPE_SECRET_KEY` added to Supabase Edge Function secrets
- [ ] AAB uploaded to a track (internal → closed → production)

> Note: the current production AAB was built **without** real Stripe/Google Maps keys (placeholders in app.json/.env). Maps and payments will not work until you set real keys and rebuild. For a functional public release, set those first.
