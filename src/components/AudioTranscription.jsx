import { useState, useEffect, useRef } from 'react';
import { ReactMediaRecorder } from 'react-media-recorder';
import SpecialtySelector from './SpecialtySelector';
import transcriptionService from '../services/transcriptionService';
import processingService from '../services/processingService';

const AudioTranscription = () => {
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [showFullTranscription, setShowFullTranscription] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [savedRecords, setSavedRecords] = useState([]);
  const [apiStatus, setApiStatus] = useState({});
  const recognitionRef = useRef(null);

  // Carregar prontuários salvos e verificar APIs
  useEffect(() => {
    const saved = localStorage.getItem('documenta-records');
    if (saved) {
      setSavedRecords(JSON.parse(saved));
    }

    // Verificar disponibilidade das APIs
    const checkAPIs = async () => {
      try {
        const [transcriptionStatus, processingStatus] = await Promise.all([
          transcriptionService.getStatus(),
          processingService.getStatus()
        ]);
        setApiStatus({ ...transcriptionStatus, ...processingStatus });
      } catch (error) {
        console.warn('Erro ao verificar APIs:', error);
      }
    };

    checkAPIs();
  }, []);

  // Inicializar serviços de transcrição
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await transcriptionService.initializeWebSpeech();
        console.log('🎯 Serviços de transcrição inicializados');
      } catch (error) {
        console.warn('Erro ao inicializar serviços:', error);
      }
    };

    initializeServices();

    return () => {
      transcriptionService.stopTranscription();
    };
  }, []);

  const startTranscription = async () => {
    if (isListening) return;

    try {
      setIsListening(true);
      setTranscription('');
      setSummary('');
      setShowFullTranscription(false);

      // Usar Web Speech API para transcrição em tempo real
      const result = await transcriptionService.transcribe(null, {
        provider: 'WEB_SPEECH',
        onProgress: (final, interim) => {
          if (final) {
            setTranscription(prev => prev + final + ' ');
          }
        }
      });

      // Configurar callbacks para Web Speech
      if (result.type === 'WEBSPEECH_CONTROL') {
        result.recognition.onstart = () => {
          setIsListening(true);
        };

        result.recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setTranscription(prev => prev + finalTranscript + ' ');
          }
        };

        result.recognition.onend = async () => {
          setIsListening(false);

          // Após finalizar, gerar resumo automaticamente
          if (transcription.trim().length > 20) {
            await generateSummary();
          }
        };

        result.recognition.onerror = (event) => {
          console.error('Erro na transcrição:', event.error);
          setIsListening(false);
        };

        result.recognition.start();
      }
    } catch (error) {
      console.error('Erro ao iniciar transcrição:', error);
      setIsListening(false);
      alert('Erro ao iniciar transcrição. Verifique se o microfone está permitido.');
    }
  };

  const stopTranscription = () => {
    if (isListening) {
      transcriptionService.stopTranscription();
      setIsListening(false);
    }
  };

  const generateSummary = async () => {
    if (!transcription.trim()) return;

    setIsProcessing(true);
    try {
      console.log('🧠 Gerando resumo da consulta...');

      const result = await processingService.generateSummary(
        transcription,
        { specialty: selectedSpecialty?.id || 'geral' }
      );

      setSummary(result.summary);
      console.log(`✅ Resumo gerado com ${result.provider}`);

    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      // Fallback: mostrar transcrição formatada como resumo
      setSummary(`## TRANSCRIÇÃO FORMATADA\n\n${formatMedicalText(transcription)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearTranscription = () => {
    setTranscription('');
    setSummary('');
    setShowFullTranscription(false);
  };

  const applyFormatting = () => {
    setTranscription(prev => formatMedicalText(prev));
  };

  const saveRecord = () => {
    if (!transcription.trim() || !patientName.trim()) {
      alert('Por favor, preencha o nome do paciente e o texto da transcrição.');
      return;
    }

    const record = {
      id: Date.now(),
      patientName,
      specialty: selectedSpecialty?.name || 'Geral',
      transcription: formatMedicalText(transcription),
      summary: summary || null,
      date: new Date().toISOString(),
      wordCount: transcription.split(' ').filter(word => word.length > 0).length
    };

    const updatedRecords = [record, ...savedRecords];
    setSavedRecords(updatedRecords);
    localStorage.setItem('documenta-records', JSON.stringify(updatedRecords));

    // Limpar campos após salvar
    setTranscription('');
    setSummary('');
    setPatientName('');
    setShowFullTranscription(false);
    alert('Prontuário salvo com sucesso!');
  };

  const loadRecord = (record) => {
    setPatientName(record.patientName);
    setTranscription(record.transcription);
    setSelectedSpecialty({ name: record.specialty });
  };

  const deleteRecord = (id) => {
    const updatedRecords = savedRecords.filter(record => record.id !== id);
    setSavedRecords(updatedRecords);
    localStorage.setItem('documenta-records', JSON.stringify(updatedRecords));
  };

  const formatMedicalText = (text) => {
    let formattedText = text;

    // Formatação específica por especialidade
    if (selectedSpecialty) {
      switch (selectedSpecialty.id) {
        case 'cardiologia':
          formattedText = formattedText
            .replace(/\b(dor torácica|angina|infarto)\b/gi, '\n\n**SINTOMAS CARDÍACOS:** $1')
            .replace(/\b(dispneia|falta de ar)\b/gi, '\n• Dispneia: presente')
            .replace(/\b(edema|inchaço)\b/gi, '\n• Edema: presente')
            .replace(/\b(palpitações|arritmia)\b/gi, '\n• Palpitações/arritmia: presente');
          break;
        case 'pediatria':
          formattedText = formattedText
            .replace(/\b(crescimento|desenvolvimento)\b/gi, '\n\n**AVALIAÇÃO DO DESENVOLVIMENTO:**')
            .replace(/\b(vacinação|vacina)\b/gi, '\n\n**STATUS VACINAL:**')
            .replace(/\b(alergia|reação alérgica)\b/gi, '\n\n**ALERGIAS:**');
          break;
        case 'ginecologia':
          formattedText = formattedText
            .replace(/\b(ciclo menstrual|menstruação)\b/gi, '\n\n**CICLO MENSTRUAL:**')
            .replace(/\b(gravidez|gestação)\b/gi, '\n\n**HISTÓRIA GESTACIONAL:**')
            .replace(/\b(anticoncepcional|método contraceptivo)\b/gi, '\n\n**MÉTODO CONTRACEPTIVO:**');
          break;
        case 'psiquiatria':
          formattedText = formattedText
            .replace(/\b(ansiedade|humor deprimido)\b/gi, '\n\n**SINTOMAS PSIQUIÁTRICOS:**')
            .replace(/\b(sono|insônia)\b/gi, '\n\n**PADRÃO DE SONO:**')
            .replace(/\b(estresse|ansiedade)\b/gi, '\n• Sintomas de ansiedade: presente');
          break;
        case 'oftalmologia':
          formattedText = formattedText
            .replace(/\b(visão|acuidade visual)\b/gi, '\n\n**ACUIDADE VISUAL:**')
            .replace(/\b(dor ocular|vermelhidão)\b/gi, '\n\n**SINTOMAS OCULARES:**')
            .replace(/\b(lentes|óculos)\b/gi, '\n\n**CORREÇÃO ÓPTICA:**');
          break;
      }
    }

    // Formatação estrutural principal
    const structuralReplacements = [
      { pattern: /\b(paciente|paciente|nome do paciente)\b/gi, replacement: '\n\n**PACIENTE:**' },
      { pattern: /\b(queixa|queixa principal|qp)\b/gi, replacement: '\n\n**QUEIXA PRINCIPAL:**' },
      { pattern: /\b(história|hda|história da doença atual|história clínica)\b/gi, replacement: '\n\n**HISTÓRIA DA DOENÇA ATUAL:**' },
      { pattern: /\b(história patológica prévia|hpp|antecedentes|antecedentes pessoais)\b/gi, replacement: '\n\n**HISTÓRIA PATOLÓGICA PRÉVIA:**' },
      { pattern: /\b(exame físico|exame clínico|ef)\b/gi, replacement: '\n\n**EXAME FÍSICO:**' },
      { pattern: /\b(exames complementares|exames|laboratório|imagem)\b/gi, replacement: '\n\n**EXAMES COMPLEMENTARES:**' },
      { pattern: /\b(diagnóstico|dx|diagnósticos)\b/gi, replacement: '\n\n**DIAGNÓSTICO:**' },
      { pattern: /\b(conduta|tratamento|plano terapêutico|tx)\b/gi, replacement: '\n\n**CONDUTA:**' },
      { pattern: /\b(orientações|orientação ao paciente|instruções)\b/gi, replacement: '\n\n**ORIENTAÇÕES AO PACIENTE:**' },
      { pattern: /\b(retorno|retornar|próxima consulta)\b/gi, replacement: '\n\n**RETORNO:**' },
      { pattern: /\b(evolução|evolução clínica)\b/gi, replacement: '\n\n**EVOLUÇÃO:**' }
    ];

    // Aplicar formatações estruturais
    structuralReplacements.forEach(({ pattern, replacement }) => {
      formattedText = formattedText.replace(pattern, replacement);
    });

    // Formatação de sinais vitais
    const vitalSignsReplacements = [
      { pattern: /\b(pa|pressão arterial)\b/gi, replacement: '\n• PA:' },
      { pattern: /\b(fc|frequência cardíaca|bpm)\b/gi, replacement: '\n• FC:' },
      { pattern: /\b(fr|frequência respiratória|respiração)\b/gi, replacement: '\n• FR:' },
      { pattern: /\b(temp|temperatura|°c)\b/gi, replacement: '\n• Temp:' },
      { pattern: /\b(sat|sat02|saturação|oxigênio)\b/gi, replacement: '\n• SatO2:' },
      { pattern: /\b(peso|kg)\b/gi, replacement: '\n• Peso:' }
    ];

    vitalSignsReplacements.forEach(({ pattern, replacement }) => {
      formattedText = formattedText.replace(pattern, replacement);
    });

    // Formatação de medicamentos
    formattedText = formattedText.replace(/\b(medicamento|remédio|medicação)\b/gi, '\n\n**MEDICAMENTOS:**');
    formattedText = formattedText.replace(/\b(dose|dosagem)\b/gi, '\n• Dose:');
    formattedText = formattedText.replace(/\b(via|administração)\b/gi, '\n• Via:');
    formattedText = formattedText.replace(/\b(frequência|freq)\b/gi, '\n• Frequência:');
    formattedText = formattedText.replace(/\b(duração|período)\b/gi, '\n• Duração:');

    // Formatação de listas
    formattedText = formattedText.replace(/(\d+)\.?\s*([A-Z])/g, '\n$1. $2');

    // Limpar formatação excessiva
    formattedText = formattedText.replace(/\n\n\n+/g, '\n\n');
    formattedText = formattedText.replace(/^\n+/, '');

    return formattedText;
  };

  const downloadTranscription = () => {
    const header = patientName ? `PACIENTE: ${patientName}\nDATA: ${new Date().toLocaleDateString('pt-BR')}\nESPECIALIDADE: ${selectedSpecialty?.name || 'Geral'}\n\n` : '';
    const content = header + formatMedicalText(transcription);
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `prontuario-${patientName || 'sem-nome'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <section className="py-16 bg-clinical-50">
      <div className="container relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SpecialtySelector
          selectedSpecialty={selectedSpecialty}
          onSpecialtyChange={setSelectedSpecialty}
        />

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-clinical-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-medical-900 mb-4">
              Transcrição Médica
            </h2>
            <p className="text-clinical-700">
              Clique no microfone e comece a ditar sua consulta médica
            </p>
          </div>

          {/* Controles de gravação */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            {!isListening ? (
              <button
                onClick={startTranscription}
                className="bg-medical-600 hover:bg-medical-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-colors flex items-center space-x-2"
                disabled={!recognitionRef.current}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
                <span>Iniciar Gravação</span>
              </button>
            ) : (
              <button
                onClick={stopTranscription}
                className="bg-emergency-600 hover:bg-emergency-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-colors flex items-center space-x-2"
              >
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                <span>Parar Gravação</span>
              </button>
            )}

            <button
              onClick={clearTranscription}
              className="bg-clinical-600 hover:bg-clinical-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Limpar
            </button>

            <button
              onClick={applyFormatting}
              disabled={!transcription.trim()}
              className="bg-sage-600 hover:bg-sage-700 disabled:bg-clinical-400 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Formatar Texto
            </button>
          </div>

          {/* Status da gravação */}
          {isListening && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 bg-medical-100 text-medical-800 px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-medical-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Gravando...</span>
              </div>
            </div>
          )}

          {/* Nome do Paciente */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-clinical-900 mb-2">
              Nome do Paciente:
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Digite o nome do paciente"
              className="w-full px-4 py-2 border border-clinical-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent"
            />
          </div>

          {/* Área de resultado */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-clinical-900 mb-2">
              {summary ? 'Resumo da Consulta:' : 'Texto Transcrito:'}
            </label>

            {/* Status de processamento */}
            {isProcessing && (
              <div className="mb-4 p-3 bg-sage-50 border border-sage-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-sage-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sage-700 text-sm">Gerando resumo médico...</span>
                </div>
              </div>
            )}

            <div className="bg-clinical-50 border border-clinical-300 rounded-lg p-4 min-h-48 max-h-96 overflow-y-auto">
              {summary ? (
                <div className="relative">
                  {/* Resumo */}
                  <div className="text-clinical-900 whitespace-pre-wrap">
                    {summary}
                  </div>

                  {/* Botão para ver transcrição completa */}
                  <button
                    onClick={() => setShowFullTranscription(!showFullTranscription)}
                    className="mt-4 inline-flex items-center space-x-2 text-medical-600 hover:text-medical-800 text-sm font-medium bg-white px-3 py-1 rounded-lg border border-medical-200 hover:border-medical-300 transition-colors"
                  >
                    <svg className={`w-4 h-4 transition-transform ${showFullTranscription ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                    <span>{showFullTranscription ? 'Ocultar' : 'Ver'} Transcrição Completa</span>
                  </button>

                  {/* Transcrição completa (expandível) */}
                  {showFullTranscription && (
                    <div className="mt-4 pt-4 border-t border-clinical-200">
                      <h4 className="text-sm font-medium text-clinical-700 mb-2">TRANSCRIÇÃO COMPLETA:</h4>
                      <div className="text-clinical-800 whitespace-pre-wrap text-sm bg-white p-3 rounded border">
                        {formatMedicalText(transcription)}
                      </div>
                    </div>
                  )}
                </div>
              ) : transcription ? (
                <div className="text-clinical-900 whitespace-pre-wrap">
                  {formatMedicalText(transcription)}
                </div>
              ) : (
                <div className="text-clinical-500 italic">
                  {isListening ? 'Fale para começar a transcrição...' : 'Clique em "Iniciar Gravação" para começar'}
                </div>
              )}
            </div>
          </div>

          {/* Status das APIs */}
          {Object.keys(apiStatus).length > 0 && (
            <div className="mb-4 p-3 bg-clinical-50 border border-clinical-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-clinical-700">APIs Disponíveis:</span>
                <div className="flex space-x-2">
                  {apiStatus.webSpeech && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Web Speech ✓
                    </span>
                  )}
                  {apiStatus.openai && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      OpenAI ✓
                    </span>
                  )}
                  {apiStatus.google && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                      Google ✓
                    </span>
                  )}
                  {apiStatus.huggingface && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      HF ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-clinical-600">
              {transcription.split(' ').filter(word => word.length > 0).length} palavras
              {summary && ` • Resumo gerado`}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={generateSummary}
                disabled={!transcription.trim() || isProcessing}
                className="bg-sage-600 hover:bg-sage-700 disabled:bg-clinical-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isProcessing ? 'Processando...' : 'Gerar Resumo'}
              </button>
              <button
                onClick={saveRecord}
                disabled={!transcription.trim() || !patientName.trim()}
                className="bg-medical-600 hover:bg-medical-700 disabled:bg-clinical-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Salvar Prontuário
              </button>
              <button
                onClick={downloadTranscription}
                disabled={!transcription.trim()}
                className="bg-sage-600 hover:bg-sage-700 disabled:bg-clinical-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Baixar Prontuário
              </button>
            </div>
          </div>

          {/* Prontuários Salvos */}
          {savedRecords.length > 0 && (
            <div className="border-t border-clinical-200 pt-6">
              <h3 className="text-lg font-semibold text-medical-900 mb-4">
                Prontuários Salvos
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {savedRecords.map((record) => (
                  <div key={record.id} className="bg-clinical-50 rounded-lg p-4 border border-clinical-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-medical-900">{record.patientName}</h4>
                        <p className="text-sm text-clinical-600">
                          {record.specialty} • {new Date(record.date).toLocaleDateString('pt-BR')} • {record.wordCount} palavras
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => loadRecord(record)}
                          className="text-medical-600 hover:text-medical-800 text-sm font-medium"
                        >
                          Carregar
                        </button>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          className="text-emergency-600 hover:text-emergency-800 text-sm font-medium"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                    <p className="text-clinical-700 text-sm line-clamp-2">
                      {record.transcription.substring(0, 150)}...
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AudioTranscription;