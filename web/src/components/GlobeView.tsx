import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RadioStation } from '../data/radios';

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

function RadioPoint({ position, radio, onPress, isSelected, camera }: RadioPointProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!meshRef.current) return;
    
    if (camera) {
      // Calcular distância da câmera ao pin
      const distance = camera.position.distanceTo(meshRef.current.position);
      // Tamanho base que diminui com o zoom (distância maior = pin menor)
      // Usar inverso da distância para pins menores quando zoom aumenta
      // Limitar escala mínima e máxima para garantir visibilidade
      const baseSize = 0.12; // Tamanho base aumentado
      const minScale = 0.3; // Escala mínima garantida (aumentada para melhor visibilidade)
      const maxScale = 0.8; // Escala máxima para não ficar muito grande
      const scale = Math.max(minScale, Math.min(maxScale, baseSize / distance));
      
      // Tamanho maior para estações principais
      const majorMultiplier = radio.isMajor ? 1.5 : 1.0;
      const finalScale = scale * majorMultiplier;
      
      meshRef.current.scale.setScalar(hovered ? finalScale * 1.2 : finalScale);
    } else {
      // Se não há câmera, usar escala padrão baseada no tamanho base
      const defaultScale = radio.isMajor ? 1.5 : 1.0;
      meshRef.current.scale.setScalar(hovered ? defaultScale * 1.2 : defaultScale);
    }
  });

  // Tamanho base do pin (será escalado pela distância)
  const baseRadius = radio.isMajor ? 0.04 : 0.03;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={() => onPress(radio)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[baseRadius, 16, 16]} />
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

// Componente para lista de pontos com LOD
function RadioPointsList({ 
  radioPoints, 
  selectedRadio, 
  onRadioSelect, 
  camera 
}: { 
  radioPoints: Array<{ position: [number, number, number]; radio: RadioStation }>;
  selectedRadio?: RadioStation | null;
  onRadioSelect: (radio: RadioStation) => void;
  camera: THREE.Camera | null;
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

  useFrame(() => {
    const newVisible = new Set<string>();
    
    if (camera) {
      const cameraDistance = camera.position.length(); // Distância da câmera à origem
      
      radioPoints.forEach((point) => {
        // Sempre mostrar TODAS as estações (independente do zoom)
        newVisible.add(point.radio.id);
      });
    } else {
      // Se não há câmera, mostrar todas as estações
      radioPoints.forEach((point) => {
        newVisible.add(point.radio.id);
      });
    }
    
    // Só atualizar se houver mudanças para evitar re-renders desnecessários
    if (newVisible.size !== visiblePoints.size || 
        Array.from(newVisible).some(id => !visiblePoints.has(id))) {
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
  const circleRef = useRef<THREE.Mesh>(null);
  const [rotateSpeed, setRotateSpeed] = useState(0.4);

  const radioPoints = useMemo<Array<{ position: [number, number, number]; radio: RadioStation }>>(() => {
    const points = radios.map((radio) => {
      const phi = (90 - radio.latitude) * (Math.PI / 180);
      const theta = (radio.longitude + 180) * (Math.PI / 180);

      const x = -(Math.sin(phi) * Math.cos(theta));
      const z = Math.sin(phi) * Math.sin(theta);
      const y = Math.cos(phi);

      // Posicionar os pins exatamente sobre a superfície do globo (raio 1.2)
      // Adicionar um pequeno offset (0.02) para garantir que fiquem visíveis acima da textura
      const globeRadius = 1.2;
      const pinOffset = 0.02; // Pequeno offset para garantir visibilidade
      const pinDistance = globeRadius + pinOffset;
      
      return {
        position: [x * pinDistance, y * pinDistance, z * pinDistance] as [number, number, number],
        radio
      };
    });
    console.log(`[GlobeView] Carregadas ${points.length} estações de rádio no globo`);
    return points;
  }, [radios]);

  // Detectar rádio mais próxima do centro (círculo vermelho) e rotacionar globo
  useFrame(({ camera, size }) => {
    // Sempre atualizar a referência da câmera
    cameraRef.current = camera;
    
    // Calcular velocidade de rotação baseada no zoom (distância da câmera)
    const cameraDistance = camera.position.length();
    const minDistance = 1.5;
    const maxDistance = 5.0;
    const normalizedDistance = Math.max(0, Math.min(1, (cameraDistance - minDistance) / (maxDistance - minDistance)));
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
    
    // Ajustar tamanho da circunferência para acompanhar o zoom
    if (circleRef.current && camera) {
      // Calcular distância da câmera à origem (centro do globo)
      const cameraDistance = camera.position.length();
      // Escalar a circunferência proporcionalmente ao zoom
      // Normalizar pela distância inicial da câmera (2.5)
      const scale = cameraDistance / 2.5;
      
      // Aplicar escala uniforme para acompanhar o zoom
      circleRef.current.scale.setScalar(scale);
      
      // Orientar a circunferência sempre de frente para a câmera (billboard effect)
      circleRef.current.lookAt(camera.position);
    }
    
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
        const minDistance = 1.5; // minDistance do OrbitControls
        const maxDistance = 5.0; // maxDistance do OrbitControls
        // Normalizar distância entre 0 (muito próximo) e 1 (muito longe)
        const normalizedDistance = Math.max(0, Math.min(1, (cameraDistance - minDistance) / (maxDistance - minDistance)));
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
        const minDistance = 1.5;
        const maxDistance = 5.0;
        const normalizedDistance = Math.max(0, Math.min(1, (cameraDistance - minDistance) / (maxDistance - minDistance)));
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

  // Carregar textura de mapa do mundo com países brancos, contornos pretos e mar cinza claro
  const [worldMapTexture, setWorldMapTexture] = useState<THREE.Texture | null>(null);
  
  useEffect(() => {
    // Importar d3-geo e topojson-client dinamicamente
    const generateTextureFromGeoJSON = async () => {
      try {
        // Importar as bibliotecas
        const d3Geo = await import('d3-geo');
        const topojson = await import('topojson-client') as any;
        
        // Carregar TopoJSON do world-atlas
        const worldTopo = await fetch('https://unpkg.com/world-atlas@1/world/110m.json')
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          });
        
        // Converter TopoJSON para GeoJSON
        const countries = topojson.feature(worldTopo as any, worldTopo.objects.countries as any);
        
        // Criar canvas para desenhar o mapa
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.error('Não foi possível criar contexto 2D');
          return;
        }
        
        // Fundo cinza claro para o mar
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Configurar projeção equirectangular
        const projection = d3Geo.geoEquirectangular()
          .scale(canvas.width / (2 * Math.PI))
          .translate([canvas.width / 2, canvas.height / 2]);
        
        // Criar path generator
        const path = d3Geo.geoPath().projection(projection).context(ctx);
        
        // Desenhar cada país
        ctx.fillStyle = '#ffffff'; // Países brancos
        ctx.strokeStyle = '#000000'; // Contornos pretos
        ctx.lineWidth = 1;
        
        countries.features.forEach((feature: any) => {
          ctx.beginPath();
          path(feature);
          ctx.fill();
          ctx.stroke();
        });
        
        // Criar textura Three.js
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        console.log('Textura gerada com sucesso a partir de GeoJSON!');
        setWorldMapTexture(texture);
        
      } catch (error) {
        console.error('Erro ao gerar textura a partir de GeoJSON:', error);
        // Criar textura básica como fallback
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#e5e7eb';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.needsUpdate = true;
          setWorldMapTexture(texture);
        }
      }
    };
    
    // Criar textura básica imediatamente (fundo cinza)
    const createBasicTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;
      
      // Fundo cinza claro para o mar
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };
    
    // Criar textura básica imediatamente
    const basicTexture = createBasicTexture();
    if (basicTexture) {
      setWorldMapTexture(basicTexture);
    }
    
    // Gerar textura a partir de GeoJSON
    generateTextureFromGeoJSON();
    
  }, []);

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
        {/* Globo com textura de mapa do mundo */}
        <Sphere args={[1.2, 64, 64]}>
          <meshStandardMaterial
            map={worldMapTexture || undefined}
            color="#ffffff"
            roughness={0.7}
            metalness={0.1}
          />
        </Sphere>

        {/* Anel do equador (borda preta fina) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.002, 16, 100]} />
          <meshStandardMaterial color="#000000" />
        </mesh>

        {/* Pontos das rádios - sempre mostrar principais, mostrar menores com zoom */}
        <RadioPointsList 
          radioPoints={radioPoints}
          selectedRadio={selectedRadio}
          onRadioSelect={onRadioSelect}
          camera={cameraRef.current}
        />
      </group>

      {/* Circunferência preta fixa que circunda o globo (não gira, apenas acompanha zoom) */}
      <mesh ref={circleRef} position={[0, 0, 0]}>
        <ringGeometry args={[1.35, 1.351, 64]} />
        <meshBasicMaterial 
          color="#000000" 
          side={THREE.DoubleSide}
          transparent={false}
        />
      </mesh>

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
        minDistance={1.5}
        maxDistance={5}
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
