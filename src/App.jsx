import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import MedicalFeatures from './components/MedicalFeatures'
import UseCases from './components/UseCases'
import MedicalTemplates from './components/MedicalTemplates'
import TranscriptionPage from './components/TranscriptionPage'
import Footer from './components/Footer'

function AppContent() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-letterly-gray-50">
      <Routes>
        <Route path="/" element={
          <main>
            <Hero />
            <Features />
            <MedicalFeatures />
            <UseCases />
            <MedicalTemplates />
            <HowItWorks />
          </main>
        } />
        <Route path="/transcrever" element={<TranscriptionPage />} />
      </Routes>
      {location.pathname !== '/transcrever' && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App