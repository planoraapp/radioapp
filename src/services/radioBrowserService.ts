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
 * Busca estações por nome do país (uma única requisição)
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

/** Tamanho de lote para paginação (API aceita offset/limit; evita cap por requisição) */
const STATIONS_BATCH_SIZE = 2000;

/**
 * Busca estações por país em lotes (offset/limit) até atingir totalWanted ou acabar na API.
 */
async function getStationsByCountryNamePaginated(
  countryName: string,
  totalWanted: number
): Promise<RadioBrowserStation[]> {
  const out: RadioBrowserStation[] = [];
  let offset = 0;
  const enc = encodeURIComponent(countryName);
  while (out.length < totalWanted) {
    const batchSize = Math.min(STATIONS_BATCH_SIZE, totalWanted - out.length + 50);
    const batch = await apiRequest<RadioBrowserStation[]>(
      `/json/stations/bycountryexact/${enc}?hidebroken=true&limit=${batchSize}&offset=${offset}&order=votes&reverse=true`
    );
    if (batch.length === 0) break;
    out.push(...batch);
    offset += batch.length;
    if (batch.length < batchSize) break;
  }
  return out;
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
  // Mais países comuns na API Radio Browser
  'romania': 'RO',
  'romênia': 'RO',
  'hungary': 'HU',
  'hungria': 'HU',
  'czech republic': 'CZ',
  'republica tcheca': 'CZ',
  'philippines': 'PH',
  'filipinas': 'PH',
  'indonesia': 'ID',
  'malaysia': 'MY',
  'thailand': 'TH',
  'tailândia': 'TH',
  'vietnam': 'VN',
  'viet nam': 'VN',
  'pakistan': 'PK',
  'bangladesh': 'BD',
  'sri lanka': 'LK',
  'israel': 'IL',
  'saudi arabia': 'SA',
  'arabia saudita': 'SA',
  'united arab emirates': 'AE',
  'emirados árabes': 'AE',
  'uae': 'AE',
  'egypt': 'EG',
  'egito': 'EG',
  'nigeria': 'NG',
  'kenya': 'KE',
  'ghana': 'GH',
  'morocco': 'MA',
  'marrocos': 'MA',
  'tanzania': 'TZ',
  'ethiopia': 'ET',
  'etiópia': 'ET',
  'senegal': 'SN',
  'burkina faso': 'BF',
  "côte d'ivoire": 'CI',
  "cote d'ivoire": 'CI',
  'ivory coast': 'CI',
  'cameroon': 'CM',
  'camarões': 'CM',
  'congo': 'CG',
  'uganda': 'UG',
  'ukraine': 'UA',
  'ucrânia': 'UA',
  'slovakia': 'SK',
  'eslováquia': 'SK',
  'serbia': 'RS',
  'sérvia': 'RS',
  'croatia': 'HR',
  'croácia': 'HR',
  'bulgaria': 'BG',
  'bulgária': 'BG',
  'ireland': 'IE',
  'irlanda': 'IE',
  'taiwan': 'TW',
  'hong kong': 'HK',
  'singapore': 'SG',
  'singapura': 'SG',
  'iran': 'IR',
  'irã': 'IR',
  'iraq': 'IQ',
  'iraque': 'IQ',
  'lebanon': 'LB',
  'líbano': 'LB',
  'syria': 'SY',
  'síria': 'SY',
  'algeria': 'DZ',
  'argélia': 'DZ',
  'tunisia': 'TN',
  'tunísia': 'TN',
  'libya': 'LY',
  'líbia': 'LY',
  'bolivia': 'BO',
  'bolívia': 'BO',
  'paraguay': 'PY',
  'paraguai': 'PY',
  'uruguay': 'UY',
  'uruguai': 'UY',
  'costa rica': 'CR',
  'panama': 'PA',
  'panamá': 'PA',
  'guatemala': 'GT',
  'honduras': 'HN',
  'el salvador': 'SV',
  'nicaragua': 'NI',
  'dominican republic': 'DO',
  'republica dominicana': 'DO',
  'puerto rico': 'PR',
  'cuba': 'CU',
  'jamaica': 'JM',
  'trinidad and tobago': 'TT',
  'trinidad e tobago': 'TT',
  'cyprus': 'CY',
  'chipre': 'CY',
  'malta': 'MT',
  'slovenia': 'SI',
  'eslovenia': 'SI',
  'bosnia and herzegovina': 'BA',
  'bosnia': 'BA',
  'macedonia': 'MK',
  'north macedonia': 'MK',
  'albania': 'AL',
  'albânia': 'AL',
  'mongolia': 'MN',
  'mongólia': 'MN',
  'kazakhstan': 'KZ',
  'cazaquistão': 'KZ',
  'uzbekistan': 'UZ',
  'uzbequistão': 'UZ',
  'afghanistan': 'AF',
  'afeganistão': 'AF',
  'nepal': 'NP',
  'myanmar': 'MM',
  'burma': 'MM',
  'cambodia': 'KH',
  'camboja': 'KH',
  'laos': 'LA',
  'yemen': 'YE',
  'iêmen': 'YE',
  'oman': 'OM',
  'qatar': 'QA',
  'kuwait': 'KW',
  'bahrain': 'BH',
  'bahrein': 'BH',
  'jordan': 'JO',
  'jordânia': 'JO',
  'palestine': 'PS',
  'palestina': 'PS',
  'georgia': 'GE',
  'geórgia': 'GE',
  'armenia': 'AM',
  'armênia': 'AM',
  'azerbaijan': 'AZ',
  'azerbaijão': 'AZ',
  'belarus': 'BY',
  'bielorrússia': 'BY',
  'moldova': 'MD',
  'estonia': 'EE',
  'estônia': 'EE',
  'latvia': 'LV',
  'letônia': 'LV',
  'lithuania': 'LT',
  'lituânia': 'LT',
  'luxembourg': 'LU',
  'luxemburgo': 'LU',
  'iceland': 'IS',
  'islândia': 'IS',
  'zimbabwe': 'ZW',
  'zimbábue': 'ZW',
  'zambia': 'ZM',
  'zâmbia': 'ZM',
  'mozambique': 'MZ',
  'angola': 'AO',
  'madagascar': 'MG',
  'madagáscar': 'MG',
  'mauritius': 'MU',
  'maurícia': 'MU',
};

/** Remove acentos para lookup (e.g. "Brasil" → "brasil", "Côte" → "cote") */
function normalizeNameForLookup(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\s\-]+/g, ' ')
    .trim();
}

/**
 * Tenta normalizar e obter código do país
 * Usa countrycode da API quando válido; senão busca em countryNameToCode por nome (com e sem acentos)
 */
function normalizeCountryCode(countryCode?: string, countryName?: string): string {
  if (countryCode && countryCode.trim() !== '' && countryCode !== 'Unknown' && countryCode !== 'XX') {
    return countryCode.toUpperCase().trim();
  }
  if (countryName) {
    const raw = countryName.toLowerCase().trim();
    const withoutAccents = normalizeNameForLookup(countryName);
    return countryNameToCode[raw] || countryNameToCode[withoutAccents] || '';
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
    RO: { lat: 45.9432, lng: 24.9668 }, // Romênia
    HU: { lat: 47.1625, lng: 19.5033 }, // Hungria
    ID: { lat: -0.7893, lng: 113.9213 }, // Indonésia
    PH: { lat: 12.8797, lng: 121.7740 }, // Filipinas
    MY: { lat: 4.2105, lng: 101.9758 }, // Malásia
    TH: { lat: 15.8700, lng: 100.9925 }, // Tailândia
    VN: { lat: 14.0583, lng: 108.2772 }, // Vietnã
    PK: { lat: 30.3753, lng: 69.3451 }, // Paquistão
    BD: { lat: 23.6850, lng: 90.3563 }, // Bangladesh
    LK: { lat: 7.8731, lng: 80.7718 }, // Sri Lanka
    IL: { lat: 31.0461, lng: 34.8516 }, // Israel
    SA: { lat: 23.8859, lng: 45.0792 }, // Arábia Saudita
    AE: { lat: 23.4241, lng: 53.8478 }, // Emirados Árabes
    EG: { lat: 26.8206, lng: 30.8025 }, // Egito
    NG: { lat: 9.0820, lng: 8.6753 }, // Nigéria
    KE: { lat: -0.0236, lng: 37.9062 }, // Quênia
    GH: { lat: 7.9465, lng: -1.0232 }, // Gana
    MA: { lat: 31.7917, lng: -7.0926 }, // Marrocos
    TZ: { lat: -6.3690, lng: 34.8888 }, // Tanzânia
    ET: { lat: 9.1450, lng: 40.4897 }, // Etiópia
    SN: { lat: 14.7167, lng: -17.4677 }, // Senegal
    BF: { lat: 12.2383, lng: -1.5616 }, // Burkina Faso
    CI: { lat: 7.5400, lng: -5.5471 }, // Costa do Marfim
    CM: { lat: 6.6111, lng: 20.9394 }, // Camarões
    CG: { lat: -0.2280, lng: 15.8277 }, // Congo
    UG: { lat: 1.3733, lng: 32.2903 }, // Uganda
    UA: { lat: 48.3794, lng: 31.1656 }, // Ucrânia
    CZ: { lat: 49.8175, lng: 15.4728 }, // República Tcheca
    SK: { lat: 48.6690, lng: 19.6990 }, // Eslováquia
    RS: { lat: 44.0165, lng: 21.0059 }, // Sérvia
    HR: { lat: 45.1, lng: 15.2 }, // Croácia
    BG: { lat: 42.7339, lng: 25.4858 }, // Bulgária
    IE: { lat: 53.1424, lng: -7.6921 }, // Irlanda
    TW: { lat: 23.6978, lng: 120.9605 }, // Taiwan
    HK: { lat: 22.3193, lng: 114.1694 }, // Hong Kong
    SG: { lat: 1.3521, lng: 103.8198 }, // Singapura
    IR: { lat: 32.4279, lng: 53.6880 }, // Irã
    IQ: { lat: 33.2232, lng: 43.6793 }, // Iraque
    LB: { lat: 33.8547, lng: 35.8623 }, // Líbano
    SY: { lat: 34.8021, lng: 38.9968 }, // Síria
    DZ: { lat: 28.0339, lng: 1.6596 }, // Argélia
    TN: { lat: 33.8869, lng: 9.5375 }, // Tunísia
    LY: { lat: 26.3351, lng: 17.2283 }, // Líbia
    BO: { lat: -16.2902, lng: -63.5887 }, // Bolívia
    PY: { lat: -23.4425, lng: -58.4438 }, // Paraguai
    UY: { lat: -32.5228, lng: -55.7658 }, // Uruguai
    CR: { lat: 9.7489, lng: -83.7534 }, // Costa Rica
    PA: { lat: 8.5380, lng: -80.7821 }, // Panamá
    GT: { lat: 15.7835, lng: -90.2308 }, // Guatemala
    HN: { lat: 15.2000, lng: -86.2419 }, // Honduras
    SV: { lat: 13.7942, lng: -88.8965 }, // El Salvador
    NI: { lat: 12.8654, lng: -85.2072 }, // Nicarágua
    DO: { lat: 18.7357, lng: -70.1627 }, // República Dominicana
    PR: { lat: 18.2208, lng: -66.5901 }, // Porto Rico
    CU: { lat: 21.5218, lng: -77.7812 }, // Cuba
    JM: { lat: 18.1096, lng: -77.2975 }, // Jamaica
    TT: { lat: 10.6918, lng: -61.2225 }, // Trinidad e Tobago
    CY: { lat: 35.1264, lng: 33.4299 }, // Chipre
    MT: { lat: 35.9375, lng: 14.3754 }, // Malta
    SI: { lat: 46.1512, lng: 14.9955 }, // Eslovênia
    BA: { lat: 43.9159, lng: 17.6791 }, // Bósnia e Herzegovina
    MK: { lat: 41.6086, lng: 21.7453 }, // Macedônia do Norte
    AL: { lat: 41.1533, lng: 20.1683 }, // Albânia
    MN: { lat: 46.8625, lng: 103.8467 }, // Mongólia
    KZ: { lat: 48.0196, lng: 66.9237 }, // Cazaquistão
    UZ: { lat: 41.3775, lng: 64.5853 }, // Uzbequistão
    AF: { lat: 33.9391, lng: 67.7100 }, // Afeganistão
    NP: { lat: 28.3949, lng: 84.1240 }, // Nepal
    MM: { lat: 21.9162, lng: 95.9560 }, // Mianmar
    KH: { lat: 12.5657, lng: 104.9910 }, // Camboja
    LA: { lat: 19.8563, lng: 102.4955 }, // Laos
    YE: { lat: 15.5527, lng: 48.5164 }, // Iêmen
    OM: { lat: 21.4735, lng: 55.9754 }, // Omã
    QA: { lat: 25.2854, lng: 51.5310 }, // Qatar
    KW: { lat: 29.3117, lng: 47.4818 }, // Kuwait
    BH: { lat: 26.0667, lng: 50.5577 }, // Bahrein
    JO: { lat: 30.5852, lng: 36.2384 }, // Jordânia
    PS: { lat: 31.9522, lng: 35.2332 }, // Palestina
    GE: { lat: 42.3154, lng: 43.3569 }, // Geórgia
    AM: { lat: 40.0691, lng: 45.0382 }, // Armênia
    AZ: { lat: 40.1431, lng: 47.5769 }, // Azerbaijão
    BY: { lat: 53.7098, lng: 27.9534 }, // Bielorrússia
    MD: { lat: 47.4116, lng: 28.3699 }, // Moldávia
    EE: { lat: 58.5953, lng: 25.0136 }, // Estônia
    LV: { lat: 56.8796, lng: 24.6032 }, // Letônia
    LT: { lat: 55.1694, lng: 23.8813 }, // Lituânia
    LU: { lat: 49.8153, lng: 6.1296 }, // Luxemburgo
    IS: { lat: 64.9631, lng: -19.0208 }, // Islândia
    ZW: { lat: -19.0154, lng: 29.1549 }, // Zimbábue
    ZM: { lat: -13.1339, lng: 27.8493 }, // Zâmbia
    MZ: { lat: -18.6657, lng: 35.5296 }, // Moçambique
    AO: { lat: -11.2027, lng: 17.8739 }, // Angola
    MG: { lat: -18.7669, lng: 46.8691 }, // Madagascar
    MU: { lat: -20.3484, lng: 57.5522 }, // Maurícia
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
  DK: { minLat: 54.5, maxLat: 57.8, minLng: 8, maxLng: 15.2 }, // Dinamarca (continental + Faroe; Groenlândia não incluída)
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
  ID: { minLat: -11, maxLat: 6, minLng: 95, maxLng: 141 }, // Indonésia
  PH: { minLat: 4.5, maxLat: 21, minLng: 117, maxLng: 127 }, // Filipinas
  MY: { minLat: 0.8, maxLat: 7.4, minLng: 99.6, maxLng: 119.3 }, // Malásia (península + Borneo)
  TH: { minLat: 5.6, maxLat: 20.5, minLng: 97.3, maxLng: 105.6 }, // Tailândia
  VN: { minLat: 8.2, maxLat: 23.4, minLng: 102.1, maxLng: 109.5 }, // Vietnã
  PK: { minLat: 23.5, maxLat: 37.1, minLng: 61, maxLng: 75.1 }, // Paquistão
  BD: { minLat: 20.4, maxLat: 26.6, minLng: 88, maxLng: 92.7 }, // Bangladesh
  LK: { minLat: 5.9, maxLat: 9.8, minLng: 79.5, maxLng: 82 }, // Sri Lanka
  IL: { minLat: 29.5, maxLat: 33.3, minLng: 34.2, maxLng: 35.9 }, // Israel
  SA: { minLat: 16.4, maxLat: 32.2, minLng: 34.5, maxLng: 55.7 }, // Arábia Saudita
  AE: { minLat: 22.6, maxLat: 26.2, minLng: 51.6, maxLng: 56.4 }, // Emirados Árabes
  EG: { minLat: 22, maxLat: 31.7, minLng: 25, maxLng: 36.9 }, // Egito
  NG: { minLat: 4.3, maxLat: 13.9, minLng: 2.7, maxLng: 14.7 }, // Nigéria
  KE: { minLat: -4.7, maxLat: 5.0, minLng: 33.9, maxLng: 41.9 }, // Quênia
  GH: { minLat: 4.7, maxLat: 11.2, minLng: -3.3, maxLng: 1.2 }, // Gana
  MA: { minLat: 27.4, maxLat: 35.9, minLng: -13.2, maxLng: -1 }, // Marrocos
  TZ: { minLat: -11.7, maxLat: -0.99, minLng: 29.3, maxLng: 40.4 }, // Tanzânia
  ET: { minLat: 3.4, maxLat: 14.9, minLng: 33, maxLng: 48 }, // Etiópia
  SN: { minLat: 12.3, maxLat: 16.7, minLng: -17.5, maxLng: -11.3 }, // Senegal
  BF: { minLat: 9.4, maxLat: 15.1, minLng: -5.5, maxLng: 2.4 }, // Burkina Faso
  CI: { minLat: 4.2, maxLat: 10.7, minLng: -8.6, maxLng: -2.5 }, // Costa do Marfim
  CM: { minLat: 1.7, maxLat: 13.1, minLng: 8.5, maxLng: 16.2 }, // Camarões
  CG: { minLat: -5.0, maxLat: 3.7, minLng: 11.1, maxLng: 18.6 }, // Congo
  UG: { minLat: -1.5, maxLat: 4.2, minLng: 29.6, maxLng: 35.0 }, // Uganda
  UA: { minLat: 44.4, maxLat: 52.4, minLng: 22.1, maxLng: 40.2 }, // Ucrânia
  CZ: { minLat: 48.6, maxLat: 51.1, minLng: 12.1, maxLng: 18.9 }, // República Tcheca
  SK: { minLat: 47.7, maxLat: 49.6, minLng: 16.8, maxLng: 22.6 }, // Eslováquia
  RS: { minLat: 42.2, maxLat: 46.2, minLng: 18.8, maxLng: 23 }, // Sérvia
  HR: { minLat: 42.4, maxLat: 46.6, minLng: 13.5, maxLng: 19.5 }, // Croácia
  BG: { minLat: 41.2, maxLat: 44.2, minLng: 22.4, maxLng: 28.6 }, // Bulgária
  IE: { minLat: 51.4, maxLat: 55.4, minLng: -10.5, maxLng: -6 }, // Irlanda
  TW: { minLat: 21.9, maxLat: 25.3, minLng: 120, maxLng: 122 }, // Taiwan
  HK: { minLat: 22.2, maxLat: 22.6, minLng: 113.8, maxLng: 114.4 }, // Hong Kong
  SG: { minLat: 1.1, maxLat: 1.5, minLng: 103.6, maxLng: 104.1 }, // Singapura
  IR: { minLat: 25.1, maxLat: 39.8, minLng: 44, maxLng: 63.3 }, // Irã
  IQ: { minLat: 29.1, maxLat: 37.4, minLng: 38.8, maxLng: 48.6 }, // Iraque
  LB: { minLat: 33.0, maxLat: 34.7, minLng: 35.1, maxLng: 36.6 }, // Líbano
  SY: { minLat: 32.3, maxLat: 37.3, minLng: 35.7, maxLng: 42.4 }, // Síria
  DZ: { minLat: 18.9, maxLat: 37.1, minLng: -8.7, maxLng: 12 }, // Argélia
  TN: { minLat: 30.2, maxLat: 37.6, minLng: 7.5, maxLng: 11.6 }, // Tunísia
  LY: { minLat: 19.5, maxLat: 33.2, minLng: 9.3, maxLng: 25.2 }, // Líbia
  BO: { minLat: -22.9, maxLat: -9.7, minLng: -69.6, maxLng: -57.5 }, // Bolívia
  PY: { minLat: -27.6, maxLat: -19.3, minLng: -62.6, maxLng: -54.3 }, // Paraguai
  UY: { minLat: -35.2, maxLat: -30.1, minLng: -58.5, maxLng: -53.1 }, // Uruguai
  CR: { minLat: 8.0, maxLat: 11.2, minLng: -87.0, maxLng: -82.5 }, // Costa Rica
  PA: { minLat: 7.2, maxLat: 9.6, minLng: -83.0, maxLng: -77.2 }, // Panamá
  GT: { minLat: 13.7, maxLat: 17.8, minLng: -92.2, maxLng: -88.2 }, // Guatemala
  HN: { minLat: 12.98, maxLat: 16.05, minLng: -89.4, maxLng: -83.1 }, // Honduras
  SV: { minLat: 13.1, maxLat: 14.4, minLng: -90.1, maxLng: -87.7 }, // El Salvador
  NI: { minLat: 10.7, maxLat: 15.0, minLng: -87.7, maxLng: -83.1 }, // Nicarágua
  DO: { minLat: 17.5, maxLat: 20.0, minLng: -72.0, maxLng: -68.3 }, // República Dominicana
  PR: { minLat: 17.9, maxLat: 18.5, minLng: -67.3, maxLng: -65.2 }, // Porto Rico
  CU: { minLat: 19.8, maxLat: 23.2, minLng: -84.9, maxLng: -74.1 }, // Cuba
  JM: { minLat: 17.7, maxLat: 18.5, minLng: -78.4, maxLng: -76.2 }, // Jamaica
  TT: { minLat: 10.0, maxLat: 11.4, minLng: -61.9, maxLng: -60.5 }, // Trinidad e Tobago
  CY: { minLat: 34.6, maxLat: 35.7, minLng: 32.3, maxLng: 34.6 }, // Chipre
  MT: { minLat: 35.8, maxLat: 36.1, minLng: 14.2, maxLng: 14.6 }, // Malta
  SI: { minLat: 45.4, maxLat: 46.9, minLng: 13.4, maxLng: 16.6 }, // Eslovênia
  BA: { minLat: 42.6, maxLat: 45.3, minLng: 15.7, maxLng: 19.6 }, // Bósnia e Herzegovina
  MK: { minLat: 40.9, maxLat: 42.4, minLng: 20.4, maxLng: 23.0 }, // Macedônia do Norte
  AL: { minLat: 39.6, maxLat: 42.7, minLng: 19.3, maxLng: 21.1 }, // Albânia
  MN: { minLat: 41.6, maxLat: 52.2, minLng: 87.7, maxLng: 119.9 }, // Mongólia
  KZ: { minLat: 40.6, maxLat: 55.4, minLng: 46.5, maxLng: 87.4 }, // Cazaquistão
  UZ: { minLat: 37.2, maxLat: 45.6, minLng: 56, maxLng: 73.2 }, // Uzbequistão
  AF: { minLat: 29.4, maxLat: 38.5, minLng: 60.5, maxLng: 74.9 }, // Afeganistão
  NP: { minLat: 26.4, maxLat: 30.4, minLng: 80.1, maxLng: 88.2 }, // Nepal
  MM: { minLat: 9.8, maxLat: 28.5, minLng: 92.2, maxLng: 101.2 }, // Mianmar
  KH: { minLat: 10.4, maxLat: 14.7, minLng: 102.3, maxLng: 107.6 }, // Camboja
  LA: { minLat: 13.9, maxLat: 22.5, minLng: 100.1, maxLng: 107.6 }, // Laos
  YE: { minLat: 12.6, maxLat: 19.0, minLng: 42.5, maxLng: 54.7 }, // Iêmen
  OM: { minLat: 16.6, maxLat: 26.4, minLng: 52.0, maxLng: 60.0 }, // Omã
  QA: { minLat: 24.5, maxLat: 26.2, minLng: 50.7, maxLng: 51.6 }, // Qatar
  KW: { minLat: 28.5, maxLat: 30.1, minLng: 46.5, maxLng: 48.4 }, // Kuwait
  BH: { minLat: 25.8, maxLat: 26.3, minLng: 50.4, maxLng: 50.6 }, // Bahrein
  JO: { minLat: 29.2, maxLat: 33.4, minLng: 34.9, maxLng: 39.3 }, // Jordânia
  PS: { minLat: 31.2, maxLat: 32.6, minLng: 34.2, maxLng: 35.6 }, // Palestina
  GE: { minLat: 41.1, maxLat: 43.6, minLng: 40.0, maxLng: 46.8 }, // Geórgia
  AM: { minLat: 38.8, maxLat: 41.3, minLng: 43.4, maxLng: 46.6 }, // Armênia
  AZ: { minLat: 38.4, maxLat: 41.9, minLng: 44.8, maxLng: 51.0 }, // Azerbaijão
  BY: { minLat: 51.3, maxLat: 56.2, minLng: 23.2, maxLng: 32.8 }, // Bielorrússia
  MD: { minLat: 45.5, maxLat: 48.5, minLng: 26.6, maxLng: 30.2 }, // Moldávia
  EE: { minLat: 57.5, maxLat: 59.7, minLng: 21.8, maxLng: 28.2 }, // Estônia
  LV: { minLat: 55.7, maxLat: 58.1, minLng: 21.0, maxLng: 28.2 }, // Letônia
  LT: { minLat: 53.9, maxLat: 56.5, minLng: 21.0, maxLng: 26.8 }, // Lituânia
  LU: { minLat: 49.4, maxLat: 50.2, minLng: 5.7, maxLng: 6.5 }, // Luxemburgo
  IS: { minLat: 63.4, maxLat: 66.5, minLng: -24.5, maxLng: -13.5 }, // Islândia
  ZW: { minLat: -22.4, maxLat: -15.6, minLng: 25.2, maxLng: 33.1 }, // Zimbábue
  ZM: { minLat: -18.1, maxLat: -8.2, minLng: 22.0, maxLng: 33.7 }, // Zâmbia
  MZ: { minLat: -26.9, maxLat: -10.5, minLng: 30.2, maxLng: 40.9 }, // Moçambique
  AO: { minLat: -18.0, maxLat: -4.4, minLng: 11.7, maxLng: 24.1 }, // Angola
  MG: { minLat: -25.6, maxLat: -11.9, minLng: 43.2, maxLng: 50.5 }, // Madagascar
  MU: { minLat: -20.5, maxLat: -19.9, minLng: 57.3, maxLng: 57.8 }, // Maurícia
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
 * Converte estação da API em RadioStation.
 * Pins no globo são posicionados pelo país de origem:
 * - Se a API envia geo_lat/geo_long: usa essas coordenadas após validar que estão dentro
 *   dos limites do país (countrycode/country da API); se fora, corrige para o centro do país.
 * - Se não há coordenadas: usa o centro do país a partir de countrycode/country da API.
 */
export function transformToRadioStation(
  apiStation: RadioBrowserStation,
  index: number
): RadioStation {
  let latitude = 0;
  let longitude = 0;
  const countryCode = normalizeCountryCode(apiStation.countrycode ?? '', apiStation.country ?? '');

  if (apiStation.geo_lat && apiStation.geo_long) {
    const lat = parseFloat(apiStation.geo_lat);
    const lng = parseFloat(apiStation.geo_long);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      latitude = lat;
      longitude = lng;
      const validated = validateAndCorrectCoordinates(latitude, longitude, apiStation.countrycode ?? '', apiStation.country ?? '');
      latitude = validated.lat;
      longitude = validated.lng;
    }
  }

  if (latitude === 0 && longitude === 0) {
    if (countryCode) {
      const countryCoords = getCountryCenter(countryCode);
      if (countryCoords.lat !== 0 || countryCoords.lng !== 0) {
        latitude = countryCoords.lat;
        longitude = countryCoords.lng;
      }
    }
    if (latitude === 0 && longitude === 0) {
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

/** Callback opcional: recebe lista acumulada de estações a cada lote (carregamento progressivo). */
export type OnStationsProgress = (stations: RadioStation[]) => void;

/**
 * Busca até totalLimit estações (ex.: 40k), sem teto por região.
 * Prioriza Brasil, EUA, UK e depois outros países; completa com busca global.
 * Usa paralelismo e onProgress para exibir estações aos poucos.
 */
export async function getPopularStationsPrioritized(
  totalLimit: number = 40000,
  priorityCountries: string[] = [
    'Brazil', 'United States of America', 'United Kingdom', // Nomes exatos da API Radio Browser
    'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Portugal', // Europa: 6 países
    'Canada', 'Australia', 'Mexico', 'Argentina', 'Colombia', // Américas: 5 países
    'Poland', 'Sweden', 'Norway', 'Denmark', 'Belgium', // Norte da Europa: 5 países
    'Japan', 'India', 'Indonesia', 'Philippines', 'South Korea', // Ásia: 5 países
    'Turkey', 'Greece', 'Czech Republic', 'Romania', 'Hungary' // Leste Europeu: 5 países
  ],
  onProgress?: OnStationsProgress
): Promise<RadioStation[]> {
  const CACHE_KEY = `radio_browser_stations_prioritized_cache_${totalLimit}`;
  const CACHE_TIMESTAMP_KEY = `radio_browser_stations_prioritized_timestamp_${totalLimit}`;
  const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 horas
  const PARALLEL_COUNTRIES = 5; // Países por grupo em paralelo

  const report = (stations: RadioStation[]) => {
    if (onProgress && stations.length > 0) onProgress(stations);
  };

  try {
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const cachedStations = localStorage.getItem(CACHE_KEY);
    if (cachedTimestamp && cachedStations) {
      const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
      if (cacheAge < CACHE_DURATION) {
        log(`Carregando ${totalLimit} estações do cache...`);
        const parsed = JSON.parse(cachedStations) as RadioStation[];
        report(parsed);
        return parsed;
      }
    }

    log(`Buscando até ${totalLimit} estações (paralelo em grupos de ${PARALLEL_COUNTRIES}, com paginação)...`);

    const allStations: RadioStation[] = [];
    const includedStationIds = new Set<string>();

    const primaryCountries = priorityCountries.slice(0, 3);
    const primaryLimits = [
      Math.floor(totalLimit * 0.2),  // Brasil: 20% (ex.: 8000 para 40k)
      Math.floor(totalLimit * 0.1),  // EUA: 10%
      Math.floor(totalLimit * 0.08), // UK: 8%
    ];

    // Fase 1: 3 países principais em paralelo, com paginação até atingir as cotas
    const primaryPromises = primaryCountries.map((country, i) =>
      getStationsByCountryNamePaginated(country, primaryLimits[i] ?? Math.floor(totalLimit * 0.1))
    );
    const primaryResults = await Promise.all(primaryPromises);

    for (let i = 0; i < primaryResults.length; i++) {
      const limit = primaryLimits[i] ?? Math.floor(totalLimit * 0.1);
      const countryStations = primaryResults[i] || [];
      const working = countryStations.filter((s) => s.lastcheckok === 1);
      const transformed = working
        .filter((s) => !includedStationIds.has(s.stationuuid))
        .slice(0, limit)
        .map((s, idx) => {
          includedStationIds.add(s.stationuuid);
          return transformToRadioStation(s, allStations.length + idx);
        });
      allStations.push(...transformed);
      log(`✓ ${primaryCountries[i]}: ${transformed.length} estações`);
      report(allStations); // Report após cada país da Fase 1 → primeira tela mais rápida (~8k, ~12k, ~15k)
    }

    // Fase 2: países secundários em grupos paralelos (sem teto; preenche até totalLimit)
    const secondaryCountries = priorityCountries.slice(3);
    const remainingSlots = Math.max(0, totalLimit - allStations.length);
    const stationsPerCountry = secondaryCountries.length
      ? Math.floor(remainingSlots / secondaryCountries.length)
      : 0;

    for (let g = 0; g < secondaryCountries.length; g += PARALLEL_COUNTRIES) {
      if (allStations.length >= totalLimit) break;
      const chunk = secondaryCountries.slice(g, g + PARALLEL_COUNTRIES);
      const chunkPromises = chunk.map((country) =>
        getStationsByCountryNamePaginated(country, Math.min(stationsPerCountry + 200, totalLimit - allStations.length))
      );
      const chunkResults = await Promise.all(chunkPromises);

      for (let i = 0; i < chunkResults.length; i++) {
        if (allStations.length >= totalLimit) break;
        const countryStations = chunkResults[i] || [];
        const working = countryStations.filter((s) => s.lastcheckok === 1);
        const availableSlots = totalLimit - allStations.length;
        const batch = working
          .filter((s) => !includedStationIds.has(s.stationuuid))
          .slice(0, Math.min(availableSlots, stationsPerCountry));
        const transformed = batch.map((s, idx) => {
          includedStationIds.add(s.stationuuid);
          return transformToRadioStation(s, allStations.length + idx);
        });
        allStations.push(...transformed);
        log(`✓ ${chunk[i]}: ${transformed.length} estações`);
      }
      report(allStations);
    }

    // Fase 3: completar com estações globais populares em lotes (offset/limit) até totalLimit
    let remaining = totalLimit - allStations.length;
    if (remaining > 0) {
      try {
        log(`Buscando até ${remaining} estações globais populares (paginação)...`);
        let globalOffset = 0;
        let addedGlobal = 0;
        while (remaining > 0) {
          const batchSize = Math.min(STATIONS_BATCH_SIZE, remaining + 200);
          const globalBatch = await apiRequest<RadioBrowserStation[]>(
            `/json/stations/search?hidebroken=true&limit=${batchSize}&offset=${globalOffset}&order=votes&reverse=true`
          );
          const working = globalBatch.filter((s) => s.lastcheckok === 1);
          const batch = working
            .filter((s) => !includedStationIds.has(s.stationuuid))
            .slice(0, remaining);
          const transformed = batch.map((s, idx) => {
            includedStationIds.add(s.stationuuid);
            return transformToRadioStation(s, allStations.length + idx);
          });
          allStations.push(...transformed);
          addedGlobal += transformed.length;
          remaining = totalLimit - allStations.length;
          globalOffset += globalBatch.length;
          if (globalBatch.length < batchSize) break;
        }
        log(`✓ Global: ${addedGlobal} estações`);
      } catch (e) {
        logWarn('Erro ao buscar estações globais:', e);
      }
      report(allStations);
    }

    const validStations = allStations.filter(
      (radio) =>
        !isNaN(radio.latitude) &&
        !isNaN(radio.longitude) &&
        radio.latitude >= -90 &&
        radio.latitude <= 90 &&
        radio.longitude >= -180 &&
        radio.longitude <= 180
    );

    const uniqueStations = validStations.filter(
      (station, index, self) => index === self.findIndex((s) => s.id === station.id)
    );

    log(`Total de ${uniqueStations.length} estações priorizadas processadas`);

    localStorage.setItem(CACHE_KEY, JSON.stringify(uniqueStations));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    report(uniqueStations);
    return uniqueStations;
  } catch (error) {
    logError('Erro ao buscar estações priorizadas:', error);
    const cachedStations = localStorage.getItem(CACHE_KEY);
    if (cachedStations) {
      log('Usando cache expirado como fallback...');
      const parsed = JSON.parse(cachedStations) as RadioStation[];
      report(parsed);
      return parsed;
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
