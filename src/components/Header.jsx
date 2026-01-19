import { useState } from 'react'

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <img alt="Documenta" className="h-8 w-auto" src="/documentalogo.png" />
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
    </header>
  )
}

export default Header