const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold text-letterly-gray-900 mb-4">Como Funciona</h2>
          <p className="text-xl text-letterly-gray-600 max-w-3xl mx-auto">Três passos simples para transformar sua voz em texto médico profissional.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-letterly-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold text-letterly-gray-900 mb-2">Grave sua Consulta</h3>
            <p className="text-letterly-gray-600">Faça upload do áudio ou grave diretamente no navegador durante a consulta médica.</p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-letterly-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold text-letterly-gray-900 mb-2">Processamento IA</h3>
            <p className="text-letterly-gray-600">Nossa IA analisa o áudio e converte automaticamente em texto estruturado e profissional.</p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-letterly-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold text-letterly-gray-900 mb-2">Pronto para Uso</h3>
            <p className="text-letterly-gray-600">Receba prontuários, prescrições e relatórios médicos prontos para uso clínico.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks