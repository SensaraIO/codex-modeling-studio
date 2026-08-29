import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type {
  CameraPreset,
  CaptureOptions,
  CaptureResult,
  ModelProject,
  ModelShape,
} from "../types";
import {
  buildCompositeGeometry,
  createPrimitiveGeometry,
  createReferenceObject,
  disposeObject,
} from "../lib/model";

export type CaptureView = (options: CaptureOptions) => Promise<CaptureResult>;

interface ViewRequest {
  preset: CameraPreset;
  nonce: number;
}

interface ModelViewportProps {
  project: ModelProject;
  selectedShape: ModelShape | null;
  onSelectModel: () => void;
  captureRef: React.MutableRefObject<CaptureView | null>;
  viewRequest: ViewRequest;
}

function viewPosition(
  preset: CameraPreset,
  box: THREE.Box3,
  aspect = 1,
): { position: THREE.Vector3; target: THREE.Vector3 } {
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z, 60);
  const distance = longest * (aspect < 0.8 ? 2.25 : 1.75);
  const target = center.clone();

  if (preset === "front") return { position: center.clone().add(new THREE.Vector3(0, -distance, 0)), target };
  if (preset === "right") return { position: center.clone().add(new THREE.Vector3(distance, 0, 0)), target };
  if (preset === "top") return { position: center.clone().add(new THREE.Vector3(0.001, 0, distance)), target };
  return {
    position: center.clone().add(new THREE.Vector3(distance * 0.9, -distance, distance * 0.72)),
    target,
  };
}

function SelectedShape({ shape }: { shape: ModelShape }) {
  const geometry = useMemo(() => createPrimitiveGeometry(shape), [shape]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      position={shape.position}
      rotation={shape.rotation.map(THREE.MathUtils.degToRad) as [number, number, number]}
      scale={shape.scale}
      renderOrder={2}
    >
      <meshBasicMaterial
        color={shape.role === "reference" ? "#f1c77d" : shape.operation === "cut" ? "#ff7b67" : "#9ed0ff"}
        wireframe
        transparent
        opacity={0.78}
        depthTest={false}
      />
    </mesh>
  );
}

function ReferenceModel({ shape }: { shape: ModelShape }) {
  const object = useMemo(() => createReferenceObject(shape), [shape]);
  useEffect(() => () => disposeObject(object), [object]);
  return <primitive object={object} />;
}

function CompositeModel({
  project,
  selectedShape,
  onSelectModel,
}: Pick<ModelViewportProps, "project" | "selectedShape" | "onSelectModel">) {
  const composite = useMemo(() => buildCompositeGeometry(project.shapes), [project.shapes]);
  useEffect(() => () => composite.geometry?.dispose(), [composite]);

  if (!composite.geometry) return null;
  return (
    <group>
      <mesh
        geometry={composite.geometry}
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelectModel();
        }}
      >
        <meshStandardMaterial
          color={project.color}
          roughness={project.roughness}
          metalness={project.metalness}
          envMapIntensity={0.7}
        />
      </mesh>
      {project.shapes
        .filter((shape) => shape.visible && shape.role === "reference")
        .map((shape) => <ReferenceModel key={shape.id} shape={shape} />)}
      {selectedShape?.visible ? <SelectedShape shape={selectedShape} /> : null}
    </group>
  );
}

function CameraController({ project, viewRequest }: { project: ModelProject; viewRequest: ViewRequest }) {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const composite = useMemo(() => buildCompositeGeometry(project.shapes), [project.shapes]);

  useEffect(() => () => composite.geometry?.dispose(), [composite]);

  useEffect(() => {
    if (!composite.geometry) return;
    composite.geometry.computeBoundingBox();
    const box = composite.geometry.boundingBox ?? new THREE.Box3(
      new THREE.Vector3(-40, -40, 0),
      new THREE.Vector3(40, 40, 80),
    );
    const next = viewPosition(viewRequest.preset, box, size.width / Math.max(size.height, 1));
    camera.up.set(0, 0, 1);
    camera.position.copy(next.position);
    camera.lookAt(next.target);
    camera.updateProjectionMatrix();
    controlsRef.current?.target.copy(next.target);
    controlsRef.current?.update();
  }, [camera, composite.geometry, size.height, size.width, viewRequest]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={25}
      maxDistance={900}
      target={[0, 0, 35]}
    />
  );
}

function CaptureBridge({
  project,
  captureRef,
}: Pick<ModelViewportProps, "project" | "captureRef">) {
  useEffect(() => {
    captureRef.current = async (options) => {
      const width = THREE.MathUtils.clamp(Math.round(options.width ?? 900), 320, 1600);
      const height = THREE.MathUtils.clamp(Math.round(options.height ?? 900), 320, 1600);
      const composite = buildCompositeGeometry(project.shapes);
      if (!composite.geometry) throw new Error(composite.error ?? "No model geometry is available.");

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: options.transparent, preserveDrawingBuffer: true });
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.setClearColor(options.transparent ? 0x000000 : 0x17171b, options.transparent ? 0 : 1);

      const scene = new THREE.Scene();
      const material = new THREE.MeshStandardMaterial({
        color: project.color,
        roughness: project.roughness,
        metalness: project.metalness,
      });
      const mesh = new THREE.Mesh(composite.geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const referenceObjects = project.shapes
        .filter((shape) => shape.visible && shape.role === "reference")
        .map((shape) => createReferenceObject(shape));
      referenceObjects.forEach((object) => scene.add(object));

      if (!options.transparent) {
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(900, 900),
          new THREE.MeshStandardMaterial({ color: 0x202024, roughness: 0.95 }),
        );
        ground.position.z = -0.08;
        ground.receiveShadow = true;
        scene.add(ground);
      }

      scene.add(new THREE.HemisphereLight(0xdde8ff, 0x26202f, 2.4));
      const key = new THREE.DirectionalLight(0xffffff, 4.5);
      key.position.set(-150, -180, 260);
      key.castShadow = true;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xa6bbff, 2.2);
      rim.position.set(220, 80, 140);
      scene.add(rim);

      composite.geometry.computeBoundingBox();
      const box = composite.geometry.boundingBox ?? new THREE.Box3();
      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 4_000);
      camera.up.set(0, 0, 1);
      const view = viewPosition(options.view, box, width / height);
      camera.position.copy(view.position);
      camera.lookAt(view.target);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);

      const dataUrl = renderer.domElement.toDataURL("image/png");
      composite.geometry.dispose();
      material.dispose();
      referenceObjects.forEach(disposeObject);
      renderer.dispose();
      return { dataUrl, width, height, view: options.view };
    };

    return () => {
      captureRef.current = null;
    };
  }, [captureRef, project]);

  return null;
}

export function ModelViewport(props: ModelViewportProps) {
  return (
    <Canvas
      className="model-canvas"
      shadows
      dpr={[1, 2]}
      camera={{ position: [150, -180, 130], fov: 38, near: 0.1, far: 4_000, up: [0, 0, 1] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onPointerMissed={() => props.onSelectModel()}
    >
      <color attach="background" args={["#17171b"]} />
      <fog attach="fog" args={["#17171b", 320, 760]} />
      <hemisphereLight args={["#dce8ff", "#281f30", 2.2]} />
      <directionalLight
        position={[-130, -180, 240]}
        intensity={3.8}
        color="#fffdf7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={600}
        shadow-camera-left={-180}
        shadow-camera-right={180}
        shadow-camera-top={180}
        shadow-camera-bottom={-180}
      />
      <directionalLight position={[180, 90, 160]} intensity={1.8} color="#9bb6ff" />
      <Grid
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -0.12]}
        args={[700, 700]}
        cellSize={10}
        cellThickness={0.55}
        cellColor="#3d3d43"
        sectionSize={50}
        sectionThickness={0.9}
        sectionColor="#575761"
        fadeDistance={440}
        fadeStrength={1.2}
        infiniteGrid
      />
      <mesh position={[0, 0, -0.3]} receiveShadow>
        <planeGeometry args={[850, 850]} />
        <shadowMaterial color="#08080a" transparent opacity={0.3} />
      </mesh>
      <CompositeModel
        project={props.project}
        selectedShape={props.selectedShape}
        onSelectModel={props.onSelectModel}
      />
      <CameraController project={props.project} viewRequest={props.viewRequest} />
      <CaptureBridge project={props.project} captureRef={props.captureRef} />
    </Canvas>
  );
}
