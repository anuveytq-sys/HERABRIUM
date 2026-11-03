import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Globe() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 4.2;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(element.clientWidth, element.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    scene.add(globe);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 72, 72),
      new THREE.MeshPhongMaterial({ color: 0x153e32, emissive: 0x061c17, shininess: 18, transparent: true, opacity: 0.94 })
    );
    globe.add(sphere);
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(1.27, 28, 18),
      new THREE.MeshBasicMaterial({ color: 0x75f2b1, wireframe: true, transparent: true, opacity: 0.13 })
    );
    globe.add(wire);
    const pointsGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    for (let i = 0; i < 620; i++) {
      const y = 1 - (i / 619) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      positions.push(Math.cos(theta) * radius * 1.29, y * 1.29, Math.sin(theta) * radius * 1.29);
    }
    pointsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    globe.add(new THREE.Points(pointsGeometry, new THREE.PointsMaterial({ color: 0x9fffc8, size: 0.012, transparent: true, opacity: 0.8 })));

    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.34, 48, 48), new THREE.MeshBasicMaterial({ color: 0x4ee59b, side: THREE.BackSide, transparent: true, opacity: 0.055 }));
    globe.add(atmosphere);
    scene.add(new THREE.AmbientLight(0x9fcab4, 1.2));
    const key = new THREE.PointLight(0x8affbf, 3.2);
    key.position.set(3, 2, 4);
    scene.add(key);
    const fill = new THREE.PointLight(0x4278b8, 1.1);
    fill.position.set(-3, -1, -2);
    scene.add(fill);

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onPointer = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      targetY = ((event.clientX - rect.left) / rect.width - 0.5) * 0.24;
      targetX = ((event.clientY - rect.top) / rect.height - 0.5) * 0.18;
    };
    element.addEventListener("pointermove", onPointer);
    const resize = () => {
      const w = Math.max(1, element.clientWidth);
      const h = Math.max(1, element.clientHeight);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!reduced) {
        globe.rotation.y += 0.0018;
        pointerX += (targetX - pointerX) * 0.025;
        pointerY += (targetY - pointerY) * 0.025;
        globe.rotation.x = pointerX;
        globe.rotation.z = pointerY;
      }
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("pointermove", onPointer);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material.dispose();
        }
      });
      renderer.dispose();
      element.removeChild(renderer.domElement);
    };
  }, []);
  return <div className="globe-stage" ref={host} aria-label="Interactive abstract 3D scientific globe" />;
}