import API_CONFIG from '../config/apiConfig.js';

// Serviço de Processamento Pós-Finalização com APIs Gratuitas
class ProcessingService {
  constructor() {
    this.currentProvider = null;
  }

  // Carregar dados médicos para contexto
  async loadMedicalContext() {
    try {
      const response = await fetch('/src/data/medical_training_data.json');
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Erro ao carregar contexto médico:', error);
      return null;
    }
  }

  // Gerar resumo médico com OpenAI (gratuito por $18)
  async generateSummaryWithOpenAI(text, specialty = 'geral') {
    if (!API_CONFIG.OPENAI.API_KEY) {
      throw new Error('API key do OpenAI não configurada');
    }

    console.log('🧠 OpenAI: Gerando resumo médico...');

    const medicalContext = await this.loadMedicalContext();

    const systemPrompt = `Você é um assistente médico brasileiro especializado em ${specialty}.
Use este contexto médico brasileiro para melhorar sua compreensão:
${medicalContext ? JSON.stringify(medicalContext, null, 2) : 'Dados médicos não disponíveis'}

INSTRUÇÕES PARA RESUMO:
- Crie um resumo conciso mas completo da consulta
- Estruture em seções: Queixa Principal, História, Exame Físico, Diagnóstico, Conduta
- Use linguagem médica profissional brasileira
- Mantenha informações críticas (medicamentos, dosagens, diagnósticos)
- Seja objetivo e claro
- Formate com markdown para melhor legibilidade`;

    const response = await fetch(`${API_CONFIG.OPENAI.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.OPENAI.API_KEY}`
      },
      body: JSON.stringify({
        model: API_CONFIG.OPENAI.MODELS.PROCESSING,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Transcrição da consulta médica:\n\n${text}\n\nPor favor, gere um resumo estruturado profissional.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro OpenAI: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const summary = result.choices[0].message.content;

    console.log('✅ OpenAI: Resumo gerado');
    return {
      summary,
      provider: 'OpenAI',
      tokens: result.usage?.total_tokens || 0
    };
  }

  // Gerar resumo com Google Gemini (60 consultas/dia gratuito)
  async generateSummaryWithGemini(text, specialty = 'geral') {
    if (!API_CONFIG.GOOGLE_SPEECH.API_KEY) {
      throw new Error('API key do Google não configurada');
    }

    console.log('🧠 Google Gemini: Gerando resumo médico...');

    const medicalContext = await this.loadMedicalContext();

    const prompt = `Você é um assistente médico brasileiro especializado em ${specialty}.

Contexto médico brasileiro:
${medicalContext ? JSON.stringify(medicalContext, null, 2) : 'Dados médicos não disponíveis'}

ANÁLISE ESTA TRANSCRIÇÃO MÉDICA:

${text}

Gere um resumo estruturado profissional contendo:
1. **QUEIXA PRINCIPAL**: Sintomas principais relatados
2. **HISTÓRIA**: Antecedentes relevantes
3. **EXAME FÍSICO**: Achados importantes
4. **DIAGNÓSTICO**: Hipóteses diagnósticas
5. **CONDUTA**: Plano terapêutico e orientações

Use linguagem médica profissional brasileira. Seja conciso mas completo.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_CONFIG.GOOGLE_SPEECH.API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1500
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro Google Gemini: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();

    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('Nenhuma resposta gerada pelo Gemini');
    }

    const summary = result.candidates[0].content.parts[0].text;

    console.log('✅ Google Gemini: Resumo gerado');
    return {
      summary,
      provider: 'Google Gemini',
      tokens: 0 // Gemini não retorna uso de tokens
    };
  }

  // Gerar resumo com Hugging Face (gratuito ilimitado)
  async generateSummaryWithHuggingFace(text, specialty = 'geral') {
    console.log('🧠 Hugging Face: Gerando resumo médico...');

    const medicalContext = await this.loadMedicalContext();

    const prompt = `<s>[INST] Você é um assistente médico brasileiro especializado em ${specialty}.

Contexto médico brasileiro:
${medicalContext ? JSON.stringify(medicalContext, null, 2) : 'Dados médicos não disponíveis'}

Analise esta transcrição médica e gere um resumo estruturado profissional:

${text}

Estrutura o resumo com:
- QUEIXA PRINCIPAL
- HISTÓRIA CLÍNICA
- EXAME FÍSICO
- DIAGNÓSTICO
- CONDUTA

Use linguagem médica profissional brasileira. [/INST]`;

    const headers = {
      'Content-Type': 'application/json'
    };

    if (API_CONFIG.HUGGINGFACE.API_KEY) {
      headers['Authorization'] = `Bearer ${API_CONFIG.HUGGINGFACE.API_KEY}`;
    }

    const response = await fetch(`${API_CONFIG.HUGGINGFACE.BASE_URL}/${API_CONFIG.HUGGINGFACE.MODELS.TEXT_PROCESSING}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1500,
          temperature: 0.3,
          do_sample: true,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro Hugging Face: ${error}`);
    }

    const result = await response.json();

    let summary;
    if (Array.isArray(result) && result.length > 0) {
      summary = result[0].generated_text;
    } else if (result.generated_text) {
      summary = result.generated_text;
    } else {
      throw new Error('Formato de resposta inesperado do Hugging Face');
    }

    console.log('✅ Hugging Face: Resumo gerado');
    return {
      summary,
      provider: 'Hugging Face',
      tokens: 0
    };
  }

  // Método principal de processamento com fallback
  async generateSummary(text, options = {}) {
    const { specialty = 'geral', provider = 'auto' } = options;
    const providers = ['OPENAI', 'GEMINI', 'HUGGINGFACE'];

    if (!text || text.trim().length < 10) {
      throw new Error('Texto muito curto para gerar resumo');
    }

    for (const currentProvider of providers) {
      try {
        console.log(`🔄 Tentando processamento com ${currentProvider}...`);

        let result;

        switch (currentProvider) {
          case 'OPENAI':
            result = await this.generateSummaryWithOpenAI(text, specialty);
            break;

          case 'GEMINI':
            result = await this.generateSummaryWithGemini(text, specialty);
            break;

          case 'HUGGINGFACE':
            result = await this.generateSummaryWithHuggingFace(text, specialty);
            break;

          default:
            continue;
        }

        if (result && result.summary && result.summary.trim()) {
          this.currentProvider = currentProvider;
          console.log(`✅ Processamento bem-sucedido com ${currentProvider}`);
          return result;
        }

      } catch (error) {
        console.warn(`❌ Falha com ${currentProvider}:`, error.message);
        continue;
      }
    }

    // Fallback: gerar resumo básico local
    console.log('🔄 Fallback: Gerando resumo básico local...');
    const basicSummary = this.generateBasicSummary(text, specialty);

    return {
      summary: basicSummary,
      provider: 'Basic Local',
      tokens: 0
    };
  }

  // Fallback: resumo básico local (sempre funciona)
  generateBasicSummary(text, specialty) {
    const sections = {
      queixa: this.extractSection(text, ['queixa', 'sintoma', 'dor', 'problema']),
      historia: this.extractSection(text, ['história', 'antecedente', 'desde', 'quando']),
      exame: this.extractSection(text, ['exame', 'pressão', 'temperatura', 'ausculta']),
      diagnostico: this.extractSection(text, ['diagnóstico', 'hipótese', 'parece', 'suspeita']),
      conduta: this.extractSection(text, ['conduta', 'tratamento', 'medicamento', 'receita'])
    };

    return `## RESUMO DA CONSULTA (${specialty.toUpperCase()})

### QUEIXA PRINCIPAL
${sections.queixa || 'Não identificado na transcrição'}

### HISTÓRIA CLÍNICA
${sections.historia || 'Não identificado na transcrição'}

### EXAME FÍSICO
${sections.exame || 'Não identificado na transcrição'}

### DIAGNÓSTICO
${sections.diagnostico || 'Não identificado na transcrição'}

### CONDUTA
${sections.conduta || 'Não identificado na transcrição'}

---
*Resumo gerado automaticamente. Recomenda-se revisão profissional.*`;
  }

  // Extrair seções do texto
  extractSection(text, keywords) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const relevant = sentences.filter(sentence =>
      keywords.some(keyword =>
        sentence.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    return relevant.length > 0 ? relevant.join('. ').trim() + '.' : null;
  }

  // Verificar status das APIs
  async getStatus() {
    const status = {
      openai: !!API_CONFIG.OPENAI.API_KEY,
      gemini: !!API_CONFIG.GOOGLE_SPEECH.API_KEY,
      huggingface: !!API_CONFIG.HUGGINGFACE.API_KEY
    };

    return status;
  }
}

export default new ProcessingService();