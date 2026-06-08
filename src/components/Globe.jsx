import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { TEXTURES, GLOBE_RADIUS as R } from '../lib/constants.js';
import {
  vec3ToLatLon,
  countryAtLatLon,
  makeGeoPath,
  paintOverlay,
  TEX_W,
  TEX_H,
} from '../lib/geo.js';
import { getVal, fmt, activeVarKey } from '../lib/data.js';
import { VAR_META } from '../lib/constants.js';


export default function Globe({
  data,
  geo,
  year,
  variable,
  healthMetric,
  selected,
  onSelect,
  onTexturesLoaded,
}) {
  const mountRef = useRef(null);
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);

  // Mutable scene refs that persist across renders.
  const sceneRef = useRef(null);
  const overlayCtxRef = useRef(null);
  const geoPathRef = useRef(null);
  const overlayTexRef = useRef(null);
  // Keep latest props accessible inside event handlers / RAF loop.
  const propsRef = useRef({ data, geo, year, variable, healthMetric, selected });
  propsRef.current = { data, geo, year, variable, healthMetric, selected };

  const repaintOverlay = useCallback(() => {
    const { data, geo, year, variable, healthMetric, selected } = propsRef.current;
    if (!overlayCtxRef.current || !data || !geo) return;
    paintOverlay({
      ctx: overlayCtxRef.current,
      geoPath: geoPathRef.current,
      geo,
      data,
      year,
      variable,
      healthMetric,
      selected,
    });
    if (overlayTexRef.current) overlayTexRef.current.needsUpdate = true;
  }, []);

  // One-time scene setup.
  useEffect(() => {
    if (!data || !geo) return;
    const mount = mountRef.current;
    const canvas = canvasRef.current;
    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 200);
    camera.position.set(0, 0, 8.7);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.55;

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x1a2740,
      roughness: 0.65,
      metalness: 0.04,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 128), earthMat);
    worldGroup.add(earth);

    let loaded = 0;
    const need = 2;
    const tick = () => {
      loaded++;
      if (loaded >= need && onTexturesLoaded) onTexturesLoaded();
    };

    loader.load(
      TEXTURES.day,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        earthMat.map = t;
        earthMat.color.set(0xffffff);
        earthMat.needsUpdate = true;
        tick();
      },
      undefined,
      () => {
        loader.load(
          TEXTURES.fallback,
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            earthMat.map = t;
            earthMat.color.set(0xffffff);
            earthMat.needsUpdate = true;
            tick();
          },
          undefined,
          tick
        );
      }
    );
    loader.load(
      TEXTURES.spec,
      (t) => {
        // Invert water mask (white=ocean) → roughness map (black=smooth ocean, white=rough land)
        const cv = document.createElement('canvas');
        cv.width = t.image.width;
        cv.height = t.image.height;
        const cx = cv.getContext('2d');
        cx.drawImage(t.image, 0, 0);
        const id = cx.getImageData(0, 0, cv.width, cv.height);
        const px = id.data;
        for (let i = 0; i < px.length; i += 4) {
          px[i] = 255 - px[i];
          px[i + 1] = 255 - px[i + 1];
          px[i + 2] = 255 - px[i + 2];
        }
        cx.putImageData(id, 0, 0);
        earthMat.roughnessMap = new THREE.CanvasTexture(cv);
        earthMat.needsUpdate = true;
      },
      undefined,
      () => {}
    );
    loader.load(
      TEXTURES.bump,
      (t) => {
        earthMat.bumpMap = t;
        earthMat.bumpScale = 0.06;
        earthMat.needsUpdate = true;
        tick();
      },
      undefined,
      tick
    );


    // Data overlay sphere.
    const overlay = document.createElement('canvas');
    overlay.width = TEX_W;
    overlay.height = TEX_H;
    const octx = overlay.getContext('2d');
    overlayCtxRef.current = octx;
    geoPathRef.current = makeGeoPath(octx);

    paintOverlay({
      ctx: octx,
      geoPath: geoPathRef.current,
      geo,
      data,
      year: propsRef.current.year,
      variable: propsRef.current.variable,
      healthMetric: propsRef.current.healthMetric,
      selected: propsRef.current.selected,
    });
    const overlayTex = new THREE.CanvasTexture(overlay);
    overlayTex.colorSpace = THREE.SRGBColorSpace;
    overlayTex.minFilter = THREE.LinearFilter;
    overlayTex.magFilter = THREE.LinearFilter;
    overlayTex.generateMipmaps = false;
    overlayTexRef.current = overlayTex;
    const overlayMesh = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.001, 128, 128),
      new THREE.MeshStandardMaterial({
        map: overlayTex,
        transparent: true,
        depthWrite: false,
        roughness: 1.0,
        metalness: 0.0,
      })
    );
    worldGroup.add(overlayMesh);


    scene.add(new THREE.AmbientLight(0xffffff, 1.6));

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let autoRotate = true;
    let idleTimer = null;
    const IDLE_MS = 3000;

    const startIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { autoRotate = true; }, IDLE_MS);
    };

    // Interaction.
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let downX = 0;
    let downY = 0;
    let downT = 0;

    const pickLatLon = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.intersectObject(earth);
      if (!hit.length) return null;
      return vec3ToLatLon(earth.worldToLocal(hit[0].point.clone()));
    };

    const onDown = (e) => {
      isDragging = true;
      autoRotate = false;
      clearTimeout(idleTimer);
      prevX = e.clientX;
      prevY = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      downT = Date.now();
    };
    const onUp = (e) => {
      isDragging = false;
      startIdleTimer();
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      const dt = Date.now() - downT;
      if (dist < 5 && dt < 300) {
        const ll = pickLatLon(e);
        if (ll) {
          const name = countryAtLatLon(propsRef.current.geo, ll[0], ll[1]);
          if (name && propsRef.current.data.lookup[name]) onSelect(name);
        }
      }
    };
    const onMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        worldGroup.rotation.y += dx * 0.005;
        worldGroup.rotation.x += dy * 0.005;
        worldGroup.rotation.x = Math.max(-1.2, Math.min(1.2, worldGroup.rotation.x));
        prevX = e.clientX;
        prevY = e.clientY;
      } else {
        const tip = tooltipRef.current;
        const ll = pickLatLon(e);
        canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
        if (!ll) {
          tip.style.opacity = '0';
          return;
        }
        const name = countryAtLatLon(propsRef.current.geo, ll[0], ll[1]);
        if (!name) {
          tip.style.opacity = '0';
          return;
        }
        const { data, year, variable, healthMetric } = propsRef.current;
        const v = getVal(data.lookup, name, year, variable, healthMetric);
        const meta = VAR_META[activeVarKey(variable, healthMetric)];
        tip.style.opacity = '1';
        tip.style.left = e.clientX + 14 + 'px';
        tip.style.top = e.clientY + 14 + 'px';
        tip.innerHTML = `<div class="tt-name">${name}</div><div class="tt-val">${
          v == null ? 'no data' : fmt(v, activeVarKey(variable, healthMetric)) + ' ' + meta.unit
        }</div>`;
        canvas.style.cursor = 'pointer';
      }
    };
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(2.9, Math.min(9, camera.position.z + e.deltaY * 0.002));
      autoRotate = false;
      startIdleTimer();
    };

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (autoRotate) worldGroup.rotation.y += 0.0007;
      renderer.render(scene, camera);
    };
    animate();

    // Expose for repaint from prop-change effects.
    sceneRef.current = { renderer, scene, camera, worldGroup };

    // Safety: signal loaded after 5s no matter what.
    const safety = setTimeout(() => onTexturesLoaded && onTexturesLoaded(), 5000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
      clearTimeout(idleTimer);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, geo]);

  // Repaint the choropleth whenever year / variable / selection changes.
  useEffect(() => {
    repaintOverlay();
  }, [year, variable, healthMetric, selected, repaintOverlay]);

  return (
    <div ref={mountRef} className="globe-mount">
      <canvas ref={canvasRef} className="globe-canvas" />
      <div ref={tooltipRef} className="tooltip" />
    </div>
  );
}
