import { useState } from 'react';

const SpecialtySelector = ({ selectedSpecialty, onSpecialtyChange }) => {

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'hospital':
        return (
          <svg className="w-6 h-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        );
      case 'heart':
        return (
          <svg className="w-6 h-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  const specialties = [
    {
      id: 'clinica',
      name: 'Clínica Geral',
      icon: 'hospital',
      description: 'Medicina interna e consultas gerais',
      keywords: ['pressão arterial', 'febre', 'dor', 'fadiga', 'tosse']
    },
    {
      id: 'cardiologia',
      name: 'Cardiologia',
      icon: 'heart',
      description: 'Doenças do coração e sistema cardiovascular',
      keywords: ['angina', 'infarto', 'arritmia', 'hipertensão', 'dispneia', 'edema']
    },
    {
      id: 'pediatria',
      name: 'Pediatria',
      icon: '👶',
      description: 'Saúde infantil e adolescente',
      keywords: ['crescimento', 'desenvolvimento', 'vacinação', 'febre', 'alergia']
    },
    {
      id: 'ginecologia',
      name: 'Ginecologia',
      icon: '👩',
      description: 'Saúde da mulher e sistema reprodutor feminino',
      keywords: ['menstruação', 'gravidez', 'parto', 'menopausa', 'citologia']
    },
    {
      id: 'ortopedia',
      name: 'Ortopedia',
      icon: '🦴',
      description: 'Sistema musculoesquelético e traumatologia',
      keywords: ['fratura', 'luxação', 'artrite', 'dor articular', 'mobilidade']
    },
    {
      id: 'dermatologia',
      name: 'Dermatologia',
      icon: '🧴',
      description: 'Doenças da pele e mucosas',
      keywords: ['erupção', 'mancha', 'coceira', 'lesão', 'alergia cutânea']
    },
    {
      id: 'psiquiatria',
      name: 'Psiquiatria',
      icon: '🧠',
      description: 'Saúde mental e transtornos psiquiátricos',
      keywords: ['ansiedade', 'depressão', 'insônia', 'estresse', 'comportamento']
    },
    {
      id: 'oftalmologia',
      name: 'Oftalmologia',
      icon: '👁️',
      description: 'Doenças dos olhos e visão',
      keywords: ['visão', 'dor ocular', 'vermelhidão', 'lacrimejamento', 'cegueira']
    }
  ];

  return (
    <section className="py-8 bg-clinical-50 border-t border-clinical-200">
      <div className="container relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-medical-900 mb-2">
            Especialidade Médica
          </h3>
          <p className="text-clinical-700 text-sm">
            Selecione sua especialidade para otimizar a transcrição
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {specialties.map((specialty) => (
            <button
              key={specialty.id}
              onClick={() => onSpecialtyChange(specialty)}
              className={`p-3 rounded-lg border transition-all text-center ${
                selectedSpecialty?.id === specialty.id
                  ? 'bg-medical-100 border-medical-400 text-medical-900 shadow-md'
                  : 'bg-white border-clinical-300 text-clinical-700 hover:border-medical-300 hover:bg-medical-50'
              }`}
            >
              <div className="mb-1 flex justify-center">{getIcon(specialty.icon)}</div>
              <div className="text-xs font-medium leading-tight">{specialty.name}</div>
            </button>
          ))}
        </div>

        {selectedSpecialty && (
          <div className="mt-4 p-4 bg-medical-50 rounded-lg border border-medical-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">{selectedSpecialty.icon}</span>
              <span className="font-semibold text-medical-900">{selectedSpecialty.name}</span>
            </div>
            <p className="text-medical-700 text-sm mb-2">{selectedSpecialty.description}</p>
            <div className="flex flex-wrap gap-1">
              {selectedSpecialty.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-medical-200 text-medical-800 px-2 py-1 rounded text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SpecialtySelector;