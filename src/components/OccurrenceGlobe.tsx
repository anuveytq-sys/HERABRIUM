import { useEffect, useRef } from "react";
import * as THREE from "three";

type PointRecord={key:number;decimalLatitude?:number;decimalLongitude?:number};
export default function OccurrenceGlobe({records}:{records:PointRecord[]}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const element=host.current;if(!element)return;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.z=4.2;
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setSize(Math.max(1,element.clientWidth),Math.max(1,element.clientHeight));renderer.outputColorSpace=THREE.SRGBColorSpace;element.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0x9bc9ad,1.4));
  const light=new THREE.DirectionalLight(0xd9ffe3,2.2);light.position.set(3,2,4);scene.add(light);
  const globe=new THREE.Group();scene.add(globe);
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(1.2,56,56),new THREE.MeshPhongMaterial({color:0x153d30,emissive:0x061a13,shininess:24,transparent:true,opacity:.96}));globe.add(sphere);
  const wire=new THREE.Mesh(new THREE.SphereGeometry(1.207,32,24),new THREE.MeshBasicMaterial({color:0x5e9d78,wireframe:true,transparent:true,opacity:.2}));globe.add(wire);
  const positions:number[]=[];
  for(const r of records){if(!Number.isFinite(r.decimalLatitude)||!Number.isFinite(r.decimalLongitude))continue;const lat=THREE.MathUtils.degToRad(r.decimalLatitude as number),lon=THREE.MathUtils.degToRad(r.decimalLongitude as number);const radius=1.225;positions.push(-radius*Math.cos(lat)*Math.cos(lon),radius*Math.sin(lat),radius*Math.cos(lat)*Math.sin(lon));}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  const material=new THREE.PointsMaterial({color:0x9be5ad,size:.055,sizeAttenuation:true,transparent:true,opacity:.95});
  const cloud=new THREE.Points(geometry,material);globe.add(cloud);
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let frame=0,dragging=false,lastX=0,lastY=0,targetY=0,targetX=0;
  const down=(e:PointerEvent)=>{dragging=true;lastX=e.clientX;lastY=e.clientY;element.setPointerCapture?.(e.pointerId)};
  const move=(e:PointerEvent)=>{if(!dragging)return;targetY+=(e.clientX-lastX)*.006;targetX+=(e.clientY-lastY)*.006;lastX=e.clientX;lastY=e.clientY};
  const up=()=>{dragging=false};
  element.addEventListener("pointerdown",down);element.addEventListener("pointermove",move);element.addEventListener("pointerup",up);element.addEventListener("pointercancel",up);
  const resize=()=>{const w=Math.max(1,element.clientWidth),h=Math.max(1,element.clientHeight);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()};
  const observer=new ResizeObserver(resize);observer.observe(element);
  const animate=()=>{frame=requestAnimationFrame(animate);if(!reduced){if(!dragging)targetY+=.0009;globe.rotation.y+=(targetY-globe.rotation.y)*.035;globe.rotation.x+=(targetX-globe.rotation.x)*.035;}renderer.render(scene,camera)};animate();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();element.removeEventListener("pointerdown",down);element.removeEventListener("pointermove",move);element.removeEventListener("pointerup",up);element.removeEventListener("pointercancel",up);scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose()}});renderer.dispose();if(renderer.domElement.parentElement===element)element.removeChild(renderer.domElement);};
 },[records]);
 return <div ref={host} aria-label="Interactive 3D globe showing returned biodiversity occurrence coordinates" style={{width:"100%",height:300,minHeight:240,touchAction:"pan-y",cursor:"grab"}}/>;
}
