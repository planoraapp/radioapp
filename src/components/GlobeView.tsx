import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
const MAX_DISTANCE = 5.0;

// Thresholds para LOD geográfico (todos maiores que MIN_DISTANCE)
const LOD_COUNTRIES_THRESHOLD = 3.0; // Zoom baixo: apenas países
const LOD_STATES_THRESHOLD = 2.0; // Zoom médio: países + estados
const LOD_CITIES_THRESHOLD = 1.6; // Zoom alto: países + estados + cidades (deve ser > MIN_DISTANCE)

interface GlobeViewProps {
  radios: RadioStation[];
  onRadioSelect: (radio: RadioStation) => void;
  selectedRadio?: RadioStation | null;
  onSelectionPosition?: (position: { x: number; y: number } | null) => void;
  centerLocation?: { latitude: number; longitude: number } | null;
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
    
    if (camera) {
      // Calcular distância da câmera ao pin
      const distance = camera.position.distanceTo(meshRef.current.position);
      // Tamanho base que diminui com o zoom (distância maior = pin menor)
      // Tamanho intermediário - menor que original, mas ainda visível
      const baseSize = radio.isMajor ? 0.06 : 0.04; // Estações principais um pouco maiores
      const minScale = radio.isMajor ? 0.25 : 0.18; // Escala mínima ajustada
      const maxScale = radio.isMajor ? 0.65 : 0.5; // Escala máxima ajustada
      const scale = Math.max(minScale, Math.min(maxScale, baseSize / distance));
      
      // Multiplicador adicional - pins major 20% maiores
      const majorMultiplier = radio.isMajor ? 1.2 : 1.0; // Estações principais 20% maiores
      const finalScale = scale * majorMultiplier;
      
      meshRef.current.scale.setScalar(hovered ? finalScale * 1.2 : finalScale);
    } else {
      // Se não há câmera, usar escala padrão baseada no tamanho base
      const defaultScale = radio.isMajor ? 1.2 : 1.0;
      meshRef.current.scale.setScalar(hovered ? defaultScale * 1.2 : defaultScale);
    }
  });

  // Tamanho base do pin (será escalado pela distância)
  // Tamanho intermediário - menor que original mas ainda visível
  const baseRadius = radio.isMajor ? 0.015 : 0.012; // Pins menores mas visíveis

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onPress(radio);
        // Notificar que o pin foi clicado para rotacionar o globo
        if (onPinClick) {
          onPinClick(position);
        }
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[baseRadius, 8, 8]} />
      <meshStandardMaterial
        color={isSelected || hovered ? "#ef4444" : "#3b82f6"}
        emissive={isSelected || hovered ? "#ef4444" : "#3b82f6"}
        emissiveIntensity={isSelected || hovered ? 0.8 : 0.5}
        metalness={0.1}
        roughness={0.2}
      />
    </mesh>
  );
}

// Componente otimizado usando InstancedMesh para renderizar milhares de pins
// Similar à estratégia do Radio Garden com Cesium para performance
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
  const color = useMemo(() => new THREE.Color(), []);
  
  // Geometria compartilhada (esfera simplificada, baixa resolução)
  const geometry = useMemo(() => 
    new THREE.SphereGeometry(0.012, 8, 8), // 8x8 em vez de 16x16 para performance
    []
  );
  
  // Material compartilhado (mantendo cores exatas do design)
  const material = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: '#3b82f6', // Azul normal
      emissive: '#3b82f6',
      emissiveIntensity: 0.5,
      metalness: 0.1,
      roughness: 0.2,
    }), 
    []
  );
  
  // Buffer de instâncias visíveis
  const visibleInstancesRef = useRef<Array<{
    index: number;
    point: { position: [number, number, number]; radio: RadioStation };
  }>>([]);
  
  // Throttle para atualizações (aumentado para melhor performance)
  const lastUpdateRef = useRef(0);
  const THROTTLE_MS = 200; // Aumentado de 100ms para 200ms
  
  useFrame(() => {
    if (!instancedMeshRef.current || !camera) return;
    
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) return;
    lastUpdateRef.current = now;
    
    // Atualizar frustum da câmera
    frustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      )
    );
    
    // Filtrar pontos visíveis no frustum
    const cameraDistance = camera.position.length();
    const normalizedZoom = Math.max(0, Math.min(1, 
      (cameraDistance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)
    ));
    
    // Limitar número máximo de pins baseado no zoom (LOD)
    // Zoom alto = menos pins, zoom baixo = mais pins
    // Zoom muito alto: máximo 500 pins
    // Zoom médio: máximo 2000 pins
    // Zoom baixo: máximo 5000 pins
    const maxPinsToProcess = normalizedZoom > 0.7 ? 500 : normalizedZoom > 0.4 ? 2000 : 5000;
    
    // Pré-filtrar por prioridade (major first) antes de processar frustum
    // Isso reduz o processamento para grandes quantidades
    const priorityPoints = radioPoints.filter((_, idx) => {
      // Primeiro 50% são major ou primeiros 50% de todas as estações
      return idx < radioPoints.length / 2 || radioPoints[idx]?.radio.isMajor;
    });
    
    // Se ainda temos muitos pontos, limitar antes do sorting
    const pointsToCheck = priorityPoints.length > maxPinsToProcess * 2
      ? priorityPoints.slice(0, maxPinsToProcess * 2)
      : priorityPoints;
    
    // Ordenar apenas os pontos pré-filtrados por distância e priorizar major
    const sortedPoints = [...pointsToCheck].sort((a, b) => {
      const distA = camera.position.distanceTo(new THREE.Vector3(...a.position));
      const distB = camera.position.distanceTo(new THREE.Vector3(...b.position));
      if (a.radio.isMajor !== b.radio.isMajor) {
        return a.radio.isMajor ? -1 : 1;
      }
      return distA - distB;
    }).slice(0, maxPinsToProcess); // Limitar antes do frustum culling
    
      // Criar frustum culling - processar apenas os pontos limitados
      const visibleInstances: typeof visibleInstancesRef.current = [];
      const sphere = new THREE.Sphere(); // Reutilizar sphere
      for (const point of sortedPoints) {
        const pointPos = new THREE.Vector3(...point.position);
        
        // Verificar se está no frustum (visível na tela)
        sphere.set(pointPos, 0.02);
        if (frustum.intersectsSphere(sphere)) {
          visibleInstances.push({
            index: visibleInstances.length,
            point
          });
        }
      }
    
    // Atualizar referência de instâncias visíveis
    visibleInstancesRef.current = visibleInstances;
    
    // Garantir que temos instâncias suficientes
    if (instancedMeshRef.current.count !== visibleInstances.length) {
      instancedMeshRef.current.count = visibleInstances.length;
    }
    
    // Atualizar matrizes e cores das instâncias
    visibleInstances.forEach((instance, i) => {
      const { point } = instance;
      const pointPos = new THREE.Vector3(...point.position);
      const distance = camera.position.distanceTo(pointPos);
      
      // Escalar baseado na distância (mesma lógica do RadioPoint original)
      const baseSize = point.radio.isMajor ? 0.06 : 0.04;
      const minScale = point.radio.isMajor ? 0.25 : 0.18;
      const maxScale = point.radio.isMajor ? 0.65 : 0.5;
      const scale = Math.max(minScale, Math.min(maxScale, baseSize / distance));
      const majorMultiplier = point.radio.isMajor ? 1.2 : 1.0;
      const finalScale = scale * majorMultiplier;
      
      // Aplicar escala e posição
      matrix.makeScale(finalScale, finalScale, finalScale);
      matrix.setPosition(pointPos);
      
      instancedMeshRef.current!.setMatrixAt(i, matrix);
      
      // Aplicar cor baseado na seleção (mantendo cores exatas do design)
      const isSelected = selectedRadio?.id === point.radio.id;
      if (isSelected) {
        color.set('#ef4444'); // Vermelho para selecionado
      } else {
        color.set('#3b82f6'); // Azul normal
      }
      instancedMeshRef.current!.setColorAt(i, color);
    });
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  });
  
  // Para interação (clique), precisamos usar raycaster manualmente
  // Por enquanto, manteremos o comportamento de seleção baseado na proximidade do centro
  // Isso é tratado no componente Globe através do useFrame
  
  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[geometry, material, radioPoints.length]}
      frustumCulled={false} // Já fazemos frustum culling manualmente
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

function Globe({ radios, onRadioSelect, selectedRadio, onSelectionPosition, centerLocation }: GlobeViewProps) {
  const lastSelectedRef = useRef<string | null>(null);
  const globeGroupRef = useRef<THREE.Group>(null);
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null);
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const cameraRef = useRef<THREE.Camera | null>(null);
  const controlsRef = useRef<any>(null);
  const [rotateSpeed, setRotateSpeed] = useState(0.4);
  
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

      // Posicionar os pins exatamente sobre a superfície do globo
      // Adicionar um pequeno offset (0.02) para garantir que fiquem visíveis acima da textura
      const pinOffset = 0.02; // Pequeno offset para garantir visibilidade
      const pinDistance = GLOBE_RADIUS + pinOffset;
      
      return {
        position: [x * pinDistance, y * pinDistance, z * pinDistance] as [number, number, number],
        radio
      };
    });
    log(`[GlobeView] Carregadas ${points.length} estações de rádio no globo`);
    return points;
  }, [radios]);

  // Detectar rádio mais próxima do centro (círculo vermelho) e rotacionar globo
  useFrame(({ camera, size }) => {
    // Sempre atualizar a referência da câmera
    cameraRef.current = camera;
    
        // Calcular velocidade de rotação baseada no zoom (distância da câmera)
        const cameraDistance = camera.position.length();
        const normalizedDistance = Math.max(0, Math.min(1, (cameraDistance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)));
    // Velocidade reduz quando zoom está alto (normalizedDistance baixo)
    // Velocidade base: 0.15 a 0.4 (quando normalizado)
    const baseSpeed = 0.4;
    const speedMultiplier = 0.375 + (normalizedDistance * 0.625); // Entre 0.375 e 1.0
    const newRotateSpeed = baseSpeed * speedMultiplier;
    
    // Atualizar velocidade de rotação do OrbitControls
    if (controlsRef.current) {
      controlsRef.current.rotateSpeed = newRotateSpeed;
    }
    setRotateSpeed(newRotateSpeed);
    
    
    // Centro da tela em coordenadas normalizadas (0, 0)
    const screenCenter = new THREE.Vector2(0, 0);
    // Raio do círculo vermelho em coordenadas normalizadas
    // Aumentado para facilitar a seleção (aproximadamente 0.05 = 5% da tela)
    const selectionRadius = 0.05;
    // Raio para iniciar rotação automática (um pouco maior que o de seleção)
    const autoRotateRadius = 0.15;
    
    let closestRadio: RadioStation | null = null;
    let closestPoint: THREE.Vector3 | null = null;
    let closestPoint3D: THREE.Vector3 | null = null;
    let minPointDistance = Infinity;

    radioPoints.forEach((point: { position: [number, number, number]; radio: RadioStation }) => {
      const pointPos = new THREE.Vector3(...point.position);
      
      // Aplicar rotação atual do globo ao ponto para obter posição atual na tela
      if (globeGroupRef.current) {
        const worldPos = pointPos.clone();
        worldPos.applyMatrix4(globeGroupRef.current.matrixWorld);
        
        // Projetar ponto 3D em coordenadas 2D da tela
        const projected = worldPos.clone().project(camera);
        
        // Converter para coordenadas normalizadas (-1 a 1)
        const screenPos = new THREE.Vector2(projected.x, projected.y);
        
        // Calcular distância do centro da tela
        const distance = screenPos.distanceTo(screenCenter);
        
        // Verificar se está dentro do raio de seleção e visível
        // projected.z entre -1 e 1 significa que está na frente da câmera
        // Valores mais próximos de 0 estão mais próximos da câmera
        if (distance < selectionRadius && projected.z > -1 && projected.z < 1) {
          // Priorizar pontos mais próximos da câmera (z mais próximo de 0)
          const depthScore = Math.abs(projected.z);
          const combinedScore = distance + depthScore * 0.5;
          
          if (combinedScore < minPointDistance) {
            minPointDistance = combinedScore;
            closestRadio = point.radio;
            closestPoint = projected;
            // Guardar posição 3D original (sem rotação do globo)
            closestPoint3D = pointPos.clone();
          }
        }
      }
    });

    // Rotacionar globo automaticamente se um pin está próximo mas não exatamente no centro
    if (closestRadio !== null && closestPoint3D !== null && closestPoint !== null) {
      const projectedPoint: THREE.Vector3 = closestPoint;
      const screenPos = new THREE.Vector2(projectedPoint.x, projectedPoint.y);
      const distance = screenPos.distanceTo(screenCenter);
      
      // Se está dentro do raio de rotação automática mas não no centro, calcular rotação necessária
      if (distance < autoRotateRadius && distance > 0.02) {
        // Calcular velocidade de rotação baseada no zoom (distância da câmera)
        // Zoom alto (distância pequena) = velocidade menor
        // Zoom baixo (distância grande) = velocidade normal
        const cameraDistance = camera.position.length();
        // Normalizar distância entre 0 (muito próximo) e 1 (muito longe)
        const normalizedDistance = Math.max(0, Math.min(1, (cameraDistance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)));
        // Velocidade reduz quando zoom está alto (normalizedDistance baixo)
        // Velocidade base reduzida proporcionalmente: 0.3 a 1.0 (quando normalizado)
        const baseRotationSpeed = 0.02;
        const speedMultiplier = 0.3 + (normalizedDistance * 0.7); // Entre 0.3 e 1.0
        const rotationSpeed = baseRotationSpeed * speedMultiplier;
        
        const offsetX = -screenPos.y * rotationSpeed; // Inverter Y para rotação X
        const offsetY = screenPos.x * rotationSpeed;
        
        // Ajustar rotação atual do globo
        if (globeGroupRef.current) {
          const currentRotX = globeGroupRef.current.rotation.x;
          const currentRotY = globeGroupRef.current.rotation.y;
          
          targetRotationRef.current = { 
            x: currentRotX + offsetX, 
            y: currentRotY + offsetY 
          };
        }
      } else {
        targetRotationRef.current = null;
      }
    } else {
      targetRotationRef.current = null;
    }

    // Aplicar rotação suave ao globo
    if (globeGroupRef.current && camera) {
      if (targetRotationRef.current) {
        // Calcular velocidade de interpolação baseada no zoom
        const cameraDistance = camera.position.length();
        const normalizedDistance = Math.max(0, Math.min(1, (cameraDistance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)));
        // LerpFactor reduz quando zoom está alto para rotação mais lenta
        const baseLerpFactor = 0.05;
        const lerpMultiplier = 0.3 + (normalizedDistance * 0.7); // Entre 0.3 e 1.0
        const lerpFactor = baseLerpFactor * lerpMultiplier;
        
        currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * lerpFactor;
        currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * lerpFactor;
        
        globeGroupRef.current.rotation.x = currentRotationRef.current.x;
        globeGroupRef.current.rotation.y = currentRotationRef.current.y;
      }
    }

    // Selecionar a rádio mais próxima se mudou
    if (closestRadio !== null && closestPoint !== null) {
      const selectedRadio: RadioStation = closestRadio;
      const projectedPoint: THREE.Vector3 = closestPoint;
      
      if (selectedRadio.id !== lastSelectedRef.current) {
        lastSelectedRef.current = selectedRadio.id;
        onRadioSelect(selectedRadio);
      }
      
      // Calcular posição em pixels (coordenadas normalizadas para pixels)
      // x e y estão em -1 a 1, precisamos converter para pixels
      const x = (projectedPoint.x * 0.5 + 0.5) * size.width;
      const y = (projectedPoint.y * -0.5 + 0.5) * size.height; // Inverter Y
      
      // Notificar posição do ponto selecionado
      if (onSelectionPosition) {
        onSelectionPosition({ x, y });
      }
    } else {
      // Se nenhuma rádio está próxima do centro, voltar ao centro
      if (onSelectionPosition) {
        onSelectionPosition(null);
      }
    }
  });

  // Sistema de LOD geográfico progressivo
  const [geographicLOD, setGeographicLOD] = useState<'countries' | 'states' | 'cities'>('countries');
  const [worldMapTexture, setWorldMapTexture] = useState<THREE.Texture | null>(null);
  const [combinedTexture, setCombinedTexture] = useState<THREE.Texture | null>(null);
  
  // Cache de texturas para evitar recarregamentos
  const textureCacheRef = useRef<{
    countries?: THREE.Texture;
    states?: THREE.Texture;
    cities?: THREE.Texture;
    combined?: { lod: 'countries' | 'states' | 'cities'; texture: THREE.Texture };
  }>({});
  
  // Função para gerar textura de países
  const generateCountriesTexture = useCallback(async (): Promise<THREE.Texture | null> => {
    // Verificar cache
    if (textureCacheRef.current.countries) {
      return textureCacheRef.current.countries;
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
      
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;
      
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const projection = d3Geo.geoEquirectangular()
        .scale(canvas.width / (2 * Math.PI))
        .translate([canvas.width / 2, canvas.height / 2]);
      
      const path = d3Geo.geoPath().projection(projection).context(ctx);
      
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      
      countries.features.forEach((feature: any) => {
        ctx.beginPath();
        path(feature);
        ctx.fill();
        ctx.stroke();
      });
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      
      // Salvar no cache
      textureCacheRef.current.countries = texture;
      log('Textura de países gerada com sucesso!');
      
      return texture;
    } catch (error) {
      logError('Erro ao gerar textura de países:', error);
      return null;
    }
  }, []);
  
  // Função para gerar textura de estados/províncias (cinza escuro)
  const generateStatesTexture = useCallback(async (): Promise<THREE.Texture | null> => {
    // Verificar cache
    if (textureCacheRef.current.states) {
      return textureCacheRef.current.states;
    }
    
    try {
      const d3Geo = await import('d3-geo');
      const topojson = await import('topojson-client') as any;
      
      // Tentar carregar dados de estados/províncias
      // Usando world-atlas que já tem alguns dados de subdivisões
      const statesTopo = await fetch('https://unpkg.com/world-atlas@1/world/50m.json')
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        }).catch(() => {
          logWarn('Não foi possível carregar dados de estados');
          return null;
        });
      
      if (!statesTopo) return null;
      
      // Usar dados de países mas desenhar com estilo de estados (contornos internos mais visíveis)
      const countries = topojson.feature(statesTopo as any, statesTopo.objects.countries as any);
      
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;
      
      // Fundo transparente para sobrepor sobre países
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const projection = d3Geo.geoEquirectangular()
        .scale(canvas.width / (2 * Math.PI))
        .translate([canvas.width / 2, canvas.height / 2]);
      
      const path = d3Geo.geoPath().projection(projection).context(ctx);
      
      // Desenhar contornos de estados/províncias em cinza escuro
      ctx.strokeStyle = '#374151'; // Cinza escuro (#6b7280 mais escuro)
      ctx.lineWidth = 1; // Linha mais visível
      ctx.globalAlpha = 0.8; // Opacidade alta para visibilidade
      
      countries.features.forEach((feature: any) => {
        ctx.beginPath();
        path(feature);
        ctx.stroke();
      });
      
      // Adicionar linhas internas para simular divisões de estados
      // Desenhar novamente com linha mais fina para criar efeito de subdivisões
      ctx.strokeStyle = '#4b5563'; // Cinza médio-escuro
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]); // Linha tracejada para subdivisões
      
      countries.features.forEach((feature: any) => {
        ctx.beginPath();
        path(feature);
        ctx.stroke();
      });
      
      ctx.setLineDash([]); // Reset
      ctx.globalAlpha = 1.0;
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      
      // Salvar no cache
      textureCacheRef.current.states = texture;
      log('Textura de estados gerada com sucesso!');
      
      return texture;
    } catch (error) {
      logError('Erro ao gerar textura de estados:', error);
      return null;
    }
  }, []);
  
  // Função para gerar textura de cidades (usando localizações das rádios)
  const generateCitiesTexture = useCallback(async (): Promise<THREE.Texture | null> => {
    // Verificar cache
    if (textureCacheRef.current.cities) {
      return textureCacheRef.current.cities;
    }
    
    try {
      const d3Geo = await import('d3-geo');
      
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;
      
      // Fundo transparente
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const projection = d3Geo.geoEquirectangular()
        .scale(canvas.width / (2 * Math.PI))
        .translate([canvas.width / 2, canvas.height / 2]);
      
      // Agrupar rádios por cidade (mesma lat/lng aproximada)
      const cityGroups = new Map<string, Array<{ lat: number; lng: number }>>();
      
      radios.forEach(radio => {
        if (radio.latitude !== 0 || radio.longitude !== 0) {
          // Arredondar para agrupar cidades próximas (0.1 grau ≈ 11km)
          const key = `${Math.round(radio.latitude * 10) / 10},${Math.round(radio.longitude * 10) / 10}`;
          
          if (!cityGroups.has(key)) {
            cityGroups.set(key, []);
          }
          cityGroups.get(key)!.push({ lat: radio.latitude, lng: radio.longitude });
        }
      });
      
      // Desenhar cidades como círculos pequenos
      ctx.fillStyle = '#1f2937'; // Cinza muito escuro
      ctx.strokeStyle = '#111827'; // Quase preto
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.7;
      
      cityGroups.forEach((locations, key) => {
        if (locations.length > 0) {
          const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
          const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;
          
          const [x, y] = projection([avgLng, avgLat]) as [number, number];
          
          if (x && y && !isNaN(x) && !isNaN(y)) {
            // Tamanho do círculo baseado no número de rádios na cidade
            const radius = Math.min(3, 1 + locations.length * 0.5);
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      });
      
      ctx.globalAlpha = 1.0;
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      
      // Salvar no cache
      textureCacheRef.current.cities = texture;
      log('Textura de cidades gerada com sucesso!');
      
      return texture;
    } catch (error) {
      logError('Erro ao gerar textura de cidades:', error);
      return null;
    }
  }, [radios]);
  
  // Função para combinar texturas baseado no LOD
  const combineTextures = useCallback(async (lod: 'countries' | 'states' | 'cities') => {
    // Verificar cache combinado
    if (textureCacheRef.current.combined?.lod === lod) {
      setCombinedTexture(textureCacheRef.current.combined.texture);
      return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Sempre começar com fundo do mar
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Carregar e desenhar países
    const countriesTexture = await generateCountriesTexture();
    if (countriesTexture?.image && (countriesTexture.image instanceof HTMLImageElement || countriesTexture.image instanceof HTMLCanvasElement)) {
      ctx.drawImage(countriesTexture.image, 0, 0);
    }
    
    // Se LOD >= states, adicionar estados
    if (lod === 'states' || lod === 'cities') {
      const statesTexture = await generateStatesTexture();
      if (statesTexture?.image && (statesTexture.image instanceof HTMLImageElement || statesTexture.image instanceof HTMLCanvasElement)) {
        ctx.drawImage(statesTexture.image, 0, 0);
      }
    }
    
    // Se LOD === cities, adicionar cidades
    if (lod === 'cities') {
      const citiesTexture = await generateCitiesTexture();
      if (citiesTexture?.image && (citiesTexture.image instanceof HTMLImageElement || citiesTexture.image instanceof HTMLCanvasElement)) {
        ctx.drawImage(citiesTexture.image, 0, 0);
      }
    }
    
    const combined = new THREE.CanvasTexture(canvas);
    combined.needsUpdate = true;
    
    // Salvar no cache
    textureCacheRef.current.combined = { lod, texture: combined };
    setCombinedTexture(combined);
    
    log(`Textura combinada gerada para LOD: ${lod}`);
  }, [generateCountriesTexture, generateStatesTexture, generateCitiesTexture]);
  
  // Carregar textura inicial (apenas países)
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
    if (basicTexture) {
      setWorldMapTexture(basicTexture);
    }
    
    // Gerar textura inicial de países
    generateCountriesTexture().then(texture => {
      if (texture) {
        setWorldMapTexture(texture);
        combineTextures('countries');
      }
    });
  }, [generateCountriesTexture, combineTextures]);
  
  // Atualizar LOD baseado na distância da câmera (com throttle para evitar atualizações excessivas)
  const lastLODUpdateRef = useRef(0);
  const LOD_UPDATE_THROTTLE = 500; // Atualizar LOD no máximo a cada 500ms
  
  useFrame(({ camera }) => {
    const now = Date.now();
    if (now - lastLODUpdateRef.current < LOD_UPDATE_THROTTLE) return;
    
    const cameraDistance = camera.position.length();
    
    let newLOD: 'countries' | 'states' | 'cities' = 'countries';
    if (cameraDistance < LOD_CITIES_THRESHOLD) {
      newLOD = 'cities'; // Zoom muito alto: mostrar cidades
    } else if (cameraDistance < LOD_STATES_THRESHOLD) {
      newLOD = 'states'; // Zoom médio: mostrar estados
    }
    
    if (newLOD !== geographicLOD) {
      lastLODUpdateRef.current = now;
      setGeographicLOD(newLOD);
      combineTextures(newLOD);
    }
  });

  // Centralizar no local do usuário quando centerLocation mudar
  useEffect(() => {
    if (centerLocation && globeGroupRef.current) {
      // Converter lat/lng para rotação do globo
      // Para centralizar um ponto no globo, precisamos rotacioná-lo
      // Latitude: -90 a 90 -> rotação X: pi/2 a -pi/2 (invertido)
      // Longitude: -180 a 180 -> rotação Y: -pi a pi (invertido)
      const targetX = (-centerLocation.latitude * Math.PI) / 180;
      const targetY = (-centerLocation.longitude * Math.PI) / 180;
      
      // Animar suavemente para a posição alvo
      targetRotationRef.current = { x: targetX, y: targetY };
      currentRotationRef.current = { x: targetX, y: targetY };
      
      if (globeGroupRef.current) {
        globeGroupRef.current.rotation.x = targetX;
        globeGroupRef.current.rotation.y = targetY;
      }
    }
  }, [centerLocation]);

  return (
    <>
      {/* Grupo do globo para aplicar rotação automática */}
      <group ref={globeGroupRef}>
        {/* Globo com textura de mapa do mundo (com LOD geográfico) */}
        <Sphere args={[GLOBE_RADIUS, 64, 64]}>
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


      {/* Iluminação suave */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />
      <directionalLight position={[-5, -5, -5]} intensity={0.2} />

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

export default function GlobeView({ radios, onRadioSelect, selectedRadio, onSelectionPosition, centerLocation }: GlobeViewProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'transparent' }}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Globe 
          radios={radios} 
          onRadioSelect={onRadioSelect} 
          selectedRadio={selectedRadio} 
          onSelectionPosition={onSelectionPosition}
          centerLocation={centerLocation}
        />
      </Canvas>
    </div>
  );
}
