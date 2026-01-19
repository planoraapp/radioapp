const MedicalFeatures = () => {

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'hospital':
        return (
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        );
      case 'globe':
        return (
          <svg className="w-12 h-12 text-medical-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'mobile':
        return (
          <svg className="w-12 h-12 text-medical-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
        );
      case 'tag':
        return (
          <svg className="w-12 h-12 text-medical-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
          </svg>
        );
      case 'sync':
        return (
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className="relative pt-16 md:pt-32">
      <div id="recursos" className="absolute top-8 lg:top-16 left-0"></div>
      <div className="container relative max-w-7xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold text-medical-900">Recursos desenvolvidos para medicina</h2>

        <div className="grid md:grid-rows-8 md:grid-cols-3 gap-4 mt-12">
          {/* Card principal - 4 linhas */}
          <div className="relative md:row-span-4 bg-slate-800 rounded-3xl p-8 flex flex-col gap-4">
            <div className="text-4xl flex-1 flex items-center justify-center">
              <div className="w-16 h-16 bg-medical-500 rounded-full flex items-center justify-center">
                {getIcon('hospital')}
              </div>
            </div>
            <h3 className="text-4xl text-balance text-white">Conformidade HIPAA</h3>
            <div className="text-slate-300">Seus dados médicos permanecem seguros e em conformidade com regulamentações de saúde.</div>
          </div>

          {/* Card médio - 2 linhas */}
          <div className="relative md:row-span-2 bg-slate-800 rounded-3xl p-8 flex flex-col gap-4">
            <div className="flex justify-center">{getIcon('globe')}</div>
            <h3 className="text-lg font-semibold text-white">70+ idiomas médicos</h3>
            <div className="text-slate-300">Reconhecimento automático de terminologia médica em múltiplos idiomas.</div>
          </div>

          {/* Card médio - 2 linhas */}
          <div className="relative md:row-span-2 bg-slate-800 rounded-3xl p-8 flex flex-col gap-4">
            <div className="flex justify-center">{getIcon('mobile')}</div>
            <h3 className="text-lg font-semibold text-white">Offline seguro</h3>
            <div className="text-slate-300">Grave anotações mesmo sem conexão com internet, sincronize quando estiver online.</div>
          </div>

          {/* Card médio - 2 linhas */}
          <div className="relative md:row-span-2 bg-slate-800 rounded-3xl p-8 flex flex-col gap-4">
            <div className="flex justify-center">{getIcon('tag')}</div>
            <h3 className="text-4xl text-balance text-white">Etiquetas especializadas</h3>
            <div className="text-slate-300">Organize por especialidade: cardiologia, pediatria, oncologia, etc.</div>
          </div>

          {/* Card principal - 4 linhas */}
          <div className="relative md:row-span-4 bg-slate-800 rounded-3xl p-8 flex flex-col gap-4">
            <div className="text-4xl flex-1 flex items-center justify-center">
              <div className="w-16 h-16 bg-sage-500 rounded-full flex items-center justify-center">
                {getIcon('sync')}
              </div>
            </div>
            <h3 className="text-4xl text-balance text-white">Sincronização</h3>
            <div className="text-slate-300">Acesse suas anotações em qualquer dispositivo: iOS, Android, web ou desktop.</div>
          </div>

          {/* Card médio - 2 linhas */}
          <div className="relative md:row-span-2 bg-slate-800 rounded-3xl p-8 flex flex-col gap-4">
            <div className="text-4xl">
              <svg className="w-10 h-10 mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#E75533" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M7.746 12.994C10.326 11.002 13.68 11.002 16.26 12.994" stroke="#01050F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M6 9.81596C9.636 7.00796 14.364 7.00796 18 9.81596" stroke="#01050F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M10.44 16.2902C11.388 15.5582 12.618 15.5582 13.566 16.2902" stroke="#01050F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M4.93934 19L19.4697 4.46973" stroke="#E75533" strokeWidth="1.5"></path>
              </svg>
            </div>
            <h3 className="text-4xl text-balance text-white">Offline recording</h3>
            <div className="text-slate-300">Record anywhere, even during flights or in other places without internet</div>
          </div>

          {/* Card principal - 4 linhas */}
          <div className="relative md:row-span-4 bg-slate-800 rounded-3xl p-8 flex flex-col justify-end gap-4">
            <div className="text-4xl">
              <div className="w-16 h-16 bg-clinical-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
            </div>
            <h3 className="text-4xl text-balance text-white">Temas médico</h3>
            <div className="text-slate-300">Interface adaptada para ambientes clínicos com modo claro e escuro.</div>
          </div>

          {/* Card principal - 4 linhas */}
          <div className="relative md:row-span-4 bg-slate-800 rounded-3xl p-8 flex flex-col gap-4">
            <div className="text-4xl flex-1 flex justify-center items-center">
              <div className="w-16 h-16 bg-emergency-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
            </div>
            <h3 className="text-4xl text-balance text-white">Segurança médica</h3>
            <div className="text-slate-300">Criptografia avançada e conformidade com regulamentações de saúde.</div>
          </div>

          {/* Card médio - 2 linhas */}
          <div className="relative md:row-span-2 bg-slate-800 rounded-3xl p-8 flex flex-col gap-4">
            <div className="text-4xl">✨</div>
            <h3 className="text-4xl text-balance text-white">IA especializada</h3>
            <div className="text-slate-300">Modelos treinados especificamente para terminologia médica.</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MedicalFeatures