import { RadioStation } from '../data/radios';
// import { searchCity } from './whosOnFirstService'; // Desabilitado: Nominatim tem CORS e rate limiting

// Interface para os dados da API Radio Browser
interface RadioBrowserStation {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  languagecodes: string;
  votes: number;
  lastchangetime: string;
  codec: string;
  bitrate: number;
  hls: number;
  lastcheckok: number;
  lastchecktime: string;
  lastcheckoktime: string;
  lastlocalchecktime: string;
  clicktimestamp: string;
  clickcount: number;
  clicktrend: number;
  ssl_error: number;
  geo_lat?: string;
  geo_long?: string;
  has_extended_info?: boolean;
}

// Cache de servidores disponíveis
let availableServers: string[] = [];
let selectedServer: string = 'https://de1.api.radio-browser.info'; // Servidor padrão

/**
 * Descobre servidores disponíveis da API Radio Browser
 * Usa lista de servidores conhecidos e os randomiza
 */
export async function discoverServers(): Promise<string[]> {
  // Lista de servidores conhecidos da API Radio Browser
  // Baseado na documentação: https://api.radio-browser.info/
  const knownServers = [
    'https://de1.api.radio-browser.info',
    'https://de2.api.radio-browser.info',
    'https://at1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://fi1.api.radio-browser.info',
  ];

  // Se já temos servidores descobertos, retornar
  if (availableServers.length > 0) {
    return availableServers;
  }

  // Testar servidores para ver quais estão disponíveis
  const testedServers: string[] = [];
  
  for (const server of knownServers) {
    try {
      // Criar timeout manual para compatibilidade
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${server}/json/stats`, {
        headers: {
          'User-Agent': 'RadioGlobe/1.0 (https://radio-globe.app)',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        testedServers.push(server);
      }
    } catch (error) {
      // Servidor não disponível, continuar
      console.debug(`Servidor ${server} não disponível`);
    }
  }

  // Se encontrou servidores disponíveis, usar eles
  if (testedServers.length > 0) {
    availableServers = testedServers;
    shuffleArray(availableServers);
    selectedServer = availableServers[0];
    return availableServers;
  }

  // Fallback: usar todos os servidores conhecidos mesmo sem teste
  availableServers = knownServers;
  shuffleArray(availableServers);
  selectedServer = availableServers[0];
  return availableServers;
}

/**
 * Faz uma requisição à API Radio Browser com retry automático
 */
async function apiRequest<T>(
  endpoint: string,
  retries: number = 3
): Promise<T> {
  if (availableServers.length === 0) {
    await discoverServers();
  }

  const servers = [...availableServers];
  shuffleArray(servers);

  for (let attempt = 0; attempt < retries; attempt++) {
    for (let i = 0; i < servers.length; i++) {
      const server = servers[i];
      try {
        const response = await fetch(`${server}${endpoint}`, {
          headers: {
            'User-Agent': 'RadioGlobe/1.0 (https://radio-globe.app)',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Marcar estação como popular (segundo a documentação)
          if (endpoint.includes('/url/')) {
            // Não fazer nada, apenas log
          }
          return data as T;
        }
      } catch (error) {
        console.warn(`Erro ao conectar com ${server}:`, error);
        continue; // Tenta próximo servidor
      }
    }
    // Se todos os servidores falharam, espera um pouco antes de tentar novamente
    if (attempt < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Todos os servidores falharam');
}

/**
 * Busca estações por país
 */
export async function getStationsByCountry(
  countryCode: string,
  limit: number = 100
): Promise<RadioBrowserStation[]> {
  try {
    const stations = await apiRequest<RadioBrowserStation[]>(
      `/json/stations/bycountrycodeexact/${countryCode}?hidebroken=true&limit=${limit}&order=votes&reverse=true`
    );
    return stations;
  } catch (error) {
    console.error(`Erro ao buscar estações de ${countryCode}:`, error);
    return [];
  }
}

/**
 * Busca estações por nome do país
 */
export async function getStationsByCountryName(
  countryName: string,
  limit: number = 100
): Promise<RadioBrowserStation[]> {
  try {
    const stations = await apiRequest<RadioBrowserStation[]>(
      `/json/stations/bycountryexact/${encodeURIComponent(countryName)}?hidebroken=true&limit=${limit}&order=votes&reverse=true`
    );
    return stations;
  } catch (error) {
    console.error(`Erro ao buscar estações de ${countryName}:`, error);
    return [];
  }
}

/**
 * Busca todas as estações populares (top votadas)
 */
export async function getPopularStations(limit: number = 500): Promise<RadioBrowserStation[]> {
  try {
    const stations = await apiRequest<RadioBrowserStation[]>(
      `/json/stations/search?hidebroken=true&limit=${limit}&order=votes&reverse=true`
    );
    return stations;
  } catch (error) {
    console.error('Erro ao buscar estações populares:', error);
    return [];
  }
}

/**
 * Busca lista de países disponíveis
 */
export async function getCountries(): Promise<Array<{ name: string; stationcount: number }>> {
  try {
    const countries = await apiRequest<Array<{ name: string; stationcount: number }>>(
      '/json/countries?order=stationcount&reverse=true'
    );
    return countries;
  } catch (error) {
    console.error('Erro ao buscar países:', error);
    return [];
  }
}

/**
 * Transforma dados da API Radio Browser para o formato RadioStation
 */
/**
 * Transforma uma estação da API Radio Browser para o formato interno
 * Usa Who's On First para geocodificação precisa quando a API não fornece coordenadas
 */
export async function transformToRadioStationAsync(
  apiStation: RadioBrowserStation,
  index: number
): Promise<RadioStation> {
  // Tentar obter coordenadas da API ou geocodificar a cidade
  let latitude = 0;
  let longitude = 0;

  if (apiStation.geo_lat && apiStation.geo_long) {
    const lat = parseFloat(apiStation.geo_lat);
    const lng = parseFloat(apiStation.geo_long);
    // Validar se as coordenadas são válidas
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      latitude = lat;
      longitude = lng;
    }
  }
  
  // Se não tiver coordenadas válidas, tentar geocodificar usando Who's On First
  // NOTA: Nominatim tem CORS e rate limiting, então por enquanto desabilitado
  // Em produção, isso deveria usar um proxy server-side ou cache pré-populado
  if (latitude === 0 && longitude === 0) {
    const countryCode = apiStation.countrycode || '';
    // Por enquanto, usar apenas centro do país como fallback
    // TODO: Implementar geocodificação via proxy server-side ou cache local
    const countryCoords = getCountryCenter(countryCode);
    latitude = countryCoords.lat;
    longitude = countryCoords.lng;
  }
  
  // Se ainda assim as coordenadas forem (0,0), usar centro do país
  if (latitude === 0 && longitude === 0 && apiStation.countrycode) {
    const countryCoords = getCountryCenter(apiStation.countrycode);
    if (countryCoords.lat !== 0 || countryCoords.lng !== 0) {
      latitude = countryCoords.lat;
      longitude = countryCoords.lng;
    } else {
      // Último fallback: distribuição baseada no hash do nome
      const hash = (apiStation.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      latitude = (hash % 180) - 90; // Entre -90 e 90
      longitude = ((hash * 7) % 360) - 180; // Entre -180 e 180
    }
  }
  
  // Extrair frequência das tags ou usar padrão
  let frequency = 'FM';
  const freqMatch = apiStation.tags?.match(/(\d+\.?\d*)\s*(FM|AM|MHz)/i);
  if (freqMatch) {
    frequency = `${freqMatch[1]} ${freqMatch[2].toUpperCase()}`;
  }

  // Determinar se é estação major (baseado em votos, bitrate e popularidade)
  // Estações principais: mais votos OU bitrate alto E verificadas
  const voteThreshold = 50; // Reduzido para mais estações principais
  const bitrateThreshold = 96; // Qualidade razoável
  const isMajor =
    (apiStation.votes >= voteThreshold || apiStation.bitrate >= bitrateThreshold) &&
    apiStation.lastcheckok === 1;

  return {
    id: apiStation.stationuuid || `radio-${index}`,
    name: apiStation.name || 'Unknown Station',
    city: apiStation.state || apiStation.country || 'Unknown',
    country: apiStation.country || 'Unknown',
    frequency: frequency,
    latitude: latitude,
    longitude: longitude,
    url: apiStation.url_resolved || apiStation.url,
    logo: apiStation.favicon || undefined,
    isMajor: isMajor,
  };
}

/**
 * Mapeamento de nomes de países para códigos ISO
 * Usado para identificar país quando countrycode está incorreto/vazio
 */
const countryNameToCode: Record<string, string> = {
  // Principais países
  'japan': 'JP',
  'japão': 'JP',
  'japon': 'JP',
  'brasil': 'BR',
  'brazil': 'BR',
  'united states': 'US',
  'estados unidos': 'US',
  'usa': 'US',
  'united states of america': 'US',
  'united kingdom': 'GB',
  'reino unido': 'GB',
  'uk': 'GB',
  'great britain': 'GB',
  'france': 'FR',
  'frança': 'FR',
  'germany': 'DE',
  'alemanha': 'DE',
  'deutschland': 'DE',
  'italy': 'IT',
  'itália': 'IT',
  'italia': 'IT',
  'spain': 'ES',
  'espanha': 'ES',
  'canada': 'CA',
  'canadá': 'CA',
  'mexico': 'MX',
  'méxico': 'MX',
  'argentina': 'AR',
  'portugal': 'PT',
  'australia': 'AU',
  'austrália': 'AU',
  'china': 'CN',
  'china (peoples republic)': 'CN',
  'peoples republic of china': 'CN',
  'india': 'IN',
  'índia': 'IN',
  'russia': 'RU',
  'rússia': 'RU',
  'russian federation': 'RU',
  'netherlands': 'NL',
  'holanda': 'NL',
  'belgium': 'BE',
  'bélgica': 'BE',
  'switzerland': 'CH',
  'suíça': 'CH',
  'austria': 'AT',
  'áustria': 'AT',
  'poland': 'PL',
  'polônia': 'PL',
  'sweden': 'SE',
  'suécia': 'SE',
  'norway': 'NO',
  'noruega': 'NO',
  'denmark': 'DK',
  'dinamarca': 'DK',
  'finland': 'FI',
  'finlândia': 'FI',
  'greece': 'GR',
  'grécia': 'GR',
  'turkey': 'TR',
  'turquia': 'TR',
  'south korea': 'KR',
  'coreia do sul': 'KR',
  'south africa': 'ZA',
  'áfrica do sul': 'ZA',
  'new zealand': 'NZ',
  'nova zelândia': 'NZ',
  'chile': 'CL',
  'colombia': 'CO',
  'colômbia': 'CO',
  'peru': 'PE',
  'perú': 'PE',
  'venezuela': 'VE',
  'ecuador': 'EC',
  'equador': 'EC',
};

/**
 * Tenta normalizar e obter código do país
 */
function normalizeCountryCode(countryCode?: string, countryName?: string): string {
  if (countryCode && countryCode.trim() !== '' && countryCode !== 'Unknown' && countryCode !== 'XX') {
    return countryCode.toUpperCase().trim();
  }
  
  if (countryName) {
    const normalizedName = countryName.toLowerCase().trim();
    return countryNameToCode[normalizedName] || '';
  }
  
  return '';
}

/**
 * Coordenadas aproximadas do centro de países comuns
 * (Fallback caso a API não forneça coordenadas)
 */
function getCountryCenter(countryCode: string): { lat: number; lng: number } {
  const countryCenters: Record<string, { lat: number; lng: number }> = {
    BR: { lat: -14.235, lng: -51.9253 }, // Brasil
    US: { lat: 39.8283, lng: -98.5795 }, // Estados Unidos
    GB: { lat: 55.3781, lng: -3.436 }, // Reino Unido
    FR: { lat: 46.2276, lng: 2.2137 }, // França
    DE: { lat: 51.1657, lng: 10.4515 }, // Alemanha
    IT: { lat: 41.8719, lng: 12.5674 }, // Itália
    ES: { lat: 40.4637, lng: -3.7492 }, // Espanha
    CA: { lat: 56.1304, lng: -106.3468 }, // Canadá
    MX: { lat: 23.6345, lng: -102.5528 }, // México
    AR: { lat: -38.4161, lng: -63.6167 }, // Argentina
    PT: { lat: 39.3999, lng: -8.2245 }, // Portugal
    AU: { lat: -25.2744, lng: 133.7751 }, // Austrália
    JP: { lat: 36.2048, lng: 138.2529 }, // Japão
    CN: { lat: 35.8617, lng: 104.1954 }, // China
    IN: { lat: 20.5937, lng: 78.9629 }, // Índia
    RU: { lat: 61.524, lng: 105.3188 }, // Rússia
  };

  // Se não encontrar no mapeamento, usar uma distribuição baseada no código do país
  // para evitar todas ficarem em (0,0)
  if (!countryCenters[countryCode.toUpperCase()]) {
    // Gerar coordenadas pseudo-aleatórias baseadas no código do país
    const hash = countryCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      lat: (hash % 180) - 90, // Entre -90 e 90
      lng: ((hash * 7) % 360) - 180 // Entre -180 e 180
    };
  }
  
  return countryCenters[countryCode.toUpperCase()];
}

/**
 * Limites aproximados (bounding boxes) dos países para validação
 * Formato: { minLat, maxLat, minLng, maxLng }
 */
const countryBounds: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  BR: { minLat: -35, maxLat: 5, minLng: -75, maxLng: -30 }, // Brasil
  US: { minLat: 24, maxLat: 50, minLng: -125, maxLng: -65 }, // Estados Unidos
  GB: { minLat: 50, maxLat: 61, minLng: -9, maxLng: 2 }, // Reino Unido
  FR: { minLat: 42, maxLat: 51, minLng: -5, maxLng: 10 }, // França
  DE: { minLat: 47, maxLat: 55, minLng: 6, maxLng: 15 }, // Alemanha
  IT: { minLat: 36, maxLat: 47, minLng: 7, maxLng: 19 }, // Itália
  ES: { minLat: 36, maxLat: 44, minLng: -10, maxLng: 5 }, // Espanha
  CA: { minLat: 42, maxLat: 70, minLng: -140, maxLng: -50 }, // Canadá
  MX: { minLat: 14, maxLat: 33, minLng: -118, maxLng: -86 }, // México
  AR: { minLat: -55, maxLat: -21, minLng: -74, maxLng: -53 }, // Argentina
  PT: { minLat: 37, maxLat: 42, minLng: -10, maxLng: -6 }, // Portugal
  AU: { minLat: -45, maxLat: -10, minLng: 113, maxLng: 154 }, // Austrália
  JP: { minLat: 24, maxLat: 46, minLng: 123, maxLng: 146 }, // Japão
  CN: { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 }, // China
  IN: { minLat: 6, maxLat: 36, minLng: 68, maxLng: 97 }, // Índia
  RU: { minLat: 41, maxLat: 82, minLng: 19, maxLng: 169 }, // Rússia
  NL: { minLat: 50, maxLat: 54, minLng: 3, maxLng: 8 }, // Holanda
  BE: { minLat: 49, maxLat: 51, minLng: 2, maxLng: 7 }, // Bélgica
  CH: { minLat: 45, maxLat: 48, minLng: 6, maxLng: 11 }, // Suíça
  AT: { minLat: 46, maxLat: 49, minLng: 9, maxLng: 17 }, // Áustria
  PL: { minLat: 49, maxLat: 55, minLng: 14, maxLng: 25 }, // Polônia
  SE: { minLat: 55, maxLat: 69, minLng: 11, maxLng: 24 }, // Suécia
  NO: { minLat: 58, maxLat: 71, minLng: 5, maxLng: 31 }, // Noruega
  DK: { minLat: 54, maxLat: 58, minLng: 8, maxLng: 13 }, // Dinamarca
  FI: { minLat: 60, maxLat: 70, minLng: 20, maxLng: 32 }, // Finlândia
  GR: { minLat: 35, maxLat: 42, minLng: 20, maxLng: 28 }, // Grécia
  TR: { minLat: 36, maxLat: 42, minLng: 26, maxLng: 45 }, // Turquia
  KR: { minLat: 33, maxLat: 39, minLng: 124, maxLng: 132 }, // Coreia do Sul
  ZA: { minLat: -35, maxLat: -22, minLng: 16, maxLng: 33 }, // África do Sul
  NZ: { minLat: -48, maxLat: -34, minLng: 166, maxLng: 179 }, // Nova Zelândia
  CL: { minLat: -56, maxLat: -17, minLng: -76, maxLng: -66 }, // Chile
  CO: { minLat: -4, maxLat: 13, minLng: -79, maxLng: -66 }, // Colômbia
  PE: { minLat: -18, maxLat: 0, minLng: -81, maxLng: -68 }, // Peru
  VE: { minLat: 0, maxLat: 13, minLng: -74, maxLng: -59 }, // Venezuela
  EC: { minLat: -5, maxLat: 2, minLng: -81, maxLng: -75 }, // Equador
};

/**
 * Verifica se as coordenadas estão dentro dos limites aproximados do país
 */
function isCoordinatesInCountry(lat: number, lng: number, countryCode: string): boolean {
  const bounds = countryBounds[countryCode.toUpperCase()];
  if (!bounds) {
    // Se não temos bounds para o país, usar verificação por distância do centro
    const center = getCountryCenter(countryCode);
    const maxDistance = 30; // Graus (aproximadamente 3300km)
    const latDiff = Math.abs(lat - center.lat);
    const lngDiff = Math.abs(lng - center.lng);
    return latDiff < maxDistance && lngDiff < maxDistance;
  }
  
  return lat >= bounds.minLat && lat <= bounds.maxLat && 
         lng >= bounds.minLng && lng <= bounds.maxLng;
}

/**
 * Corrige coordenadas se estiverem fora dos limites do país
 */
function validateAndCorrectCoordinates(
  lat: number, 
  lng: number, 
  countryCode: string, 
  countryName: string
): { lat: number; lng: number; corrected: boolean } {
  const normalizedCode = normalizeCountryCode(countryCode, countryName);
  
  if (!normalizedCode) {
    // Se não conseguimos identificar o país, manter coordenadas originais
    return { lat, lng, corrected: false };
  }
  
  // Se as coordenadas estão dentro dos limites do país, manter
  if (isCoordinatesInCountry(lat, lng, normalizedCode)) {
    return { lat, lng, corrected: false };
  }
  
  // Se não estão, corrigir para o centro do país
  const center = getCountryCenter(normalizedCode);
  console.warn(`Coordenadas (${lat}, ${lng}) fora dos limites do país ${normalizedCode} (${countryName}). Corrigindo para centro do país (${center.lat}, ${center.lng})`);
  return { lat: center.lat, lng: center.lng, corrected: true };
}

/**
 * Versão síncrona (mantida para compatibilidade)
 * Usa geocodificação básica sem Who's On First
 */
export function transformToRadioStation(
  apiStation: RadioBrowserStation,
  index: number
): RadioStation {
  // Tentar obter coordenadas da API ou geocodificar a cidade
  let latitude = 0;
  let longitude = 0;

  if (apiStation.geo_lat && apiStation.geo_long) {
    const lat = parseFloat(apiStation.geo_lat);
    const lng = parseFloat(apiStation.geo_long);
    // Validar se as coordenadas são válidas
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      latitude = lat;
      longitude = lng;
      
      // Validar e corrigir coordenadas se estiverem no país errado
      const validated = validateAndCorrectCoordinates(
        latitude, 
        longitude, 
        apiStation.countrycode || '', 
        apiStation.country || ''
      );
      latitude = validated.lat;
      longitude = validated.lng;
    }
  }
  
  // Se não tiver coordenadas válidas, tentar identificar país corretamente
  if (latitude === 0 && longitude === 0) {
    const countryCode = normalizeCountryCode(apiStation.countrycode, apiStation.country);
    
    // Usar centro do país se encontramos um código válido
    if (countryCode) {
      const countryCoords = getCountryCenter(countryCode);
      latitude = countryCoords.lat;
      longitude = countryCoords.lng;
    } else {
      // Último fallback: distribuição baseada no nome (evita agrupamento em um país específico)
      const hash = (apiStation.name || apiStation.stationuuid || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      latitude = (hash % 180) - 90;
      longitude = ((hash * 7) % 360) - 180;
    }
  }

  // Extrair frequência das tags ou usar padrão
  let frequency = 'FM';
  const freqMatch = apiStation.tags?.match(/(\d+\.?\d*)\s*(FM|AM|MHz)/i);
  if (freqMatch) {
    frequency = `${freqMatch[1]} ${freqMatch[2].toUpperCase()}`;
  }

  // Determinar se é estação major (baseado em votos, bitrate e popularidade)
  // Estações principais: mais votos OU bitrate alto E verificadas
  const voteThreshold = 50; // Reduzido para mais estações principais
  const bitrateThreshold = 96; // Qualidade razoável
  const isMajor =
    (apiStation.votes >= voteThreshold || apiStation.bitrate >= bitrateThreshold) &&
    apiStation.lastcheckok === 1;

  return {
    id: apiStation.stationuuid || `radio-${index}`,
    name: apiStation.name || 'Unknown Station',
    city: apiStation.state || apiStation.country || 'Unknown',
    country: apiStation.country || 'Unknown',
    frequency: frequency,
    latitude: latitude,
    longitude: longitude,
    url: apiStation.url_resolved || apiStation.url,
    logo: apiStation.favicon || undefined,
    isMajor: isMajor,
  };
}

/**
 * Utility: embaralha array
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Busca estações de múltiplos países
 */
export async function getStationsFromMultipleCountries(
  countryCodes: string[],
  limitPerCountry: number = 50
): Promise<RadioStation[]> {
  const allStations: RadioStation[] = [];

  for (const countryCode of countryCodes) {
    try {
      const apiStations = await getStationsByCountry(countryCode, limitPerCountry);
      const transformedPromises = apiStations
        .filter((s) => s.lastcheckok === 1) // Apenas estações funcionais
        .map((s, index) => transformToRadioStation(s, allStations.length + index));

      const transformed = await Promise.all(transformedPromises);
      allStations.push(...transformed);

      // Pequeno delay entre requisições para não sobrecarregar
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Erro ao buscar estações de ${countryCode}:`, error);
    }
  }

  return allStations;
}

/**
 * Busca estações por nome do país (para busca na tela de países)
 */
export async function getStationsByCountryNameSearch(
  countryName: string,
  limit: number = 100
): Promise<RadioStation[]> {
  try {
    const apiStations = await getStationsByCountryName(countryName, limit);
    const transformed = apiStations
      .filter((s) => s.lastcheckok === 1)
      .map((s, index) => transformToRadioStation(s, index));

    return transformed;
  } catch (error) {
    console.error(`Erro ao buscar estações de ${countryName}:`, error);
    return [];
  }
}

/**
 * Busca estações populares de todo o mundo
 */
export async function getPopularStationsWorldwide(limit: number = 500): Promise<RadioStation[]> {
  try {
    const apiStations = await getPopularStations(limit);
    const transformed = apiStations
      .filter((s) => s.lastcheckok === 1) // Apenas estações funcionais
      .map((s, index) => transformToRadioStation(s, index));

    return transformed;
  } catch (error) {
    console.error('Erro ao buscar estações populares:', error);
    return [];
  }
}

/**
 * Busca estações populares inicialmente (carregamento rápido)
 * Similar ao Radio Garden: carrega apenas as mais populares primeiro
 */
export async function getPopularStationsInitial(limit: number = 2000): Promise<RadioStation[]> {
  const CACHE_KEY = 'radio_browser_stations_cache';
  const CACHE_TIMESTAMP_KEY = 'radio_browser_stations_timestamp';
  const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 horas

  try {
    // Verificar cache primeiro (carregamento instantâneo)
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const cachedStations = localStorage.getItem(CACHE_KEY);

    if (cachedTimestamp && cachedStations) {
      const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
      if (cacheAge < CACHE_DURATION) {
        console.log('Carregando estações do cache...');
        return JSON.parse(cachedStations);
      }
    }

    console.log(`Buscando ${limit} estações populares (carregamento rápido)...`);
    
    // Buscar apenas as mais populares (ordenadas por votos, limitadas)
    // Isso é muito mais rápido que carregar tudo
    const apiStations = await apiRequest<RadioBrowserStation[]>(
      `/json/stations/search?hidebroken=true&limit=${limit}&order=votes&reverse=true`
    );

    console.log(`Encontradas ${apiStations.length} estações populares`);

    // Transformar apenas as funcionais (já filtradas pela API com hidebroken=true)
    const workingStations = apiStations.filter((s) => s.lastcheckok === 1);
    console.log(`Processando ${workingStations.length} estações funcionais...`);
    
    // Processar todas de uma vez (limitado a 2000, então é rápido)
    const transformed = workingStations.map((s, idx) => transformToRadioStation(s, idx));

    // Filtrar coordenadas válidas
    const validStations = transformed.filter(radio => 
      !isNaN(radio.latitude) && 
      !isNaN(radio.longitude) &&
      radio.latitude >= -90 && radio.latitude <= 90 &&
      radio.longitude >= -180 && radio.longitude <= 180
    );

    // Remover duplicatas
    const uniqueStations = validStations.filter((station, index, self) => 
      index === self.findIndex(s => s.id === station.id)
    );

    console.log(`Total de ${uniqueStations.length} estações válidas processadas`);

    // Salvar no cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(uniqueStations));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    return uniqueStations;
  } catch (error) {
    console.error('Erro ao buscar estações populares:', error);
    // Tentar carregar do cache mesmo se expirado
    const cachedStations = localStorage.getItem(CACHE_KEY);
    if (cachedStations) {
      console.log('Usando cache expirado como fallback...');
      return JSON.parse(cachedStations);
    }
    return [];
  }
}

/**
 * Busca estações populares priorizando Brasil, EUA e Europa
 * 60% das estações vêm de regiões priorizadas, 40% do resto do mundo
 */
export async function getPopularStationsPrioritized(
  totalLimit: number = 20000,
  priorityCountries: string[] = [
    'Brazil', 'United States', 'United Kingdom', // Principais: 3 países
    'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Portugal', // Europa: 6 países
    'Canada', 'Australia', 'Mexico', 'Argentina', 'Colombia', // Américas: 5 países
    'Poland', 'Sweden', 'Norway', 'Denmark', 'Belgium', // Norte da Europa: 5 países
    'Japan', 'India', 'Indonesia', 'Philippines', 'South Korea', // Ásia: 5 países
    'Turkey', 'Greece', 'Czech Republic', 'Romania', 'Hungary' // Leste Europeu: 5 países
  ]
): Promise<RadioStation[]> {
  const CACHE_KEY = 'radio_browser_stations_prioritized_cache';
  const CACHE_TIMESTAMP_KEY = 'radio_browser_stations_prioritized_timestamp';
  const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 horas

  try {
    // Verificar cache primeiro
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const cachedStations = localStorage.getItem(CACHE_KEY);

    if (cachedTimestamp && cachedStations) {
      const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
      if (cacheAge < CACHE_DURATION) {
        console.log('Carregando estações priorizadas do cache...');
        return JSON.parse(cachedStations);
      }
    }

    console.log(`Buscando ${totalLimit} estações priorizando regiões...`);
    
    // Dividir: 60% regiões priorizadas, 40% resto do mundo
    const priorityLimit = Math.floor(totalLimit * 0.6);
    const globalLimit = totalLimit - priorityLimit;
    
    const allStations: RadioStation[] = [];
    const includedStationIds = new Set<string>();
    
    // Buscar por país prioritário (Brasil, EUA, Reino Unido - principais)
    // 3 países principais recebem 30% do total (10% cada)
    const primaryCountries = priorityCountries.slice(0, 3); // Brazil, United States, United Kingdom
    const stationsPerPrimary = Math.floor(totalLimit * 0.1); // 10% do total para cada país principal
    
    for (const country of primaryCountries) {
      try {
        console.log(`Buscando estações de ${country}...`);
        const countryStations = await getStationsByCountryName(country, stationsPerPrimary + 100); // Buscar um pouco mais para garantir quantidade
        const workingStations = countryStations.filter(s => s.lastcheckok === 1);
        const transformed = workingStations
          .filter(s => !includedStationIds.has(s.stationuuid))
          .slice(0, stationsPerPrimary)
          .map((s, idx) => {
            includedStationIds.add(s.stationuuid);
            return transformToRadioStation(s, allStations.length + idx);
          });
        
        allStations.push(...transformed);
        console.log(`✓ ${country}: ${transformed.length} estações`);
      } catch (e) {
        console.warn(`Erro ao buscar estações de ${country}:`, e);
      }
    }
    
    // Buscar estações dos países prioritários restantes (Europa, Américas, Ásia)
    const secondaryCountries = priorityCountries.slice(3);
    const remainingPrioritySlots = priorityLimit - allStations.length;
    // Distribuir igualmente entre todos os países secundários
    const stationsPerCountry = Math.floor(remainingPrioritySlots / secondaryCountries.length);
    
    for (const country of secondaryCountries) {
      if (allStations.length >= priorityLimit) break;
      
      try {
        console.log(`Buscando estações de ${country}...`);
        const countryStations = await getStationsByCountryName(country, stationsPerCountry + 100);
        const workingStations = countryStations.filter(s => s.lastcheckok === 1);
        const availableSlots = priorityLimit - allStations.length;
        const stationBatch = workingStations
          .filter(s => !includedStationIds.has(s.stationuuid))
          .slice(0, Math.min(availableSlots, stationsPerCountry));
        
        // Usar transformação síncrona (geocodificação via Who's On First desabilitada devido a CORS)
        const transformed = stationBatch.map((s, idx) => {
          includedStationIds.add(s.stationuuid);
          return transformToRadioStation(s, allStations.length + idx);
        });
        
        allStations.push(...transformed);
        console.log(`✓ ${country}: ${transformed.length} estações`);
      } catch (e) {
        console.warn(`Erro ao buscar estações de ${country}:`, e);
      }
    }
    
    // Buscar estações globais populares para completar
    const remaining = totalLimit - allStations.length;
    if (remaining > 0) {
      try {
        console.log(`Buscando ${remaining} estações globais populares...`);
        // Buscar mais estações globais para garantir que tenhamos variedade
        const globalStations = await apiRequest<RadioBrowserStation[]>(
          `/json/stations/search?hidebroken=true&limit=${remaining + 500}&order=votes&reverse=true`
        );
        const workingStations = globalStations.filter(s => s.lastcheckok === 1);
        const stationBatch = workingStations
          .filter(s => !includedStationIds.has(s.stationuuid))
          .slice(0, remaining);
        
        // Usar transformação síncrona (geocodificação via Who's On First desabilitada devido a CORS)
        const transformed = stationBatch.map((s, idx) => {
          includedStationIds.add(s.stationuuid);
          return transformToRadioStation(s, allStations.length + idx);
        });
        
        allStations.push(...transformed);
        console.log(`✓ Global: ${transformed.length} estações`);
      } catch (e) {
        console.warn('Erro ao buscar estações globais:', e);
      }
    }

    // Validar e remover duplicatas
    const validStations = allStations.filter(radio => 
      !isNaN(radio.latitude) && 
      !isNaN(radio.longitude) &&
      radio.latitude >= -90 && radio.latitude <= 90 &&
      radio.longitude >= -180 && radio.longitude <= 180
    );

    const uniqueStations = validStations.filter((station, index, self) => 
      index === self.findIndex(s => s.id === station.id)
    );

    console.log(`Total de ${uniqueStations.length} estações priorizadas processadas`);

    // Salvar no cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(uniqueStations));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    return uniqueStations;
  } catch (error) {
    console.error('Erro ao buscar estações priorizadas:', error);
    // Tentar carregar do cache mesmo se expirado
    const cachedStations = localStorage.getItem(CACHE_KEY);
    if (cachedStations) {
      console.log('Usando cache expirado como fallback...');
      return JSON.parse(cachedStations);
    }
    return [];
  }
}

/**
 * Busca TODAS as estações disponíveis (sem limite)
 * Carrega em lotes para não sobrecarregar
 * Por padrão, agora usa getPopularStationsInitial para carregamento rápido
 */
export async function getAllStations(): Promise<RadioStation[]> {
  // Por padrão, usar apenas estações populares para carregamento rápido
  // Se precisar carregar tudo, pode aumentar o limite aqui
  return getPopularStationsInitial(5000); // Aumentar limite se necessário
}

/**
 * Busca TODAS as estações disponíveis da API sem priorização
 * Retorna todas as estações funcionais com coordenadas válidas
 * Se existingStationIds for fornecido, filtra apenas as novas estações
 */
export async function getAllAvailableStations(
  existingStationIds?: Set<string>
): Promise<RadioStation[]> {
  const CACHE_KEY = 'radio_browser_all_stations_cache';
  const CACHE_TIMESTAMP_KEY = 'radio_browser_all_stations_timestamp';
  const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 horas

  try {
    // Verificar cache primeiro
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const cachedStations = localStorage.getItem(CACHE_KEY);

    if (cachedTimestamp && cachedStations) {
      const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
      if (cacheAge < CACHE_DURATION) {
        console.log('Carregando todas as estações do cache...');
        const cached = JSON.parse(cachedStations) as RadioStation[];
        // Se temos IDs existentes, filtrar apenas as novas
        if (existingStationIds && existingStationIds.size > 0) {
          const newStations = cached.filter(s => !existingStationIds.has(s.id));
          console.log(`${cached.length} estações no cache, ${newStations.length} novas para adicionar`);
          return newStations;
        }
        return cached;
      }
    }

    console.log('Buscando TODAS as estações disponíveis da API (sem priorização)...');
    console.log('Isso pode levar alguns minutos...');
    
    // Buscar em lotes grandes (1000 por vez até não ter mais)
    const allApiStations: RadioBrowserStation[] = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;
    const maxBatches = 100; // Limite de segurança (100.000 estações máximo)

    while (hasMore && offset < maxBatches * batchSize) {
      try {
        console.log(`Buscando lote ${offset + 1}... (offset: ${offset})`);
        const batch = await apiRequest<RadioBrowserStation[]>(
          `/json/stations/search?hidebroken=true&limit=${batchSize}&offset=${offset}&order=votes&reverse=true`
        );

        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        allApiStations.push(...batch);
        offset += batchSize;

        // Se retornou menos que o batch size, não há mais
        if (batch.length < batchSize) {
          hasMore = false;
        }

        // Pequeno delay para não sobrecarregar a API
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        console.log(`✓ Carregadas ${allApiStations.length} estações da API...`);
      } catch (error) {
        console.error(`Erro ao buscar lote ${offset}-${offset + batchSize}:`, error);
        // Continuar tentando com próximo lote
        hasMore = false;
      }
    }

    console.log(`Total de estações encontradas na API: ${allApiStations.length}`);

    // Filtrar apenas funcionais
    const workingStations = allApiStations.filter((s) => s.lastcheckok === 1);
    console.log(`Processando ${workingStations.length} estações funcionais...`);
    
    // Transformar e filtrar coordenadas válidas
    const transformed: RadioStation[] = [];
    const includedIds = existingStationIds || new Set<string>();
    
    // Processar em chunks para não bloquear a UI
    const chunkSize = 500;
    for (let i = 0; i < workingStations.length; i += chunkSize) {
      const chunk = workingStations.slice(i, i + chunkSize);
      const chunkResults = chunk
        .filter(s => !includedIds.has(s.stationuuid))
        .map((s, idx) => transformToRadioStation(s, transformed.length + idx));
      
      // Filtrar apenas estações com coordenadas válidas
      const validResults = chunkResults.filter(radio => 
        !isNaN(radio.latitude) && 
        !isNaN(radio.longitude) &&
        radio.latitude >= -90 && radio.latitude <= 90 &&
        radio.longitude >= -180 && radio.longitude <= 180 &&
        !includedIds.has(radio.id)
      );
      
      validResults.forEach(r => includedIds.add(r.id));
      transformed.push(...validResults);
      
      if (transformed.length % 1000 === 0 && transformed.length > 0) {
        console.log(`✓ Processadas ${transformed.length} estações válidas até agora...`);
      }
      
      // Pequeno delay entre chunks
      if (i + chunkSize < workingStations.length) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Remover duplicatas finais
    const uniqueStations = transformed.filter((station, index, self) => 
      index === self.findIndex(s => s.id === station.id)
    );

    console.log(`Total de ${uniqueStations.length} estações válidas processadas`);

    // Salvar no cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(uniqueStations));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    return uniqueStations;
  } catch (error) {
    console.error('Erro ao buscar todas as estações:', error);
    // Tentar carregar do cache mesmo se expirado
    const cachedStations = localStorage.getItem(CACHE_KEY);
    if (cachedStations) {
      console.log('Usando cache expirado como fallback...');
      const cached = JSON.parse(cachedStations) as RadioStation[];
      if (existingStationIds && existingStationIds.size > 0) {
        return cached.filter(s => !existingStationIds.has(s.id));
      }
      return cached;
    }
    return [];
  }
}

/**
 * Busca TODAS as estações disponíveis em lotes (lento, para carregamento completo)
 * Mantida para uso futuro se necessário
 */
export async function getAllStationsBatches(): Promise<RadioStation[]> {
  const CACHE_KEY = 'radio_browser_stations_cache';
  const CACHE_TIMESTAMP_KEY = 'radio_browser_stations_timestamp';
  const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 horas

  try {
    // Verificar cache
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const cachedStations = localStorage.getItem(CACHE_KEY);

    if (cachedTimestamp && cachedStations) {
      const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
      if (cacheAge < CACHE_DURATION) {
        console.log('Carregando estações do cache...');
        return JSON.parse(cachedStations);
      }
    }

    console.log('Buscando todas as estações da API (pode levar alguns minutos)...');
    
    // Buscar em lotes grandes (1000 por vez até não ter mais)
    const allStations: RadioBrowserStation[] = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore && offset < 100000) { // Limite de segurança
      try {
        const batch = await apiRequest<RadioBrowserStation[]>(
          `/json/stations/search?hidebroken=true&limit=${batchSize}&offset=${offset}&order=votes&reverse=true`
        );

        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        allStations.push(...batch);
        offset += batchSize;

        // Se retornou menos que o batch size, não há mais
        if (batch.length < batchSize) {
          hasMore = false;
        }

        // Pequeno delay para não sobrecarregar a API
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        console.log(`Carregadas ${allStations.length} estações...`);
      } catch (error) {
        console.error(`Erro ao buscar lote ${offset}-${offset + batchSize}:`, error);
        hasMore = false;
      }
    }

    console.log(`Total de estações encontradas: ${allStations.length}`);

    // Transformar e filtrar apenas funcionais (em paralelo com chunks para não bloquear)
    const workingStations = allStations.filter((s) => s.lastcheckok === 1);
    console.log(`Processando ${workingStations.length} estações funcionais...`);
    
    // Processar em chunks para não bloquear
    const chunkSize = 100;
    const transformed: RadioStation[] = [];
    
    for (let i = 0; i < workingStations.length; i += chunkSize) {
      const chunk = workingStations.slice(i, i + chunkSize);
      const chunkResults = chunk.map((s, idx) => transformToRadioStation(s, i + idx));
      // Filtrar apenas estações com coordenadas válidas (não NaN, dentro dos limites geográficos)
      const validResults = chunkResults.filter(radio => 
        !isNaN(radio.latitude) && 
        !isNaN(radio.longitude) &&
        radio.latitude >= -90 && radio.latitude <= 90 &&
        radio.longitude >= -180 && radio.longitude <= 180
      );
      transformed.push(...validResults);
      
      // Atualizar estado periodicamente para mostrar progresso ao usuário
      // Atualizar a cada 500 estações processadas para não sobrecarregar o React
      if (transformed.length % 500 === 0 && transformed.length > 0) {
        console.log(`Processadas ${transformed.length} estações válidas até agora...`);
        // Nota: Não atualizamos o estado aqui para não causar re-renders excessivos
        // As estações serão atualizadas quando todo o processamento terminar
      }
      
      // Pequeno delay entre chunks para não bloquear a UI
      if (i + chunkSize < workingStations.length) {
        await new Promise((resolve) => setTimeout(resolve, 25)); // Reduzido para ser mais rápido
      }
    }

    console.log(`Total processadas: ${transformed.length} estações válidas com coordenadas`);

    // Salvar no cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(transformed));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    return transformed;
  } catch (error) {
    console.error('Erro ao buscar todas as estações:', error);
    // Tentar carregar do cache mesmo se expirado
    const cachedStations = localStorage.getItem(CACHE_KEY);
    if (cachedStations) {
      console.log('Usando cache expirado como fallback...');
      return JSON.parse(cachedStations);
    }
    return [];
  }
}
