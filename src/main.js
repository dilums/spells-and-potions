import './style.css'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {ParametricGeometry} from 'three/examples/jsm/geometries/ParametricGeometry'

let camera, scene, renderer;
const uniforms = {
  t: { value: 0 }
};

const { PI, cos, sin } = Math;
const TAU = 2 * PI;
const HALF_PI = PI / 2;

const map = (value, sMin, sMax, dMin, dMax) => {
  return dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);
};
const textrue = (path) => new THREE.TextureLoader().load(path);

const vec = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const range = (n, m = 0) =>
  Array(n)
    .fill(m)
    .map((i, j) => i + j);

const polar = (ang, r = 1) => [r * cos(ang), r * sin(ang)];

const group = () => new THREE.Group();

const shaderMaterials = getShaderMaterialSet(uniforms);
function init() {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(
    1.5733694630638464,
    64.24498103358587,
    100.84717514499769
  );
  camera.rotation.x = -0.5672196272222528;
  camera.rotation.y = 0.013157534983447959;
  camera.rotation.z = 0.008381607123176699;

  const controls = new OrbitControls(camera, renderer.domElement);

  addResizeHandler(renderer, camera);

  const envMapTexture = new THREE.TextureLoader().load(
    "https://assets.codepen.io/3685267/spells_potions_satara_night.jpg",
    () => {
      const rt = new THREE.WebGLCubeRenderTarget(envMapTexture.image.height);
      rt.fromEquirectangularTexture(renderer, envMapTexture);
      addObjects(scene, rt);
    }
  );
  render();
}

function addObjects(scene, textureEnv) {
  createPot(scene, -40, 0, 10, textureEnv, shaderMaterials.pot);
  createGlassContainer({
    scene,
    texture: textureEnv,
    curve: beaker1,
    itemScale: 0.3,
    position: vec(-22, 0, -20),
    customLiquidMaterial: shaderMaterials.beaker
  });
  createGlassContainer({
    scene,
    texture: textureEnv,
    curve: beaker2,
    itemScale: 0.2,
    position: vec(-10, 0, -20),
    customLiquidMaterial: shaderMaterials.beaker
  });

  createTable(scene, textureEnv);

  createPapers(scene);
  createWineGlass(scene, textureEnv, vec(25, 20, 0), shaderMaterials.bottle);
  createBottle(scene, textureEnv, vec(20, 6.8, -10), shaderMaterials.bottle);
  createDish(scene, textureEnv);
}

function createPotBody(scene, x, y, z, textureEnv) {
  const geometry = new THREE.SphereBufferGeometry(
    10,
    36,
    36,
    0,
    TAU,
    PI * 0.3,
    PI * 0.5
  );

  const t = textrue(
    "https://assets.codepen.io/3685267/spells_potions_rust.jpg"
  );

  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  const material = new THREE.MeshBasicMaterial({
    map: t,
    envMap: textureEnv.texture,
    side: THREE.DoubleSide
  });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(x, y, z);
  scene.add(sphere);
}

function createPotTop(scene, x, y, z, textureEnv) {
  const geometry = new THREE.TorusBufferGeometry(7.8, 0.7, 16, 100);

  const t = textrue(
    "https://assets.codepen.io/3685267/spells_potions_rust.jpg"
  );

  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 1);
  const material = new THREE.MeshBasicMaterial({
    map: t,
    envMap: textureEnv.texture,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = HALF_PI;
  mesh.position.set(x, y, z);
  scene.add(mesh);
}

function potLiquidFunc(v, u, target) {
  const ang = map(u, 0, 1, 0.001, TAU);
  const r = map(v, 0, 1, 0.001, 8);
  const [x, z] = polar(ang, r);

  const y = 0;

  target.set(x, y, z);
}

function createPotLiquid(scene, x, y, z, potLiquidMaterial) {
  const geometry = new ParametricGeometry(potLiquidFunc, 15, 25);
  const mesh = new THREE.Mesh(geometry, potLiquidMaterial);
  mesh.position.set(x, y, z);
  scene.add(mesh);
}

function createPot(scene, x, y, z, textureEnv, potLiquidMaterial) {
  const g = group();
  g.position.set(x, y, z);
  g.scale.set(1.4, 1.2, 1.2);
  createPotBody(g, 0, 8, 0, textureEnv);
  createPotTop(g, 0, 14, 0, textureEnv);
  createPotLiquid(g, 0, 12, 0, potLiquidMaterial);
  scene.add(g);
}

function createWineGlass(scene, textureEnv, position, customLiquidMaterial) {
  const g = group();
  createGlassContainer({
    scene: g,
    texture: textureEnv,
    curve: curveWineGlassBottom,
    itemScale: 1,
    position: vec(0, -20, 0),
    customLiquidMaterial,
    noTop: true,
    noLiquid: true
  });
  createGlassContainer({
    scene: g,
    texture: textureEnv,
    curve: curveWineGlassTop,
    itemScale: 1,
    position: vec(0, -20, 0),
    customLiquidMaterial,
    noTop: true,
    filled: 0.8
  });
  g.position.copy(position);
  scene.add(g);
}

function createBottleTop(scene, textureEnv) {
  const geometry = new THREE.SphereBufferGeometry(4, 32, 32);

  const t = textrue(
    "https://assets.codepen.io/3685267/spells_potions_rust.jpg"
  );

  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  const material = new THREE.MeshBasicMaterial({
    map: t,
    envMap: textureEnv.texture,
    side: THREE.DoubleSide
  });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.y = 40;
  scene.add(sphere);
}

function createBottle(scene, textureEnv, position, customLiquidMaterial) {
  const g = group();
  createGlassContainer({
    scene: g,
    texture: textureEnv,
    curve: curveBottle,
    itemScale: 4,
    position: vec(0, -20, 0),
    customLiquidMaterial,
    noTop: true,
    noLiquid: false
  });
  createBottleTop(g, textureEnv);

  g.scale.set(0.34, 0.34, 0.34);
  g.position.copy(position);
  scene.add(g);
}

function createDishTop(scene) {
  const geometry = new THREE.PlaneBufferGeometry(37, 37, 32);
  const plane = new THREE.Mesh(geometry, shaderMaterials.dish);
  plane.rotation.x = HALF_PI;
  plane.position.y = 8.2;
  scene.add(plane);
}

function createDish(scene, textureEnv) {
  const g = group();
  createGlassContainer({
    scene: g,
    texture: textureEnv,
    curve: curveDish,
    itemScale: 0.2,
    filled: 0.6,
    noLiquid: true,
    position: vec(0, 0, 0)
  });
  createDishTop(g);
  g.scale.set(0.4, 0.4, 0.4);
  g.position.set(35, 0, 15);
  scene.add(g);
}

function createBoxGeometry(scene, material, dimensions, position) {
  const geometry = new THREE.BoxBufferGeometry(...dimensions);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  scene.add(mesh);
}
function createTable(scene, textureEnv) {
  const g = group();
  const material = new THREE.MeshBasicMaterial({
    map: textrue("https://assets.codepen.io/3685267/spells_potions_wood.jpg"),
    side: THREE.DoubleSide,
    envMap: textureEnv.texture
  });
  createBoxGeometry(g, material, [120, 5, 60], vec(0, 0, 0));
  createBoxGeometry(g, material, [5, 40, 60], vec(-50, -22.5, 0));
  createBoxGeometry(g, material, [5, 40, 60], vec(50, -22.5, 0));
  g.position.y = -3;
  scene.add(g);
}

function createGlassContainer({
  scene,
  texture,
  position = vec(0, 0, 0),
  curve,
  itemScale = 1,
  insideScale = 0.9,
  filled = 0.5,
  customLiquidMaterial,
  noTop,
  noLiquid
}) {
  const points = curve();
  const g = group();
  g.position.copy(position);
  g.scale.set(itemScale, itemScale, itemScale);
  if (!noLiquid) {
    createGlassContainerLiquid(
      g,
      points,
      filled,
      insideScale,
      customLiquidMaterial
    );
  }
  createGlassContainerBody(g, texture, points);
  if (!noTop) {
    createGlassContaineTop(g, texture, points);
  }
  g.rotation.y = PI;
  scene.add(g);
  return g;
}

function createGlassContainerBody(scene, texture, points) {
  const geometry = new THREE.LatheGeometry(points, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xefb08c,
    side: THREE.DoubleSide,
    envMap: texture.texture,
    transparent: true,
    opacity: 0.5
  });
  const lathe = new THREE.Mesh(geometry, material);
  scene.add(lathe);
}

function createGlassContaineTop(scene, texture, points) {
  const r = points[0].x;
  const y = points[0].y;
  const geometry = new THREE.TorusBufferGeometry(r, 0.6, 16, 100);
  const material = new THREE.MeshBasicMaterial({
    color: 0xefb08c,
    side: THREE.DoubleSide,
    envMap: texture.texture,
    transparent: true,
    opacity: 0.8
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = HALF_PI;
  mesh.position.y = y;
  scene.add(mesh);
}

function getSurfacePoints(xe, ye) {
  return range(50).map((i) => {
    const x = map(i, 0, 50, 0.01, xe);
    const y = map(i, 0, 50, ye + 0.1, ye);
    return vec(x, y, 0);
  });
}

function createGlassContainerLiquid(
  scene,
  points,
  filledPrecentage,
  scale,
  customLiquidMaterial
) {
  const yMax = points[0].y;
  const yCutoff = map(filledPrecentage, 0, 1, 0, yMax);
  const selectedPoints = points.filter(({ x, y, z }) => y < yCutoff);

  const topAdded = [
    ...getSurfacePoints(selectedPoints[0].x, selectedPoints[0].y),
    ...selectedPoints
  ];

  const geometry = new THREE.LatheGeometry(topAdded, 32);

  const mesh = new THREE.Mesh(geometry, customLiquidMaterial);

  mesh.scale.set(scale, 1, scale);
  scene.add(mesh);
}

function createPaper(scene, geometry, texturePath, rotZ, position) {
  const material = new THREE.MeshBasicMaterial({ map: textrue(texturePath) });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -HALF_PI;
  plane.rotation.z = rotZ;
  plane.position.copy(position);
  scene.add(plane);
}

function createPapers(scene) {
  const g = group();
  const geometry = new THREE.PlaneBufferGeometry(18, 25, 32);
  createPaper(
    scene,
    geometry,
    "https://assets.codepen.io/3685267/spells_potions_page1.jpg",
    TAU / 16,
    vec(-15, 0, 0)
  );
  createPaper(
    scene,
    geometry,
    "https://assets.codepen.io/3685267/spells_potions_page2.jpg",
    -TAU / 16,
    vec(1, 0.1, -5)
  );
  createPaper(
    scene,
    geometry,
    "https://assets.codepen.io/3685267/spells_potions_page3.jpg",
    0,
    vec(0, 0.2, 15)
  );
  createPaper(
    scene,
    geometry,
    "https://assets.codepen.io/3685267/spells_potions_page4.jpg",
    -TAU / 16,
    vec(25, 0, 22)
  );
  scene.add(g);
}

function beaker1() {
  return new THREE.CubicBezierCurve3(
    vec(4, 45, 0),
    vec(4, 11.1, 0),
    vec(20.23, 10.3, 0),
    vec(9, 0, 0)
  ).getSpacedPoints(100);
}

function beaker2() {
  const c1 = new THREE.LineCurve3(vec(5.8, 50), vec(5.8, 35.3, 0));
  const c2 = new THREE.CubicBezierCurve3(
    vec(5.8, 35.3, 0),
    vec(32.3, 24.1, 0),
    vec(30.7, 7.1, 0),
    vec(0, 0, 0)
  );
  const path = new THREE.CurvePath();
  path.add(c1);
  path.add(c2);
  return path.getSpacedPoints(100);
}

function curveDish() {
  return new THREE.CubicBezierCurve3(
    vec(98.2, 49.5, 0),
    vec(71, 9.8, 0),
    vec(6.5, 34.4, 0),
    vec(48.2, 0, 0)
  ).getSpacedPoints(100);
}
function curveWineGlassTop() {
  return new THREE.CubicBezierCurve3(
    vec(1.821, 15.054, 0),
    vec(4.324, 9.362, 0),
    vec(2.669, 8.07, 0),
    vec(0.327, 7.02, 0)
  ).getSpacedPoints(100);
}

function curveWineGlassBottom() {
  const c1 = new THREE.CubicBezierCurve3(
    vec(2.4, 0),
    vec(0.327, 0.708, 0),
    vec(2.097, 1.248, 0),
    vec(0.36, 3.002, 0)
  );
  const c2 = new THREE.LineCurve3(vec(0.36, 3.002), vec(0.327, 7.02, 0));
  const c3 = new THREE.CubicBezierCurve3(
    vec(0.327, 7.02, 0),
    vec(2.669, 8.07, 0),
    vec(4.324, 9.362, 0),
    vec(1.821, 15.054, 0)
  );
  const path = new THREE.CurvePath();
  path.add(c1);
  path.add(c2);
  return path.getSpacedPoints(100);
}
function curveBottle() {
  const c1 = new THREE.CubicBezierCurve3(
    vec(3.009, 0.013),
    vec(4.112, 0.134, 0),
    vec(3.45, 1.189, 0),
    vec(2.96, 1.091, 0)
  );
  const c2 = new THREE.LineCurve3(vec(2.96, 1.091, 0), vec(3.058, 7.905, 0));
  const c3 = new THREE.LineCurve3(vec(3.058, 7.905, 0), vec(1.048, 9.988, 0));
  const c4 = new THREE.CubicBezierCurve3(
    vec(1.048, 9.988, 0),
    vec(1.954, 10.625, 0),
    vec(0.88, 12.267, 0),
    vec(0.856, 14.984, 0)
  );

  const path = new THREE.CurvePath();
  path.add(c1);
  path.add(c2);
  path.add(c3);
  path.add(c4);

  const points = path.getSpacedPoints(100);

  points.reverse();
  return points;
}

function addResizeHandler(renderer, camera) {
  window.addEventListener(
    "resize",
    () => {
      const { innerWidth: w, innerHeight: h } = window;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    false
  );
}

function getVertexShader() {
  return `
  varying vec2 vUv;
  void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1. );
  }`;
}

function getBeakerFragmentShader() {
  return `
  uniform float t;
  varying vec2 vUv;

  ${addNoise()}
  const float TAU = 6.2831853071;
  float map(float value, float sMin, float sMax, float dMin, float dMax){
      return dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);
  }
  vec3 hsb2rgb( in vec3 c ){
      vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                               6.0)-3.0)-1.0,
                       0.0,
                       1.0 );
      rgb = rgb*rgb*(3.0-2.0*rgb);
      return c.z * mix( vec3(1.0), rgb, c.y);
  }
  void main() {
      vec2 u = vUv;
      float size = 10.;
      float timeScaler = 0.001;
      float speed = 0.0001;
      u.y = sin(map(u.y, 0.0, 1.0, 0.0, TAU) + t*0.0002)*0.5;
      float noise = cnoise(vec3(u*size,t*timeScaler));
      vec3 c = hsb2rgb(vec3(map(noise, 0.0, 1.0, 0.3, 0.4), 0.9, map(noise*noise*noise, 0.0, 1.0, 0.3, 0.8)));
      gl_FragColor = vec4( c, 1.);
}`;
}

function getBottleFragmentShader() {
  return `
  uniform float t;
  varying vec2 vUv;
  void main() {
      float time = t*0.005;
      vec2 u = (1.0 - 2.0) * vUv;
      vec3 ht = smoothstep(0.0, 2.0, 10.0 - dot(u, u)) * vec3(u * 0.02, -1.0);
      vec3 n = 100.0 * normalize(ht - vec3(0.0, -0.5 * fract(0.015), 0.65));
      vec3 p = n;
      for (float i = 0.0; i <= 20.0; i++) {
          p = 10.0 * n + vec3(cos(0.325 * time - i - p.x) + cos(0.325 * time + i - p.y), sin(i - p.y) + cos(i + p.x), 1);
          p.xy = cos(i) * p.xy + sin(i) * vec2(p.y, -p.x);
      }
      float tx = 5.0 * sqrt(dot(vec3(3.0, 0.0, 5.0), -p));
      gl_FragColor = vec4(pow(sin(vec3(1.2, 0.2, 0.1) - tx) * 0.49 + 0.5, vec3(1.0)), 1.0);
  }`;
}

function getDishFragmentShader() {
  return `
  uniform float t;
  varying vec2 vUv;
  float circle(in vec2 _st, in float _radius){
      vec2 dist = _st-vec2(0.5);
      return 1.-smoothstep(_radius-(_radius*0.01),
                           _radius+(_radius*0.01),
                           dot(dist,dist)*4.0);
  }
  void main() {
      vec2 u = vUv;
      float PI = 3.14159265;
  
      float time = t*0.0005;
  
     
      vec2 p = u;
      
      vec3 color = vec3(1.0);
     float l = 0.0;
       
     for(float i = 1.0; i < 6.0; i++){
     p.x += 0.1 / i * cos(i * 8.0 * p.y + time + sin(time / 75.0));
     p.y += 0.1 / i * sin(i * 12.0 * p.x + time + cos(time / 120.0));
     l = length(vec2(0, p.y + sin(p.x * PI * i * sin(time / 3.0))));
   }
  float g = 1.0 - pow(l, 0.6);
  color = vec3(g * 0.1, g * 0.4, g*0.5);
  float alpha = circle(u,0.9);
  gl_FragColor=vec4(color, alpha);
  }
  `;
}

function getPotFragmentShader() {
  return `
  uniform float t;
  varying vec2 vUv;
  ${addNoise()}
  const float TAU = 6.2831853071;
  float map(float value, float sMin, float sMax, float dMin, float dMax){
      return dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);
  }
  vec3 hsb2rgb( in vec3 c ){
      vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                               6.0)-3.0)-1.0,
                       0.0,
                       1.0 );
      rgb = rgb*rgb*(3.0-2.0*rgb);
      return c.z * mix( vec3(1.0), rgb, c.y);
  }
  void main() {
      vec2 u = vUv;
      float size = 10.;
      float timeScaler = 0.001;
      float speed = 0.0001;
      u.y = sin(map(u.y, 0.0, 1.0, 0.0, TAU) + t*0.0002)*0.5;
      float noise = cnoise(vec3(u*size,t*timeScaler));
      vec3 c = hsb2rgb(vec3(map(noise, 0.0, 1.0, 0.7, 0.8), 0.9, map(noise*noise*noise, 0.0, 1.0, 0.3, 0.8)));
      gl_FragColor = vec4( c, 1.);
  }`;
}

function createShaderMaterial(fragmentShader, uniforms) {
  return new THREE.ShaderMaterial({
    fragmentShader,
    vertexShader: getVertexShader(),
    side: THREE.DoubleSide,
    uniforms,
    wireframe: false,
    flatShading: false,
    transparent: true
  });
}

function getShaderMaterialSet(uniforms) {
  return {
    beaker: createShaderMaterial(getBeakerFragmentShader(), uniforms),
    bottle: createShaderMaterial(getBottleFragmentShader(), uniforms),
    dish: createShaderMaterial(getDishFragmentShader(), uniforms),
    pot: createShaderMaterial(getPotFragmentShader(), uniforms)
  };
}

function addNoise() {
  return `
  //	Classic Perlin 3D Noise 
  //	by Stefan Gustavson
  //
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
  
  float cnoise(vec3 P){
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
  
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
  
    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  
    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;
  
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
  
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
  }
  `;
}

function render(time) {
  uniforms.t.value = time;
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

init();


