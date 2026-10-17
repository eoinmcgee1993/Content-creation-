# TN Neon Archive (tn-museum)

A first-person walkthrough of a cyberpunk digital museum of TN-inspired sneaker
concepts. It is one standalone HTML file: plain JavaScript and native WebGL2,
with no libraries, model files, textures or network requests. It is built for
phones first, and also works on desktop.

It is an unofficial fan concept. It is not affiliated with or endorsed by Nike,
Inc., and the seven exhibits are invented concepts, not real products.

| Path | What it is |
|---|---|
| `index.html` | The whole game: HUD/CSS, procedural geometry, four GLSL programs, input and render loop. |

## Controls
- **Phone:** drag on the left half of the screen to walk (a floating thumbstick
  appears under your thumb). Drag on the right half to look around.
- **Desktop:** WASD or the arrow keys, and drag with the mouse.
- Walk up to a pedestal to open its holographic card. Stay near it for about a
  second to log it. Logging all seven shows a completion message.

## How it is built
- **Room:** a brutalist concrete hall with board-formed panel seams, tie holes,
  wall fins and ceiling beams. Every surface is lit only by neon: analytic line
  lights for the trims and point lights for the exhibits.
- **Floor:** brushed metal with a pulsing anti-aliased neon grid. The scene is
  rendered mirrored at half resolution, and the floor samples that texture with
  a small ripple and blur to give a satin reflection with Fresnel falloff.
- **Exhibits:** each shoe is generated from a heel-to-toe profile spline. Its
  shell is low-poly shards (each triangle shrunk toward its centroid). The neon
  line work traces the collar, the wavy exoskeleton "fingers", the wave cage,
  the split sole pods with visible air windows, and the split whale-tail shank,
  which also shows in the floor reflection. Colours flow along a three-stop
  palette per exhibit.
- **Draw calls:** 7 per frame in total (world, shards and lines, each drawn
  twice for the mirror and main passes, plus the floor). Every neon line in the
  scene is one instanced draw of camera-facing ribbons, and exhibit transforms
  are applied in the vertex shader from a uniform array. About 2,200 shard
  triangles and 4,300 line segments in total.
- **Mobile performance:** all input listeners are passive pointer events on a
  `touch-action: none` layer. The frame loop makes no per-frame allocations,
  and the HUD animates only `opacity` and `transform`. Render resolution adapts
  between 0.75× and 2× device pixels to hold the frame rate. WebGL context loss
  is handled.

## Run locally
```bash
python3 -m http.server 8000 --directory tn-museum
# open http://localhost:8000/ (or just open index.html directly; it has no dependencies)
```
To try it on a phone, serve it on your LAN and open the machine's IP address.

## Verification so far
Checked in headless Chromium using SwiftShader (software WebGL2) with mobile
emulation in portrait and landscape: the shaders compile, there are no console
errors, touch sticks move and turn the camera, all seven exhibits log, and
plinth collision holds. SwiftShader runs on the CPU, so it says nothing about
frame rate. **The 60 FPS target has not yet been measured on a real phone.**
The FPS readout in the top-right corner shows it on a real device.

## Deploying
Not deployed. The root `netlify.toml` publishes `trading-dashboard/`, so don't
connect a Netlify site that builds from this repo. Deploy `tn-museum/` by upload.
