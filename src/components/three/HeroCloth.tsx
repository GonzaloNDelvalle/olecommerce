"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { MathUtils, TextureLoader, Vector2, type Mesh, type ShaderMaterial } from "three";

/**
 * Escena WebGL del hero (DESIGN.md §7): la foto de campaña como una tela que
 * ondula suave y se inclina hacia el puntero. Es decorativa: se monta encima
 * de la <Image> del servidor (que sigue siendo el LCP) y solo aparece cuando
 * la textura ya cargó.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  varying vec2 vUv;
  varying float vShade;

  void main() {
    vUv = uv;
    vec3 p = position;
    float wave = sin(p.x * 2.4 + uTime * 0.9) * 0.035 + sin(p.y * 3.1 + uTime * 0.7) * 0.025;
    float d = distance(uv, uPointer * 0.5 + 0.5);
    float bump = smoothstep(0.45, 0.0, d) * 0.06;
    p.z += wave + bump;
    vShade = wave * 4.0 + bump * 3.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uUvScale;
  varying vec2 vUv;
  varying float vShade;

  void main() {
    vec2 uv = (vUv - 0.5) * uUvScale + 0.5;
    vec4 color = texture2D(uTexture, uv);
    // La textura llega en sRGB: pasarla a lineal antes del colorspace de salida
    color.rgb = pow(color.rgb, vec3(2.2));
    color.rgb *= 1.0 + vShade * 0.35;
    gl_FragColor = color;
    #include <colorspace_fragment>
  }
`;

function ClothPlane({ src, onReady }: { src: string; onReady: () => void }) {
  const texture = useLoader(TextureLoader, src);
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const { viewport, invalidate } = useThree();

  // object-fit: cover para la textura dentro del plano
  const image = texture.image as { width: number; height: number };
  const planeAspect = viewport.width / viewport.height;
  const imageAspect = image.width / image.height;
  const scaleX = planeAspect > imageAspect ? 1 : planeAspect / imageAspect;
  const scaleY = planeAspect > imageAspect ? imageAspect / planeAspect : 1;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new Vector2(0, 0) },
      uTexture: { value: texture },
      uUvScale: { value: new Vector2(1, 1) },
    }),
    [texture],
  );

  useEffect(() => {
    material.current?.uniforms.uUvScale.value.set(scaleX, scaleY);
    invalidate();
  }, [scaleX, scaleY, invalidate]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  useFrame((state, delta) => {
    const m = material.current;
    if (!mesh.current || !m) return;
    // Interpolación suave del puntero: la tela "persigue" al mouse
    pointer.current.x = MathUtils.damp(pointer.current.x, state.pointer.x, 4, delta);
    pointer.current.y = MathUtils.damp(pointer.current.y, state.pointer.y, 4, delta);
    m.uniforms.uTime.value += delta;
    m.uniforms.uPointer.value.set(pointer.current.x, pointer.current.y);
    // Giro sutil: el plano es más grande que la pantalla y nunca muestra sus bordes
    mesh.current.rotation.y = pointer.current.x * 0.06;
    mesh.current.rotation.x = -pointer.current.y * 0.04;
  });

  return (
    <mesh ref={mesh} scale={[viewport.width * 1.16, viewport.height * 1.16, 1]}>
      <planeGeometry args={[1, 1, 64, 64]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

export default function HeroCloth({
  src,
  active,
  onReady,
}: {
  src: string;
  /** false cuando el hero sale de pantalla: se pausa el render. */
  active: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 1.6], fov: 35 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <ClothPlane src={src} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
