# Honda CRF250L / CRF300L — NA Pump Gas ECU Template

A generic, mass-market base file for the standard Honda CRF250L, CRF250 Rally, CRF300L, and CRF300 Rally. Built for the most common setup in this market: no forced induction, a full aftermarket exhaust, an open intake, and a rider who wants the bike to sound aggressive and launch hard.

**File:** [`honda-crf250-300-na-pumpgas.json`](./honda-crf250-300-na-pumpgas.json)

## Template Builder app

[`app/index.html`](./app/index.html) is a self-contained static web app for distributing this template to customers. Riders pick their exact model (CRF250L / CRF250 Rally / CRF300L / CRF300 Rally), injector, and features (launch control with adjustable hold RPM 5,500–8,000, decel pops on/off), see a live JSON preview, and download their configured file — the download is gated behind accepting the disclaimer.

It has no build step and no dependencies.

Downloads are gated: the rider must accept the disclaimer **and** enter a valid email before the button unlocks. The email and chosen model are posted to Netlify Forms (form name `ecu-download`) and appear under the site's Forms tab. Lead capture never blocks the download — if the post fails, the rider still gets their file.

### Deployment

A Netlify site is already provisioned for it:

- **Site:** `crf-ecu-template-builder` (`ca431dfc-8aa8-4e51-ab98-8765e101e3a0`)
- **URL:** https://crf-ecu-template-builder.netlify.app
- **Dashboard:** https://app.netlify.com/projects/crf-ecu-template-builder

[`.github/workflows/deploy-ecu-app.yml`](../.github/workflows/deploy-ecu-app.yml) publishes `ecu-templates/app` to that site on every push to `main` that touches the app, using the same `NETLIFY_AUTH_TOKEN` secret as the trading dashboard workflow. The repo root `netlify.toml` is claimed by `trading-dashboard`, which is why this deploys to its own site rather than reusing that config.

**Prerequisite:** the `NETLIFY_AUTH_TOKEN` repository secret is currently unset — the trading dashboard deploys have failed with `Authentication required` since 2026-07-20 for this reason. Add the secret under Settings → Secrets and variables → Actions before relying on either workflow.

To push a deploy by hand from a machine with the Netlify CLI logged in:

```
netlify deploy --dir=ecu-templates/app --prod --site=ca431dfc-8aa8-4e51-ab98-8765e101e3a0
```

Any other static host works too — serve `ecu-templates/app/` as-is.

## Who it's for

- Standard displacement (250cc / 286cc), naturally aspirated engines
- Aftermarket intake + full exhaust system
- High-octane pump gas (91–95 octane)
- OEM injector or PCX150 injector upgrade
- Standalone ECUs (aRacer RC Mini5, Super X) or flash/hex editing workflows (e.g. TunerPro)

## The tuning logic

### 1. Launch Control (the 6,500 RPM hold)

- **The logic:** You want enough RPM to launch the bike aggressively without looping it or bogging down the engine. For a standard CRF250/300, 6,500 RPM sits right below peak torque.
- **The programming:** The system initiates a secondary rev limiter at 6,500 RPM. By retarding the ignition by 5 degrees and adding 10% more fuel, the bike builds a slight bit of backpressure and creates a violent, rapid-fire exhaust note off the line before the clutch is dropped.

### 2. Pops, Bangs & Flames (deceleration map)

- **The logic:** This is what gets attention on the street. It forces the unburnt fuel into the hot aftermarket exhaust header.
- **The programming:** The critical zone is when the throttle is completely closed (**0% to 3% TPS**) but the engine is still revving high during a downshift (**4,500 to 8,500 RPM**). By commanding the ECU to dump +15% more fuel and pulling the ignition timing back slightly (-2 degrees), the fuel detonates in the exhaust pipe, creating the signature pops and flames.

### 3. Standard performance optimization

- **The logic:** The factory Honda ECU runs incredibly lean to pass strict global emissions standards, which is why stock bikes run hot and feel sluggish.
- **The programming:** This map corrects the Air-to-Fuel Ratio (AFR) to a richer, healthier **13.0 to 13.2** range under Wide Open Throttle (WOT). It also slightly advances the ignition timing across the board to wake up the throttle response, maximizing the airflow from the aftermarket intake and exhaust.

## Disclaimer

This is a base file intended for motorcycles with a free-flowing aftermarket exhaust and intake. Running decel-flame maps on a factory exhaust system with a catalytic converter will destroy the converter. Always verify AFR on a dyno or with a wideband sensor before extended use. Intended for closed-course / off-road use where emissions-related modifications are restricted by local law.
