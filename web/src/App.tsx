import React, { useState, useEffect, useRef } from 'react';
import GlobeView from './components/GlobeView';
import { RADIO_STATIONS, RadioStation } from './data/radios';
import { Play, Pause, SkipForward, SkipBack, Menu, Search, ArrowLeft, Heart, Share2 } from 'lucide-react';
import './App.css';

type View = 'home' | 'countries' | 'player';

function App() {
  const [view, setView] = useState<View>('home');
  const [selectedRadio, setSelectedRadio] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(94.4);
  const [selectedBand, setSelectedBand] = useState<'FM' | 'AM'>('FM');
  const [favorites, setFavorites] = useState<RadioStation[]>([]);
  const [currentSong, setCurrentSong] = useState({ artist: 'Bob Dylan', title: 'One More Cup of Coffee' });

  // Agrupar rádios por país
  const radiosByCountry = RADIO_STATIONS.reduce((acc, radio) => {
    const country = radio.country;
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(radio);
    return acc;
  }, {} as Record<string, RadioStation[]>);

  const countries = Object.keys(radiosByCountry);
  const countriesWithCount = countries.map(country => ({
    name: country,
    count: radiosByCountry[country].length
  }));

  // Frequências para o tuner
  const getFrequencies = () => {
    if (selectedBand === 'FM') {
      const freqs: string[] = [];
      for (let i = 880; i <= 1080; i += 2) {
        freqs.push((i / 10).toFixed(1));
      }
      return freqs;
    } else {
      const freqs: string[] = [];
      for (let i = 530; i <= 1700; i += 10) {
        freqs.push(i.toString());
      }
      return freqs;
    }
  };

  const frequencies = getFrequencies();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleRadioSelect = (radio: RadioStation) => {
    setSelectedRadio(radio);
    const freq = parseFloat(radio.frequency.replace(' FM', '').replace(' AM', ''));
    setFrequency(freq);
    setView('player');
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const toggleFavorite = () => {
    if (selectedRadio) {
      if (favorites.some(fav => fav.id === selectedRadio.id)) {
        setFavorites(favorites.filter(fav => fav.id !== selectedRadio.id));
      } else {
        setFavorites([...favorites, selectedRadio]);
      }
    }
  };

  const isFavorite = selectedRadio ? favorites.some(fav => fav.id === selectedRadio.id) : false;

  // Scroll para a frequência atual
  useEffect(() => {
    if (scrollRef.current && selectedRadio) {
      const freqIndex = frequencies.findIndex(f => parseFloat(f) === frequency);
      if (freqIndex > 0) {
        const scrollPosition = freqIndex * 48;
        scrollRef.current.scrollTo({ left: scrollPosition - scrollRef.current.offsetWidth / 2, behavior: 'smooth' });
      }
    }
  }, [frequency, selectedBand, frequencies]);

  // TELA INICIAL - Home com globo e países espalhados
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-white flex flex-col rounded-3xl overflow-hidden">
        {/* Top Section - Globo centralizado com países espalhados */}
        <div className="flex-1 relative bg-white overflow-hidden" style={{ minHeight: '60vh' }}>
          {/* Globo 3D centralizado */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-full max-w-md h-64">
              <GlobeView
                radios={RADIO_STATIONS}
                onRadioSelect={handleRadioSelect}
              />
            </div>
          </div>

          {/* Países espalhados ao redor */}
          <div className="absolute inset-0 p-8 z-0">
            {countries.map((country, index) => {
              const positions = [
                { top: '8%', left: '12%' },
                { top: '15%', left: '75%' },
                { top: '30%', left: '20%' },
                { top: '40%', left: '82%' },
                { top: '55%', left: '8%' },
                { top: '65%', left: '70%' },
                { top: '22%', left: '48%' },
                { top: '50%', left: '35%' },
              ];
              const pos = positions[index % positions.length];
              return (
                <button
                  key={country}
                  onClick={() => setView('countries')}
                  className="absolute text-gray-400 hover:text-black transition-colors font-medium text-sm uppercase tracking-wide"
                  style={pos}
                >
                  {country.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Ruler divider */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200">
            <div className="flex gap-1 px-4 py-1">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="w-px h-3 bg-gray-300" />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section - Preto com texto */}
        <div className="bg-black text-white px-8 pt-8 pb-16" style={{ minHeight: '40vh' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
          </div>
          <div className="text-5xl font-light mb-3 tracking-tight">
            Listen <span className="text-gray-400">Online</span>
          </div>
          <div className="text-9xl font-black tracking-tighter">
            Radio<span className="text-red-500">.</span>
          </div>
        </div>
      </div>
    );
  }

  // TELA DE LISTA DE PAÍSES
  if (view === 'countries') {
    return (
      <div className="min-h-screen bg-white rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h1 className="text-gray-600 font-medium text-base">Choose Country</h1>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de países */}
        <div className="px-6 py-4 pb-32">
          <div className="space-y-0">
            {countriesWithCount.map((country) => (
              <button
                key={country.name}
                onClick={() => {
                  const radios = radiosByCountry[country.name];
                  if (radios.length > 0) {
                    handleRadioSelect(radios[0]);
                  }
                }}
                className="w-full text-left py-5 text-3xl font-black text-black hover:text-gray-600 transition-colors leading-tight"
              >
                {country.name}
                <sup className="text-base font-normal text-gray-400 ml-2">({country.count})</sup>
              </button>
            ))}
          </div>
        </div>

        {/* Footer com total */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-6">
          <div className="flex items-center justify-end gap-2 mb-4">
            <span className="text-sm text-gray-400 font-medium">All</span>
            <span className="text-4xl font-black text-black">{RADIO_STATIONS.length}</span>
          </div>
        </div>
      </div>
    );
  }

  // TELA DO PLAYER
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <button onClick={() => setView('countries')} className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5 text-black" strokeWidth={2} />
          <span className="font-medium text-black text-base">{selectedRadio?.city || 'Radio'}</span>
        </button>
        
        {/* Toggle FM/AM */}
        <div className="flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setSelectedBand('FM')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedBand === 'FM'
                ? 'bg-black text-white'
                : 'bg-white text-black'
            }`}
          >
            FM
          </button>
          <button
            onClick={() => setSelectedBand('AM')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedBand === 'AM'
                ? 'bg-black text-white'
                : 'bg-white text-black'
            }`}
          >
            AM
          </button>
        </div>
      </div>

      {/* Frequência grande */}
      <div className="px-8 pt-8 pb-6 text-center">
        <div className="text-9xl font-black text-black mb-3 tracking-tighter" style={{ fontFamily: 'monospace' }}>
          <span className="text-gray-300 font-black">0</span>
          {frequency.toFixed(1)}
        </div>
        <div className="text-sm text-gray-400 mt-3 font-medium">
          {selectedRadio?.name || 'No station selected'}
        </div>
      </div>

      {/* Tuner horizontal */}
      <div className="relative px-6 pb-6">
        {/* Marcador central vermelho */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-0.5 h-10 bg-red-500 z-20 shadow-sm"></div>

        {/* Botões laterais */}
        <div className="absolute left-6 top-1 z-10">
          <button
            onClick={toggleFavorite}
            className={`p-2 ${isFavorite ? 'text-red-500' : 'text-gray-300'}`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} strokeWidth={2} />
          </button>
        </div>
        <div className="absolute right-6 top-1 z-10">
          <button className="p-2 text-gray-300">
            <Share2 className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Barra de frequências */}
        <div
          ref={scrollRef}
          className="flex items-end gap-6 overflow-x-auto no-scrollbar px-[45%] h-20 cursor-grab active:cursor-grabbing"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            const scrollLeft = target.scrollLeft;
            const index = Math.round(scrollLeft / 48);
            if (frequencies[index]) {
              setFrequency(parseFloat(frequencies[index]));
            }
          }}
        >
          {frequencies.map((freq, i) => {
            const freqNum = parseFloat(freq);
            const isMajor = selectedBand === 'FM' 
              ? Math.floor(freqNum) % 1 === 0 && freqNum % 1 === 0
              : parseInt(freq) % 100 === 0;
            return (
              <div key={i} className="flex flex-col items-center min-w-[14px]">
                <div className={`w-[1px] rounded-full ${
                  isMajor ? 'h-10 bg-gray-400' : 'h-5 bg-gray-200'
                }`}></div>
                {isMajor && (
                  <span className="text-xs mt-2 font-medium text-gray-400">
                    {Math.floor(freqNum)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Informação da música */}
      {isPlaying && (
        <div className="px-6 pb-8 text-center">
          <div className="text-xs text-gray-400 mb-1.5 font-medium">{currentSong.artist}</div>
          <div className="text-xl font-black text-black">{currentSong.title}</div>
        </div>
      )}

      {/* Controles */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-10">
        <div className="flex items-center justify-center gap-10">
          <button className="p-2 text-gray-400 hover:text-black transition-colors">
            <SkipBack className="w-7 h-7" strokeWidth={2.5} />
          </button>

          <button
            onClick={togglePlay}
            className="w-24 h-24 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-900 transition-colors shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10" fill="currentColor" />
            ) : (
              <Play className="w-10 h-10 ml-1" fill="currentColor" />
            )}
          </button>

          <button className="p-2 text-gray-400 hover:text-black transition-colors">
            <SkipForward className="w-7 h-7" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
