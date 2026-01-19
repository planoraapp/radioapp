import { useState, useEffect } from 'react';

const Hero = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  const words = [
    'suas anamneses',
    'seus exames',
    'seus retornos'
  ];

  // Animação de datilografia
  useEffect(() => {
    const word = words[currentWordIndex];
    const shouldDelete = isDeleting;

    const timeout = setTimeout(() => {
      if (!shouldDelete) {
        // Digitando
        if (currentText.length < word.length) {
          setCurrentText(word.slice(0, currentText.length + 1));
        } else {
          // Terminou de digitar, aguardar antes de apagar
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Apagando
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          // Terminou de apagar, passar para próxima palavra
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, shouldDelete ? 100 : 150); // Apagar mais rápido que digitar

    return () => clearTimeout(timeout);
  }, [currentText, currentWordIndex, isDeleting, words]);

  // Cursor piscando
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <section id="hero" className="md:p-4 bg-slate-900 pt-24 md:pt-32 pb-8 md:pb-8 xl:pb-16 text-white relative overflow-x-hidden rounded-b-4xl md:rounded-4xl xl:rounded-6xl">
      {/* Header Branco */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/public/documentalogo.png" alt="Documenta" className="h-8 w-auto" />
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-700 hover:text-medical-600 transition-colors">Recursos</a>
            <a href="#how-it-works" className="text-gray-700 hover:text-medical-600 transition-colors">Como Funciona</a>
            <a href="#pricing" className="text-gray-700 hover:text-medical-600 transition-colors">Preços</a>
          </nav>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-gray-700 hover:text-medical-600 transition-colors">Entrar</a>
            <a href="/transcrever" className="bg-medical-600 text-white px-4 py-2 rounded-lg hover:bg-medical-700 transition-colors">Começar Grátis</a>
          </div>
        </div>
      </div>

      <div className="container relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 items-center gap-12 lg:gap-16 relative px-2 sm:px-0">
          {/* Conteúdo principal */}
          <div>
            <h1 className="max-w-5xl mx-auto">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-white mb-2">
                Transcreva
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-white mb-2">
                <span>{currentText}</span>
                <span className={`inline-block w-1 h-[1em] bg-white ml-1 align-baseline ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}></span>
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-white">
                automaticamente
              </div>
            </h1>

            <div className="subtitle subtitle--md text-slate-300 leading-relaxed mt-8 max-lg:m-0">
              <div className="text-xl md:text-2xl text-slate-200">
                Sua consulta com mais foco no <span className="text-orange-400">paciente</span>, a gente documenta para você
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <a href="/transcrever" className="btn btn--md lg:btn--lg lg:px-8 xl:px-10 relative bg-medical-600 text-white hover:bg-medical-700 transition-colors border-2 border-medical-500 shadow-lg">
                Teste agora
              </a>
            </div>

            <div className="mt-8 text-slate-400 flex flex-row flex-wrap gap-4 md:gap-8 text-sm md:text-base">
              <div className="flex items-center gap-1">
                <svg className="w-4 block h-4 md:w-6 md:h-6" width="24" height="24" viewBox="0 0 24 24" fill="currentcolor" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M19.1001 18.16C19.6901 17.26 19.9101 16.8 20.3601 15.79C17.0401 14.53 16.5101 9.79999 19.7901 7.98999C18.7901 6.72999 17.3801 6 16.0501 6C15.0901 6 14.4301 6.25001 13.8401 6.48001C13.3401 6.67001 12.8901 6.84 12.3301 6.84C11.7301 6.84 11.2001 6.65001 10.6401 6.45001C10.0301 6.23001 9.39006 6 8.59006 6C7.10006 6 5.51007 6.91 4.50007 8.47C3.08007 10.67 3.33007 14.79 5.62007 18.31C6.44007 19.57 7.54007 20.98 8.97007 21C9.57007 21.01 9.96007 20.83 10.3901 20.64C10.8801 20.42 11.4101 20.18 12.3401 20.18C13.2701 20.17 13.7901 20.42 14.2801 20.64C14.7001 20.83 15.0801 21.01 15.6701 21C17.1201 20.98 18.2801 19.42 19.1001 18.16Z" fill="inherit"></path>
                  <path fillRule="evenodd" clipRule="evenodd" d="M15.8399 1C15.9999 2.1 15.5499 3.19001 14.9599 3.95001C14.3299 4.77001 13.2299 5.41 12.1699 5.37C11.9799 4.31 12.4699 3.21999 13.0699 2.48999C13.7399 1.68999 14.8699 1.07 15.8399 1Z" fill="inherit"></path>
                </svg>
                iOS
              </div>
              <div className="flex items-center gap-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentcolor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 18V21C11 21.55 10.55 22 10 22C9.45 22 9 21.55 9 21V18H11Z" fill="inherit"></path>
                  <path d="M15 18V21C15 21.55 14.55 22 14 22C13.45 22 13 21.55 13 21V18H15Z" fill="inherit"></path>
                  <path d="M17 11V16C17 17.1 16.1 18 15 18H9C7.9 18 7 17.1 7 16V11C7 9.9 7.9 9 9 9H15C16.1 9 17 9.9 17 11Z" fill="inherit"></path>
                  <path d="M5 11V15C5 15.55 4.55 16 4 16C3.45 16 3 15.55 3 15V11C3 10.45 3.45 10 4 10C4.55 10 5 10.45 5 11Z" fill="inherit"></path>
                  <path d="M21 11V15C21 15.55 20.55 16 20 16C19.45 16 19 15.55 19 15V11C19 10.45 19.45 10 20 10C20.55 10 21 10.45 21 11Z" fill="inherit"></path>
                  <path d="M9.59998 7.60001H14.4C15.28 7.60001 16 6.88 16 6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6C8 6.88 8.71998 7.60001 9.59998 7.60001Z" fill="inherit"></path>
                </svg>
                Android
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 block h-4 md:w-6 md:h-6" width="25" height="25" viewBox="0 0 25 25" fill="currentcolor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.3906 24.1299C10.7494 24.1299 9.2033 23.8167 7.75237 23.1904C6.30935 22.564 5.03285 21.6998 3.92284 20.5977C2.82076 19.4877 1.95654 18.2112 1.33017 16.7681C0.703808 15.3172 0.390625 13.7711 0.390625 12.1299C0.390625 10.4887 0.703808 8.94656 1.33017 7.50354C1.95654 6.0526 2.82076 4.77606 3.92284 3.67399C5.02493 2.56398 6.29745 1.69579 7.74047 1.06943C9.19141 0.443063 10.7375 0.129883 12.3787 0.129883C14.0279 0.129883 15.574 0.443063 17.017 1.06943C18.4679 1.69579 19.7444 2.56398 20.8465 3.67399C21.9566 4.77606 22.8247 6.0526 23.4511 7.50354C24.0775 8.94656 24.3906 10.4887 24.3906 12.1299C24.3906 13.7711 24.0775 15.3172 23.4511 16.7681C22.8247 18.2112 21.9566 19.4877 20.8465 20.5977C19.7444 21.6998 18.4679 22.564 17.017 23.1904C15.574 23.8167 14.0319 24.1299 12.3906 24.1299ZM12.3906 22.4173C13.8178 22.4173 15.1498 22.1477 16.3867 21.6086C17.6315 21.0774 18.7256 20.344 19.6691 19.4084C20.6206 18.4649 21.3579 17.3747 21.8812 16.1378C22.4124 14.893 22.6781 13.5571 22.6781 12.1299C22.6781 10.7027 22.4124 9.37073 21.8812 8.13385C21.35 6.88906 20.6126 5.79491 19.6691 4.85141C18.7256 3.90788 17.6315 3.17052 16.3867 2.6393C15.1419 2.10808 13.8059 1.84247 12.3787 1.84247C10.9595 1.84247 9.62752 2.10808 8.38272 2.6393C7.13789 3.17052 6.04772 3.90788 5.11213 4.85141C4.17655 5.79491 3.44315 6.88906 2.91193 8.13385C2.38072 9.37073 2.11511 10.7027 2.11511 12.1299C2.11511 13.5571 2.38072 14.893 2.91193 16.1378C3.44315 17.3747 4.17655 18.4649 5.11213 19.4084C6.05563 20.344 7.14584 21.0774 8.38272 21.6086C9.62752 22.1477 10.9635 22.4173 12.3906 22.4173ZM7.27664 18.1596C7.02292 18.2785 6.80489 18.3063 6.62254 18.2429C6.4481 18.1795 6.3292 18.0566 6.26575 17.8742C6.21026 17.6839 6.23802 17.4699 6.34901 17.232L9.78608 10.3103C9.97635 9.93763 10.238 9.67202 10.571 9.51342L17.4689 6.08824C17.8574 5.90589 18.1548 5.92177 18.3609 6.13582C18.575 6.34992 18.5908 6.64325 18.4085 7.01591L14.9833 13.9376C14.8009 14.2865 14.5393 14.5442 14.1984 14.7107L7.27664 18.1596ZM12.3906 13.5927C12.7871 13.5927 13.128 13.45 13.4134 13.1646C13.6989 12.8792 13.8416 12.5343 13.8416 12.1299C13.8416 11.7255 13.6989 11.3846 13.4134 11.1071C13.128 10.8217 12.7871 10.6789 12.3906 10.6789C11.9863 10.6789 11.6414 10.8217 11.356 11.1071C11.0705 11.3846 10.9278 11.7255 10.9278 12.1299C10.9278 12.5343 11.0705 12.8792 11.356 13.1646C11.6414 13.45 11.9863 13.5927 12.3906 13.5927Z" fill="inherit"></path>
                </svg>
                Web
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 block h-4 md:w-6 md:h-6" width="24" height="24" viewBox="0 0 24 24" fill="currentcolor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.9753 18.3765C12.8059 18.3848 12.6027 18.3932 12.3994 18.3932C10.1299 18.3932 8.5801 17.7518 7.68243 17.2103C7.26747 16.9604 6.90332 16.6855 6.58151 16.3773C6.47989 16.2774 6.38673 16.1858 6.31052 16.0941C6.29358 16.0775 6.28511 16.0608 6.27664 16.0525L6.21736 15.9692C6.14114 15.8692 6.11574 15.7443 6.13267 15.6193C6.14961 15.4944 6.22583 15.3861 6.32745 15.3194C6.53917 15.1695 6.83557 15.2195 6.988 15.4277C7.00494 15.4527 7.02188 15.4694 7.04728 15.4944C7.08963 15.5444 7.15737 15.6193 7.259 15.711C7.43684 15.8859 7.74171 16.1441 8.19054 16.4107C8.98659 16.8855 10.3585 17.4519 12.4079 17.4519C12.5688 17.4519 12.7382 17.4519 12.933 17.4352C12.916 16.8938 12.8991 16.3107 12.8991 15.661V13.7284H11.0275C10.4263 13.7284 9.94354 13.2536 9.94354 12.6622V10.6631C9.94354 6.82299 11.2562 3.72428 12.12 2H7.93649C4.65067 2.00833 2 4.61558 2 7.83923V16.1691C2 19.3928 4.65067 22 7.92802 22H14C13.458 21.0171 13.1193 20.2674 12.9753 18.3765ZM6.13267 8.25573C6.13267 7.97251 6.3698 7.73928 6.65773 7.73928C6.94566 7.73928 7.18278 7.97251 7.18278 8.25573V9.9217C7.18278 10.2049 6.94566 10.4382 6.65773 10.4382C6.3698 10.4382 6.13267 10.2049 6.13267 9.9217V8.25573Z" fill="inherit"></path>
                  <path d="M16.2491 2H13.2378C12.4645 3.51667 11 6.68333 11 10.6667V12.6667C11 12.6667 11.0082 12.6917 11.0247 12.6917H13.8714V15.6667C13.8714 16.2833 13.8714 16.825 13.896 17.3333C14.8669 17.175 15.7307 16.8667 16.463 16.4083C16.8908 16.1417 17.187 15.8833 17.368 15.7083C17.4667 15.6167 17.5325 15.5417 17.5737 15.4917C17.5901 15.4667 17.6066 15.45 17.6148 15.4333H17.623C17.7711 15.2083 18.0591 15.1667 18.2648 15.3167C18.3635 15.3917 18.4293 15.5 18.454 15.6167C18.4705 15.7083 18.454 15.7917 18.4211 15.875L18.38 15.9417C18.38 15.9417 18.3717 15.9583 18.3635 15.9667L18.3059 16.05C18.3059 16.05 18.2812 16.075 18.273 16.0917C18.2236 16.1583 18.1331 16.25 18.0097 16.375C17.804 16.5833 17.442 16.8917 16.9402 17.2083C16.0763 17.7417 15.0643 18.1 13.9372 18.275C14.0688 20.1417 14.3979 20.7417 14.982 21.8083C15.015 21.875 15.0479 21.9417 15.089 22H16.2408C19.4248 22 22 19.3917 22 16.1667V7.83333C22 4.60833 19.4248 2 16.2408 2H16.2491ZM17.9933 9.91667C17.9933 10.2 17.7629 10.4333 17.4832 10.4333C17.2034 10.4333 16.9731 10.2 16.9731 9.91667V8.25C16.9731 7.96667 17.2034 7.73333 17.4832 7.73333C17.7629 7.73333 17.9933 7.96667 17.9933 8.25V9.91667Z" fill="inherit"></path>
                </svg>
                macOS
              </div>
            </div>

            <div className="mt-8 text-slate-400 leading-[1.35] text-sm flex items-center gap-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-medical-500 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <span className="text-slate-300">Trusted by<br/>10,000+ médicos</span>
              </div>
            </div>
          </div>

          {/* Mockup de Dispositivos */}
          <div className="relative lg:flex lg:justify-end">
            <div className="lg:max-w-md xl:max-w-lg relative">
              {/* Laptop ao fundo */}
              <div className="absolute -top-8 -right-8 transform rotate-3 opacity-60 scale-75">
                <div className="bg-slate-900 rounded-lg p-2 shadow-2xl border border-slate-700">
                  <div className="bg-slate-800 rounded border border-slate-600 p-3">
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-700 rounded"></div>
                      <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                      <div className="h-2 bg-medical-600 rounded w-1/2"></div>
                      <div className="h-2 bg-slate-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Celular na frente */}
              <div className="relative z-10 transform -rotate-2">
                <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-700 mx-auto max-w-xs">
                  {/* Notch do celular */}
                  <div className="bg-black rounded-t-2xl h-6 flex items-center justify-center">
                    <div className="w-16 h-2 bg-black rounded-full"></div>
                  </div>

                  {/* Tela do celular */}
                  <div className="bg-slate-800 rounded-b-2xl p-4">
                    {/* Header da página */}
                    <div className="bg-slate-700 rounded-lg p-2 mb-3">
                      <div className="flex justify-between items-center">
                        <div className="h-1 bg-slate-600 rounded w-6"></div>
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                          <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                          <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Conteúdo da página */}
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="h-2 bg-slate-600 rounded w-3/4 mx-auto mb-2"></div>
                        <div className="h-1 bg-medical-600 rounded w-1/2 mx-auto"></div>
                      </div>

                      <div className="bg-slate-700 rounded-lg p-2">
                        <div className="space-y-1">
                          <div className="h-1 bg-slate-600 rounded"></div>
                          <div className="h-1 bg-slate-600 rounded w-4/5"></div>
                          <div className="h-1 bg-medical-500 rounded w-2/3"></div>
                        </div>
                      </div>

                      <div className="bg-slate-700 rounded-lg p-2">
                        <div className="space-y-1">
                          <div className="h-1 bg-slate-600 rounded"></div>
                          <div className="h-1 bg-slate-600 rounded w-3/4"></div>
                        </div>
                      </div>

                      {/* Botão no final */}
                      <div className="bg-medical-600 rounded-lg h-8 flex items-center justify-center">
                        <div className="h-1 bg-white rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero