const Footer = () => {
  return (
    <>
      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-letterly-gray-100">
        <div className="container relative max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-letterly-gray-900 mb-4">Pronto para começar?</h2>
          <p className="text-xl text-letterly-gray-700 mb-8">Junte-se a milhares de profissionais que confiam no Documenta para suas transcrições.</p>
          <a href="#" className="bg-medical-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-medical-700 transition-colors">Começar Teste Grátis</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-letterly-gray-900 text-letterly-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-letterly-gray-100 mb-4">Documenta</h3>
              <p className="text-letterly-gray-400 text-sm">Transformando voz médica em texto profissional com IA avançada.</p>
            </div>
            <div>
              <h4 className="font-medium text-letterly-gray-100 mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-letterly-gray-400">
                <li><a href="#features" className="hover:text-letterly-gray-100 transition-colors">Recursos</a></li>
                <li><a href="#how-it-works" className="hover:text-letterly-gray-100 transition-colors">Como Funciona</a></li>
                <li><a href="#" className="hover:text-letterly-gray-100 transition-colors">Preços</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-letterly-gray-100 mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-letterly-gray-400">
                <li><a href="#" className="hover:text-letterly-gray-100 transition-colors">Ajuda</a></li>
                <li><a href="#" className="hover:text-letterly-gray-100 transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-letterly-gray-100 transition-colors">Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-letterly-gray-100 mb-4">Conecte-se</h4>
              <ul className="space-y-2 text-sm text-letterly-gray-400">
                <li><a href="#" className="hover:text-letterly-gray-100 transition-colors">iOS</a></li>
                <li><a href="#" className="hover:text-letterly-gray-100 transition-colors">Android</a></li>
                <li><a href="#" className="hover:text-letterly-gray-100 transition-colors">Web</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Footer