import * as THREE from 'three';
import { ShapeBuilder, canvasTexture, textured, shade } from '../../src/lib/index.js';

// Local helpers for the Hindu temple: painted textures with 0..1 / per-niche UVs.

const BODY = ['#2f62c9', '#c8382c', '#2f8f4a', '#f2efe4', '#3a7fe0', '#e07a1f', '#8a3fb0', '#f0c419'];
const NICHE = ['#ffd84a', '#7fd0e8', '#f59ab8', '#9fe07a', '#ffb347', '#c9a6ff'];

/**
 * Repeating band of painted stucco deities in arched niches, as seen on gopuram tiers.
 * One texture repeat = `count` niches; UVs (u) are set by tierBox so niches are ~0.6 m wide.
 */
export function deityTexture(variant = 0) {
  return canvasTexture(256, 96, (ctx, W, H) => {
    const n = 4, nw = W / n;
    ctx.fillStyle = '#efe4c8';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const k = i + variant * 3;
      const x0 = i * nw;
      // pilasters between niches
      ctx.fillStyle = '#e8b04a';
      ctx.fillRect(x0, 0, 6, H);
      ctx.fillStyle = '#b5482c';
      ctx.fillRect(x0 + 2, 0, 2, H);
      // arched niche
      const nx = x0 + 10, ny = 18, nwid = nw - 16, nh = H - 26;
      ctx.fillStyle = NICHE[k % NICHE.length];
      ctx.beginPath();
      ctx.moveTo(nx, ny + nh);
      ctx.lineTo(nx, ny + 10);
      ctx.quadraticCurveTo(nx + nwid / 2, ny - 14, nx + nwid, ny + 10);
      ctx.lineTo(nx + nwid, ny + nh);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 2;
      ctx.stroke();
      // deity figure
      const cx = nx + nwid / 2;
      const body = BODY[(k * 5 + variant) % BODY.length];
      ctx.fillStyle = body;
      ctx.fillRect(cx - 6, 42, 12, 18); // torso
      ctx.fillRect(cx - 14, 40, 5, 14); // arms (four of them)
      ctx.fillRect(cx + 9, 40, 5, 14);
      ctx.fillRect(cx - 18, 32, 4, 10);
      ctx.fillRect(cx + 14, 32, 4, 10);
      ctx.beginPath();
      ctx.arc(cx, 34, 6, 0, Math.PI * 2); // head
      ctx.fill();
      ctx.fillStyle = '#f0c419'; // crown + necklace
      ctx.beginPath();
      ctx.moveTo(cx - 6, 30);
      ctx.lineTo(cx, 18);
      ctx.lineTo(cx + 6, 30);
      ctx.fill();
      ctx.fillRect(cx - 6, 42, 12, 3);
      ctx.fillStyle = k % 2 ? '#e0531f' : '#d9a21a'; // dhoti
      ctx.fillRect(cx - 8, 60, 16, 16);
      ctx.fillStyle = shade(body, -0.3);
      ctx.fillRect(cx - 7, 76, 5, 6);
      ctx.fillRect(cx + 2, 76, 5, 6);
    }
    // cornice band top and plinth band bottom
    ctx.fillStyle = '#b5482c';
    ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = '#e8b04a';
    ctx.fillRect(0, 6, W, 3);
    ctx.fillStyle = '#8c3a22';
    ctx.fillRect(0, H - 8, W, 8);
  }, { key: 'hindu-temple:deities-' + variant });
}

/** Vertical red/white "kavi" stripes painted on South Indian temple walls. */
export function kaviTexture() {
  return canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = '#f4efe2';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#b8352a';
    ctx.fillRect(0, 0, W / 2, H);
  }, { key: 'hindu-temple:kavi' });
}

/** Carved granite with horizontal mouldings, for the gopuram base and plinths. */
export function graniteTexture() {
  return canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = '#b9ab92';
    ctx.fillRect(0, 0, W, H);
    for (const [y, c] of [[6, '#8f8270'], [22, '#cfc2a6'], [30, '#8f8270'], [46, '#cfc2a6'], [54, '#8f8270']]) {
      ctx.fillStyle = c;
      ctx.fillRect(0, y, W, 4);
    }
    ctx.fillStyle = '#9c8f7a';
    for (let x = 0; x < W; x += 16) ctx.fillRect(x, 34, 2, 12);
  }, { key: 'hindu-temple:granite' });
}

/**
 * Box (base at y = 0) whose side faces repeat `tex` every `period` metres horizontally
 * and stretch it once vertically. Top uses `topMat`.
 */
export function tierBox(w, h, d, tex, topMat, period = 2.4) {
  const b = new ShapeBuilder();
  const W = w / 2, D = d / 2;
  const uw = Math.max(1, Math.round(w / (period / 4))) / 4;
  const ud = Math.max(1, Math.round(d / (period / 4))) / 4;
  const uv = (u) => [[0, 0], [u, 0], [u, 1], [0, 1]];
  b.quadUV([-W, 0, D], [W, 0, D], [W, h, D], [-W, h, D], uv(uw), 0);
  b.quadUV([W, 0, -D], [-W, 0, -D], [-W, h, -D], [W, h, -D], uv(uw), 0);
  b.quadUV([W, 0, D], [W, 0, -D], [W, h, -D], [W, h, D], uv(ud), 0);
  b.quadUV([-W, 0, -D], [-W, 0, D], [-W, h, D], [-W, h, -D], uv(ud), 0);
  b.quad([-W, h, D], [W, h, D], [W, h, -D], [-W, h, -D], 1);
  return new THREE.Mesh(b.build(), [textured(tex), topMat]);
}



/** Colourful kolam / rangoli drawn on the path in front of the gate. */
export function kolamTexture() {
  return canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = '#b8a888';
    ctx.fillRect(0, 0, W, H);
    const c = W / 2;
    const rings = [[58, '#ffffff'], [50, '#e0312b'], [40, '#ffd21f'], [30, '#2f8f4a'], [20, '#f28c18'], [10, '#c22a6a']];
    for (const [r, col] of rings) {
      ctx.fillStyle = col;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const rr = i % 2 ? r * 0.82 : r;
        ctx.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(c + Math.cos(a) * 35, c + Math.sin(a) * 35, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, { key: 'hindu-temple:kolam', repeat: false });
}
