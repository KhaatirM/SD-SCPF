"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Pose = {
  hipY: number;
  torsoRot: [number, number, number];
  headRot: [number, number, number];
  lArm: [number, number, number];
  rArm: [number, number, number];
  lFore: [number, number, number];
  rFore: [number, number, number];
  lLeg: [number, number, number];
  rLeg: [number, number, number];
  lShin: [number, number, number];
  rShin: [number, number, number];
  rootY: number;
  rootRotY: number;
};

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const k = THREE.MathUtils.smoothstep(t, 0, 1);
  const mix3 = (
    x: [number, number, number],
    y: [number, number, number],
  ): [number, number, number] => [
    THREE.MathUtils.lerp(x[0], y[0], k),
    THREE.MathUtils.lerp(x[1], y[1], k),
    THREE.MathUtils.lerp(x[2], y[2], k),
  ];
  return {
    hipY: THREE.MathUtils.lerp(a.hipY, b.hipY, k),
    torsoRot: mix3(a.torsoRot, b.torsoRot),
    headRot: mix3(a.headRot, b.headRot),
    lArm: mix3(a.lArm, b.lArm),
    rArm: mix3(a.rArm, b.rArm),
    lFore: mix3(a.lFore, b.lFore),
    rFore: mix3(a.rFore, b.rFore),
    lLeg: mix3(a.lLeg, b.lLeg),
    rLeg: mix3(a.rLeg, b.rLeg),
    lShin: mix3(a.lShin, b.lShin),
    rShin: mix3(a.rShin, b.rShin),
    rootY: THREE.MathUtils.lerp(a.rootY, b.rootY, k),
    rootRotY: THREE.MathUtils.lerp(a.rootRotY, b.rootRotY, k),
  };
}

const ATTENTION: Pose = {
  hipY: 0,
  torsoRot: [0.02, 0, 0],
  headRot: [0, 0, 0],
  lArm: [0.08, 0, 0.12],
  rArm: [0.08, 0, -0.12],
  lFore: [0.15, 0, 0],
  rFore: [0.15, 0, 0],
  lLeg: [0.02, 0, 0.04],
  rLeg: [0.02, 0, -0.04],
  lShin: [0.04, 0, 0],
  rShin: [0.04, 0, 0],
  rootY: 0,
  rootRotY: 0.15,
};

const GUARD: Pose = {
  hipY: 0,
  torsoRot: [0.04, 0.35, 0],
  headRot: [0, -0.2, 0],
  lArm: [0.45, 0.2, 0.35],
  rArm: [-0.55, -0.15, -0.55],
  lFore: [0.55, 0, 0],
  rFore: [1.1, 0, 0],
  lLeg: [0.15, 0, 0.18],
  rLeg: [-0.05, 0, -0.22],
  lShin: [0.2, 0, 0],
  rShin: [0.35, 0, 0],
  rootY: 0,
  rootRotY: -0.2,
};

function trainingPose(phase: number): Pose {
  const swing = Math.sin(phase * Math.PI * 2);
  return {
    hipY: Math.abs(swing) * 0.04,
    torsoRot: [0.08, swing * 0.25, 0],
    headRot: [0.05, -swing * 0.2, 0],
    lArm: [-0.9 + swing * 0.5, 0.1, 0.2],
    rArm: [-1.2 - swing * 0.35, -0.2, -0.45],
    lFore: [0.9, 0, 0],
    rFore: [1.25, 0, 0],
    lLeg: [0.35 + swing * 0.25, 0, 0.1],
    rLeg: [0.1 - swing * 0.35, 0, -0.15],
    lShin: [0.45, 0, 0],
    rShin: [0.55, 0, 0],
    rootY: Math.abs(swing) * 0.03,
    rootRotY: swing * 0.15,
  };
}

function runPose(phase: number): Pose {
  const a = Math.sin(phase * Math.PI * 2);
  const b = Math.cos(phase * Math.PI * 2);
  return {
    hipY: Math.abs(a) * 0.08,
    torsoRot: [0.18, a * 0.12, 0],
    headRot: [0.08, 0, 0],
    lArm: [-0.9 * a, 0, 0.15],
    rArm: [0.9 * a, 0, -0.15],
    lFore: [0.7 + Math.max(0, -a) * 0.4, 0, 0],
    rFore: [0.7 + Math.max(0, a) * 0.4, 0, 0],
    lLeg: [0.95 * a, 0, 0.05],
    rLeg: [-0.95 * a, 0, -0.05],
    lShin: [0.55 + Math.max(0, -a) * 0.7, 0, 0],
    rShin: [0.55 + Math.max(0, a) * 0.7, 0, 0],
    rootY: Math.abs(b) * 0.06,
    rootRotY: a * 0.08,
  };
}

function fightPose(phase: number): Pose {
  const punch = Math.sin(phase * Math.PI * 2);
  const kick = Math.sin(phase * Math.PI * 2 + 1.2);
  return {
    hipY: Math.max(0, -kick) * 0.12,
    torsoRot: [0.12, punch * 0.55, punch * 0.08],
    headRot: [0, -punch * 0.25, 0],
    lArm: [-0.4 + punch * 0.3, 0.35, 0.5],
    rArm: [-1.6 - Math.max(0, punch) * 0.7, -0.35, -0.35],
    lFore: [0.8, 0, 0],
    rFore: [0.2 + Math.max(0, punch) * 0.2, 0, 0],
    lLeg: [0.25, 0, 0.2],
    rLeg: [-0.15 + Math.max(0, kick) * 1.1, 0, -0.25],
    lShin: [0.35, 0, 0],
    rShin: [0.2 + Math.max(0, kick) * 0.5, 0, 0],
    rootY: Math.max(0, kick) * 0.08,
    rootRotY: -0.35 + punch * 0.2,
  };
}

function poseFromProgress(p: number): Pose {
  const t = THREE.MathUtils.clamp(p, 0, 1);
  if (t < 0.18) {
    return lerpPose(ATTENTION, GUARD, t / 0.18);
  }
  if (t < 0.42) {
    const local = (t - 0.18) / 0.24;
    return lerpPose(GUARD, trainingPose(local * 2.2), Math.min(1, local * 1.4));
  }
  if (t < 0.7) {
    const local = (t - 0.42) / 0.28;
    const from = trainingPose(2.2);
    return lerpPose(from, runPose(local * 3.4), Math.min(1, local * 1.5));
  }
  const local = (t - 0.7) / 0.3;
  return lerpPose(runPose(3.4), fightPose(local * 2.6), Math.min(1, local * 1.35));
}

type LimbProps = {
  color: string;
  args: [number, number, number];
  position?: [number, number, number];
};

function Limb({ color, args, position = [0, 0, 0] }: LimbProps) {
  return (
    <mesh castShadow receiveShadow position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.25} />
    </mesh>
  );
}

export function SdOperative({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
}) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const lFore = useRef<THREE.Group>(null);
  const rFore = useRef<THREE.Group>(null);
  const lLeg = useRef<THREE.Group>(null);
  const rLeg = useRef<THREE.Group>(null);
  const lShin = useRef<THREE.Group>(null);
  const rShin = useRef<THREE.Group>(null);

  const colors = useMemo(
    () => ({
      armor: "#2a322e",
      plate: "#3d4740",
      trim: "#d2c49a",
      hot: "#d4a017",
      cloth: "#1c221d",
      visor: "#0b0d0c",
      skin: "#4a433c",
    }),
    [],
  );

  useFrame(() => {
    const pose = poseFromProgress(progressRef.current);
    if (!root.current) return;
    root.current.position.y = pose.rootY;
    root.current.rotation.y = pose.rootRotY;

    if (torso.current) torso.current.rotation.set(...pose.torsoRot);
    if (head.current) head.current.rotation.set(...pose.headRot);
    if (lArm.current) lArm.current.rotation.set(...pose.lArm);
    if (rArm.current) rArm.current.rotation.set(...pose.rArm);
    if (lFore.current) lFore.current.rotation.set(...pose.lFore);
    if (rFore.current) rFore.current.rotation.set(...pose.rFore);
    if (lLeg.current) lLeg.current.rotation.set(...pose.lLeg);
    if (rLeg.current) rLeg.current.rotation.set(...pose.rLeg);
    if (lShin.current) lShin.current.rotation.set(...pose.lShin);
    if (rShin.current) rShin.current.rotation.set(...pose.rShin);
  });

  return (
    <group ref={root} position={[0, -1.25, 0]} scale={1.05}>
      {/* legs */}
      <group ref={lLeg} position={[-0.22, 0.95, 0]}>
        <Limb color={colors.cloth} args={[0.28, 0.55, 0.28]} position={[0, -0.28, 0]} />
        <group ref={lShin} position={[0, -0.55, 0]}>
          <Limb color={colors.armor} args={[0.26, 0.5, 0.26]} position={[0, -0.25, 0]} />
          <Limb color={colors.plate} args={[0.32, 0.14, 0.38]} position={[0, -0.52, 0.04]} />
        </group>
      </group>
      <group ref={rLeg} position={[0.22, 0.95, 0]}>
        <Limb color={colors.cloth} args={[0.28, 0.55, 0.28]} position={[0, -0.28, 0]} />
        <group ref={rShin} position={[0, -0.55, 0]}>
          <Limb color={colors.armor} args={[0.26, 0.5, 0.26]} position={[0, -0.25, 0]} />
          <Limb color={colors.plate} args={[0.32, 0.14, 0.38]} position={[0, -0.52, 0.04]} />
        </group>
      </group>

      {/* hips / lower armor */}
      <Limb color={colors.plate} args={[0.62, 0.28, 0.36]} position={[0, 1.05, 0]} />

      <group ref={torso} position={[0, 1.2, 0]}>
        <Limb color={colors.armor} args={[0.72, 0.85, 0.4]} position={[0, 0.42, 0]} />
        <Limb color={colors.plate} args={[0.78, 0.35, 0.46]} position={[0, 0.55, 0.02]} />
        <Limb color={colors.trim} args={[0.18, 0.08, 0.48]} position={[0, 0.72, 0.01]} />
        <Limb color={colors.hot} args={[0.12, 0.22, 0.06]} position={[0.22, 0.48, 0.22]} />
        {/* collar / shoulder plates */}
        <Limb color={colors.plate} args={[0.95, 0.16, 0.42]} position={[0, 0.88, 0]} />

        <group ref={head} position={[0, 1.05, 0]}>
          <Limb color={colors.skin} args={[0.34, 0.34, 0.3]} position={[0, 0.12, 0]} />
          <Limb color={colors.armor} args={[0.4, 0.28, 0.38]} position={[0, 0.28, 0]} />
          <Limb color={colors.visor} args={[0.36, 0.1, 0.16]} position={[0, 0.2, 0.14]} />
          <Limb color={colors.trim} args={[0.42, 0.06, 0.42]} position={[0, 0.4, 0]} />
        </group>

        <group ref={lArm} position={[-0.48, 0.78, 0]}>
          <Limb color={colors.armor} args={[0.24, 0.42, 0.24]} position={[0, -0.22, 0]} />
          <group ref={lFore} position={[0, -0.44, 0]}>
            <Limb color={colors.plate} args={[0.22, 0.4, 0.22]} position={[0, -0.2, 0]} />
            <Limb color={colors.cloth} args={[0.2, 0.14, 0.2]} position={[0, -0.42, 0]} />
          </group>
        </group>
        <group ref={rArm} position={[0.48, 0.78, 0]}>
          <Limb color={colors.armor} args={[0.24, 0.42, 0.24]} position={[0, -0.22, 0]} />
          <group ref={rFore} position={[0, -0.44, 0]}>
            <Limb color={colors.plate} args={[0.22, 0.4, 0.22]} position={[0, -0.2, 0]} />
            <Limb color={colors.cloth} args={[0.2, 0.14, 0.2]} position={[0, -0.42, 0]} />
            {/* baton / tool */}
            <Limb color={colors.trim} args={[0.08, 0.55, 0.08]} position={[0.02, -0.55, 0.08]} />
          </group>
        </group>
      </group>
    </group>
  );
}
