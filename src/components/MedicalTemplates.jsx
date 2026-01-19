import { useState } from 'react';

const MedicalTemplates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'hospital':
        return (
          <svg className="w-6 h-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        );
      case 'pill':
        return (
          <svg className="w-6 h-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        );
      case 'stethoscope':
        return (
          <svg className="w-6 h-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  const templates = [
    {
      id: 'consulta',
      name: 'Consulta Clínica',
      icon: 'hospital',
      description: 'Template completo para consultas médicas',
      structure: `**PRONTUÁRIO MÉDICO**

**Paciente:** [Nome do Paciente], [Idade] anos
**Data:** ${new Date().toLocaleDateString('pt-BR')}
**Médico:** [Nome do Médico]

**QUEIXA PRINCIPAL:**
[Ditar a queixa principal do paciente]

**HISTÓRIA DA DOENÇA ATUAL:**
[Ditar história detalhada da doença]

**HISTÓRIA PATOLÓGICA PRÉVIA:**
• Antecedentes pessoais: [ ]
• Antecedentes familiares: [ ]
• Alergias: [ ]
• Medicamentos em uso: [ ]

**EXAME FÍSICO:**
• Sinais vitais:
  - PA: ___/___ mmHg
  - FC: ___ bpm
  - FR: ___ ipm
  - Temp: ___°C
  - SatO2: ___%
• [Outros achados do exame físico]

**EXAMES COMPLEMENTARES:**
[Solicitar exames se necessário]

**DIAGNÓSTICO:**
[Diagnóstico principal e diferenciais]

**CONDUTA:**
[Plano terapêutico, prescrições, orientações]

**RETORNO:**
[Data e condições para retorno]`
    },
    {
      id: 'prescricao',
      name: 'Prescrição Médica',
      icon: 'pill',
      description: 'Template estruturado para prescrições',
      structure: `**PRESCRIÇÃO MÉDICA**

**Paciente:** [Nome do Paciente]
**Data:** ${new Date().toLocaleDateString('pt-BR')}
**CRM:** [Número do CRM]

**MEDICAMENTOS:**

1. **[Nome do Medicamento]**
   - Dose: [Dosagem]
   - Via: [Oral/IV/IM/Topica/etc]
   - Frequência: [ ]
   - Duração: [ ]
   - Quantidade: [ ]

2. **[Nome do Medicamento]**
   - Dose: [Dosagem]
   - Via: [ ]
   - Frequência: [ ]
   - Duração: [ ]
   - Quantidade: [ ]

**ORIENTAÇÕES AO PACIENTE:**
[Ditar orientações específicas sobre o uso dos medicamentos]

**EFEITOS COLATERAIS A OBSERVAR:**
[Listar efeitos colaterais importantes a serem observados]

**CONTRAINDICAÇÕES:**
[Mencionar contraindicações relevantes]

**RETORNO:**
[Agendar retorno se necessário]`
    },
    {
      id: 'relatorio',
      name: 'Relatório Cirúrgico',
      icon: '⚕️',
      description: 'Template para relatórios de procedimentos cirúrgicos',
      structure: `**RELATÓRIO CIRÚRGICO**

**Paciente:** [Nome do Paciente]
**Data da Cirurgia:** ${new Date().toLocaleDateString('pt-BR')}
**Cirurgião:** [Nome do Cirurgião]
**Equipe:** [Equipe cirúrgica]

**PROCEDIMENTO REALIZADO:**
[Nome completo do procedimento cirúrgico]

**INDICAÇÃO:**
[Motivo da realização do procedimento]

**TÉCNICA CIRÚRGICA:**
[Descrição detalhada da técnica utilizada]

**DURAÇÃO DA CIRURGIA:**
[Tempo total do procedimento]

**COMPLICAÇÕES INTRAOPERATÓRIAS:**
[Nenhuma/Descrever complicações ocorridas]

**ACHADOS INTRAOPERATÓRIOS:**
[Descrição dos achados durante o procedimento]

**MATERIAL UTILIZADO:**
[Listar materiais e implantes utilizados]

**AMOSTRAS ENVIADAS:**
[Descrever amostras enviadas para análise]

**ORIENTAÇÕES PÓS-OPERATÓRIAS:**
[Cuidados imediatos e de seguimento]

**EVOLUÇÃO ESPERADA:**
[Prognóstico e acompanhamento previsto]`
    },
    {
      id: 'evolucao',
      name: 'Evolução de Paciente',
      icon: '📋',
      description: 'Template para registro de evolução clínica',
      structure: `**EVOLUÇÃO CLÍNICA**

**Paciente:** [Nome do Paciente]
**Data:** ${new Date().toLocaleDateString('pt-BR')}
**Médico:** [Nome do Médico]

**EVOLUÇÃO DO QUADRO:**
[Descrição da evolução desde a última consulta]

**SINAIS VITAIS:**
• PA: ___/___ mmHg
• FC: ___ bpm
• FR: ___ ipm
• Temp: ___°C
• Peso: ___ kg

**EXAME FÍSICO ATUAL:**
[Descrição dos achados atuais]

**EXAMES REALIZADOS:**
[Resultado de exames solicitados anteriormente]

**AJUSTES TERAPÊUTICOS:**
[Modificações no tratamento atual]

**ORIENTAÇÕES AO PACIENTE:**
[Instruções para o paciente]

**PLANO PARA PRÓXIMA CONSULTA:**
[Exames a solicitar, ajustes necessários, data de retorno]`
    }
  ];

  const applyTemplate = (template) => {
    setSelectedTemplate(template);
    // Copiar para área de transferência
    navigator.clipboard.writeText(template.structure).then(() => {
      alert('Template copiado para a área de transferência! Cole no campo de transcrição.');
    });
  };

  return (
    <section className="py-16 bg-white">
      <div className="container relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-medical-900 mb-4">
            Templates Médicos
          </h2>
          <p className="text-clinical-700 max-w-2xl mx-auto">
            Utilize templates pré-definidos para estruturar seus documentos médicos.
            Clique em um template para copiá-lo e utilizá-lo na transcrição.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-clinical-50 rounded-xl p-6 border border-clinical-200 hover:border-medical-300 transition-colors cursor-pointer"
              onClick={() => applyTemplate(template)}
            >
              <div className="mb-4 flex justify-center">{getIcon(template.icon)}</div>
              <h3 className="text-lg font-semibold text-medical-900 mb-2">
                {template.name}
              </h3>
              <p className="text-clinical-700 text-sm mb-4">
                {template.description}
              </p>
              <button className="w-full bg-medical-600 hover:bg-medical-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Usar Template
              </button>
            </div>
          ))}
        </div>

        {/* Preview do template selecionado */}
        {selectedTemplate && (
          <div className="mt-12 bg-clinical-50 rounded-xl p-6 border border-clinical-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-medical-900">
                Preview: {selectedTemplate.name}
              </h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-clinical-500 hover:text-clinical-700"
              >
                ✕
              </button>
            </div>
            <div className="bg-white rounded-lg p-4 border border-clinical-300 max-h-96 overflow-y-auto">
              <pre className="text-clinical-900 whitespace-pre-wrap text-sm font-mono">
                {selectedTemplate.structure}
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MedicalTemplates;