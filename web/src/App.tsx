import React, { useState, useEffect, useRef } from 'react';
import GlobeView from './components/GlobeView';
import { RADIO_STATIONS, RadioStation } from './data/radios';
import { Play, Pause, SkipForward, SkipBack, Menu, Search, ArrowLeft, Heart, Share2, ChevronRight, ArrowRight, X, Settings, User, Star } from 'lucide-react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedRadioHome, setSelectedRadioHome] = useState<RadioStation | null>(null);
  const [selectorPosition, setSelectorPosition] = useState<{ x: number; y: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [centerLocation, setCenterLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const globeContainerRef = useRef<HTMLDivElement>(null);

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

  // Função para obter localização do usuário e centralizar no globo
  const handleCenterOnLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setCenterLocation({ latitude, longitude });
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          alert('Não foi possível obter sua localização. Verifique as permissões do navegador.');
        }
      );
    } else {
      alert('Geolocalização não é suportada por este navegador.');
    }
  };

  // ============================================
  // TELA 1: HOME SCREEN - Globo centralizado
  // ============================================
  if (view === 'home') {
    return (
      <div className="app-screen app-home">
        {/* Barra de navegação superior */}
        <div className="home-nav-bar">
          <button 
            onClick={() => setView('countries')}
            className="nav-countries-button"
          >
            Countries
          </button>
        </div>

        {/* Top Section - Branco com globo */}
        <div className="home-top-section">
          {/* Globo 3D - Aumentado e centralizado */}
          <div className="globe-container" ref={globeContainerRef}>
            <GlobeView
              radios={RADIO_STATIONS}
              onRadioSelect={(radio) => {
                setSelectedRadioHome(radio);
                setSelectedRadio(radio);
                const freq = parseFloat(radio.frequency.replace(' FM', '').replace(' AM', ''));
                setFrequency(freq);
              }}
              selectedRadio={selectedRadioHome}
              onSelectionPosition={(position) => {
                if (position && globeContainerRef.current) {
                  const containerRect = globeContainerRef.current.getBoundingClientRect();
                  const topSectionRect = globeContainerRef.current.closest('.home-top-section')?.getBoundingClientRect();
                  if (topSectionRect) {
                    // Converter posição do canvas para posição relativa ao home-top-section
                    const relativeX = position.x + (containerRect.left - topSectionRect.left);
                    const relativeY = position.y + (containerRect.top - topSectionRect.top);
                    setSelectorPosition({ x: relativeX, y: relativeY });
                  } else {
                    setSelectorPosition(position);
                  }
                } else {
                  setSelectorPosition(null);
                }
              }}
              centerLocation={centerLocation}
            />
          </div>

          {/* Círculo vermelho - Seletor de rádio (se move para o pin quando selecionado) */}
          <div 
            className="radio-selector-circle"
            style={
              selectorPosition
                ? {
                    left: `${selectorPosition.x}px`,
                    top: `${selectorPosition.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }
                : {
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }
            }
          ></div>

          {/* Ruler divider na parte inferior */}
          <div className="ruler-divider">
            {[...Array(40)].map((_, i) => (
              <div key={i} className="ruler-line" />
            ))}
          </div>

          {/* Botão de centralização na localização do usuário */}
          <button
            onClick={handleCenterOnLocation}
            className="location-center-button"
            title="Centralizar na minha localização"
            aria-label="Centralizar no globo na minha localização"
          >
            <img 
              src="/radio-antenna.svg" 
              alt="Antena de rádio" 
              className="location-center-icon"
            />
          </button>
        </div>

        {/* Bottom Section - Preto com texto ou player */}
        <div className="home-bottom-section">
          {selectedRadioHome ? (
            /* Player quando rádio selecionada */
            <div className="home-player">
              <div className="home-player-header">
                <button
                  onClick={() => {
                    setSelectedRadioHome(null);
                    setSelectedRadio(null);
                    setSelectorPosition(null);
                  }}
                  className="home-player-close"
                >
                  <X className="home-player-close-icon" />
                </button>
              </div>
              <div className="home-player-info">
                <div className="home-player-station">{selectedRadioHome.name}</div>
                <div className="home-player-location">{selectedRadioHome.city}, {selectedRadioHome.country}</div>
                <div className="home-player-frequency">{selectedRadioHome.frequency}</div>
              </div>
              {isPlaying && (
                <div className="home-player-now-playing">
                  <div className="home-now-playing-artist">{currentSong.artist}</div>
                  <div className="home-now-playing-title">{currentSong.title}</div>
                </div>
              )}
              <div className="home-player-controls">
                <button
                  onClick={togglePlay}
                  className="home-play-button"
                >
                  {isPlaying ? (
                    <Pause className="home-play-icon" fill="currentColor" />
                  ) : (
                    <Play className="home-play-icon" fill="currentColor" />
                  )}
                </button>
                <button
                  onClick={() => {
                    if (selectedRadioHome) {
                      if (favorites.some(fav => fav.id === selectedRadioHome.id)) {
                        setFavorites(favorites.filter(fav => fav.id !== selectedRadioHome.id));
                      } else {
                        setFavorites([...favorites, selectedRadioHome]);
                      }
                    }
                  }}
                  className={`home-favorite-button ${favorites.some(fav => fav.id === selectedRadioHome.id) ? 'active' : ''}`}
                >
                  <Heart className={`home-favorite-icon ${favorites.some(fav => fav.id === selectedRadioHome.id) ? 'filled' : ''}`} />
                </button>
              </div>
            </div>
          ) : (
            /* Texto padrão quando nenhuma rádio selecionada */
            <>
              <div className="color-circles">
                <div className="circle-small"></div>
                <div className="circle-large"></div>
              </div>
              <div className="listen-text">
                Listen <span className="text-gray-400">Online</span>
              </div>
              <div className="radio-text">
                Radio<span className="text-red-500">.</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // TELA 2: CHOOSE COUNTRY - Lista de países
  // ============================================
  if (view === 'countries') {
    return (
      <div className="app-screen app-countries">
        {/* Header */}
        <div className="countries-header">
          <div className="header-left">
            <button 
              className="icon-button"
              onClick={() => setView('home')}
            >
              <X className="icon" />
            </button>
            <h1 className="countries-title">Choose Country</h1>
          </div>
          <div className="header-icons">
            <button className="icon-button">
              <Search className="icon" />
            </button>
            <button 
              className="icon-button"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="icon" />
            </button>
          </div>
        </div>

        {/* Lista de países */}
        <div className="countries-list-container">
          <div className="countries-list">
            {countriesWithCount.map((country) => (
              <button
                key={country.name}
                onClick={() => {
                  const radios = radiosByCountry[country.name];
                  if (radios.length > 0) {
                    handleRadioSelect(radios[0]);
                  }
                }}
                className="country-item"
              >
                {country.name}
                <sup className="country-count">({country.count})</sup>
              </button>
            ))}
          </div>
        </div>

        {/* Footer com total */}
        <div className="countries-footer">
          <div className="footer-total">
            <span className="footer-label">All</span>
            <span className="footer-number">{RADIO_STATIONS.length}</span>
          </div>
        </div>

        {/* Go Premium Section */}
        <div className="premium-section">
          <button className="premium-button">
            <span>Go Premium</span>
            <ArrowRight className="premium-arrow" />
          </button>
        </div>

        {/* Menu Lateral */}
        {isMenuOpen && (
          <>
            <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}></div>
            <div className="side-menu">
              <div className="menu-header">
                <h2 className="menu-title">Menu</h2>
                <button 
                  className="menu-close-button"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="menu-close-icon" />
                </button>
              </div>

              <div className="menu-content">
                {/* Perfil do Usuário */}
                <button className="menu-item">
                  <User className="menu-item-icon" />
                  <span className="menu-item-text">Perfil</span>
                  <ChevronRight className="menu-item-arrow" />
                </button>

                {/* Favoritos */}
                <div className="menu-section">
                  <div className="menu-section-title">Favoritos ({favorites.length})</div>
                  {favorites.length === 0 ? (
                    <div className="menu-empty-state">
                      Nenhuma rádio favoritada ainda
                    </div>
                  ) : (
                    <div className="menu-favorites-list">
                      {favorites.map((radio) => (
                        <button
                          key={radio.id}
                          className="menu-favorite-item"
                          onClick={() => {
                            handleRadioSelect(radio);
                            setIsMenuOpen(false);
                          }}
                        >
                          <Star className="menu-favorite-icon" fill="currentColor" />
                          <div className="menu-favorite-info">
                            <div className="menu-favorite-name">{radio.name}</div>
                            <div className="menu-favorite-location">{radio.city}, {radio.country}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Configurações */}
                <button className="menu-item">
                  <Settings className="menu-item-icon" />
                  <span className="menu-item-text">Configurações</span>
                  <ChevronRight className="menu-item-arrow" />
                </button>

                {/* Sobre */}
                <button className="menu-item">
                  <span className="menu-item-text">Sobre o App</span>
                  <ChevronRight className="menu-item-arrow" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ============================================
  // TELA 3: RADIO PLAYER - Player completo
  // ============================================
  return (
    <div className="app-screen app-player">
      {/* Header */}
      <div className="player-header">
        <button onClick={() => setView('countries')} className="back-button">
          <ArrowLeft className="back-icon" />
          <span className="city-name">{selectedRadio?.city || 'Radio'}</span>
        </button>
        
        {/* Toggle FM/AM */}
        <div className="band-toggle">
          <button
            onClick={() => setSelectedBand('FM')}
            className={`toggle-button ${selectedBand === 'FM' ? 'active' : ''}`}
          >
            FM
          </button>
          <button
            onClick={() => setSelectedBand('AM')}
            className={`toggle-button ${selectedBand === 'AM' ? 'active' : ''}`}
          >
            AM
          </button>
        </div>
      </div>

      {/* Frequência grande */}
      <div className="frequency-display">
        <div className="frequency-number">
          <span className="frequency-zero">0</span>
          {frequency.toFixed(1)}
        </div>
        <div className="station-name">
          {selectedRadio?.name || 'No station selected'}
        </div>
      </div>

      {/* Tuner horizontal */}
      <div className="tuner-container">
        {/* Marcador central vermelho */}
        <div className="tuner-indicator"></div>

        {/* Botões laterais */}
        <button
          onClick={toggleFavorite}
          className={`tuner-button tuner-favorite ${isFavorite ? 'active' : ''}`}
        >
          <Heart className={`tuner-icon ${isFavorite ? 'filled' : ''}`} />
        </button>
        <button className="tuner-button tuner-share">
          <Share2 className="tuner-icon" />
        </button>

        {/* Barra de frequências */}
        <div
          ref={scrollRef}
          className="tuner-scroll"
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
              <div key={i} className="tuner-mark">
                <div className={`tuner-line ${isMajor ? 'major' : 'minor'}`}></div>
                {isMajor && (
                  <span className="tuner-number">{Math.floor(freqNum)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Informação da música */}
      {isPlaying && (
        <div className="now-playing">
          <div className="song-artist">{currentSong.artist}</div>
          <div className="song-title">{currentSong.title}</div>
        </div>
      )}

      {/* Controles */}
      <div className="player-controls">
        <button className="control-button">
          <SkipBack className="control-icon" />
        </button>

        <button
          onClick={togglePlay}
          className="play-button"
        >
          {isPlaying ? (
            <Pause className="play-icon" fill="currentColor" />
          ) : (
            <Play className="play-icon" fill="currentColor" />
          )}
        </button>

        <button className="control-button">
          <SkipForward className="control-icon" />
        </button>
      </div>
    </div>
  );
}

export default App;
