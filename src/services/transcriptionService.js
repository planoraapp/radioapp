import API_CONFIG from '../config/apiConfig.js';

// Serviço de Transcrição Híbrido com APIs Gratuitas
class TranscriptionService {
  constructor() {
    this.currentProvider = null;
    this.isInitialized = false;
    this.webSpeechRecognition = null;
  }

  // Inicializar Web Speech API (sempre disponível)
  initializeWebSpeech() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.webSpeechRecognition = new SpeechRecognition();
      this.webSpeechRecognition.continuous = true;
      this.webSpeechRecognition.interimResults = true;
      this.webSpeechRecognition.lang = 'pt-BR';

      return true;
    }
    return false;
  }

  // Transcrição com Web Speech API (gratuito e offline)
  async transcribeWithWebSpeech(onResult, onEnd) {
    return new Promise((resolve, reject) => {
      if (!this.webSpeechRecognition) {
        reject(new Error('Web Speech API não disponível'));
        return;
      }

      let finalTranscript = '';
      let interimTranscript = '';

      this.webSpeechRecognition.onstart = () => {
        console.log('🎤 Web Speech: Iniciando gravação...');
      };

      this.webSpeechRecognition.onresult = (event) => {
        finalTranscript = '';
        interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        onResult(finalTranscript, interimTranscript);
      };

      this.webSpeechRecognition.onend = () => {
        console.log('🎤 Web Speech: Gravação finalizada');
        onEnd();
        resolve(finalTranscript);
      };

      this.webSpeechRecognition.onerror = (event) => {
        console.error('Erro Web Speech:', event.error);
        reject(new Error(`Erro na transcrição: ${event.error}`));
      };

      this.webSpeechRecognition.start();
    });
  }

  // Transcrição com OpenAI Whisper (gratuito por $18)
  async transcribeWithOpenAI(audioBlob) {
    if (!API_CONFIG.OPENAI.API_KEY) {
      throw new Error('API key do OpenAI não configurada');
    }

    console.log('🎯 OpenAI: Iniciando transcrição...');

    const formData = new FormData();
    formData.append('file', audioBlob);
    formData.append('model', API_CONFIG.OPENAI.MODELS.TRANSCRIPTION);
    formData.append('language', 'pt');
    formData.append('response_format', 'json');

    const response = await fetch(`${API_CONFIG.OPENAI.BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.OPENAI.API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro OpenAI: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ OpenAI: Transcrição concluída');
    return result.text;
  }

  // Transcrição com Google Speech (60 min gratuitos/mês)
  async transcribeWithGoogle(audioBlob) {
    if (!API_CONFIG.GOOGLE_SPEECH.API_KEY) {
      throw new Error('API key do Google Speech não configurada');
    }

    console.log('🎯 Google Speech: Iniciando transcrição...');

    // Converter blob para base64
    const audioBytes = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBytes)));

    const requestBody = {
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 16000,
        languageCode: 'pt-BR',
        enableAutomaticPunctuation: true,
        model: 'latest_long'
      },
      audio: {
        content: base64Audio
      }
    };

    const response = await fetch(`${API_CONFIG.GOOGLE_SPEECH.BASE_URL}/speech:recognize?key=${API_CONFIG.GOOGLE_SPEECH.API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro Google Speech: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();

    if (!result.results || result.results.length === 0) {
      throw new Error('Nenhum resultado de transcrição encontrado');
    }

    const transcription = result.results
      .map(result => result.alternatives[0].transcript)
      .join(' ');

    console.log('✅ Google Speech: Transcrição concluída');
    return transcription;
  }

  // Transcrição com Hugging Face (gratuito ilimitado)
  async transcribeWithHuggingFace(audioBlob) {
    console.log('🎯 Hugging Face: Iniciando transcrição...');

    const formData = new FormData();
    formData.append('inputs', audioBlob);

    const headers = {};
    if (API_CONFIG.HUGGINGFACE.API_KEY) {
      headers['Authorization'] = `Bearer ${API_CONFIG.HUGGINGFACE.API_KEY}`;
    }

    const response = await fetch(`${API_CONFIG.HUGGINGFACE.BASE_URL}/${API_CONFIG.HUGGINGFACE.MODELS.SPEECH_TO_TEXT}`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro Hugging Face: ${error}`);
    }

    const result = await response.json();

    if (Array.isArray(result) && result.length > 0) {
      console.log('✅ Hugging Face: Transcrição concluída');
      return result[0].text;
    }

    throw new Error('Formato de resposta inesperado do Hugging Face');
  }

  // Método principal de transcrição com fallback
  async transcribe(audioBlob, options = {}) {
    const { provider = 'auto', onProgress } = options;
    const providers = API_CONFIG.SETTINGS.FALLBACK_ORDER;

    for (const currentProvider of providers) {
      try {
        console.log(`🔄 Tentando transcrição com ${currentProvider}...`);

        let result;

        switch (currentProvider) {
          case 'WEB_SPEECH':
            if (!audioBlob) {
              // Para Web Speech, retornamos o objeto de controle
              return {
                type: 'WEBSPEECH_CONTROL',
                recognition: this.webSpeechRecognition
              };
            }
            continue; // Web Speech funciona diferente

          case 'OPENAI':
            result = await this.transcribeWithOpenAI(audioBlob);
            break;

          case 'GOOGLE':
            result = await this.transcribeWithGoogle(audioBlob);
            break;

          case 'HUGGINGFACE':
            result = await this.transcribeWithHuggingFace(audioBlob);
            break;

          default:
            continue;
        }

        if (result && result.trim()) {
          this.currentProvider = currentProvider;
          console.log(`✅ Transcrição bem-sucedida com ${currentProvider}`);
          return {
            text: result.trim(),
            provider: currentProvider,
            confidence: 0.9 // Estimativa
          };
        }

      } catch (error) {
        console.warn(`❌ Falha com ${currentProvider}:`, error.message);
        continue;
      }
    }

    throw new Error('Todas as APIs de transcrição falharam. Verifique sua conexão e chaves de API.');
  }

  // Parar transcrição ativa
  stopTranscription() {
    if (this.webSpeechRecognition) {
      this.webSpeechRecognition.stop();
    }
  }

  // Verificar status das APIs
  async getStatus() {
    const status = {
      webSpeech: this.initializeWebSpeech(),
      openai: !!API_CONFIG.OPENAI.API_KEY,
      google: !!API_CONFIG.GOOGLE_SPEECH.API_KEY,
      huggingface: !!API_CONFIG.HUGGINGFACE.API_KEY
    };

    return status;
  }
}

export default new TranscriptionService();