"use client";

import { useEffect, useRef, useState } from "react";
import { Box, LoaderCircle, Maximize2, Move, Rotate3D, Ruler, X } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { TDSLoader } from "three/addons/loaders/TDSLoader.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function CadViewer({ file }: { file: File }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fitViewRef = useRef<(() => void) | null>(null);
  const rulerModeRef = useRef(false);
  const resetRulerRef = useRef<(() => void) | null>(null);
  const [viewerError, setViewerError] = useState("");
  const [rulerMode, setRulerMode] = useState(false);
  const [measurement, setMeasurement] = useState("");
  const extension = extensionOf(file.name);
  const canRender3d = ["stl", "obj", "fbx", "glb", "gltf", "3ds"].includes(extension);
  const canRender2d = extension === "dwg" || extension === "dxf";

  useEffect(() => {
    if (!canRender3d || !hostRef.current) return;
    const host = hostRef.current;
    let disposed = false;
    let frame = 0;
    let model: any;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const measurePoints: Array<InstanceType<typeof THREE.Vector3>> = [];
    const measureGroup = new THREE.Group();
    let pointerDown: { x: number; y: number } | null = null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);
    const grid = new THREE.GridHelper(10, 10, 0xc4b5fd, 0xe5e7eb);
    scene.add(grid);
    scene.add(measureGroup);
    setMeasurement("");

    const clearMeasurement = () => {
      measurePoints.length = 0;
      while (measureGroup.children.length) {
        const child = measureGroup.children.pop();
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material: any) => material.dispose());
        }
      }
      setMeasurement("");
    };
    resetRulerRef.current = clearMeasurement;

    const addMeasurePoint = (value: InstanceType<typeof THREE.Vector3>) => {
      measurePoints.push(value.clone());
      const markerSize = Math.max(camera.position.distanceTo(value) * 0.008, 0.001);
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(markerSize, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, depthTest: false }),
      );
      marker.position.copy(value);
      marker.renderOrder = 10;
      measureGroup.add(marker);

      const previousLine = measureGroup.children.find((child: any) => child.userData.isRulerLine);
      if (previousLine instanceof THREE.Line) {
        measureGroup.remove(previousLine);
        previousLine.geometry.dispose();
        const materials = Array.isArray(previousLine.material) ? previousLine.material : [previousLine.material];
        materials.forEach((material: any) => material.dispose());
      }

      if (measurePoints.length >= 2) {
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(measurePoints),
          new THREE.LineBasicMaterial({ color: 0xf59e0b, depthTest: false }),
        );
        line.userData.isRulerLine = true;
        line.renderOrder = 10;
        measureGroup.add(line);
        const totalDistance = measurePoints.slice(1).reduce(
          (total, point, index) => total + point.distanceTo(measurePoints[index]),
          0,
        );
        setMeasurement(`${totalDistance.toLocaleString(undefined, { maximumFractionDigits: 3 })} units · ${measurePoints.length} titik`);
      } else {
        setMeasurement("1 titik · pilih titik berikutnya");
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDown = { x: event.clientX, y: event.clientY };
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (!rulerModeRef.current || !model || !pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 4) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(model, true)[0];
      if (hit) addMeasurePoint(hit.point);
    };
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    file.arrayBuffer().then(async (buffer) => {
      if (disposed) return;
      try {
        if (extension === "stl") {
          const geometry = new STLLoader().parse(buffer);
          geometry.computeVertexNormals();
          geometry.center();
          const stlGeometry = geometry as typeof geometry & { hasColors?: boolean; alpha?: number };
          const hasEmbeddedColors = stlGeometry.hasColors === true && geometry.hasAttribute("color");
          const opacity = stlGeometry.alpha ?? 1;
          model = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
              color: hasEmbeddedColors ? 0xffffff : 0xb8bec8,
              metalness: 0.08,
              roughness: 0.55,
              vertexColors: hasEmbeddedColors,
              opacity,
              transparent: opacity < 1,
            }),
          );
          model.rotation.x = -Math.PI / 2;
        } else if (extension === "obj") {
          model = new OBJLoader().parse(new TextDecoder().decode(buffer));
        } else if (extension === "fbx") {
          model = new FBXLoader().parse(buffer, "");
        } else if (extension === "3ds") {
          model = new TDSLoader().parse(buffer, "");
        } else {
          const gltf = await new Promise<{ scene: any }>((resolve, reject) => {
            new GLTFLoader().parse(buffer, "", resolve, reject);
          });
          model = gltf.scene;
        }
        if (disposed || !model) return;
        model.traverse((object: any) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = true;
          object.receiveShadow = true;
          if (!object.material) {
            object.material = new THREE.MeshStandardMaterial({ color: 0xb8bec8, metalness: 0.08, roughness: 0.55 });
          } else {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material: any) => {
              if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
              material.needsUpdate = true;
            });
          }
        });
        scene.add(model);
        const box = new THREE.Box3().setFromObject(model);
        if (box.isEmpty()) throw new Error("Model tidak memiliki geometri yang dapat ditampilkan");
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z, 1);
        grid.scale.setScalar(maxDimension / 8);
        const fit = () => {
          camera.position.set(center.x + maxDimension * 1.35, center.y + maxDimension, center.z + maxDimension * 1.35);
          camera.near = maxDimension / 1000;
          camera.far = maxDimension * 100;
          camera.updateProjectionMatrix();
          controls.target.copy(center);
          controls.update();
        };
        fitViewRef.current = fit;
        fit();
      } catch (reason) {
        const detail = reason instanceof Error ? reason.message : "format file tidak valid";
        setViewerError(`${extension.toUpperCase()} tidak dapat diproses: ${detail}.`);
      }
    });

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      measureGroup.traverse((object: any) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material: any) => material.dispose());
        }
      });
      scene.remove(measureGroup);
      scene.traverse((object: any) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material: any) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      fitViewRef.current = null;
      resetRulerRef.current = null;
    };
  }, [canRender3d, extension, file]);

  if (canRender2d) return <Cad2dViewer file={file} />;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex h-12 items-center justify-between border-b px-4">
          <div><p className="text-sm font-semibold text-gray-900">CAD 3D Preview</p><p className="text-[11px] text-gray-400">{file.name}</p></div>
          {canRender3d && <div className="flex gap-2"><Button type="button" variant={rulerMode ? "default" : "outline"} size="sm" onClick={() => { const next = !rulerMode; rulerModeRef.current = next; setRulerMode(next); if (!next) resetRulerRef.current?.(); }}><Ruler className="h-3.5 w-3.5" /> Ruler</Button><Button type="button" variant="outline" size="sm" onClick={() => fitViewRef.current?.()}><Maximize2 className="h-3.5 w-3.5" /> Fit model</Button></div>}
        </div>
        {canRender3d ? (
          <div className="relative"><div ref={hostRef} className="h-[480px] w-full" />
            {!viewerError && <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1.5 text-[11px] text-gray-600 shadow-sm"><Rotate3D className="h-3.5 w-3.5" /> Drag to rotate - scroll to zoom - right drag to pan</div>}
            {rulerMode && <div className="absolute right-3 top-3 flex items-center gap-2 rounded-md bg-white/95 px-3 py-2 text-xs text-gray-700 shadow"><Ruler className="h-4 w-4 text-amber-500" /><span>{measurement || "Klik titik pertama pada model"}</span>{measurement && <button type="button" aria-label="Reset ruler" onClick={() => resetRulerRef.current?.()}><X className="h-4 w-4" /></button>}</div>}
            {viewerError && <div className="absolute inset-0 grid place-items-center bg-gray-50 p-8 text-center text-sm text-red-600">{viewerError}</div>}
          </div>
        ) : (
          <div className="flex h-[480px] flex-col items-center justify-center bg-gray-100 px-8 text-center"><Box className="mb-3 h-10 w-10 text-violet-500" /><p className="font-semibold text-gray-800">{extension.toUpperCase()} CAD file siap direview</p><p className="mt-2 max-w-lg text-sm text-gray-500">Preview interaktif mendukung STL, OBJ, FBX, GLB, GLTF, 3DS, DWG, dan DXF. STEP, IGES, serta F3D perlu dikonversi atau diproses melalui layanan CAD terlebih dahulu.</p></div>
        )}
      </CardContent>
    </Card>
  );
}

type Point = { x: number; y: number };
type CadEntity = Record<string, any> & { type: string; isVisible?: boolean; isInPaperSpace?: boolean };
type CadLayer = { color?: number; colorIndex?: number; visible?: boolean; frozen?: boolean; off?: boolean };

// AutoCAD Color Index values most commonly used by CAD drawings.
const basicAciColors: Record<number, number> = {
  1: 0xff0000, 2: 0xffff00, 3: 0x00ff00, 4: 0x00ffff,
  5: 0x0000ff, 6: 0xff00ff, 7: 0xffffff, 8: 0x808080, 9: 0xc0c0c0,
};

function aciToRgb(index?: number) {
  if (!index || index < 1 || index > 255) return undefined;
  if (basicAciColors[index] !== undefined) return basicAciColors[index];
  // Indices 10-249 are arranged in 24 hues, with five brightness levels.
  if (index <= 249) {
    const group = Math.floor((index - 10) / 10);
    const shade = (index - 10) % 10;
    const hue = group * 15;
    const saturation = shade % 2 === 0 ? 100 : 50;
    const lightness = [50, 50, 40, 40, 30, 30, 20, 20, 10, 10][shade];
    const color = new THREE.Color().setHSL(hue / 360, saturation / 100, lightness / 100);
    return color.getHex();
  }
  const gray = Math.round(51 + ((index - 250) / 5) * 153);
  return (gray << 16) | (gray << 8) | gray;
}

function cssColor(value?: number) {
  if (!Number.isFinite(value)) return undefined;
  return `#${(value! & 0xffffff).toString(16).padStart(6, "0")}`;
}

function entityBounds(entity: CadEntity): Point[] {
  if (entity.type === "LINE") return [entity.startPoint, entity.endPoint];
  if (entity.type === "CIRCLE" || entity.type === "ARC") {
    const { center, radius } = entity;
    return [{ x: center.x - radius, y: center.y - radius }, { x: center.x + radius, y: center.y + radius }];
  }
  if (entity.type === "POLYLINE2D" || entity.type === "POLYLINE3D") {
    return (entity.vertices ?? []).map((vertex: any) => vertex.point ?? vertex.position ?? vertex);
  }
  if (entity.type === "TEXT" || entity.type === "MTEXT") return [entity.startPoint ?? entity.insertionPoint];
  return [];
}

function Cad2dViewer({ file }: { file: File }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entitiesRef = useRef<CadEntity[]>([]);
  const layersRef = useRef<Record<string, CadLayer>>({});
  const viewRef = useRef({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; viewX: number; viewY: number } | null>(null);
  const rulerPointsRef = useRef<Point[]>([]);
  const rulerModeRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [entityCount, setEntityCount] = useState(0);
  const [rulerMode, setRulerMode] = useState(false);
  const [measurement, setMeasurement] = useState("");

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = "#111827";
    context.fillRect(0, 0, width, height);
    const view = viewRef.current;
    const point = (value: Point) => ({ x: value.x * view.scale + view.x, y: -value.y * view.scale + view.y });
    context.lineWidth = 1;

    for (const entity of entitiesRef.current) {
      if (entity.isVisible === false || entity.isInPaperSpace) continue;
      const layer = layersRef.current[entity.layer];
      if (layer?.visible === false || layer?.frozen || layer?.off) continue;
      const usesLayerColor = entity.colorIndex === undefined || entity.colorIndex === 256;
      const usesBlockColor = entity.colorIndex === 0;
      const entityColor = !usesLayerColor && !usesBlockColor
        ? entity.color ?? aciToRgb(Math.abs(entity.colorIndex))
        : undefined;
      const layerColorIndex = Math.abs(layer?.colorIndex ?? 0);
      const layerColor = aciToRgb(layerColorIndex) ?? layer?.color;
      const color = cssColor(entityColor ?? layerColor) ?? "#e5e7eb";
      context.strokeStyle = color;
      context.fillStyle = color;
      context.beginPath();
      if (entity.type === "LINE") {
        const start = point(entity.startPoint); const end = point(entity.endPoint);
        context.moveTo(start.x, start.y); context.lineTo(end.x, end.y);
      } else if (entity.type === "CIRCLE") {
        const center = point(entity.center);
        context.arc(center.x, center.y, entity.radius * view.scale, 0, Math.PI * 2);
      } else if (entity.type === "ARC") {
        const center = point(entity.center);
        context.arc(center.x, center.y, entity.radius * view.scale, -entity.endAngle, -entity.startAngle);
      } else if (entity.type === "POLYLINE2D" || entity.type === "POLYLINE3D") {
        const vertices = entityBounds(entity).map(point);
        vertices.forEach((vertex, index) => index ? context.lineTo(vertex.x, vertex.y) : context.moveTo(vertex.x, vertex.y));
        if ((entity.flag & 1) === 1 && vertices.length) context.closePath();
      } else {
        continue;
      }
      context.stroke();
    }

    const rulerPoints = rulerPointsRef.current.map(point);
    if (rulerPoints.length) {
      context.save();
      context.fillStyle = "#f59e0b";
      context.strokeStyle = "#f59e0b";
      context.lineWidth = 2;
      context.setLineDash([6, 4]);
      if (rulerPoints.length >= 2) {
        context.beginPath();
        context.moveTo(rulerPoints[0].x, rulerPoints[0].y);
        rulerPoints.slice(1).forEach((rulerPoint) => context.lineTo(rulerPoint.x, rulerPoint.y));
        context.stroke();
      }
      context.setLineDash([]);
      rulerPoints.forEach((rulerPoint) => {
        context.beginPath();
        context.arc(rulerPoint.x, rulerPoint.y, 5, 0, Math.PI * 2);
        context.fill();
      });
      context.restore();
    }
  };

  const clearRuler = () => {
    rulerPointsRef.current = [];
    setMeasurement("");
    redraw();
  };

  const addRulerPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const view = viewRef.current;
    rulerPointsRef.current.push({
      x: (clientX - rect.left - view.x) / view.scale,
      y: -(clientY - rect.top - view.y) / view.scale,
    });
    if (rulerPointsRef.current.length >= 2) {
      const totalDistance = rulerPointsRef.current.slice(1).reduce((total, point, index) => {
        const previousPoint = rulerPointsRef.current[index];
        return total + Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y);
      }, 0);
      setMeasurement(`${totalDistance.toLocaleString(undefined, { maximumFractionDigits: 3 })} units · ${rulerPointsRef.current.length} titik`);
    } else {
      setMeasurement("1 titik · pilih titik berikutnya");
    }
    redraw();
  };

  const fitDrawing = () => {
    const canvas = canvasRef.current;
    const points = entitiesRef.current.flatMap(entityBounds).filter((item) => Number.isFinite(item?.x) && Number.isFinite(item?.y));
    if (!canvas || !points.length) return;
    const minX = Math.min(...points.map((item) => item.x)); const maxX = Math.max(...points.map((item) => item.x));
    const minY = Math.min(...points.map((item) => item.y)); const maxY = Math.max(...points.map((item) => item.y));
    const padding = 32;
    const scale = Math.min((canvas.clientWidth - padding * 2) / Math.max(maxX - minX, 1), (canvas.clientHeight - padding * 2) / Math.max(maxY - minY, 1));
    viewRef.current = { scale, x: canvas.clientWidth / 2 - ((minX + maxX) / 2) * scale, y: canvas.clientHeight / 2 + ((minY + maxY) / 2) * scale };
    redraw();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let parsedEntities: CadEntity[];
        let parsedLayers: Record<string, CadLayer> = {};
        if (extensionOf(file.name) === "dwg") {
          const { Dwg_File_Type, LibreDwg } = await import("@mlightcad/libredwg-web");
          const parser = await LibreDwg.create("/cad/");
          const drawing = parser.dwg_read_data(await file.arrayBuffer(), Dwg_File_Type.DWG);
          if (drawing === undefined) throw new Error("Parser tidak menghasilkan data drawing.");
          const database = parser.convert(drawing);
          parsedEntities = database.entities as CadEntity[];
          parsedLayers = Object.fromEntries(database.tables.LAYER.entries.map((layer) => [layer.name, layer]));
        } else {
          const { default: DxfParser } = await import("dxf-parser");
          const drawing = new DxfParser().parseSync(await file.text());
          parsedLayers = (drawing?.tables?.layer?.layers ?? {}) as Record<string, CadLayer>;
          parsedEntities = ((drawing?.entities ?? []) as CadEntity[]).map((entity) => {
            if (entity.type === "LINE" && entity.vertices?.length >= 2) return { ...entity, startPoint: entity.vertices[0], endPoint: entity.vertices[1] };
            if (entity.type === "LWPOLYLINE" || entity.type === "POLYLINE") return { ...entity, type: "POLYLINE2D" };
            if (entity.type === "ARC") return { ...entity, startAngle: entity.startAngle * Math.PI / 180, endAngle: entity.endAngle * Math.PI / 180 };
            return entity;
          });
        }
        if (cancelled) return;
        layersRef.current = parsedLayers;
        entitiesRef.current = parsedEntities.filter((entity) => !entity.isInPaperSpace);
        setEntityCount(entitiesRef.current.length);
        setStatus("ready");
        requestAnimationFrame(fitDrawing);
      } catch (reason) {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "File CAD 2D tidak dapat diproses.");
        setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => status === "ready" && redraw());
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const oldScale = viewRef.current.scale;
      const scale = Math.min(Math.max(oldScale * Math.exp(-event.deltaY * 0.001), 0.01), 10000);
      viewRef.current.x = mouseX - (mouseX - viewRef.current.x) * scale / oldScale;
      viewRef.current.y = mouseY - (mouseY - viewRef.current.y) * scale / oldScale;
      viewRef.current.scale = scale;
      redraw();
    };
    observer.observe(canvas);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      observer.disconnect();
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [status]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex h-12 items-center justify-between border-b px-4">
          <div><p className="text-sm font-semibold text-gray-900">CAD 2D Preview</p><p className="text-[11px] text-gray-400">{file.name}{entityCount ? ` - ${entityCount} entities` : ""}</p></div>
          <div className="flex gap-2"><Button type="button" variant={rulerMode ? "default" : "outline"} size="sm" disabled={status !== "ready"} onClick={() => { const next = !rulerMode; rulerModeRef.current = next; setRulerMode(next); if (!next) clearRuler(); }}><Ruler className="h-3.5 w-3.5" /> Ruler</Button><Button type="button" variant="outline" size="sm" disabled={status !== "ready"} onClick={fitDrawing}><Maximize2 className="h-3.5 w-3.5" /> Fit drawing</Button></div>
        </div>
        <div className="relative h-[480px] bg-gray-900">
          <canvas
            ref={canvasRef}
            className={`h-full w-full ${rulerMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); if (rulerModeRef.current) { addRulerPoint(event.clientX, event.clientY); return; } dragRef.current = { x: event.clientX, y: event.clientY, viewX: viewRef.current.x, viewY: viewRef.current.y }; }}
            onPointerMove={(event) => { const drag = dragRef.current; if (!drag) return; viewRef.current.x = drag.viewX + event.clientX - drag.x; viewRef.current.y = drag.viewY + event.clientY - drag.y; redraw(); }}
            onPointerUp={() => { dragRef.current = null; }}
          />
          {status === "loading" && <div className="absolute inset-0 grid place-items-center bg-gray-900 text-sm text-gray-200"><span className="flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" /> Membaca drawing {extensionOf(file.name).toUpperCase()}...</span></div>}
          {status === "error" && <div className="absolute inset-0 grid place-items-center bg-gray-900 p-8 text-center text-sm text-red-300">Preview CAD 2D gagal: {error}</div>}
          {status === "ready" && <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-gray-950/80 px-2.5 py-1.5 text-[11px] text-gray-200 shadow-sm"><Move className="h-3.5 w-3.5" /> Drag to pan - scroll to zoom</div>}
          {status === "ready" && rulerMode && <div className="absolute right-3 top-3 flex items-center gap-2 rounded-md bg-gray-950/90 px-3 py-2 text-xs text-gray-100 shadow"><Ruler className="h-4 w-4 text-amber-400" /><span>{measurement || "Klik titik pertama pada drawing"}</span>{measurement && <button type="button" aria-label="Reset ruler" onClick={clearRuler}><X className="h-4 w-4" /></button>}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
