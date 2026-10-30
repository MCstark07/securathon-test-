import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ShieldCheck, ShieldAlert, Cpu, Activity } from 'lucide-react';

export default function Vault3DCore({ isTampered = false }) {
  const mountRef = useRef(null);
  const isTamperedRef = useRef(isTampered);

  // Keep ref in sync for animation loop
  useEffect(() => {
    isTamperedRef.current = isTampered;
  }, [isTampered]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 280;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 2. Cryptographic Enclave: Wireframe Icosahedron
    const coreGeometry = new THREE.IcosahedronGeometry(1.7, 1);
    const wireframeGeometry = new THREE.WireframeGeometry(coreGeometry);

    const coreMaterial = new THREE.LineBasicMaterial({
      color: 0x34d399,
      linewidth: 2,
      transparent: true,
      opacity: 0.95
    });
    const coreMesh = new THREE.LineSegments(wireframeGeometry, coreMaterial);
    scene.add(coreMesh);

    // Inner pulsing solid core
    const innerGeometry = new THREE.IcosahedronGeometry(0.9, 0);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: false,
      transparent: true,
      opacity: 0.35
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerMesh);

    // 3. Floating Particle Cloud
    const particleCount = 280;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.4 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x06b6d4, // Cyan
      size: 0.07,
      transparent: true,
      opacity: 0.85
    });
    const particleCloud = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleCloud);

    // 4. Mouse movement tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouseX = x * 1.2;
      targetMouseY = y * 0.8;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // 5. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const tampered = isTamperedRef.current;

      // Color transitions
      const targetCoreColor = tampered ? 0xf87171 : 0x34d399; // Red alert vs Emerald green
      const targetInnerColor = tampered ? 0xef4444 : 0x10b981;
      const targetParticleColor = tampered ? 0xf43f5e : 0x06b6d4; // Crimson vs Cyan

      coreMaterial.color.setHex(targetCoreColor);
      innerMaterial.color.setHex(targetInnerColor);
      particleMaterial.color.setHex(targetParticleColor);

      // Mouse tracking interpolation
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;
      camera.position.x = currentMouseX * 1.5;
      camera.position.y = currentMouseY * 1.2;
      camera.lookAt(0, 0, 0);

      // Rotation speeds & glitch effects
      if (!tampered) {
        // Nominal smooth rotation
        coreMesh.rotation.x = elapsedTime * 0.35;
        coreMesh.rotation.y = elapsedTime * 0.5;
        innerMesh.rotation.x = -elapsedTime * 0.4;
        innerMesh.rotation.y = -elapsedTime * 0.6;
        particleCloud.rotation.y = elapsedTime * 0.15;
        particleCloud.rotation.x = elapsedTime * 0.08;

        // Reset any jitter
        coreMesh.position.set(0, 0, 0);
        innerMesh.position.set(0, 0, 0);
        const pulse = 1 + Math.sin(elapsedTime * 2.5) * 0.04;
        innerMesh.scale.set(pulse, pulse, pulse);
      } else {
        // Tampered high-speed spin + glitch jitter
        const fastTime = elapsedTime * 3.5;
        coreMesh.rotation.x = fastTime * 0.9;
        coreMesh.rotation.y = fastTime * 1.4;
        innerMesh.rotation.x = -fastTime * 1.2;
        innerMesh.rotation.y = -fastTime * 1.6;
        particleCloud.rotation.y = fastTime * 0.6;

        // Glitch jitter displacement
        const jitterX = (Math.random() - 0.5) * 0.12;
        const jitterY = (Math.random() - 0.5) * 0.12;
        const jitterZ = (Math.random() - 0.5) * 0.12;
        coreMesh.position.set(jitterX, jitterY, jitterZ);
        innerMesh.position.set(-jitterX, -jitterY, -jitterZ);

        // Erratic pulsing
        const erraticScale = 0.9 + Math.random() * 0.3;
        innerMesh.scale.set(erraticScale, erraticScale, erraticScale);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 6. Resize handling
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 280;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();

      coreGeometry.dispose();
      wireframeGeometry.dispose();
      coreMaterial.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className={`relative rounded-3xl backdrop-blur-md bg-slate-900/80 border p-5 shadow-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
        isTampered
          ? 'border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.35)]'
          : 'border-slate-800 hover:border-emerald-500/40'
      }`}
    >
      {/* Header telemetry badge */}
      <div className="flex items-center justify-between gap-2 z-10 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl border ${
              isTampered
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-400'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
            }`}
          >
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Cryptographic Enclave Core</span>
              <span className="text-[10px] font-mono text-slate-500">3D WebGL</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive icosahedron enclave & particle telemetry
            </p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all ${
            isTampered
              ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
          }`}
        >
          {isTampered ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>BREACH DETECTED</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ENCLAVE NOMINAL</span>
            </>
          )}
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-56 sm:h-64 relative flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        {/* Subtle overlay hint */}
        <div className="absolute bottom-2 left-2 z-10 text-[10px] text-slate-500 font-mono pointer-events-none flex items-center gap-1">
          <Activity className="w-3 h-3 text-cyan-400" /> Move cursor to orient camera
        </div>
      </div>
    </div>
  );
}

