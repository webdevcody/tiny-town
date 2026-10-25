// Static batching for the world view. Buildings arrive as deep trees of small
// meshes (often hundreds each, ~55k for the whole town), which would be one
// draw call apiece. Here every mesh is baked into world space and merged into
// one geometry per (chunk, material family):
//
//  - Plain MeshStandardMaterials that differ only in colour share a family:
//    the colour moves into a vertex-colour attribute and one material draws
//    them all. Textured materials group by texture (colour still per vertex).
//  - Anything unusual (other texture slots, custom materials) keeps its own
//    material, still merged per chunk.
//  - Chunks are spatial (a few city blocks each) so frustum culling and
//    raycasting still skip off-screen parts of town.
//
// Each merged geometry remembers which triangles came from which building, so
// a raycast hit maps back to a building id.

import * as THREE from 'three';

const OTHER_MAPS = ['lightMap', 'aoMap', 'emissiveMap', 'bumpMap', 'normalMap', 'displacementMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'envMap'];
const BASE_COMPILE = THREE.Material.prototype.onBeforeCompile;

/** Key shared by materials that can be drawn as one once colour is per-vertex, or null. */
function familyKey(m) {
  if (m.type !== 'MeshStandardMaterial' || m.vertexColors || m.onBeforeCompile !== BASE_COMPILE) return null;
  if (OTHER_MAPS.some((s) => m[s])) return null;
  return [
    m.map ? m.map.uuid : '-',
    m.roughness,
    m.metalness,
    m.flatShading,
    m.transparent,
    m.opacity,
    m.side,
    m.emissive.getHexString(),
    m.emissiveIntensity,
    m.alphaTest,
    m.depthWrite,
    m.depthTest,
    m.envMapIntensity,
    m.wireframe,
    m.polygonOffset && `${m.polygonOffsetFactor}/${m.polygonOffsetUnits}`,
    m.blending,
    m.toneMapped,
  ].join('|');
}

const familyMaterials = new Map();
function familyMaterial(key, template) {
  if (!familyMaterials.has(key)) {
    const m = template.clone();
    m.color.set('#ffffff');
    m.vertexColors = true;
    m.name = 'family:' + (template.map ? 'tex' : 'plain');
    familyMaterials.set(key, m);
  }
  return familyMaterials.get(key);
}

export class WorldBatcher {
  constructor() {
    this.buckets = new Map(); // `${chunk}#${materialKey}` -> { material, family, parts: [] }
    this.loose = []; // lines / points / sprites we don't merge
    this.stats = { meshes: 0, parts: 0, vertices: 0 };
  }

  /** Queue every visible mesh under `root` (world matrices must be up to date). */
  add(root, buildingId, chunk) {
    const visit = (o) => {
      if (!o.visible) return;
      if (o.isMesh) this._addMesh(o, buildingId, chunk);
      else if (o.isLine || o.isPoints || o.isSprite) this.loose.push({ obj: o, buildingId });
      for (const c of o.children) visit(c);
    };
    visit(root);
  }

  _addMesh(mesh, buildingId, chunk) {
    this.stats.meshes++;
    const geom = mesh.geometry;
    if (!geom?.attributes?.position) return;
    if (!geom.attributes.normal) geom.computeVertexNormals();
    const total = geom.index ? geom.index.count : geom.attributes.position.count;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const ranges = Array.isArray(mesh.material) && geom.groups.length
      ? geom.groups.map((g) => ({ start: g.start, count: Math.min(g.count, total - g.start), material: mats[g.materialIndex] }))
      : [{ start: 0, count: total, material: mats[0] }];

    const matrices = [];
    const colors = [];
    if (mesh.isInstancedMesh) {
      const m = new THREE.Matrix4();
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, m);
        matrices.push(new THREE.Matrix4().multiplyMatrices(mesh.matrixWorld, m));
        colors.push(mesh.instanceColor ? mesh.getColorAt(i, new THREE.Color()) : null);
      }
    } else {
      matrices.push(mesh.matrixWorld.clone());
      colors.push(null);
    }

    for (const r of ranges) {
      if (!r.material || !r.material.visible || r.count <= 0) continue;
      const fam = familyKey(r.material);
      const key = chunk + '#' + (fam ? 'F' + fam : 'U' + r.material.uuid);
      let bucket = this.buckets.get(key);
      if (!bucket) {
        bucket = {
          chunk,
          family: !!fam,
          material: fam ? familyMaterial(fam, r.material) : r.material,
          uv: !!r.material.map || !fam,
          parts: [],
        };
        this.buckets.set(key, bucket);
      }
      matrices.forEach((matrix, i) => {
        let color = null;
        if (fam) {
          color = r.material.color.clone();
          if (colors[i]) color.multiply(colors[i]);
        }
        bucket.parts.push({ geom, start: r.start, count: r.count, matrix, color, buildingId });
        this.stats.parts++;
      });
    }
  }

  /** Build the merged meshes. Returns { meshes: Mesh[], loose: Object3D[] }. */
  build() {
    const meshes = [];
    for (const bucket of this.buckets.values()) {
      const geometry = mergeParts(bucket);
      this.stats.vertices += geometry.attributes.position.count;
      const mesh = new THREE.Mesh(geometry, bucket.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      mesh.userData.chunk = bucket.chunk;
      meshes.push(mesh);
    }
    const loose = this.loose.map(({ obj, buildingId }) => {
      obj.updateWorldMatrix(true, false);
      const m = obj.matrixWorld.clone();
      obj.removeFromParent();
      m.decompose(obj.position, obj.quaternion, obj.scale);
      obj.userData.buildingId = buildingId;
      return obj;
    });
    this.buckets.clear();
    this.loose = [];
    return { meshes, loose };
  }
}

/** Merge one bucket's parts into a single indexed geometry in world space. */
function mergeParts(bucket) {
  // pass 1: per part, the source vertices it uses and its remapped triangle list
  let vertexTotal = 0;
  let indexTotal = 0;
  const prepared = bucket.parts.map((p) => {
    const src = p.geom.index;
    const n = p.geom.attributes.position.count;
    let verts, local;
    if (src) {
      const remap = new Int32Array(n).fill(-1);
      verts = [];
      local = new Uint32Array(p.count);
      for (let k = 0; k < p.count; k++) {
        const v = src.getX(p.start + k);
        if (remap[v] < 0) {
          remap[v] = verts.length;
          verts.push(v);
        }
        local[k] = remap[v];
      }
    } else {
      verts = new Array(p.count);
      local = new Uint32Array(p.count);
      for (let k = 0; k < p.count; k++) {
        verts[k] = p.start + k;
        local[k] = k;
      }
    }
    const tri = local.length - (local.length % 3);
    vertexTotal += verts.length;
    indexTotal += tri;
    return { p, verts, local, tri };
  });

  const pos = new Float32Array(vertexTotal * 3);
  const nor = new Float32Array(vertexTotal * 3);
  const uv = bucket.uv ? new Float32Array(vertexTotal * 2) : null;
  const col = bucket.family ? new Float32Array(vertexTotal * 3) : null;
  const index = vertexTotal > 65535 ? new Uint32Array(indexTotal) : new Uint16Array(indexTotal);
  // picking table: first triangle of each run of triangles from one building
  const runStart = [];
  const runId = [];

  const v = new THREE.Vector3();
  const nm = new THREE.Matrix3();
  let vo = 0;
  let io = 0;
  for (const { p, verts, local, tri } of prepared) {
    const a = p.geom.attributes;
    nm.getNormalMatrix(p.matrix);
    const flip = p.matrix.determinant() < 0;
    for (let k = 0; k < verts.length; k++) {
      const s = verts[k];
      const d = vo + k;
      v.fromBufferAttribute(a.position, s).applyMatrix4(p.matrix);
      pos[d * 3] = v.x;
      pos[d * 3 + 1] = v.y;
      pos[d * 3 + 2] = v.z;
      v.fromBufferAttribute(a.normal, s).applyMatrix3(nm).normalize();
      nor[d * 3] = v.x;
      nor[d * 3 + 1] = v.y;
      nor[d * 3 + 2] = v.z;
      if (uv && a.uv) {
        uv[d * 2] = a.uv.getX(s);
        uv[d * 2 + 1] = a.uv.getY(s);
      }
      if (col) {
        col[d * 3] = p.color.r;
        col[d * 3 + 1] = p.color.g;
        col[d * 3 + 2] = p.color.b;
      }
    }
    if (runId.at(-1) !== p.buildingId) {
      runStart.push(io / 3);
      runId.push(p.buildingId);
    }
    for (let k = 0; k < tri; k += 3) {
      index[io++] = vo + local[k];
      index[io++] = vo + local[flip ? k + 2 : k + 1];
      index[io++] = vo + local[flip ? k + 1 : k + 2];
    }
    vo += verts.length;
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  g.userData.runStart = Uint32Array.from(runStart);
  g.userData.runId = Int32Array.from(runId);
  return g;
}

/** Building id for a raycast hit on a merged mesh (or a loose object). */
export function buildingIdOf(hit) {
  const o = hit.object;
  if (o.userData.buildingId !== undefined) return o.userData.buildingId;
  const { runStart, runId } = o.geometry.userData;
  if (!runStart || hit.faceIndex == null) return -1;
  let lo = 0, hi = runStart.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (runStart[mid] <= hit.faceIndex) lo = mid;
    else hi = mid - 1;
  }
  return runId[lo];
}
