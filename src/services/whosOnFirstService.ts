/**
 * Serviço para integração com a API Who's On First
 * https://whosonfirst.org - Gazetteer de lugares do mundo
 */

interface WhoOnFirstPlace {
  id: number;
  name: string;
  placetype: string;
  lat: number;
  lon: number;
  country?: string;
  country_iso?: string;
  hierarchy?: {
    continent_id?: number;
    country_id?: number;
    region_id?: number;
    locality_id?: number;
  };
}

interface WhoOnFirstSearchResponse {
  places: WhoOnFirstPlace[];
}

// Cache local para reduzir requisições à API
const locationCache = new Map<string, { lat: number; lng: number }>();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

// Cache com timestamp
interface CachedLocation {
  coordinates: { lat: number; lng: number };
  timestamp: number;
}

const locationCacheWithTimestamp = new Map<string, CachedLocation>();

/**
 * Busca coordenadas de um lugar usando Who's On First API
 * @param city Nome da cidade
 * @param country Nome do país (opcional)
 * @param countryCode Código ISO do país (opcional, mais preciso)
 * @returns Coordenadas {lat, lng} ou null se não encontrar
 */
export async function searchPlace(
  city?: string,
  country?: string,
  countryCode?: string
): Promise<{ lat: number; lng: number } | null> {
  // Se não tiver cidade, não fazer busca
  if (!city || city.trim() === '' || city === 'Unknown') {
    return null;
  }

  // Criar chave de cache
  const cacheKey = `${city.toLowerCase()}_${countryCode?.toLowerCase() || country?.toLowerCase() || ''}`;
  
  // Verificar cache
  const cached = locationCacheWithTimestamp.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.debug(`Cache hit para ${cacheKey}`);
    return cached.coordinates;
  }

  // Construir query para Who's On First API
  // A API Who's On First usa o endpoint de busca
  // Docs: https://whosonfirst.org/docs/api/
  
  // Primeiro tentar buscar por cidade + país
  let query = '';
  if (city) {
    query = city;
    if (countryCode || country) {
      query += `, ${countryCode || country}`;
    }
  } else {
    return null;
  }

  try {
    // Usar API REST do Who's On First
    // Endpoint: https://places.whosonfirst.org/api/rest/?method=whosonfirst.places.search
    // Nota: A API pública pode precisar de access token, vamos usar método alternativo
    
    // Alternativa: usar o serviço de geocodificação via Nominatim (OpenStreetMap)
    // que tem dados baseados em Who's On First
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'RadioGlobe/1.0 (radio-app)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Erro ao buscar ${query} via Nominatim: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      const place = data[0];
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        const coordinates = { lat, lng: lon };
        
        // Salvar no cache
        locationCacheWithTimestamp.set(cacheKey, {
          coordinates,
          timestamp: Date.now(),
        });
        
        // Também salvar no cache simples para acesso rápido
        locationCache.set(cacheKey, coordinates);
        
        console.debug(`Coordenadas encontradas para ${query}: ${lat}, ${lon}`);
        return { lat, lng: lon };
      }
    }

    return null;
  } catch (error) {
    console.warn(`Erro ao buscar lugar "${query}" no Who's On First:`, error);
    return null;
  }
}

/**
 * Busca coordenadas de uma cidade específica com país
 * Versão otimizada para busca em lote
 */
export async function searchCity(
  cityName: string,
  stateName: string | null,
  countryName: string,
  countryCode: string
): Promise<{ lat: number; lng: number } | null> {
  // Tentar buscar com estado primeiro (mais preciso)
  if (stateName && stateName !== 'Unknown') {
    const coords = await searchPlace(`${cityName}, ${stateName}`, countryName, countryCode);
    if (coords) return coords;
  }
  
  // Se não encontrar, buscar só cidade + país
  return searchPlace(cityName, countryName, countryCode);
}

/**
 * Limpa o cache de localizações (útil para testes ou atualizações)
 */
export function clearLocationCache(): void {
  locationCache.clear();
  locationCacheWithTimestamp.clear();
}

/**
 * Obtém estatísticas do cache
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: locationCache.size,
    keys: Array.from(locationCache.keys()),
  };
}
