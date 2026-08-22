# Honda CRF250L / CRF300L — NA Pump Gas ECU Template

A generic, mass-market base file for the standard Honda CRF250L, CRF250 Rally, CRF300L, and CRF300 Rally. Built for the most common setup in this market: no forced induction, a full aftermarket exhaust, an open intake, and a rider who wants the bike to sound aggressive and launch hard.

**File:** [`honda-crf250-300-na-pumpgas.json`](./honda-crf250-300-na-pumpgas.json)

## Template Builder app

The builder now lives in [`crf-builder/`](../crf-builder/) alongside the CRF250L graphics kit builder, as two pages of one site:

- [`crf-builder/index.html`](../crf-builder/index.html) — CRF250L graphics kit builder (front page)
- [`crf-builder/ecu.html`](../crf-builder/ecu.html) — this ECU template builder

Both share a nav bar so they read as one site. Riders pick their exact model (CRF250L / CRF250 Rally / CRF300L / CRF300 Rally), injector, and features (launch control with adjustable hold RPM 5,500–8,000, decel pops on/off), see a live JSON preview, and download their configured file.

No build step, no dependencies. The download unlocks once the rider accepts the disclaimer **and** enters a valid email; the email and chosen model post to Netlify Forms (form `ecu-download`) without blocking the download if the post fails.

### Deployment

[`.github/workflows/deploy-ecu-app.yml`](../.github/workflows/deploy-ecu-app.yml) publishes the whole `crf-builder/` folder on pushes to `main` that touch it, plus manual runs from the Actions tab.

- **Site:** `crf-garage` (`ca431dfc-8aa8-4e51-ab98-8765e101e3a0`)
- **URL:** https://crf-garage.netlify.app

**Known issue:** the `NETLIFY_AUTH_TOKEN` repo secret is set but no longer authorised — deploys fail with `Unauthorized: could not retrieve project`. A fresh Netlify personal access token is needed before automatic deploys work again.

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
- **What arms it:** the limiter is only allowed to engage with the clutch pulled in, in first or neutral, below 5 km/h — `activation_conditions` in the file. Wire it to RPM alone and you have not built launch control, you have built a 6,500 RPM rev limiter that will catch you mid-corner in third.

### 2. Pops, Bangs & Flames (deceleration map)

- **The logic:** This is what gets attention on the street. It forces the unburnt fuel into the hot aftermarket exhaust header.
- **The programming:** The critical zone is when the throttle is completely closed (**0% to 3% TPS**) but the engine is still revving high during a downshift (**4,500 to 8,500 RPM**). By commanding the ECU to dump +15% more fuel and pulling the ignition timing back slightly (-2 degrees), the fuel detonates in the exhaust pipe, creating the signature pops and flames.
- **Deceleration fuel cut-off must be off.** This is the step most people miss. With DFCO active the ECU cuts injection entirely on a closed throttle, so there is no fuel there to enrich and the map does nothing at all. The file sets `disable_dfco` alongside the decel map for that reason.

### 3. Bounce limiter (the fun one)

- **The logic:** A second limiter, set below the 10,500 RPM hard limiter, that you can sit on deliberately. It is opt-in and off by default, because it is a party trick rather than a way to ride.
- **The programming:** On **ignition cut** the spark is cut but injection continues, so the charge leaves the cylinder unburnt and lights in the hot header — that is where the bang and the flame come from. A random cut pattern stops it sounding mechanical, and the file adds -8 degrees and 12% fuel to make it louder. On **fuel cut** injection stops instead: nothing left to burn, no flame, and far kinder to the engine. Enrichment keys are only written for ignition cut, because there is nothing to enrich on fuel cut.
- **What it never does:** replace `rev_limiter_rpm`. The hard limiter stays at 10,500 on fuel cut and exists to protect the engine. The bounce limiter is capped at 10,200 so it always sits below it.
- **The cost:** sustained ignition cut puts raw fuel and a lot of heat through the exhaust valves and header. On a catalysed factory exhaust it will destroy the converter, same as the decel map.

### 4. Standard performance optimization

- **The logic:** The factory Honda ECU runs incredibly lean to pass strict global emissions standards, which is why stock bikes run hot and feel sluggish.
- **The programming:** This map corrects the Air-to-Fuel Ratio (AFR) to a richer, healthier **12.8 to 13.1** range under Wide Open Throttle (WOT), with cruise held at **13.2 to 13.5**. It also slightly advances the ignition timing across the board to wake up the throttle response, maximizing the airflow from the aftermarket intake and exhaust.

## Disclaimer

This is a base file intended for motorcycles with a free-flowing aftermarket exhaust and intake. Running decel-flame maps on a factory exhaust system with a catalytic converter will destroy the converter. Always verify AFR on a dyno or with a wideband sensor before extended use. Intended for closed-course / off-road use where emissions-related modifications are restricted by local law.
