// Utilitários para integração dos dados de treinamento da IA
import trainingData from './medical_training_data.json';

/**
 * Classe principal para acessar e utilizar os dados de treinamento
 */
export class MedicalTrainingData {
  constructor() {
    this.data = trainingData;
  }

  /**
   * Busca informações sobre um medicamento específico
   * @param {string} medicationName - Nome do medicamento a buscar
   * @returns {object|null} Informações do medicamento ou null se não encontrado
   */
  findMedication(medicationName) {
    const normalizedName = medicationName.toLowerCase().trim();

    // Buscar em todas as categorias de medicamentos
    for (const category of Object.values(this.data.sections.medications.categories)) {
      for (const med of category) {
        // Verificar nome principal
        if (med.nome.toLowerCase().includes(normalizedName)) {
          return med;
        }

        // Verificar nomes comerciais
        if (med.nomes_comerciais.some(commercial =>
          commercial.toLowerCase().includes(normalizedName)
        )) {
          return med;
        }
      }
    }

    return null;
  }

  /**
   * Verifica se um nome é brasileiro comum
   * @param {string} name - Nome a verificar
   * @returns {object} Informações sobre o nome
   */
  validateBrazilianName(name) {
    const normalizedName = name.toLowerCase().trim();

    const result = {
      isValid: false,
      suggestions: [],
      type: null
    };

    // Verificar nomes masculinos
    const maleMatch = this.data.sections.brazilian_names.first_names_masculine
      .find(n => n.toLowerCase().includes(normalizedName));

    if (maleMatch) {
      result.isValid = true;
      result.type = 'masculino';
      result.suggestions.push(maleMatch);
    }

    // Verificar nomes femininos
    const femaleMatch = this.data.sections.brazilian_names.first_names_feminine
      .find(n => n.toLowerCase().includes(normalizedName));

    if (femaleMatch) {
      result.isValid = true;
      result.type = 'feminino';
      result.suggestions.push(femaleMatch);
    }

    // Verificar sobrenomes
    const surnameMatch = this.data.sections.brazilian_names.surnames
      .find(n => n.toLowerCase().includes(normalizedName));

    if (surnameMatch) {
      result.isValid = true;
      result.type = result.type ? `${result.type} + sobrenome` : 'sobrenome';
      result.suggestions.push(surnameMatch);
    }

    // Verificar variações comuns
    for (const [correct, variations] of Object.entries(this.data.sections.brazilian_names.common_variations)) {
      if (variations.some(v => v.toLowerCase() === normalizedName)) {
        result.isValid = true;
        result.suggestions.push(correct);
        break;
      }
    }

    return result;
  }

  /**
   * Busca termos médicos por especialidade
   * @param {string} specialty - Especialidade médica
   * @returns {array} Lista de termos da especialidade
   */
  getMedicalTermsBySpecialty(specialty) {
    const normalizedSpecialty = specialty.toLowerCase().trim();

    // Mapear termos comuns para especialidades
    const specialtyMap = {
      'cardio': 'cardiologia',
      'cardíaca': 'cardiologia',
      'coração': 'cardiologia',
      'cardiológica': 'cardiologia',
      'orto': 'ortopedia',
      'ossos': 'ortopedia',
      'ortopédica': 'ortopedia',
      'gineco': 'ginecologia',
      'mulher': 'ginecologia',
      'ginecológica': 'ginecologia',
      'pediatra': 'pediatria',
      'criança': 'pediatria',
      'pediátrica': 'pediatria',
      'pele': 'dermatologia',
      'dermatológica': 'dermatologia',
      'dermato': 'dermatologia',
      'olho': 'oftalmologia',
      'vista': 'oftalmologia',
      'oftálmica': 'oftalmologia',
      'ouvido': 'otorrinolaringologia',
      'orelha': 'otorrinolaringologia',
      'nariz': 'otorrinolaringologia',
      'garganta': 'otorrinolaringologia',
      'otorrino': 'otorrinolaringologia',
      'mental': 'psiquiatria',
      'psiquiátrica': 'psiquiatria',
      'psi': 'psiquiatria'
    };

    const mappedSpecialty = specialtyMap[normalizedSpecialty] || normalizedSpecialty;

    return this.data.sections.medical_terms.specialties[mappedSpecialty] || [];
  }

  /**
   * Busca cirurgias por termo
   * @param {string} searchTerm - Termo de busca
   * @returns {array} Lista de cirurgias relacionadas
   */
  findSurgeries(searchTerm) {
    const normalizedTerm = searchTerm.toLowerCase().trim();

    return this.data.sections.medical_terms.surgeries
      .filter(surgery => surgery.toLowerCase().includes(normalizedTerm));
  }

  /**
   * Expande abreviações médicas
   * @param {string} abbreviation - Abreviação a expandir
   * @returns {string|null} Significado completo ou null se não encontrado
   */
  expandAbbreviation(abbreviation) {
    const normalizedAbbr = abbreviation.toUpperCase().trim();

    // Buscar em abreviações comuns
    const commonAbbr = this.data.sections.medical_terms.abbreviations.common
      .find(abbr => abbr.startsWith(`${normalizedAbbr} (`));

    if (commonAbbr) {
      return commonAbbr;
    }

    // Buscar em abreviações médicas
    const medicalAbbr = this.data.sections.medical_terms.abbreviations.medical
      .find(abbr => abbr.startsWith(`${normalizedAbbr} (`));

    return medicalAbbr || null;
  }

  /**
   * Obtém regras de contexto para um tipo específico
   * @param {string} contextType - Tipo de contexto ('medication', 'name', 'medical')
   * @returns {array} Lista de regras de contexto
   */
  getContextRules(contextType) {
    const rulesMap = {
      'medication': 'medication_context',
      'name': 'name_context',
      'medical': 'medical_context'
    };

    const ruleKey = rulesMap[contextType];
    return ruleKey ? this.data.context_rules[ruleKey] : [];
  }

  /**
   * Obtém regras de transcrição
   * @param {string} ruleType - Tipo de regra ('spelling', 'context', 'formatting')
   * @returns {object} Regras de transcrição
   */
  getTranscriptionRules(ruleType) {
    return this.data.transcription_rules[ruleType] || {};
  }

  /**
   * Busca sintomas por termo
   * @param {string} searchTerm - Termo de busca
   * @returns {array} Lista de sintomas relacionados
   */
  findSymptoms(searchTerm) {
    const normalizedTerm = searchTerm.toLowerCase().trim();

    return this.data.sections.medical_terms.symptoms
      .filter(symptom => symptom.toLowerCase().includes(normalizedTerm));
  }

  /**
   * Busca exames diagnósticos por termo
   * @param {string} searchTerm - Termo de busca
   * @returns {array} Lista de exames relacionados
   */
  findDiagnostics(searchTerm) {
    const normalizedTerm = searchTerm.toLowerCase().trim();

    return this.data.sections.medical_terms.diagnostics
      .filter(diagnostic => diagnostic.toLowerCase().includes(normalizedTerm));
  }

  /**
   * Valida e corrige texto médico baseado nos dados de treinamento
   * @param {string} text - Texto a ser validado/corrigido
   * @returns {object} Resultado com sugestões de correção
   */
  validateAndCorrect(text) {
    const result = {
      original: text,
      corrections: [],
      suggestions: [],
      confidence: 0
    };

    const words = text.split(/\s+/);

    words.forEach((word, index) => {
      // Verificar medicamentos
      const medication = this.findMedication(word);
      if (medication) {
        result.suggestions.push({
          type: 'medication',
          position: index,
          original: word,
          suggestion: medication.nome,
          details: medication
        });
      }

      // Verificar nomes brasileiros
      const nameValidation = this.validateBrazilianName(word);
      if (nameValidation.isValid && nameValidation.suggestions.length > 0) {
        result.suggestions.push({
          type: 'name',
          position: index,
          original: word,
          suggestions: nameValidation.suggestions,
          details: nameValidation
        });
      }

      // Verificar abreviações
      const expansion = this.expandAbbreviation(word);
      if (expansion) {
        result.suggestions.push({
          type: 'abbreviation',
          position: index,
          original: word,
          suggestion: expansion,
          details: { expanded: expansion }
        });
      }
    });

    result.confidence = result.suggestions.length / words.length;

    return result;
  }
}

// Instância singleton para uso em toda a aplicação
export const medicalTrainingData = new MedicalTrainingData();

// Função de utilidade para integração fácil
export const getTrainingData = () => medicalTrainingData;

// Funções específicas para transcrição
export const enhanceTranscription = (transcriptionText) => {
  return medicalTrainingData.validateAndCorrect(transcriptionText);
};

export const findMedicalInfo = (term) => {
  return {
    medication: medicalTrainingData.findMedication(term),
    symptoms: medicalTrainingData.findSymptoms(term),
    diagnostics: medicalTrainingData.findDiagnostics(term),
    surgeries: medicalTrainingData.findSurgeries(term)
  };
};

export default medicalTrainingData;