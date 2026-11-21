"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { MathUtils, TextureLoader, Vector2, Vector3, type Mesh, type ShaderMaterial } from "three";

/**
 * Escena WebGL del hero (DESIGN.md §7): las fotos de campaña como una tela que
 * ondula suave y se inclina hacia el puntero. Admite hasta 3 imágenes: una
 * sola tela las mezcla y, al cambiar de imagen, se funde entre ellas.
 * Es decorativa: se monta encima de las <Image> del servidor (que siguen
 * siendo el LCP) y solo aparece cuando las texturas ya cargaron.
 */

const SLOTS = 3;

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
  uniform sampler2D uTex0;
  uniform sampler2D uTex1;
  uniform sampler2D uTex2;
  uniform vec2 uScale0;
  uniform vec2 uScale1;
  uniform vec2 uScale2;
  uniform vec3 uWeights;
  varying vec2 vUv;
  varying float vShade;

  void main() {
    vec2 c = vUv - 0.5;
    vec4 color =
      texture2D(uTex0, c * uScale0 + 0.5) * uWeights.x +
      texture2D(uTex1, c * uScale1 + 0.5) * uWeights.y +
      texture2D(uTex2, c * uScale2 + 0.5) * uWeights.z;
    // La textura llega en sRGB: pasarla a lineal antes del colorspace de salida
    color.rgb = pow(color.rgb, vec3(2.2));
    color.rgb *= 1.0 + vShade * 0.35;
    gl_FragColor = color;
    #include <colorspace_fragment>
  }
`;

function ClothPlane({
  sources,
  index,
  onReady,
}: {
  sources: string[];
  index: number;
  onReady: () => void;
}) {
  // Siempre 3 texturas: si hay menos imágenes se repite la última
  const urls = useMemo(
    () => Array.from({ length: SLOTS }, (_, i) => sources[Math.min(i, sources.length - 1)]),
    [sources],
  );
  const textures = useLoader(TextureLoader, urls);
  const mesh = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const { viewport, invalidate } = useThree();

  const planeAspect = viewport.width / viewport.height;
  // object-fit: cover para cada textura dentro del plano
  const scales = textures.map((texture) => {
    const image = texture.image as { width: number; height: number };
    const imageAspect = image.width / image.height;
    return planeAspect > imageAspect
      ? new Vector2(1, imageAspect / planeAspect)
      : new Vector2(planeAspect / imageAspect, 1);
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new Vector2(0, 0) },
      uTex0: { value: textures[0] },
      uTex1: { value: textures[1] },
      uTex2: { value: textures[2] },
      uScale0: { value: new Vector2(1, 1) },
      uScale1: { value: new Vector2(1, 1) },
      uScale2: { value: new Vector2(1, 1) },
      uWeights: { value: new Vector3(1, 0, 0) },
    }),
    [textures],
  );

  useEffect(() => {
    const u = material.current?.uniforms;
    if (!u) return;
    u.uScale0.value.copy(scales[0]);
    u.uScale1.value.copy(scales[1]);
    u.uScale2.value.copy(scales[2]);
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planeAspect, textures, invalidate]);

  // Avisa recién cuando ya se dibujaron un par de cuadros: evita un destello oscuro al aparecer
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(onReady);
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [onReady]);

  useFrame((state, delta) => {
    const m = material.current;
    if (!mesh.current || !m) return;
    // Interpolación suave del puntero: la tela "persigue" al mouse
    pointer.current.x = MathUtils.damp(pointer.current.x, state.pointer.x, 4, delta);
    pointer.current.y = MathUtils.damp(pointer.current.y, state.pointer.y, 4, delta);
    m.uniforms.uTime.value += delta;
    m.uniforms.uPointer.value.set(pointer.current.x, pointer.current.y);

    // Fundido entre imágenes: cada peso se acerca a 1 (la activa) o a 0
    const w = m.uniforms.uWeights.value as Vector3;
    const target = Math.min(index, SLOTS - 1);
    w.x = MathUtils.damp(w.x, target === 0 ? 1 : 0, 2.5, delta);
    w.y = MathUtils.damp(w.y, target === 1 ? 1 : 0, 2.5, delta);
    w.z = MathUtils.damp(w.z, target === 2 ? 1 : 0, 2.5, delta);

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
  sources,
  index,
  active,
  onReady,
}: {
  sources: string[];
  /** Imagen que debe verse (0–2). */
  index: number;
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
        <ClothPlane sources={sources} index={index} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
