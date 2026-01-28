import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RadioStation } from '../data/radios';

// Helper para logs apenas em desenvolvimento
const log = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

const logWarn = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(...args);
  }
};

const logError = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args);
  }
};

// Constantes do globo
const GLOBE_RADIUS = 1.2;
const MIN_DISTANCE_OFFSET = 0.15; // Margem de segurança para evitar atravessar o globo
const MIN_DISTANCE = GLOBE_RADIUS + MIN_DISTANCE_OFFSET; // 1.35 (não permite atravessar)
const MAX_DISTANCE = 2.5; // Distância inicial da câmera: globo só pode ser aproximado, não reduzido

// Thresholds para LOD geográfico (todos maiores que MIN_DISTANCE). Estações são sempre pins individuais.
const LOD_COUNTRIES_THRESHOLD = 3.0; // Zoom baixo: apenas países
const LOD_STATES_THRESHOLD = 2.0; // Zoom médio: países + estados

// Espessura dos contornos por nível de zoom (zoom alto = linha mais fina, traços em alta definição)
type StrokeLevel = 'wide' | 'medium' | 'fine' | 'extra_fine';
const STROKE_LINE_WIDTH: Record<StrokeLevel, number> = {
  wide: 1.2,
  medium: 0.7,
  fine: 0.4,
  extra_fine: 0.22,
};
const STROKE_ZOOM_EXTRA_FINE = 1.55; // cameraDistance < 1.55 → extra_fine (máximo zoom)
const STROKE_ZOOM_FINE = 2.0;       // cameraDistance < 2 → fine
const STROKE_ZOOM_MEDIUM = 2.8;     // cameraDistance < 2.8 → medium, else wide

// Resolução alta (4096×2048) para fine/extra_fine = traços nítidos quando o globo está ampliado
const TEXTURE_SIZE_STD = { w: 2048, h: 1024 };
const TEXTURE_SIZE_HIRES = { w: 4096, h: 2048 };
const isHiresStroke = (s: StrokeLevel): boolean => s === 'fine' || s === 'extra_fine';
function textureSizeForStroke(s: StrokeLevel): { w: number; h: number } {
  return isHiresStroke(s) ? TEXTURE_SIZE_HIRES : TEXTURE_SIZE_STD;
}

// Natural Earth: divisões admin1 (estados/províncias)
const ADMIN1_GEOJSON_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';

interface GlobeViewProps {
  radios: RadioStation[];
  onRadioSelect: (radio: RadioStation | null) => void;
  selectedRadio?: RadioStation | null;
  onSelectionPosition?: (position: { x: number; y: number } | null) => void;
  centerLocation?: { latitude: number; longitude: number } | null;
  selectorOffsetPx?: { x: number; y: number };
  commitSelectionRequested?: boolean;
  onSelectionCommitProcessed?: () => void;
}

interface RadioPointProps {
  position: [number, number, number];
  radio: RadioStation;
  onPress: (radio: RadioStation) => void;
  isSelected?: boolean;
  camera?: THREE.Camera;
}

function RadioPoint({ position, radio, onPress, isSelected, camera, onPinClick }: RadioPointProps & { onPinClick?: (position: [number, number, number]) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const handleClick = () => {
    onPress(radio);
    // Notificar que o pin foi clicado para rotacionar o globo
    if (onPinClick) {
      onPinClick(position);
    }
  };

  useFrame(() => {
    if (!meshRef.current) return;
    const m = meshRef.current;
    // Disco tangente ao globo: normal do círculo = direção do centro → posição
    m.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      m.position.clone().normalize()
    );
    if (camera) {
      const distance = camera.position.distanceTo(m.position);
      const baseSize = 0.025;
      const minScale = 0.2;
      const maxScale = 0.3;
      const scale = Math.max(minScale, Math.min(maxScale, baseSize / distance));
      m.scale.setScalar(hovered ? scale * 1.2 : scale);
    } else {
      const defaultScale = 0.3;
      m.scale.setScalar(hovered ? defaultScale * 1.2 : defaultScale);
    }
  });

  const baseRadius = 0.01;

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow={false}
      receiveShadow={false}
      onClick={(e) => {
        e.stopPropagation();
        onPress(radio);
        if (onPinClick) onPinClick(position);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <circleGeometry args={[baseRadius, 16]} />
      <meshBasicMaterial
        color={isSelected || hovered ? '#f87171' : '#dc2626'}
        side={THREE.DoubleSide}
        depthWrite={true}
        depthTest={true}
      />
    </mesh>
  );
}

// Pins circulares (discos) sobre o globo; sem sombra/halo: MeshBasicMaterial + renderOrder
function InstancedRadioPoints({ 
  radioPoints, 
  selectedRadio,
  camera,
  onRadioSelect,
  onPinClick
}: { 
  radioPoints: Array<{ position: [number, number, number]; radio: RadioStation }>;
  selectedRadio?: RadioStation | null;
  camera: THREE.Camera | null;
  onRadioSelect: (radio: RadioStation) => void;
  onPinClick?: (position: [number, number, number]) => void;
}) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const upZ = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const scaleVec = useMemo(() => new THREE.Vector3(), []);
  
  // Disco circular tangente ao globo
  const geometry = useMemo(() => new THREE.CircleGeometry(0.01, 16), []);
  
  // Vermelho, sem iluminação, sem polygonOffset; renderOrder evita artefato de profundidade
  const material = useMemo(() => 
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#dc2626'),
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
    }), 
    []
  );
  
  const visibleInstancesRef = useRef<Array<{ index: number; point: { position: [number, number, number]; radio: RadioStation } }>>([]);
  const lastUpdateRef = useRef(0);
  const THROTTLE_MS = 200;
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const pointPos = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!instancedMeshRef.current || !camera) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) return;
    lastUpdateRef.current = now;

    frustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      )
    );

    // Usar todas as rádios: pins visíveis = todos no hemisfério visível (frustum em espaço mundial)
    const group = instancedMeshRef.current.parent;
    const visibleInstances: typeof visibleInstancesRef.current = [];
    const sphere = new THREE.Sphere();

    for (let i = 0; i < radioPoints.length; i++) {
      const pt = radioPoints[i];
      pointPos.set(pt.position[0], pt.position[1], pt.position[2]);
      if (group) {
        worldPos.copy(pointPos).applyMatrix4(group.matrixWorld);
      } else {
        worldPos.copy(pointPos);
      }
      sphere.set(worldPos, 0.02);
      if (frustum.intersectsSphere(sphere)) {
        visibleInstances.push({ index: visibleInstances.length, point: pt });
      }
    }
    visibleInstancesRef.current = visibleInstances;

    if (instancedMeshRef.current.count !== visibleInstances.length) {
      instancedMeshRef.current.count = visibleInstances.length;
    }

    visibleInstances.forEach((instance, i) => {
      const { point } = instance;
      pointPos.set(point.position[0], point.position[1], point.position[2]);
      if (group) worldPos.copy(pointPos).applyMatrix4(group.matrixWorld);
      else worldPos.copy(pointPos);
      const distance = camera.position.distanceTo(worldPos);
      const baseSize = 0.025;
      const minScale = 0.2;
      const maxScale = 0.3;
      const scale = Math.max(minScale, Math.min(maxScale, baseSize / distance));
      normal.copy(pointPos).normalize();
      quat.setFromUnitVectors(upZ, normal);
      scaleVec.setScalar(scale);
      matrix.compose(pointPos, quat, scaleVec);
      instancedMeshRef.current!.setMatrixAt(i, matrix);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  // Capacidade mínima para 16k+ rádios; evita buffer pequeno quando a lista cresce após o carregamento
  const instanceCount = Math.max(radioPoints.length, 40000);

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[geometry, material, instanceCount]}
      frustumCulled={false}
      castShadow={false}
      receiveShadow={false}
      renderOrder={1}
    />
  );
}

// Componente para lista de pontos com LOD (mantido para compatibilidade)
function RadioPointsList({ 
  radioPoints, 
  selectedRadio, 
  onRadioSelect, 
  camera,
  onPinClick
}: { 
  radioPoints: Array<{ position: [number, number, number]; radio: RadioStation }>;
  selectedRadio?: RadioStation | null;
  onRadioSelect: (radio: RadioStation) => void;
  camera: THREE.Camera | null;
  onPinClick?: (position: [number, number, number]) => void;
}) {
  // Inicializar com TODAS as estações visíveis
  const initialVisible = useMemo(() => {
    const visible = new Set<string>();
    radioPoints.forEach((point) => {
      // Mostrar todas as estações, não apenas as principais
      visible.add(point.radio.id);
    });
    return visible;
  }, [radioPoints]);
  
  const [visiblePoints, setVisiblePoints] = useState<Set<string>>(initialVisible);

  // Usar useRef para throttling de atualizações
  const lastUpdateRef = useRef(0);
  const THROTTLE_MS = 200; // Atualizar no máximo a cada 200ms (otimizado para performance)
  
  useFrame((state, delta) => {
    const now = Date.now();
    // Throttle para reduzir atualizações
    if (now - lastUpdateRef.current < THROTTLE_MS) return;
    lastUpdateRef.current = now;
    
    const newVisible = new Set<string>();
    
    if (camera) {
      const cameraDistance = camera.position.length();
      
      // Mostrar TODOS os pins sempre - sem limite baseado em zoom
      // Os pins devem permanecer visíveis em qualquer nível de zoom
      radioPoints.forEach((point) => {
        newVisible.add(point.radio.id);
      });
    } else {
      // Se não há câmera, mostrar todas as estações
      radioPoints.forEach((point) => {
        newVisible.add(point.radio.id);
      });
    }
    
    // Só atualizar se houver mudanças significativas (mais de 50 pins de diferença)
    const sizeDiff = Math.abs(newVisible.size - visiblePoints.size);
    if (sizeDiff > 50 || 
        Array.from(newVisible).slice(0, 100).some(id => !visiblePoints.has(id))) {
      setVisiblePoints(newVisible);
    }
  });

  return (
    <>
      {radioPoints.map((point) => {
        if (!visiblePoints.has(point.radio.id)) return null;
        
        const isSelected = selectedRadio?.id === point.radio.id;
        return (
          <RadioPoint
            key={point.radio.id}
            position={point.position}
            radio={point.radio}
            onPress={onRadioSelect}
            isSelected={isSelected}
            camera={camera || undefined}
            onPinClick={onPinClick}
          />
        );
      })}
    </>
  );
}

// Throttle para busca da rádio mais próxima do centro (evita perda de contexto WebGL com muitos pontos)
const CLOSEST_RADIO_CHECK_MS = 120;
// Verificar todas as estações para que nenhum ponto visível fique "não selecionável" (ex.: Mato Grosso)
const MAX_POINTS_TO_CHECK = 100000;
// Diâmetro do círculo seletor em pixels (deve bater com .radio-selector-circle width/height no App).
const SELECTOR_CIRCLE_DIAMETER_PX = 29;
function Globe({
  radios,
  onRadioSelect,
  selectedRadio,
  onSelectionPosition,
  centerLocation,
  selectorOffsetPx,
  commitSelectionRequested,
  onSelectionCommitProcessed,
}: GlobeViewProps) {
  const lastSelectedRef = useRef<string | null>(null);
  const globeGroupRef = useRef<THREE.Group>(null);
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null);
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const cameraRef = useRef<THREE.Camera | null>(null);
  const controlsRef = useRef<any>(null);
  const [rotateSpeed, setRotateSpeed] = useState(0.4);
  const lastClosestCheckRef = useRef(0);
  const closestResultRef = useRef<{ radio: RadioStation; projected: THREE.Vector3; point3D: THREE.Vector3 } | null>(null);

  // Função para rotacionar o globo e centralizar um pin clicado
  const handlePinClick = useCallback((pinPosition: [number, number, number]) => {
    if (!cameraRef.current || !globeGroupRef.current) return;
    
    // Criar vetor da posição do pin (em coordenadas do globo, sem rotação)
    const pinVector = new THREE.Vector3(...pinPosition);
    
    // A direção desejada é na frente da câmera (direção Z negativa no espaço da câmera)
    // A câmera olha para o centro (0,0,0), então queremos que o pin fique na direção oposta à câmera
    const cameraPos = cameraRef.current.position.clone();
    const cameraDirection = cameraPos.normalize().negate(); // Direção da câmera para o centro, invertida
    
    // Converter posição do pin para coordenadas esféricas (theta = longitude, phi = latitude)
    const pinSpherical = new THREE.Spherical();
    pinSpherical.setFromVector3(pinVector);
    
    // Converter direção alvo (onde queremos que o pin fique) para coordenadas esféricas
    const targetSpherical = new THREE.Spherical();
    targetSpherical.setFromVector3(cameraDirection);
    
    // Calcular diferença de ângulos
    // Theta (azimute/longitude) - rotação horizontal
    let deltaTheta = targetSpherical.theta - pinSpherical.theta;
    // Normalizar para o intervalo [-PI, PI]
    if (deltaTheta > Math.PI) deltaTheta -= 2 * Math.PI;
    if (deltaTheta < -Math.PI) deltaTheta += 2 * Math.PI;
    
    // Phi (elevação/latitude) - rotação vertical
    let deltaPhi = targetSpherical.phi - pinSpherical.phi;
    
    // Aplicar rotação atual do globo
    const currentRotX = globeGroupRef.current.rotation.x;
    const currentRotY = globeGroupRef.current.rotation.y;
    
    // Calcular nova rotação alvo
    // Rotação Y (azimute) - rotação horizontal
    const newRotY = currentRotY + deltaTheta;
    // Rotação X (elevação) - rotação vertical (limitada para não virar o globo de cabeça para baixo)
    const newRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, currentRotX + deltaPhi));
    
    // Definir rotação alvo para animação suave
    targetRotationRef.current = { x: newRotX, y: newRotY };
  }, []);

  const radioPoints = useMemo<Array<{ position: [number, number, number]; radio: RadioStation }>>(() => {
    // Filtrar estações com coordenadas válidas (NaN ou fora dos limites geográficos)
    const validRadios = radios.filter(radio => 
      !isNaN(radio.latitude) && 
      !isNaN(radio.longitude) &&
      radio.latitude >= -90 && radio.latitude <= 90 &&
      radio.longitude >= -180 && radio.longitude <= 180
    );
    
    const points = validRadios.map((radio) => {
      const phi = (90 - radio.latitude) * (Math.PI / 180);
      const theta = (radio.longitude + 180) * (Math.PI / 180);

      const x = -(Math.sin(phi) * Math.cos(theta));
      const z = Math.sin(phi) * Math.sin(theta);
      const y = Math.cos(phi);

      // Pins sobre a superfície do globo na região de origem (mínimo offset para evitar “órbita”)
      const pinOffset = 0.003; // Quase na superfície: fica acima do país/cidade, não em órbita
      const pinDistance = GLOBE_RADIUS + pinOffset;
      
      return {
        position: [x * pinDistance, y * pinDistance, z * pinDistance] as [number, number, number],
        radio
      };
    });
    log(`[GlobeView] Carregadas ${points.length} estações de rádio no globo`);
    return points;
  }, [radios]);

  // Centro do seletor em NDC: um pixel no centro do círculo é a referência de proximidade.
  // Quando o seletor é arrastado (selectorOffsetPx), o centro em pixels é (size/2 + offset); converter para NDC.
  const getSelectorCenterNDC = (size: { width: number; height: number }) => {
    if (selectorOffsetPx == null || size.width <= 0 || size.height <= 0) {
      return new THREE.Vector2(0, 0);
    }
    return new THREE.Vector2(
      2 * selectorOffsetPx.x / size.width,
      -2 * selectorOffsetPx.y / size.height
    );
  };

  // Detectar pin sob o seletor; rotação para centralizar o mais próximo no centro do seletor; seleção só ao soltar (commit).
  useFrame(({ camera, size }) => {
    cameraRef.current = camera;

    const cameraDistance = camera.position.length();
    const normalizedDistance = Math.max(0, Math.min(1, (cameraDistance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)));
    const baseSpeed = 0.4;
    const speedMultiplier = 0.375 + (normalizedDistance * 0.625);
    const newRotateSpeed = baseSpeed * speedMultiplier;
    if (controlsRef.current) {
      controlsRef.current.rotateSpeed = newRotateSpeed;
    }
    setRotateSpeed(newRotateSpeed);

    const selectorCenterNDC = getSelectorCenterNDC(size);

    // Raio do círculo seletor em NDC: só estações dentro desse raio são consideradas "centralizadas".
    const minSize = Math.min(size.width, size.height);
    const selectorRadiusNDC = minSize > 0 ? SELECTOR_CIRCLE_DIAMETER_PX / minSize : 0.1;

    // Seletor ativo quando temos offset (incluindo 0,0 = centro). Filtra só estações dentro do círculo.
    const hasSelector = selectorOffsetPx != null;

    let closestRadio: RadioStation | null = null;
    let closestPoint: THREE.Vector3 | null = null;
    let closestPoint3D: THREE.Vector3 | null = null;
    let isUnderSelector = false;

    if (hasSelector) {
      const now = Date.now();
      if (now - lastClosestCheckRef.current >= CLOSEST_RADIO_CHECK_MS && radioPoints.length > 0 && globeGroupRef.current) {
        lastClosestCheckRef.current = now;
        let minDistanceToCenter = Infinity;
        const step = radioPoints.length > MAX_POINTS_TO_CHECK ? Math.ceil(radioPoints.length / MAX_POINTS_TO_CHECK) : 1;
        const vec = new THREE.Vector3();
        const worldPos = new THREE.Vector3();
        const projected = new THREE.Vector3();

        for (let i = 0; i < radioPoints.length; i += step) {
          const point = radioPoints[i];
          vec.set(point.position[0], point.position[1], point.position[2]);
          worldPos.copy(vec).applyMatrix4(globeGroupRef.current.matrixWorld);
          if (worldPos.dot(camera.position) <= 0) continue;
          projected.copy(worldPos).project(camera);
          if (projected.z <= -1 || projected.z >= 1) continue;

          const distanceToCenter = Math.hypot(projected.x - selectorCenterNDC.x, projected.y - selectorCenterNDC.y);
          // Só estações centralizadas no círculo: dentro do raio do seletor, a mais próxima do centro é a selecionada.
          if (distanceToCenter <= selectorRadiusNDC && distanceToCenter < minDistanceToCenter) {
            minDistanceToCenter = distanceToCenter;
            closestRadio = point.radio;
            closestPoint = projected.clone();
            closestPoint3D = vec.clone();
          }
        }
        closestResultRef.current = closestRadio && closestPoint && closestPoint3D
          ? { radio: closestRadio, projected: closestPoint, point3D: closestPoint3D }
          : null;
      } else {
        const cached = closestResultRef.current;
        if (cached) {
          closestRadio = cached.radio;
          closestPoint = cached.projected;
          closestPoint3D = cached.point3D;
        }
      }

      // Decidir “sob o seletor” pela posição atual do pin na tela (re-projetar), dentro do raio do círculo.
      let distanceToCenter = Infinity;
      if (closestPoint3D && globeGroupRef.current && camera) {
        const w = new THREE.Vector3();
        const p = new THREE.Vector3();
        w.copy(closestPoint3D).applyMatrix4(globeGroupRef.current.matrixWorld);
        if (w.dot(camera.position) > 0) {
          p.copy(w).project(camera);
          if (p.z > -1 && p.z < 1) {
            distanceToCenter = Math.hypot(p.x - selectorCenterNDC.x, p.y - selectorCenterNDC.y);
          }
        }
      }
      isUnderSelector = closestRadio !== null && distanceToCenter <= selectorRadiusNDC;

      if (!isUnderSelector) {
        targetRotationRef.current = null;
      }
      // Seletor só filtra a rádio mais ao centro como selecionada; nenhuma rotação automática do globo.
    } else {
      targetRotationRef.current = null;
    }

    if (globeGroupRef.current && camera && targetRotationRef.current) {
      const normalizedDistance = Math.max(0, Math.min(1, (cameraDistance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)));
      const baseLerpFactor = 0.09;
      const lerpFactor = baseLerpFactor * (0.35 + (normalizedDistance * 0.65));

      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * lerpFactor;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * lerpFactor;

      globeGroupRef.current.rotation.x = currentRotationRef.current.x;
      globeGroupRef.current.rotation.y = currentRotationRef.current.y;
    }

    // Preview: enquanto move o círculo, reporta a estação mais próxima do centro (para mostrar no painel).
    if (isUnderSelector && closestRadio !== null) {
      if (closestRadio.id !== lastSelectedRef.current) {
        lastSelectedRef.current = closestRadio.id;
        onRadioSelect(closestRadio);
      }
      const cx = size.width / 2 + (selectorOffsetPx?.x ?? 0);
      const cy = size.height / 2 + (selectorOffsetPx?.y ?? 0);
      if (onSelectionPosition) onSelectionPosition({ x: cx, y: cy });
    }
    // Seleção só ao soltar (commit): não chama onRadioSelect(null) durante o arrasto.
    if (commitSelectionRequested && onSelectionCommitProcessed) {
      if (closestRadio !== null) {
        lastSelectedRef.current = closestRadio.id;
        onRadioSelect(closestRadio);
      } else {
        lastSelectedRef.current = null;
        onRadioSelect(null);
      }
      if (onSelectionPosition) {
        if (closestRadio !== null) {
          const cx = size.width / 2 + (selectorOffsetPx?.x ?? 0);
          const cy = size.height / 2 + (selectorOffsetPx?.y ?? 0);
          onSelectionPosition({ x: cx, y: cy });
        } else {
          onSelectionPosition(null);
        }
      }
      onSelectionCommitProcessed();
    }
  });

  // Sistema de LOD geográfico progressivo (apenas países e estados; estações são pins individuais, sem agrupamento)
  const [geographicLOD, setGeographicLOD] = useState<'countries' | 'states'>('countries');
  const [worldMapTexture, setWorldMapTexture] = useState<THREE.Texture | null>(null);
  const [combinedTexture, setCombinedTexture] = useState<THREE.Texture | null>(null);
  const { gl } = useThree();

  // Nitidez em ângulo: anisotropia máxima na textura do globo (traços mais nítidos ao ampliar)
  useEffect(() => {
    const tex = combinedTexture || worldMapTexture;
    if (!tex) return;
    const caps = (gl as { capabilities?: { getMaxAnisotropy?: () => number } }).capabilities;
    tex.anisotropy = typeof caps?.getMaxAnisotropy === 'function' ? caps.getMaxAnisotropy() : 1;
    tex.needsUpdate = true;
  }, [combinedTexture, worldMapTexture, gl]);

  // Cache de texturas por LOD e por nível de stroke (zoom)
  const textureCacheRef = useRef<{
    countriesByStroke?: Partial<Record<StrokeLevel, THREE.Texture>>;
    statesByStroke?: Partial<Record<StrokeLevel, THREE.Texture>>;
    combined?: { lod: 'countries' | 'states'; strokeLevel: StrokeLevel; texture: THREE.Texture };
  }>({});
  
  // Gerar textura de países com espessura de contorno conforme zoom (strokeLevel)
  const generateCountriesTexture = useCallback(async (strokeLevel: StrokeLevel = 'wide'): Promise<THREE.Texture | null> => {
    if (!textureCacheRef.current.countriesByStroke) textureCacheRef.current.countriesByStroke = {};
    if (textureCacheRef.current.countriesByStroke[strokeLevel]) {
      return textureCacheRef.current.countriesByStroke[strokeLevel]!;
    }
    
    try {
      const d3Geo = await import('d3-geo');
      const topojson = await import('topojson-client') as any;
      
      const worldTopo = await fetch('https://unpkg.com/world-atlas@1/world/50m.json')
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        });
      
      const countries = topojson.feature(worldTopo as any, worldTopo.objects.countries as any);

      const { w, h } = textureSizeForStroke(strokeLevel);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const projection = d3Geo.geoEquirectangular()
        .scale(canvas.width / (2 * Math.PI))
        .translate([canvas.width / 2, canvas.height / 2]);
      
      const path = d3Geo.geoPath().projection(projection).context(ctx);
      const lineWidth = STROKE_LINE_WIDTH[strokeLevel];
      
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = lineWidth;
      
      countries.features.forEach((feature: any) => {
        ctx.beginPath();
        path(feature);
        ctx.fill();
        ctx.stroke();
      });
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      textureCacheRef.current.countriesByStroke[strokeLevel] = texture;
      log('Textura de países gerada com sucesso!');
      return texture;
    } catch (error) {
      logError('Erro ao gerar textura de países:', error);
      return null;
    }
  }, []);
  
  // Gerar textura de estados/províncias (admin1) com espessura de contorno conforme zoom (strokeLevel)
  const generateStatesTexture = useCallback(async (strokeLevel: StrokeLevel = 'wide'): Promise<THREE.Texture | null> => {
    if (!textureCacheRef.current.statesByStroke) textureCacheRef.current.statesByStroke = {};
    if (textureCacheRef.current.statesByStroke[strokeLevel]) {
      return textureCacheRef.current.statesByStroke[strokeLevel]!;
    }

    try {
      const d3Geo = await import('d3-geo');

      const statesGeo = await fetch(ADMIN1_GEOJSON_URL)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .catch(() => {
          logWarn('Não foi possível carregar dados de estados/províncias (admin1)');
          return null;
        });

      if (!statesGeo?.features?.length) return null;

      const { w, h } = textureSizeForStroke(strokeLevel);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const projection = d3Geo.geoEquirectangular()
        .scale(canvas.width / (2 * Math.PI))
        .translate([canvas.width / 2, canvas.height / 2]);
      const path = d3Geo.geoPath().projection(projection).context(ctx);

      const lineWidth = Math.max(0.2, STROKE_LINE_WIDTH[strokeLevel] * 0.6);

      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = 0.85;

      statesGeo.features.forEach((feature: { geometry?: unknown }) => {
        if (feature.geometry) {
          ctx.beginPath();
          path(feature as any);
          ctx.stroke();
        }
      });

      ctx.globalAlpha = 1.0;

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      textureCacheRef.current.statesByStroke[strokeLevel] = texture;
      log('Textura de estados/províncias (admin1) gerada com sucesso!');
      return texture;
    } catch (error) {
      logError('Erro ao gerar textura de estados:', error);
      return null;
    }
  }, []);
  
  // Sem agrupamento por cidade: cada estação é exibida individualmente como pin 3D (InstancedRadioPoints).
  // A textura do globo usa apenas países e estados (contornos); nenhuma camada de “cidades” agrupadas.

  // Combinar texturas por LOD e por espessura de contorno (strokeLevel = zoom); resolução alta para fine/extra_fine
  const combineTextures = useCallback(async (lod: 'countries' | 'states', strokeLevel: StrokeLevel = 'wide') => {
    const cached = textureCacheRef.current.combined;
    if (cached?.lod === lod && cached?.strokeLevel === strokeLevel) {
      setCombinedTexture(cached.texture);
      return;
    }

    const { w, h } = textureSizeForStroke(strokeLevel);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const countriesTexture = await generateCountriesTexture(strokeLevel);
    if (countriesTexture?.image && (countriesTexture.image instanceof HTMLImageElement || countriesTexture.image instanceof HTMLCanvasElement)) {
      ctx.drawImage(countriesTexture.image, 0, 0);
    }

    if (lod === 'states') {
      const statesTexture = await generateStatesTexture(strokeLevel);
      if (statesTexture?.image && (statesTexture.image instanceof HTMLImageElement || statesTexture.image instanceof HTMLCanvasElement)) {
        ctx.drawImage(statesTexture.image, 0, 0);
      }
    }

    const combined = new THREE.CanvasTexture(canvas);
    combined.needsUpdate = true;
    textureCacheRef.current.combined = { lod, strokeLevel, texture: combined };
    setCombinedTexture(combined);
    log(`Textura combinada gerada para LOD: ${lod}, stroke: ${strokeLevel}`);
  }, [generateCountriesTexture, generateStatesTexture]);
  
  // Carregar textura inicial (países com contorno "wide")
  useEffect(() => {
    const createBasicTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };
    
    const basicTexture = createBasicTexture();
    if (basicTexture) setWorldMapTexture(basicTexture);
    
    generateCountriesTexture('wide').then(texture => {
      if (texture) {
        setWorldMapTexture(texture);
        combineTextures('countries', 'wide');
      }
    });
  }, [generateCountriesTexture, combineTextures]);
  
  // Atualizar LOD e espessura dos contornos (strokeLevel) conforme zoom
  const lastLODUpdateRef = useRef(0);
  const lastStrokeLevelRef = useRef<StrokeLevel>('wide');
  const LOD_UPDATE_THROTTLE = 500;
  
  useFrame(({ camera }) => {
    const now = Date.now();
    if (now - lastLODUpdateRef.current < LOD_UPDATE_THROTTLE) return;
    
    const cameraDistance = camera.position.length();
    
    // LOD: países só, ou países + estados; estações são sempre pins individuais (sem agrupamento por cidade)
    let newLOD: 'countries' | 'states' = 'countries';
    if (cameraDistance < LOD_STATES_THRESHOLD) {
      newLOD = 'states';
    }
    
    const newStrokeLevel: StrokeLevel = cameraDistance < STROKE_ZOOM_EXTRA_FINE
      ? 'extra_fine'
      : cameraDistance < STROKE_ZOOM_FINE
        ? 'fine'
        : cameraDistance < STROKE_ZOOM_MEDIUM
          ? 'medium'
          : 'wide';
    
    const lodChanged = newLOD !== geographicLOD;
    const strokeChanged = newStrokeLevel !== lastStrokeLevelRef.current;
    
    if (lodChanged || strokeChanged) {
      lastLODUpdateRef.current = now;
      lastStrokeLevelRef.current = newStrokeLevel;
      if (lodChanged) setGeographicLOD(newLOD);
      combineTextures(newLOD, newStrokeLevel);
    }
  });

  // Centralizar no local do usuário quando centerLocation mudar
  // Usa a mesma convenção de coordenadas dos pins: (lat,lng) → posição no globo → rotação que leva esse ponto à frente da câmera
  useEffect(() => {
    if (!centerLocation || !globeGroupRef.current) return;
    const { latitude, longitude } = centerLocation;
    // Mesma fórmula dos radioPoints: posição do ponto (lat,lng) na superfície do globo
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (longitude + 180) * (Math.PI / 180);
    const x = -(Math.sin(phi) * Math.cos(theta)) * GLOBE_RADIUS;
    const z = Math.sin(phi) * Math.sin(theta) * GLOBE_RADIUS;
    const y = Math.cos(phi) * GLOBE_RADIUS;
    const pinVector = new THREE.Vector3(x, y, z);
    // Direção “à frente” da câmera (câmera em (0,0,2.5) → direção (0,0,1))
    const targetVector = new THREE.Vector3(0, 0, 1);
    const pinSpherical = new THREE.Spherical();
    pinSpherical.setFromVector3(pinVector);
    const targetSpherical = new THREE.Spherical();
    targetSpherical.setFromVector3(targetVector);
    let deltaTheta = targetSpherical.theta - pinSpherical.theta;
    if (deltaTheta > Math.PI) deltaTheta -= 2 * Math.PI;
    if (deltaTheta < -Math.PI) deltaTheta += 2 * Math.PI;
    const deltaPhi = targetSpherical.phi - pinSpherical.phi;
    const targetX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, deltaPhi));
    const targetY = deltaTheta;
    targetRotationRef.current = { x: targetX, y: targetY };
    currentRotationRef.current = { x: targetX, y: targetY };
    globeGroupRef.current.rotation.x = targetX;
    globeGroupRef.current.rotation.y = targetY;
  }, [centerLocation]);

  return (
    <>
      {/* Grupo do globo para aplicar rotação automática */}
      <group ref={globeGroupRef}>
        {/* Globo: sem receber sombra para evitar halo dos pins */}
        <Sphere args={[GLOBE_RADIUS, 64, 64]} castShadow={false} receiveShadow={false}>
          <meshStandardMaterial
            map={combinedTexture || worldMapTexture || undefined}
            color="#ffffff"
            roughness={0.7}
            metalness={0.1}
          />
        </Sphere>


        {/* Pontos das rádios - renderização otimizada com InstancedMesh */}
        <InstancedRadioPoints 
          radioPoints={radioPoints}
          selectedRadio={selectedRadio}
          camera={cameraRef.current}
          onRadioSelect={onRadioSelect}
          onPinClick={handlePinClick}
        />
      </group>


      {/* Iluminação suave; luzes sem sombra para não gerar halo ao dar zoom */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} castShadow={false} />
      <directionalLight position={[-5, -5, -5]} intensity={0.2} castShadow={false} />

      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        zoomSpeed={0.6}
        panSpeed={0.5}
        rotateSpeed={rotateSpeed}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
}

export default function GlobeView({
  radios,
  onRadioSelect,
  selectedRadio,
  onSelectionPosition,
  centerLocation,
  selectorOffsetPx,
  commitSelectionRequested,
  onSelectionCommitProcessed,
}: GlobeViewProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'transparent' }}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
        shadows={false}
      >
        <Globe
          radios={radios}
          onRadioSelect={onRadioSelect}
          selectedRadio={selectedRadio}
          onSelectionPosition={onSelectionPosition}
          centerLocation={centerLocation}
          selectorOffsetPx={selectorOffsetPx}
          commitSelectionRequested={commitSelectionRequested}
          onSelectionCommitProcessed={onSelectionCommitProcessed}
        />
      </Canvas>
    </div>
  );
}
