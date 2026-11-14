"use client";

import { useEffect, useMemo, type MutableRefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SdOperative } from "./SdOperative";

function SceneContent({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
  reduced?: boolean;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    camera.position.set(0.35, 1.85, 5.2);
    camera.lookAt(0, 0.35, 0);
    gl.setClearColor(new THREE.Color("#080a09"), 0);
    return () => {
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose?.();
        }
      });
      gl.dispose();
    };
  }, [camera, gl, scene]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        intensity={1.85}
        position={[3.5, 6.5, 4]}
        shadow-mapSize={[512, 512]}
        color="#f5ecd4"
      />
      <directionalLight intensity={0.65} position={[-4, 3, -1.5]} color="#8aa884" />
      <spotLight
        intensity={0.9}
        position={[0.5, 5.5, 3]}
        angle={0.5}
        penumbra={0.7}
        color="#d4a017"
      />
      <pointLight intensity={0.45} position={[-1.5, 1.2, 2.5]} color="#c4b58a" />
      <SdOperative progressRef={progressRef} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]} receiveShadow>
        <circleGeometry args={[3.6, 48]} />
        <meshStandardMaterial color="#141a15" roughness={0.9} metalness={0.08} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.14, 0]}>
        <circleGeometry args={[1.15, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>
      <fog attach="fog" args={["#080a09", 8, 16]} />
    </>
  );
}

export function SdFigureCanvas({
  progressRef,
  reduced,
}: {
  progressRef: MutableRefObject<number>;
  reduced?: boolean;
}) {
  const dpr = useMemo(() => (reduced ? ([1, 1] as [number, number]) : ([1, 1.5] as [number, number])), [reduced]);

  return (
    <Canvas
      className="sd-figure-canvas"
      dpr={dpr}
      shadows={!reduced}
      gl={{
        antialias: !reduced,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      camera={{ fov: 42, near: 0.1, far: 40 }}
      frameloop="always"
      onCreated={({ gl }) => {
        gl.domElement.style.touchAction = "none";
      }}
    >
      <SceneContent progressRef={progressRef} />
    </Canvas>
  );
}
