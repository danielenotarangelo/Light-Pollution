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

function makeStarfield() {
  const n = 2200;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 40 + Math.random() * 40;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.18,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
  });
  return new THREE.Points(g, m);
}

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
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene.add(makeStarfield());

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x1a2740,
      shininess: 18,
      specular: new THREE.Color(0x333333),
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
        earthMat.specularMap = t;
        earthMat.specular = new THREE.Color(0x666666);
        earthMat.needsUpdate = true;
      },
      undefined,
      () => {}
    );
    loader.load(
      TEXTURES.bump,
      (t) => {
        earthMat.bumpMap = t;
        earthMat.bumpScale = 0.022;
        earthMat.needsUpdate = true;
        tick();
      },
      undefined,
      tick
    );

    // Cloud layer.
    const cloudMat = new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 96, 96), cloudMat);
    worldGroup.add(clouds);
    loader.load(
      TEXTURES.clouds,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        cloudMat.map = t;
        cloudMat.alphaMap = t;
        cloudMat.needsUpdate = true;
      },
      undefined,
      () => {}
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
    overlayTexRef.current = overlayTex;
    const overlayMesh = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.004, 128, 128),
      new THREE.MeshBasicMaterial({ map: overlayTex, transparent: true, depthWrite: false })
    );
    worldGroup.add(overlayMesh);

    // Atmosphere glow.
    const atmMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `varying vec3 vN;void main(){float i=pow(0.66-dot(vN,vec3(0,0,1.0)),2.6);gl_FragColor=vec4(0.35,0.6,1.0,1.0)*i;}`,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 96, 96), atmMat));

    // Lighting.
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const sun = new THREE.DirectionalLight(0xfff4e6, 1.5);
    sun.position.set(-3, 1.5, 4);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x88aaff, 0.3);
    fill.position.set(3, -1, -2);
    scene.add(fill);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let autoRotate = true;

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
      prevX = e.clientX;
      prevY = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      downT = Date.now();
    };
    const onUp = (e) => {
      isDragging = false;
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
      clouds.rotation.y += 0.0004;
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
