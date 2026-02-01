// Coordenadas centrais (latitude, longitude) por código de país (ISO 3166-1 alpha-2)
// Usado como fallback quando a API retorna coordenadas inválidas (0,0) ou no mar.

export const COUNTRY_CENTERS: Record<string, [number, number]> = {
    // África
    'NA': [-22.5, 17.0],   // Namíbia
    'ZA': [-29.0, 24.0],   // África do Sul
    'NG': [9.08, 8.67],    // Nigéria
    'EG': [26.8, 30.8],    // Egito
    'KE': [1.29, 36.8],    // Quênia
    'MA': [31.79, -7.09],  // Marrocos
    'GH': [7.95, -1.02],   // Gana
    'TZ': [-6.36, 34.88],  // Tanzânia
    'DZ': [28.0, 3.0],     // Argélia
    'AO': [-11.2, 17.87],  // Angola

    // Américas
    'BR': [-14.2, -51.9],  // Brasil
    'US': [37.09, -95.7],  // Estados Unidos
    'CA': [56.13, -106.3], // Canadá
    'MX': [23.63, -102.5], // México
    'AR': [-38.4, -63.6],  // Argentina
    'CO': [4.57, -74.29],  // Colômbia
    'PE': [-9.19, -75.0],  // Peru
    'VE': [6.42, -66.58],  // Venezuela
    'CL': [-35.67, -71.5], // Chile
    'UY': [-32.52, -55.7], // Uruguai

    // Europa
    'DE': [51.16, 10.45],  // Alemanha
    'FR': [46.22, 2.21],   // França
    'GB': [55.37, -3.43],  // Reino Unido
    'IT': [41.87, 12.56],  // Itália
    'ES': [40.46, -3.74],  // Espanha
    'PT': [39.39, -8.22],  // Portugal
    'NL': [52.13, 5.29],   // Holanda
    'BE': [50.50, 4.46],   // Bélgica
    'CH': [46.81, 8.22],   // Suíça
    'SE': [60.12, 18.64],  // Suécia
    'NO': [60.47, 8.46],   // Noruega
    'FI': [61.92, 25.74],  // Finlândia
    'PL': [51.91, 19.14],  // Polônia
    'UA': [48.37, 31.16],  // Ucrânia
    'RU': [61.52, 105.3],  // Rússia

    // Ásia
    'CN': [35.86, 104.1],  // China
    'IN': [20.59, 78.96],  // Índia
    'JP': [36.20, 138.2],  // Japão
    'KR': [35.90, 127.7],  // Coreia do Sul
    'ID': [-0.78, 113.9],  // Indonésia
    'TR': [38.96, 35.24],  // Turquia
    'SA': [23.88, 45.07],  // Arábia Saudita
    'TH': [15.87, 100.9],  // Tailândia
    'VN': [14.05, 108.2],  // Vietnã
    'PH': [12.87, 121.7],  // Filipinas

    // Oceania
    'AU': [-25.27, 133.7], // Austrália
    'NZ': [-40.90, 174.8], // Nova Zelândia
};
