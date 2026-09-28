// Builds site/money-machine/money-machine.glb: an original, rigged take on a
// classic mini one-armed bandit (the CC0 "Slot Machine Mini" on Meshy was the
// visual reference; no geometry or texture was copied from it).
//
// AI-generated meshes are one fused, baked shell, so their reels can't spin.
// This model is built from parts instead, and the page animates them by name:
//   Reel_1..3  groups pivoting on their own axle (rotation.x spins them)
//   Lever      group pivoting at the hub (rotation.x pulls it)
//   MarqueeSign, LowerSign, ReelFace material: get canvas textures at runtime
//   Bulb_00..  marquee bulbs, Beacon, LedBar_1..5, SpinButton, LeverBall
//
// Run: npm install && npm run build:glb

import { writeFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// GLTFExporter reads blobs through FileReader, which Node doesn't have.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
};

const mat = (name, props) => Object.assign(new THREE.MeshStandardMaterial(props), { name });
const M = {
  brass: mat("Brass", { color: 0xb58a3a, metalness: 1, roughness: 0.32 }),
  lacquer: mat("Lacquer", { color: 0x0c0c0d, metalness: 0.5, roughness: 0.3 }),
  chrome: mat("Chrome", { color: 0xd9dde0, metalness: 1, roughness: 0.14 }),
  reel: mat("ReelFace", { color: 0x141312, metalness: 0, roughness: 0.55 }),
  sign: mat("SignFace", { color: 0x050505, emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.4 }),
  glass: mat("Glass", { color: 0xffffff, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.08 }),
  ruby: mat("Ruby", { color: 0xff2a3a, emissive: 0xff1a2a, emissiveIntensity: 0.6, roughness: 0.25 }),
  bulb: mat("Bulb", { color: 0xffcf7a, emissive: 0xffb52e, emissiveIntensity: 1.2, roughness: 0.3 }),
  ivory: mat("Ivory", { color: 0xefe9dc, metalness: 0, roughness: 0.4 }),
  payline: mat("Payline", { color: 0xff3b3b, emissive: 0xff3b3b, emissiveIntensity: 1.5 }),
};

const root = new THREE.Group();
root.name = "MoneyMachine";

function add(name, geometry, material, [x, y, z] = [0, 0, 0], parent = root) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
// Indexed, so the rounded boxes (most of the vertices) stay small.
const rbox = (w, h, d, r = 0.04) => mergeVertices(new RoundedBoxGeometry(w, h, d, 2, r));
// Cylinder whose axis runs left-right (along X), like an axle.
const axle = (r, len, seg = 32) => new THREE.CylinderGeometry(r, r, len, seg).rotateZ(Math.PI / 2);
const upright = (r, len, seg = 24) => new THREE.CylinderGeometry(r, r, len, seg);

// Plinth and lower cabinet: gold body on a black base.
add("Base", rbox(1.56, 0.16, 1.06, 0.03), M.lacquer, [0, 0.08, 0]);
add("BaseTrim", box(1.5, 0.02, 1.0), M.brass, [0, 0.17, 0]);
add("Cabinet", rbox(1.24, 0.86, 0.88, 0.05), M.brass, [0, 0.59, 0]);

// Lower front: a framed glowing plate over the coin tray.
add("LowerPanel", box(1.0, 0.44, 0.02), M.lacquer, [0, 0.62, 0.45]);
add("LowerSign", new THREE.PlaneGeometry(0.9, 0.34), M.sign, [0, 0.62, 0.462]);
add("LowerFrame", mergeGeometries([
  box(1.04, 0.03, 0.03).translate(0, 0.235, 0), box(1.04, 0.03, 0.03).translate(0, -0.235, 0),
  box(0.03, 0.5, 0.03).translate(-0.505, 0, 0), box(0.03, 0.5, 0.03).translate(0.505, 0, 0),
]), M.chrome, [0, 0.62, 0.46]);
add("CoinTray", box(0.7, 0.08, 0.18), M.chrome, [0, 0.24, 0.53]);
add("CoinTrayInner", box(0.62, 0.05, 0.15), M.lacquer, [0, 0.27, 0.535]);

// Black side panels with brass stripes, both sides.
for (const [side, x] of [["L", -0.625], ["R", 0.625]]) {
  add(`SidePanel_${side}`, box(0.02, 0.72, 0.72), M.lacquer, [x, 0.6, 0]);
  const stripes = [];
  for (let i = 0; i < 7; i++) stripes.push(box(0.024, 0.022, 0.64).translate(0, -0.3 + i * 0.1, 0));
  add(`SideStripes_${side}`, mergeGeometries(stripes), M.brass, [x, 0.6, 0]);
}

// Control deck: four ivory buttons and the red spin button.
add("Deck", box(1.24, 0.07, 0.28), M.lacquer, [0, 1.055, 0.34]);
add("DeckTrim", box(1.26, 0.02, 0.02), M.brass, [0, 1.09, 0.48]);
[-0.44, -0.3, -0.16, -0.02].forEach((x, i) => add(`Button_${i + 1}`, upright(0.042, 0.03), M.ivory, [x, 1.105, 0.4]));
add("SpinButton", upright(0.075, 0.045, 32), M.ruby, [0.3, 1.11, 0.38]);
add("CoinSlot", box(0.1, 0.06, 0.02), M.chrome, [0.5, 1.13, 0.3]);

// Upper cabinet: the reel housing, set back from the lower body.
add("UpperCabinet", rbox(1.18, 0.78, 0.74, 0.05), M.brass, [0, 1.48, -0.07]);
const window = { w: 0.86, h: 0.36, y: 1.52 };
const plate = new THREE.Shape();
plate.moveTo(-0.55, -0.36).lineTo(0.55, -0.36).lineTo(0.55, 0.36).lineTo(-0.55, 0.36).lineTo(-0.55, -0.36);
const front = 0.56; // z of the reel box face
const hole = new THREE.Path();
hole.moveTo(-window.w / 2, -window.h / 2).lineTo(-window.w / 2, window.h / 2).lineTo(window.w / 2, window.h / 2).lineTo(window.w / 2, -window.h / 2);
plate.holes.push(hole);
// The reel box: a thick bezel whose window is a tunnel, standing proud of the
// cabinet so the drums sit inside it (their backs hide in the cabinet).
add("ReelBox", new THREE.ExtrudeGeometry(plate, { depth: 0.26, bevelEnabled: false }), M.lacquer, [0, window.y, 0.3]);
add("WindowFrame", mergeGeometries([
  box(window.w + 0.07, 0.035, 0.05).translate(0, window.h / 2 + 0.0175, 0),
  box(window.w + 0.07, 0.035, 0.05).translate(0, -window.h / 2 - 0.0175, 0),
  box(0.035, window.h, 0.05).translate(-window.w / 2 - 0.0175, 0, 0),
  box(0.035, window.h, 0.05).translate(window.w / 2 + 0.0175, 0, 0),
]), M.chrome, [0, window.y, front + 0.012]);

// Three reels, each a group on its own axle so rotation.x spins it in place.
// The cylinder's UV u runs around the drum; the page paints words on it.
[-0.285, 0, 0.285].forEach((x, i) => {
  const reel = new THREE.Group();
  reel.name = `Reel_${i + 1}`;
  reel.position.set(x, window.y, front - 0.26);
  root.add(reel);
  add(`ReelDrum_${i + 1}`, axle(0.22, 0.25, 48), M.reel, [0, 0, 0], reel);
});
add("Payline", box(window.w + 0.02, 0.008, 0.005), M.payline, [0, window.y, front - 0.02]);
add("Glass", new THREE.PlaneGeometry(window.w, window.h), M.glass, [0, window.y, front - 0.008]);
for (let i = 0; i < 5; i++) add(`LedBar_${i + 1}`, box(0.05, 0.035, 0.02), M.ruby, [0.5, 1.4 + i * 0.06, front + 0.005]);
add("WindowSign", new THREE.PlaneGeometry(0.7, 0.07), M.sign, [0, 1.25, front + 0.002]);

// Marquee: a sign ringed with bulbs, and a red beacon on top.
add("Marquee", rbox(1.1, 0.36, 0.6, 0.06), M.lacquer, [0, 2.05, -0.02]);
add("MarqueeSign", new THREE.PlaneGeometry(0.86, 0.22), M.sign, [0, 2.05, 0.286]);
add("MarqueeTrim", mergeGeometries([
  box(1.0, 0.025, 0.025).translate(0, 0.155, 0), box(1.0, 0.025, 0.025).translate(0, -0.155, 0),
  box(0.025, 0.33, 0.025).translate(-0.4875, 0, 0), box(0.025, 0.33, 0.025).translate(0.4875, 0, 0),
]), M.brass, [0, 2.05, 0.285]);
const bulbs = [];
for (let i = 0; i < 12; i++) bulbs.push([-0.44 + i * 0.08, 0.135]);
for (let i = 0; i < 3; i++) bulbs.push([0.465, 0.07 - i * 0.07]);
for (let i = 11; i >= 0; i--) bulbs.push([-0.44 + i * 0.08, -0.135]);
for (let i = 2; i >= 0; i--) bulbs.push([-0.465, 0.07 - i * 0.07]);
bulbs.forEach(([x, y], i) => add(`Bulb_${String(i).padStart(2, "0")}`, new THREE.SphereGeometry(0.02, 10, 6), M.bulb, [x, 2.05 + y, 0.3]));
add("BeaconBase", upright(0.075, 0.04, 32), M.chrome, [0, 2.25, -0.02]);
add("Beacon", new THREE.SphereGeometry(0.07, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.ruby, [0, 2.27, -0.02]);

// Lever on the right, pivoting at its hub: rotation.x > 0 pulls it forward and down.
add("LeverHub", axle(0.11, 0.1), M.chrome, [0.67, 1.2, 0]);
const lever = new THREE.Group();
lever.name = "Lever";
lever.position.set(0.745, 1.2, 0);
root.add(lever);
add("LeverCollar", axle(0.05, 0.05), M.lacquer, [0, 0, 0], lever);
add("LeverRod", upright(0.028, 0.75), M.chrome, [0, 0.375, 0], lever);
add("LeverBall", new THREE.SphereGeometry(0.085, 24, 12), M.ruby, [0, 0.8, 0], lever);

const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(root, { binary: true });
const out = new URL("../site/money-machine/money-machine.glb", import.meta.url);
writeFileSync(out, Buffer.from(glb));
console.log(`wrote ${out.pathname} (${glb.byteLength} bytes, ${root.children.length} top-level nodes)`);
