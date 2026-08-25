import { Suspense, useEffect, useLayoutEffect, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { BoxGeometry, DoubleSide, type BufferGeometry } from "three";
import { buildVoronoiLidParts, LID } from "@/lib/voronoi-lid";

export type PartView = "lid" | "bottom" | "assembled";

const FILAMENT = "#e24a1c";
const LID_Z = 8.05;

const filamentMat = {
  color: FILAMENT,
  roughness: 0.42,
  metalness: 0.06,
  envMapIntensity: 0.4,
  side: DoubleSide,
} as const;

function StlPart({ url, position }: { url: string; position?: [number, number, number] }) {
  const geom = useLoader(STLLoader, url) as BufferGeometry;

  useLayoutEffect(() => {
    geom.computeVertexNormals();
    geom.computeBoundingBox();
  }, [geom]);

  return (
    <mesh geometry={geom} position={position} castShadow receiveShadow>
      <meshStandardMaterial {...filamentMat} />
    </mesh>
  );
}

function LidMesh({ scale, position }: { scale: number; position?: [number, number, number] }) {
  const parts = useMemo(() => buildVoronoiLidParts(scale), [scale]);
  const bar = useMemo(() => new BoxGeometry(1, 1, 1), []);

  useEffect(() => {
    return () => {
      parts.frame.dispose();
      parts.lip.dispose();
      parts.pads.dispose();
    };
  }, [parts]);

  useEffect(() => {
    return () => bar.dispose();
  }, [bar]);

  return (
    <group position={position}>
      <mesh geometry={parts.frame} castShadow receiveShadow>
        <meshStandardMaterial {...filamentMat} />
      </mesh>
      <mesh geometry={parts.lip} castShadow receiveShadow>
        <meshStandardMaterial {...filamentMat} />
      </mesh>
      <mesh geometry={parts.pads} castShadow receiveShadow>
        <meshStandardMaterial {...filamentMat} />
      </mesh>
      {parts.edges.map((e, i) => (
        <mesh
          key={i}
          geometry={bar}
          position={[e.x, e.y, LID.thick / 2]}
          rotation={[0, 0, e.rotZ]}
          scale={[e.len + parts.wallW, parts.wallW, LID.thick]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial {...filamentMat} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ view, scale }: { view: PartView; scale: number }) {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {view !== "lid" && <StlPart url="/models/pi_zero_case_bottom.stl" />}
      {view !== "bottom" && (
        <LidMesh scale={scale} position={view === "assembled" ? [0, 0, LID_Z] : undefined} />
      )}
    </group>
  );
}

export function CaseViewer({
  view,
  autoRotate,
  scale,
}: {
  view: PartView;
  autoRotate: boolean;
  scale: number;
}) {
  return (
    <Canvas
      className="h-full w-full touch-none"
      dpr={[1, 2]}
      shadows
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [42, 36, 58], fov: 32, near: 0.5, far: 400 }}
    >
      <color attach="background" args={["#111110"]} />
      <ambientLight intensity={0.38} />
      <hemisphereLight args={["#ffd7c2", "#1c1814", 0.65]} />
      <directionalLight
        position={[50, 70, 28]}
        intensity={1.55}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-40, 24, -18]} intensity={0.32} />
      <spotLight position={[0, 90, 10]} intensity={0.45} angle={0.45} penumbra={0.6} />

      <Suspense fallback={null}>
        <Scene view={view} scale={scale} />
      </Suspense>

      <ContactShadows position={[0, -12, 0]} opacity={0.38} scale={90} blur={2.4} far={28} color="#0a0908" />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.7}
        minDistance={38}
        maxDistance={140}
        maxPolarAngle={Math.PI / 1.55}
      />
    </Canvas>
  );
}
