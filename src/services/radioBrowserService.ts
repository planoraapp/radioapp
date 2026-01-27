import { RadioStation } from '../data/radios';
// import { searchCity } from './whosOnFirstService'; // Desabilitado: Nominatim tem CORS e rate limiting

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

// Um único servidor oficial (menos dependências, menos falhas de DNS).
// de1 é o principal e geralmente o mais estável: https://api.radio-browser.info/
const RADIO_BROWSER_BASE = 'https://de1.api.radio-browser.info';
let availableServers: string[] = [RADIO_BROWSER_BASE];

/**
 * Retorna o servidor em uso. Uso de uma só API reduz falhas de DNS e latência.
 */
export async function discoverServers(): Promise<string[]> {
  if (availableServers.length === 0) {
    availableServers = [RADIO_BROWSER_BASE];
  }
  return availableServers;
}

/**
 * Requisição à API Radio Browser (um único servidor, retry no mesmo host).
 */
async function apiRequest<T>(
  endpoint: string,
  retries: number = 3
): Promise<T> {
  if (availableServers.length === 0) {
    await discoverServers();
  }
  const server = availableServers[0];

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${server}${endpoint}`, {
        headers: { 'User-Agent': 'RadioGlobe/1.0 (https://radio-globe.app)' },
      });
      if (response.ok) {
        return (await response.json()) as T;
      }
    } catch (error) {
      logWarn(`Erro ao conectar com ${server}:`, error);
    }
    if (attempt < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
  throw new Error('Falha ao conectar à API Radio Browser');
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
    logError(`Erro ao buscar estações de ${countryCode}:`, error);
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
    logError(`Erro ao buscar estações de ${countryName}:`, error);
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
    logError('Erro ao buscar estações populares:', error);
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
    logError('Erro ao buscar países:', error);
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
    NL: { lat: 52.1326, lng: 5.2913 }, // Holanda
    BE: { lat: 50.5039, lng: 4.4699 }, // Bélgica
    CH: { lat: 46.8182, lng: 8.2275 }, // Suíça
    AT: { lat: 47.5162, lng: 14.5501 }, // Áustria
    PL: { lat: 51.9194, lng: 19.1451 }, // Polônia
    SE: { lat: 60.1282, lng: 18.6435 }, // Suécia
    NO: { lat: 60.4720, lng: 8.4689 }, // Noruega
    DK: { lat: 56.2639, lng: 9.5018 }, // Dinamarca
    FI: { lat: 61.9241, lng: 25.7482 }, // Finlândia
    GR: { lat: 39.0742, lng: 21.8243 }, // Grécia
    TR: { lat: 38.9637, lng: 35.2433 }, // Turquia
    KR: { lat: 35.9078, lng: 127.7669 }, // Coreia do Sul
    ZA: { lat: -30.5595, lng: 22.9375 }, // África do Sul
    NZ: { lat: -40.9006, lng: 174.8860 }, // Nova Zelândia
    CL: { lat: -35.6751, lng: -71.5430 }, // Chile
    CO: { lat: 4.5709, lng: -74.2973 }, // Colômbia
    PE: { lat: -9.1900, lng: -75.0152 }, // Peru
    VE: { lat: 6.4238, lng: -66.5897 }, // Venezuela
    EC: { lat: -1.8312, lng: -78.1834 }, // Equador
    RO: { lat: 45.9432, lng: 24.9668 }, // Romênia (ADICIONADO)
    HU: { lat: 47.1625, lng: 19.5033 }, // Hungria (ADICIONADO)
    ID: { lat: -0.7893, lng: 113.9213 }, // Indonésia (ADICIONADO)
  };

  // Se não encontrar no mapeamento, retornar null para indicar que não temos dados
  // Em vez de usar hash que gera coordenadas completamente erradas
  if (!countryCenters[countryCode.toUpperCase()]) {
    // Retornar (0, 0) como indicador de "desconhecido" - será tratado no código chamador
    return { lat: 0, lng: 0 };
  }
  
  return countryCenters[countryCode.toUpperCase()];
}

/**
 * Limites aproximados (bounding boxes) dos países para validação
 * Formato: { minLat, maxLat, minLng, maxLng }
 */
const countryBounds: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  BR: { minLat: -35, maxLat: 5, minLng: -75, maxLng: -30 }, // Brasil
  US: { minLat: 18, maxLat: 72, minLng: -180, maxLng: -50 }, // Estados Unidos (incluindo Alaska e Havaí)
  GB: { minLat: 49, maxLat: 61, minLng: -9, maxLng: 2 }, // Reino Unido (expandido)
  FR: { minLat: 41, maxLat: 52, minLng: -6, maxLng: 10 }, // França (incluindo territórios)
  DE: { minLat: 47, maxLat: 55, minLng: 6, maxLng: 15 }, // Alemanha
  IT: { minLat: 36, maxLat: 47, minLng: 7, maxLng: 19 }, // Itália
  ES: { minLat: 27, maxLat: 44, minLng: -19, maxLng: 5 }, // Espanha (incluindo Canárias)
  CA: { minLat: 41, maxLat: 84, minLng: -141, maxLng: -50 }, // Canadá (expandido para incluir todas as regiões)
  MX: { minLat: 14, maxLat: 33, minLng: -118, maxLng: -86 }, // México
  AR: { minLat: -55, maxLat: -21, minLng: -74, maxLng: -53 }, // Argentina
  PT: { minLat: 32, maxLat: 42, minLng: -32, maxLng: -6 }, // Portugal (incluindo Açores e Madeira)
  AU: { minLat: -45, maxLat: -10, minLng: 113, maxLng: 154 }, // Austrália
  JP: { minLat: 24, maxLat: 46, minLng: 123, maxLng: 146 }, // Japão
  CN: { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 }, // China
  IN: { minLat: 6, maxLat: 36, minLng: 68, maxLng: 97 }, // Índia
  RU: { minLat: 41, maxLat: 82, minLng: 19, maxLng: 169 }, // Rússia
  NL: { minLat: 50, maxLat: 54, minLng: 3, maxLng: 8 }, // Holanda
  BE: { minLat: 49.4, maxLat: 51.6, minLng: 2.3, maxLng: 6.5 }, // Bélgica (ajustado para coordenadas reais)
  CH: { minLat: 45.8, maxLat: 47.8, minLng: 6, maxLng: 10.5 }, // Suíça
  AT: { minLat: 46.3, maxLat: 49, minLng: 9.5, maxLng: 17.2 }, // Áustria
  PL: { minLat: 49, maxLat: 55, minLng: 14, maxLng: 25 }, // Polônia
  SE: { minLat: 55, maxLat: 69, minLng: 11, maxLng: 24 }, // Suécia
  NO: { minLat: 58, maxLat: 71, minLng: 5, maxLng: 31 }, // Noruega
  DK: { minLat: 54.5, maxLat: 57.8, minLng: 8, maxLng: 15.2 }, // Dinamarca (incluindo Groenlândia e territórios)
  FI: { minLat: 60, maxLat: 70, minLng: 20, maxLng: 32 }, // Finlândia
  GR: { minLat: 35, maxLat: 42, minLng: 20, maxLng: 28 }, // Grécia
  TR: { minLat: 36, maxLat: 42, minLng: 26, maxLng: 45 }, // Turquia
  KR: { minLat: 33, maxLat: 39, minLng: 124, maxLng: 132 }, // Coreia do Sul
  ZA: { minLat: -35, maxLat: -22, minLng: 16, maxLng: 33 }, // África do Sul
  NZ: { minLat: -48, maxLat: -34, minLng: 166, maxLng: 179 }, // Nova Zelândia
  CL: { minLat: -56, maxLat: -17, minLng: -76, maxLng: -66 }, // Chile
  CO: { minLat: -4.3, maxLat: 12.5, minLng: -79, maxLng: -66.8 }, // Colômbia (corrigido minLat)
  PE: { minLat: -18.3, maxLat: -0.04, minLng: -81.3, maxLng: -68.7 }, // Peru
  VE: { minLat: 0.6, maxLat: 12.2, minLng: -73.4, maxLng: -59.8 }, // Venezuela
  EC: { minLat: -5.0, maxLat: 1.5, minLng: -81.1, maxLng: -75.2 }, // Equador
  RO: { minLat: 43.6, maxLat: 48.2, minLng: 20.2, maxLng: 30 }, // Romênia (ADICIONADO)
  HU: { minLat: 45.7, maxLat: 48.6, minLng: 16.1, maxLng: 22.9 }, // Hungria (ADICIONADO)
  ID: { minLat: -11, maxLat: 6, minLng: 95, maxLng: 141 }, // Indonésia (ADICIONADO)
};

/**
 * Verifica se as coordenadas estão dentro dos limites aproximados do país
 */
function isCoordinatesInCountry(lat: number, lng: number, countryCode: string): boolean {
  const bounds = countryBounds[countryCode.toUpperCase()];
  if (!bounds) {
    // Se não temos bounds para o país, usar verificação por distância do centro
    const center = getCountryCenter(countryCode);
    
    // Se o centro é (0, 0), significa que não temos dados do país
    // Neste caso, ser muito tolerante - aceitar coordenadas válidas
    if (center.lat === 0 && center.lng === 0) {
      // Apenas rejeitar coordenadas obviamente inválidas
      return !(lat === 0 && lng === 0) && 
             lat >= -90 && lat <= 90 && 
             lng >= -180 && lng <= 180;
    }
    
    // Se temos centro válido, usar verificação por distância (mais tolerante)
    const maxDistance = 50; // Aumentado de 30 para 50 graus (mais tolerante)
    const latDiff = Math.abs(lat - center.lat);
    const lngDiff = Math.abs(lng - center.lng);
    return latDiff < maxDistance && lngDiff < maxDistance;
  }
  
  // Para países com bounds, usar margem de erro para coordenadas próximas das fronteiras
  const margin = 1.0; // Margem de 1 grau para coordenadas próximas das fronteiras
  return lat >= bounds.minLat - margin && lat <= bounds.maxLat + margin && 
         lng >= bounds.minLng - margin && lng <= bounds.maxLng + margin;
}

/**
 * Corrige coordenadas se estiverem fora dos limites do país
 * Mais tolerante - só corrige se claramente fora do país
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
  
  // Verificar se o centro do país é válido (não é 0,0 do fallback)
  const center = getCountryCenter(normalizedCode);
  if (center.lat === 0 && center.lng === 0) {
    // Se não temos centro válido, manter coordenadas originais
    // (evita corrigir para coordenadas erradas geradas por hash)
    return { lat, lng, corrected: false };
  }
  
  // Se não estão, corrigir para o centro do país
  // Em produção, reduzir logging para evitar spam no console
  if (process.env.NODE_ENV !== 'production') {
    logWarn(`Coordenadas (${lat.toFixed(6)}, ${lng.toFixed(6)}) fora dos limites do país ${normalizedCode} (${countryName}). Corrigindo para centro do país (${center.lat}, ${center.lng})`);
  }
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
      logError(`Erro ao buscar estações de ${countryCode}:`, error);
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
    logError(`Erro ao buscar estações de ${countryName}:`, error);
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
    logError('Erro ao buscar estações populares:', error);
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
        log('Carregando estações do cache...');
        return JSON.parse(cachedStations);
      }
    }

    log(`Buscando ${limit} estações populares (carregamento rápido)...`);
    
    // Buscar apenas as mais populares (ordenadas por votos, limitadas)
    // Isso é muito mais rápido que carregar tudo
    const apiStations = await apiRequest<RadioBrowserStation[]>(
      `/json/stations/search?hidebroken=true&limit=${limit}&order=votes&reverse=true`
    );

    log(`Encontradas ${apiStations.length} estações populares`);

    // Transformar apenas as funcionais (já filtradas pela API com hidebroken=true)
    const workingStations = apiStations.filter((s) => s.lastcheckok === 1);
    log(`Processando ${workingStations.length} estações funcionais...`);
    
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

    log(`Total de ${uniqueStations.length} estações válidas processadas`);

    // Salvar no cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(uniqueStations));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    return uniqueStations;
  } catch (error) {
    logError('Erro ao buscar estações populares:', error);
    // Tentar carregar do cache mesmo se expirado
    const cachedStations = localStorage.getItem(CACHE_KEY);
    if (cachedStations) {
      log('Usando cache expirado como fallback...');
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
    'Brazil', 'United States of America', 'United Kingdom', // Nomes exatos da API Radio Browser
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
        log('Carregando estações priorizadas do cache...');
        return JSON.parse(cachedStations);
      }
    }

    log(`Buscando ${totalLimit} estações priorizando regiões...`);
    
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
        log(`Buscando estações de ${country}...`);
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
        log(`✓ ${country}: ${transformed.length} estações`);
      } catch (e) {
        logWarn(`Erro ao buscar estações de ${country}:`, e);
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
        log(`Buscando estações de ${country}...`);
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
        log(`✓ ${country}: ${transformed.length} estações`);
      } catch (e) {
        logWarn(`Erro ao buscar estações de ${country}:`, e);
      }
    }
    
    // Buscar estações globais populares para completar
    const remaining = totalLimit - allStations.length;
    if (remaining > 0) {
      try {
        log(`Buscando ${remaining} estações globais populares...`);
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
        log(`✓ Global: ${transformed.length} estações`);
      } catch (e) {
        logWarn('Erro ao buscar estações globais:', e);
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

    log(`Total de ${uniqueStations.length} estações priorizadas processadas`);

    // Salvar no cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(uniqueStations));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    return uniqueStations;
  } catch (error) {
    logError('Erro ao buscar estações priorizadas:', error);
    // Tentar carregar do cache mesmo se expirado
    const cachedStations = localStorage.getItem(CACHE_KEY);
    if (cachedStations) {
      log('Usando cache expirado como fallback...');
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
        log('Carregando todas as estações do cache...');
        const cached = JSON.parse(cachedStations) as RadioStation[];
        // Se temos IDs existentes, filtrar apenas as novas
        if (existingStationIds && existingStationIds.size > 0) {
          const newStations = cached.filter(s => !existingStationIds.has(s.id));
          log(`${cached.length} estações no cache, ${newStations.length} novas para adicionar`);
          return newStations;
        }
        return cached;
      }
    }

    log('Buscando TODAS as estações disponíveis da API (sem priorização)...');
    log('Isso pode levar alguns minutos...');
    
    // Buscar em lotes grandes (1000 por vez até não ter mais)
    const allApiStations: RadioBrowserStation[] = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;
    const maxBatches = 100; // Limite de segurança (100.000 estações máximo)

    while (hasMore && offset < maxBatches * batchSize) {
      try {
        log(`Buscando lote ${offset + 1}... (offset: ${offset})`);
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
        
        log(`✓ Carregadas ${allApiStations.length} estações da API...`);
      } catch (error) {
        logError(`Erro ao buscar lote ${offset}-${offset + batchSize}:`, error);
        // Continuar tentando com próximo lote
        hasMore = false;
      }
    }

    log(`Total de estações encontradas na API: ${allApiStations.length}`);

    // Filtrar apenas funcionais
    const workingStations = allApiStations.filter((s) => s.lastcheckok === 1);
    log(`Processando ${workingStations.length} estações funcionais...`);
    
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
        log(`✓ Processadas ${transformed.length} estações válidas até agora...`);
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

    log(`Total de ${uniqueStations.length} estações válidas processadas`);

    // Salvar no cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(uniqueStations));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    return uniqueStations;
  } catch (error) {
    logError('Erro ao buscar todas as estações:', error);
    // Tentar carregar do cache mesmo se expirado
    const cachedStations = localStorage.getItem(CACHE_KEY);
    if (cachedStations) {
      log('Usando cache expirado como fallback...');
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
        log('Carregando estações do cache...');
        return JSON.parse(cachedStations);
      }
    }

    log('Buscando todas as estações da API (pode levar alguns minutos)...');
    
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
        
        log(`Carregadas ${allStations.length} estações...`);
      } catch (error) {
        logError(`Erro ao buscar lote ${offset}-${offset + batchSize}:`, error);
        hasMore = false;
      }
    }

    log(`Total de estações encontradas: ${allStations.length}`);

    // Transformar e filtrar apenas funcionais (em paralelo com chunks para não bloquear)
    const workingStations = allStations.filter((s) => s.lastcheckok === 1);
    log(`Processando ${workingStations.length} estações funcionais...`);
    
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
        log(`Processadas ${transformed.length} estações válidas até agora...`);
        // Nota: Não atualizamos o estado aqui para não causar re-renders excessivos
        // As estações serão atualizadas quando todo o processamento terminar
      }
      
      // Pequeno delay entre chunks para não bloquear a UI
      if (i + chunkSize < workingStations.length) {
        await new Promise((resolve) => setTimeout(resolve, 25)); // Reduzido para ser mais rápido
      }
    }

    log(`Total processadas: ${transformed.length} estações válidas com coordenadas`);

    // Salvar no cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(transformed));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    return transformed;
  } catch (error) {
    logError('Erro ao buscar todas as estações:', error);
    // Tentar carregar do cache mesmo se expirado
    const cachedStations = localStorage.getItem(CACHE_KEY);
    if (cachedStations) {
      log('Usando cache expirado como fallback...');
      return JSON.parse(cachedStations);
    }
    return [];
  }
}
