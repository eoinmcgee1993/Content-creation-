# Honda CRF250L / CRF300L — NA Pump Gas ECU Template

A generic, mass-market base file for the standard Honda CRF250L, CRF250 Rally, CRF300L, and CRF300 Rally. Built for the most common setup in this market: no forced induction, a full aftermarket exhaust, an open intake, and a rider who wants the bike to sound aggressive and launch hard.

**File:** [`honda-crf250-300-na-pumpgas.json`](./honda-crf250-300-na-pumpgas.json)

## Template Builder app

[`app/index.html`](./app/index.html) is a self-contained static web app for distributing this template to customers. Riders pick their exact model (CRF250L / CRF250 Rally / CRF300L / CRF300 Rally), injector, and features (launch control with adjustable hold RPM 5,500–8,000, decel pops on/off), see a live JSON preview, and download their configured file — the download is gated behind accepting the disclaimer.

It has no build step and no dependencies. Deploy by pointing any static host at `ecu-templates/app/`:

- **Netlify:** drag-and-drop the `app` folder, or set publish directory to `ecu-templates/app` (note: the repo root `netlify.toml` currently deploys `trading-dashboard`, so use a separate Netlify site for this).
- **GitHub Pages / Cloudflare Pages / any static host:** serve the folder as-is.

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
