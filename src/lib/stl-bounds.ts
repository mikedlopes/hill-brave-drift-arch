/** Binary STL: 80-byte header + u32 count + 50 bytes/triangle. */

export type StlBounds = {
  triangles: number;
  min: [number, number, number];
  max: [number, number, number];
  size: [number, number, number];
};

export function readBinaryStl(data: ArrayBuffer | Uint8Array): StlBounds {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.byteLength < 84) throw new Error("STL too small");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const triangles = view.getUint32(80, true);
  const expect = 84 + triangles * 50;
  if (bytes.byteLength < expect) throw new Error(`STL truncated (${bytes.byteLength} < ${expect})`);
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0, o = 84; i < triangles; i++, o += 50) {
    for (let v = 0; v < 3; v++) {
      const x = view.getFloat32(o + 12 + v * 12, true);
      const y = view.getFloat32(o + 16 + v * 12, true);
      const z = view.getFloat32(o + 20 + v * 12, true);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }
  }
  return {
    triangles,
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    size: [maxX - minX, maxY - minY, maxZ - minZ],
  };
}
