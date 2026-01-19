const UseCases = () => {
  return (
    <section className="py-16 md:py-32">
      <div className="container relative max-w-7xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold text-medical-900">Casos de uso em medicina</h2>
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-clinical-50 rounded-4xl p-8 border border-clinical-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-medical-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <h3 className="text-4xl text-balance text-medical-900">Consultas clínicas</h3>
            </div>
            <div className="flex flex-row flex-wrap gap-2 mb-4">
              <span className="bg-medical-100 text-medical-800 px-3 py-1 rounded-full text-sm font-medium">prontuários</span>
              <span className="bg-sage-100 text-sage-800 px-3 py-1 rounded-full text-sm font-medium">diagnósticos</span>
              <span className="bg-emergency-100 text-emergency-800 px-3 py-1 rounded-full text-sm font-medium">emergências</span>
              <span className="bg-clinical-200 text-clinical-800 px-3 py-1 rounded-full text-sm font-medium">exames</span>
            </div>
            <p className="text-clinical-700">
              Documente consultas rapidamente. Da queixa inicial ao plano terapêutico, tudo organizado automaticamente.
            </p>
          </div>

          <div className="bg-clinical-50 rounded-4xl p-8 border border-clinical-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-medical-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-4xl text-balance text-medical-900">Prescrições médicas</h3>
            </div>
            <div className="flex flex-row flex-wrap gap-2 mb-4">
              <span className="bg-medical-100 text-medical-800 px-3 py-1 rounded-full text-sm font-medium">medicamentos</span>
              <span className="bg-sage-100 text-sage-800 px-3 py-1 rounded-full text-sm font-medium">dosagens</span>
              <span className="bg-clinical-200 text-clinical-800 px-3 py-1 rounded-full text-sm font-medium">orientações</span>
              <span className="bg-emergency-100 text-emergency-800 px-3 py-1 rounded-full text-sm font-medium">urgente</span>
            </div>
            <p className="text-clinical-700">
              Dicte prescrições completas com dosagem, frequência e instruções ao paciente automaticamente formatadas.
            </p>
          </div>

          <div className="bg-clinical-50 rounded-4xl p-8 border border-clinical-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-medical-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-4xl text-balance text-medical-900">Relatórios médicos</h3>
            </div>
            <div className="flex flex-row flex-wrap gap-2 mb-4">
              <span className="bg-medical-100 text-medical-800 px-3 py-1 rounded-full text-sm font-medium">cirurgias</span>
              <span className="bg-sage-100 text-sage-800 px-3 py-1 rounded-full text-sm font-medium">procedimentos</span>
              <span className="bg-clinical-200 text-clinical-800 px-3 py-1 rounded-full text-sm font-medium">resultados</span>
              <span className="bg-emergency-100 text-emergency-800 px-3 py-1 rounded-full text-sm font-medium">complicações</span>
            </div>
            <p className="text-clinical-700">
              Gere relatórios cirúrgicos, de procedimentos e evolução do paciente com terminologia adequada.
            </p>
          </div>

          <div className="bg-clinical-50 rounded-4xl p-8 border border-clinical-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-medical-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h3 className="text-4xl text-balance text-medical-900">Educação médica</h3>
            </div>
            <div className="flex flex-row flex-wrap gap-2 mb-4">
              <span className="bg-medical-100 text-medical-800 px-3 py-1 rounded-full text-sm font-medium">casos clínicos</span>
              <span className="bg-sage-100 text-sage-800 px-3 py-1 rounded-full text-sm font-medium">estudos</span>
              <span className="bg-clinical-200 text-clinical-800 px-3 py-1 rounded-full text-sm font-medium">pesquisa</span>
              <span className="bg-emergency-100 text-emergency-800 px-3 py-1 rounded-full text-sm font-medium">discussões</span>
            </div>
            <p className="text-clinical-700">
              Documente casos clínicos para ensino, discuta diagnósticos diferenciais e crie material educacional.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default UseCases