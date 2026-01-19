const Features = () => {
  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">Recursos Poderosos</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Tudo que você precisa para transformar voz em texto médico, com precisão e velocidade de nível empresarial.</p>
        </div>

        {/* Features Layout similar to Gumroad */}
        <div className="flex flex-col max-w-6xl mx-auto px-4 gap-8">
          {/* First Row */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Segurança e Privacidade - Agora no box maior */}
            <div className="flex flex-col md:relative bg-white border border-gray-900/20 rounded-3xl p-8 lg:basis-2/3 h-auto md:h-120">
              <div className="order-1 md:order-0">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl text-balance">Dados 100% Seguros</span>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                </div>
                <p className="text-lg md:absolute md:bottom-8 md:left-8 md:w-1/2 mt-4 md:mt-0 text-gray-600">
                  Seus dados médicos são criptografados e processados com os mais altos padrões de segurança HIPAA e LGPD. Proteção total da privacidade dos pacientes.
                </p>
              </div>
              <div className="w-80 order-2 md:order-0 md:absolute md:-top-8 md:-right-2 mt-4 md:mt-0">
                <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Proteção Ativa</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                      <span>Criptografia de ponta a ponta</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                      <span>Conformidade HIPAA & LGPD</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                      <span>Auditoria independente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Velocidade e Precisão - Agora no box menor */}
            <div className="flex flex-col md:relative overflow-hidden bg-white border border-gray-900/20 rounded-3xl p-8 lg:basis-1/3 h-auto md:h-120">
              <div className="order-1 md:order-0">
                <span className="text-4xl text-balance">Velocidade e Precisão</span>
                <p className="text-lg mb-4 text-gray-600">
                  Obtenha transcrições em segundos, com uma IA especializada em contexto médico
                </p>
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Análise Inteligente */}
            <div className="overflow-hidden flex flex-col justify-between bg-white border border-gray-900/20 rounded-3xl p-8 lg:basis-1/3 h-auto md:h-120">
              <p className="text-4xl text-balance">Análise Inteligente</p>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="h-7 flex-none flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                  <p className="text-lg text-balance text-gray-600">Extração automática de medicamentos e dosagens</p>
                </div>
                <div className="flex gap-4">
                  <div className="h-7 flex-none flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                  <p className="text-lg text-balance text-gray-600">Identificação de diagnósticos e sintomas</p>
                </div>
                <div className="flex gap-4">
                  <div className="h-7 flex-none flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                  <p className="text-lg text-balance text-gray-600">Estruturação automática da anamnese</p>
                </div>
              </div>
            </div>

            {/* Flexibilidade Total */}
            <div className="flex flex-col md:relative bg-white border border-gray-900/20 rounded-3xl p-8 lg:basis-2/3 h-auto md:h-120">
              <div className="order-1 md:order-0">
                <p className="text-4xl text-balance">
                  Flexibilidade Total
                </p>
                <p className="text-lg md:absolute md:bottom-8 md:left-8 md:w-80 mt-4 md:mt-0 text-gray-600">
                  Suporte para mais de 50 idiomas com detecção automática. Exporte para diversos formatos ou integre diretamente com sistemas de prontuário eletrônico.
                </p>
              </div>
              <div className="w-72 order-2 md:order-0 md:absolute md:top-8 md:-right-8 mt-8 md:mt-0">
                <div className="bg-gradient-to-br from-purple-50 to-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">50+ idiomas suportados</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="text-sm text-gray-600">Português (BR)</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="text-sm text-gray-600">English (US)</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="text-sm text-gray-600">Español</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New section inspired by Gumroad */}
      <div className="flex flex-col sm:flex-row gap-6 mt-12 max-w-6xl mx-auto">
        <div className="bg-white border border-gray-900/50 rounded-3xl p-6 md:p-8 flex-1">
          <div className="flex flex-col md:relative">
            <div className="order-2 md:order-0">
              <img alt="Side project 1" className="w-full h-auto" src="https://assets.gumroad.com/assets/about/side-project-1-7fd11f86a4c58a3ecd0d0c811c9bc844b3dae38c7a7271e521647652b1b10965.svg" />
            </div>
            <div className="order-1 md:order-0 md:absolute md:-top-3 md:left-0 sm:md:-left-6 bg-white rounded-xl px-4 sm:px-6 py-3 border border-black mb-4 md:mb-0">
              <p className="text-lg font-medium m-0">ao invés de perder tempo digitando...</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-900/50 rounded-3xl p-6 flex-1">
          <div className="flex flex-col md:relative">
            <div className="order-2 md:order-0">
              <img alt="Side project 2" className="w-full h-auto object-cover mx-auto" src="https://assets.gumroad.com/assets/about/side-project-2-6933c74e039a65520c2861067a2608a94a12101c536012f1c7c61021a47c7dd4.svg" />
            </div>
            <div className="order-1 md:order-0 md:absolute md:bottom-1 bg-white rounded-xl px-4 sm:px-4 py-3 border border-black mb-4 md:mb-0">
              <p className="text-lg font-medium m-0">...gaste mais tempo com seu paciente</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features