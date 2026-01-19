// Configuração das APIs gratuitas para teste
export const API_CONFIG = {
  // OpenAI - $18 gratuitos para novos usuários
  OPENAI: {
    API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
    BASE_URL: 'https://api.openai.com/v1',
    MODELS: {
      TRANSCRIPTION: 'whisper-1',
      PROCESSING: 'gpt-3.5-turbo'
    }
  },

  // Google Cloud Speech - 60 minutos gratuitos por mês
  GOOGLE_SPEECH: {
    API_KEY: import.meta.env.VITE_GOOGLE_SPEECH_KEY || '',
    BASE_URL: 'https://speech.googleapis.com/v1',
    PROJECT_ID: 'your-project-id' // Para Google Cloud
  },

  // Hugging Face - Gratuito e ilimitado
  HUGGINGFACE: {
    API_KEY: import.meta.env.VITE_HUGGINGFACE_API_KEY || '',
    BASE_URL: 'https://api-inference.huggingface.co/models',
    MODELS: {
      SPEECH_TO_TEXT: 'openai/whisper-small',
      TEXT_PROCESSING: 'mistralai/Mistral-7B-Instruct-v0.1'
    }
  },

  // Configurações gerais
  SETTINGS: {
    USE_LOCAL_MODELS: import.meta.env.VITE_USE_LOCAL_MODELS === 'true',
    FALLBACK_ORDER: ['WEB_SPEECH', 'OPENAI', 'GOOGLE', 'HUGGINGFACE'],
    MAX_RETRIES: 3,
    TIMEOUT: 30000
  }
};

// Função para verificar disponibilidade das APIs
export const checkAPIAvailability = async () => {
  const results = {
    webSpeech: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    openai: !!API_CONFIG.OPENAI.API_KEY,
    google: !!API_CONFIG.GOOGLE_SPEECH.API_KEY,
    huggingface: !!API_CONFIG.HUGGINGFACE.API_KEY
  };

  console.log('Disponibilidade das APIs:', results);
  return results;
};

export default API_CONFIG;