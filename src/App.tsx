import React, { useState, useEffect, useRef } from 'react';
import GlobeView from './components/GlobeView';
import { RADIO_STATIONS, RadioStation } from './data/radios';
import { Play, Pause, SkipForward, SkipBack, Menu, Search, ArrowLeft, Heart, Share2, ChevronRight, ArrowRight, X, Settings, User, Star, Loader2 } from 'lucide-react';
import { getPopularStationsWorldwide, getStationsFromMultipleCountries, discoverServers, getCountries, getAllStations, getPopularStationsInitial, getPopularStationsPrioritized } from './services/radioBrowserService';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import './App.css';

// Helper para logs apenas em desenvolvimento
const log = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

const logError = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args);
  }
};

type View = 'home' | 'countries' | 'player';

function App() {
  const [view, setView] = useState<View>('home');
  const [selectedRadio, setSelectedRadio] = useState<RadioStation | null>(null);
  const [frequency, setFrequency] = useState(94.4);
  const [selectedBand, setSelectedBand] = useState<'FM' | 'AM'>('FM');
  const [favorites, setFavorites] = useState<RadioStation[]>([]);
  const [currentSong, setCurrentSong] = useState({ artist: 'Bob Dylan', title: 'One More Cup of Coffee' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedRadioHome, setSelectedRadioHome] = useState<RadioStation | null>(null);
  const [selectorPosition, setSelectorPosition] = useState<{ x: number; y: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [centerLocation, setCenterLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radioStations, setRadioStations] = useState<RadioStation[]>(RADIO_STATIONS); // Inicia com dados estáticos
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [countriesFilter, setCountriesFilter] = useState<'all' | 'favorites'>('all'); // Novo: filtro de países/favoritos
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null); // País selecionado para ver rádios
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const countriesTitleRef = useRef<HTMLHeadingElement>(null);
  const favouritesTitleRef = useRef<HTMLHeadingElement>(null);
  const [barStyle, setBarStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const loadingApiRef = useRef(false); // Evita dupla chamada (ex.: React Strict Mode)

  // Hook de áudio
  const audioPlayer = useAudioPlayer();
  const { isPlaying, isLoading: isLoadingAudio, error: audioError, nowPlaying } = audioPlayer;

  // Carregar estações da API Radio Browser
  // Primeiro carrega do cache (instantâneo), depois atualiza da API em background
  useEffect(() => {
    // Carregar do cache imediatamente para exibição rápida
    const loadFromCache = () => {
      try {
        const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 horas
        const MIN_STATIONS_VALID = 100;

        // Preferir cache prioritizado (16k+ estações), depois cache "all"
        const candidates: { key: string; tsKey: string }[] = [
          { key: 'radio_browser_stations_prioritized_cache', tsKey: 'radio_browser_stations_prioritized_timestamp' },
          { key: 'radio_browser_all_stations_cache', tsKey: 'radio_browser_all_stations_timestamp' },
        ];

        for (const { key: CACHE_KEY, tsKey: CACHE_TIMESTAMP_KEY } of candidates) {
          const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
          const cachedStations = localStorage.getItem(CACHE_KEY);
          if (!cachedTimestamp || !cachedStations) continue;

          const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
          if (cacheAge >= CACHE_DURATION) continue;

          const stations = JSON.parse(cachedStations);
          if (stations.length < MIN_STATIONS_VALID) continue;

          log(`[App] Carregadas ${stations.length} estações do cache (carregamento rápido)`);
          setRadioStations(stations);
          return true;
        }
      } catch (error) {
        logError('[App] Erro ao carregar do cache:', error);
      }
      return false;
    };

    const loadStationsFromAPI = async () => {
      if (loadingApiRef.current) return;
      loadingApiRef.current = true;
      setIsLoadingStations(true);
      try {
        await discoverServers();

        // Carregamento progressivo: globo atualiza a cada lote; loading some após primeira leva
        const onProgress = (stations: RadioStation[]) => {
          setRadioStations([...stations]);
          if (stations.length >= 500 && loadingApiRef.current) {
            setIsLoadingStations(false); // Primeira leva visível → tirar loading
          }
        };

        log('[App] Iniciando busca de estações priorizadas (até 20k, em paralelo)...');
        const apiStations = await getPopularStationsPrioritized(20000, undefined, onProgress);

        log(`[App] API retornou ${apiStations.length} estações`);
        if (apiStations.length > 0) {
          setRadioStations(apiStations);
        } else {
          log('[App] AVISO: Nenhuma estação retornada da API!');
        }
      } catch (error) {
        logError('[App] Erro ao carregar estações da API:', error);
      } finally {
        setIsLoadingStations(false);
        loadingApiRef.current = false;
      }
    };

    // Caches usados: prioritizado (16k+) e all; não limpar o prioritizado
    try {
      const oldCacheKeys = [
        'radio_browser_stations_cache',
        'radio_browser_stations_timestamp'
      ];
      oldCacheKeys.forEach(key => {
        if (localStorage.getItem(key)) localStorage.removeItem(key);
      });
    } catch (e) {
      logError('[App] Erro ao limpar cache antigo:', e);
    }
    
    // Carregar do cache primeiro (instantâneo)
    const cacheLoaded = loadFromCache();
    
    // Se cache não foi encontrado ou está expirado, carregar da API imediatamente
    // Se cache foi carregado, atualizar da API em background
    if (!cacheLoaded) {
      log('[App] Cache não encontrado - carregando da API imediatamente');
      loadStationsFromAPI();
    } else {
      log('[App] Cache carregado - atualizando da API em background');
      // Carregar da API em background (atualizar com dados mais recentes)
      setTimeout(() => {
        loadStationsFromAPI();
      }, 1000); // Aguardar 1 segundo para não bloquear renderização inicial
    }

    // Atualização periódica das estações (a cada 6 horas)
    const updateInterval = setInterval(() => {
      log('Atualizando estações periodicamente...');
      loadStationsFromAPI();
    }, 6 * 60 * 60 * 1000); // 6 horas

    return () => clearInterval(updateInterval);
  }, []);

  // Favoritar 5 rádios automaticamente quando as estações forem carregadas
  useEffect(() => {
    if (radioStations.length > 0 && favorites.length === 0) {
      // Selecionar 5 rádios variados (diferentes países)
      const stationsToFavorite = radioStations
        .filter((radio, index, self) => {
          // Evitar duplicatas do mesmo país
          return index === self.findIndex(r => r.country === radio.country);
        })
        .slice(0, 5);
      
      if (stationsToFavorite.length > 0) {
        setFavorites(stationsToFavorite);
        log(`Adicionadas ${stationsToFavorite.length} rádios aos favoritos automaticamente`);
      }
    }
  }, [radioStations, favorites.length]);

  // Atualizar posição e largura da barra baseado no título ativo
  useEffect(() => {
    const updateBarPosition = () => {
      if (countriesFilter === 'all' && countriesTitleRef.current) {
        const rect = countriesTitleRef.current.getBoundingClientRect();
        const headerRect = countriesTitleRef.current.parentElement?.getBoundingClientRect();
        if (headerRect) {
          setBarStyle({
            left: rect.left - headerRect.left,
            width: rect.width
          });
        }
      } else if (countriesFilter === 'favorites' && favouritesTitleRef.current) {
        const rect = favouritesTitleRef.current.getBoundingClientRect();
        const headerRect = favouritesTitleRef.current.parentElement?.getBoundingClientRect();
        if (headerRect) {
          setBarStyle({
            left: rect.left - headerRect.left,
            width: rect.width
          });
        }
      }
    };

    // Pequeno delay para garantir que o DOM foi renderizado
    const timeoutId = setTimeout(updateBarPosition, 0);
    window.addEventListener('resize', updateBarPosition);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateBarPosition);
    };
  }, [countriesFilter]);

  // Agrupar rádios por país
  const radiosByCountry = radioStations.reduce((acc, radio) => {
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

  // Preview: mostra a estação quando o círculo está próximo; limpa quando o usuário afasta
  const handleRadioPreview = (radio: RadioStation | null) => {
    setSelectedRadioHome(radio ?? null);
  };

  // Play: Carregar stream apenas quando usuário quer tocar
  // Mantém o usuário na visualização do globo (home)
  const handleRadioPlay = (radio: RadioStation) => {
    setSelectedRadio(radio);
    setSelectedRadioHome(radio); // Garantir que também atualiza o preview
    const freq = parseFloat(radio.frequency.replace(' FM', '').replace(' AM', '').replace(' MHz', ''));
    if (!isNaN(freq)) {
      setFrequency(freq);
    }
    // AGORA sim carregar o stream
    audioPlayer.setStation(radio);
    // Não mudar de view - usuário permanece no globo
  };

  // Função legada para compatibilidade com views antigas
  const handleRadioSelect = (radio: RadioStation) => {
    handleRadioPlay(radio);
  };

  const togglePlay = () => {
    const radioToPlay = selectedRadio || selectedRadioHome;
    if (radioToPlay) {
      // Se ainda não carregou o stream, carregar agora
      if (radioToPlay && (!selectedRadio || selectedRadio.id !== radioToPlay.id)) {
        handleRadioPlay(radioToPlay);
      }
      // Toggle play/pause
      audioPlayer.toggle();
    }
  };

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
          logError('Erro ao obter localização:', error);
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
              radios={radioStations}
              onRadioSelect={handleRadioPreview}
              selectedRadio={selectedRadioHome}
              onSelectionPosition={(position) => {
                setSelectorPosition(position);
              }}
              centerLocation={centerLocation}
            />
            {/* Círculo seletor sempre visível no centro; quando o usuário traz uma estação para perto dele, o globo desloca-se suavemente para fixá-la */}
            <div className="radio-selector-circle radio-selector-circle--fixed" aria-hidden />
          </div>

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
              <div className="home-player-content">
                <div className="home-player-info">
                  <div className="home-player-station">{selectedRadioHome.name}</div>
                  <div className="home-player-location">{selectedRadioHome.city}, {selectedRadioHome.country}</div>
                  <div className="home-player-frequency">{selectedRadioHome.frequency}</div>
                  {isLoadingAudio && (
                    <div className="home-preparing-message" aria-live="polite">
                      Preparando estação…
                    </div>
                  )}
                  {isPlaying && selectedRadio && !isLoadingAudio && (
                    <div className="home-player-now-playing" aria-label="Em reprodução">
                      <div className="home-now-playing-artist">
                        {nowPlaying?.artist || selectedRadio.name || 'Rádio'}
                      </div>
                      <div className="home-now-playing-title">
                        {nowPlaying?.title || (nowPlaying?.artist ? '' : 'Agora tocando')}
                      </div>
                      <div className="home-now-playing-station" style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                        {selectedRadio.city && selectedRadio.country
                          ? `${selectedRadio.city}, ${selectedRadio.country}`
                          : selectedRadio.country || selectedRadio.city || ''}
                      </div>
                    </div>
                  )}
                </div>
                <div className="home-player-controls">
                  <button
                    onClick={() => {
                      if (selectedRadioHome && !isLoadingAudio) {
                        if (!selectedRadio || selectedRadio.id !== selectedRadioHome.id) {
                          handleRadioPlay(selectedRadioHome);
                          setTimeout(() => {
                            audioPlayer.play();
                          }, 100);
                        } else {
                          togglePlay();
                        }
                      }
                    }}
                    className="home-play-button"
                    aria-label={isLoadingAudio ? 'Preparando' : isPlaying ? 'Pausar' : 'Reproduzir'}
                    aria-busy={isLoadingAudio}
                    disabled={isLoadingAudio}
                  >
                    {isLoadingAudio ? (
                      <Loader2 className="home-play-icon home-play-loading" size={28} aria-hidden />
                    ) : isPlaying ? (
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
              {isLoadingStations && (
                <div style={{ 
                  marginTop: '16px', 
                  fontSize: '12px', 
                  color: '#999',
                  textAlign: 'center' 
                }}>
                  Carregando estações da API...
                </div>
              )}
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
          <div className="header-icons" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '300px' }}>
            <input
              type="text"
              placeholder="Buscar país..."
              value={searchCountry}
              onChange={(e) => setSearchCountry(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '150px',
              }}
            />
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
          {/* Títulos com Dot Matrix */}
          <div className={`countries-filter-header ${countriesFilter === 'favorites' ? 'favourites-active' : 'countries-active'}`}>
            <h2 
              ref={countriesTitleRef}
              className={`countries-dot-title ${countriesFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCountriesFilter('all')}
            >
              COUNTRIES
            </h2>
            <h2 
              ref={favouritesTitleRef}
              className={`countries-dot-title countries-favourites-title ${countriesFilter === 'favorites' ? 'active' : ''}`}
              onClick={() => setCountriesFilter('favorites')}
            >
              FAVOURITES
            </h2>
            {/* Barra deslizante com posição e largura dinâmicas */}
            <div 
              className="countries-bar-indicator"
              style={{
                left: `${barStyle.left}px`,
                width: `${barStyle.width}px`
              }}
            />
          </div>

          {/* Container com animação de slide */}
          <div className={`countries-list-wrapper ${countriesFilter === 'favorites' ? 'slide-left' : 'slide-right'}`}>
            {/* Lista de países */}
            <div className="countries-list countries-list-all">
            {countriesFilter === 'all' ? (
              selectedCountry ? (
                // Mostrar país selecionado no topo + lista de rádios
                <>
                  <button
                    onClick={() => {
                      setSelectedCountry(null);
                      setSearchCountry('');
                    }}
                    className="country-item country-item-selected"
                  >
                    <ArrowLeft className="country-item-back-icon" />
                    {selectedCountry}
                    <sup className="country-count">({radiosByCountry[selectedCountry]?.length || 0})</sup>
                  </button>
                  {(() => {
                    const countryRadios = radiosByCountry[selectedCountry] || [];
                    const filteredRadios = countryRadios.filter(radio =>
                      searchCountry
                        ? radio.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
                          radio.city.toLowerCase().includes(searchCountry.toLowerCase())
                        : true
                    );
                    return filteredRadios.length === 0 ? (
                      <div className="countries-empty-state">
                        <p>{searchCountry ? 'Nenhuma rádio encontrada' : 'Nenhuma rádio disponível'}</p>
                      </div>
                    ) : (
                      filteredRadios.map((radio) => (
                        <button
                          key={radio.id}
                          onClick={() => {
                            // Selecionar a rádio no globo (preview)
                            handleRadioPreview(radio);
                            // Voltar para a tela home para ver o globo
                            setView('home');
                            setSelectedCountry(null);
                            setSearchCountry('');
                          }}
                          className="country-item radio-item"
                        >
                          <div className="radio-item-content">
                            <div className="radio-item-name">{radio.name}</div>
                            <div className="radio-item-location">{radio.city}, {radio.country}</div>
                            <div className="radio-item-frequency">{radio.frequency}</div>
                          </div>
                          <ChevronRight className="radio-item-arrow" />
                        </button>
                      ))
                    );
                  })()}
                </>
              ) : (
                // Mostrar todos os países
                countriesWithCount
                  .filter((country) =>
                    searchCountry
                      ? country.name.toLowerCase().includes(searchCountry.toLowerCase())
                      : true
                  )
                  .map((country) => (
                    <button
                      key={country.name}
                      onClick={() => {
                        setSelectedCountry(country.name);
                      }}
                      className="country-item"
                    >
                      {country.name}
                      <sup className="country-count">({country.count})</sup>
                    </button>
                  ))
              )
            ) : null}
            </div>
            
            {/* Lista de favoritos */}
            <div className="countries-list countries-list-favorites">
            {countriesFilter === 'favorites' ? (
              selectedCountry ? (
                // Mostrar país selecionado no topo + lista de rádios favoritas
                <>
                  <button
                    onClick={() => {
                      setSelectedCountry(null);
                      setSearchCountry('');
                    }}
                    className="country-item country-item-selected"
                  >
                    <ArrowLeft className="country-item-back-icon" />
                    {selectedCountry}
                    <sup className="country-count">({(() => {
                      const favoritesByCountry: { [key: string]: RadioStation[] } = {};
                      favorites.forEach(radio => {
                        const country = radio.country || 'Unknown';
                        if (!favoritesByCountry[country]) {
                          favoritesByCountry[country] = [];
                        }
                        favoritesByCountry[country].push(radio);
                      });
                      return favoritesByCountry[selectedCountry]?.length || 0;
                    })()})</sup>
                  </button>
                  {(() => {
                    const favoritesByCountry: { [key: string]: RadioStation[] } = {};
                    favorites.forEach(radio => {
                      const country = radio.country || 'Unknown';
                      if (!favoritesByCountry[country]) {
                        favoritesByCountry[country] = [];
                      }
                      favoritesByCountry[country].push(radio);
                    });
                    const countryRadios = favoritesByCountry[selectedCountry] || [];
                    const filteredRadios = countryRadios.filter(radio =>
                      searchCountry
                        ? radio.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
                          radio.city.toLowerCase().includes(searchCountry.toLowerCase())
                        : true
                    );
                    return filteredRadios.length === 0 ? (
                      <div className="countries-empty-state">
                        <p>{searchCountry ? 'Nenhuma rádio encontrada' : 'Nenhuma rádio disponível'}</p>
                      </div>
                    ) : (
                      filteredRadios.map((radio) => (
                        <button
                          key={radio.id}
                          onClick={() => {
                            // Selecionar a rádio no globo (preview)
                            handleRadioPreview(radio);
                            // Voltar para a tela home para ver o globo
                            setView('home');
                            setSelectedCountry(null);
                            setSearchCountry('');
                          }}
                          className="country-item radio-item"
                        >
                          <div className="radio-item-content">
                            <div className="radio-item-name">{radio.name}</div>
                            <div className="radio-item-location">{radio.city}, {radio.country}</div>
                            <div className="radio-item-frequency">{radio.frequency}</div>
                          </div>
                          <ChevronRight className="radio-item-arrow" />
                        </button>
                      ))
                    );
                  })()}
                </>
              ) : (
                // Mostrar rádios favoritas agrupadas por país
                favorites.length === 0 ? (
                  <div className="countries-empty-state">
                    <p>Nenhuma rádio favoritada ainda</p>
                  </div>
                ) : (
                  (() => {
                    // Agrupar favoritos por país
                    const favoritesByCountry: { [key: string]: RadioStation[] } = {};
                    favorites.forEach(radio => {
                      const country = radio.country || 'Unknown';
                      if (!favoritesByCountry[country]) {
                        favoritesByCountry[country] = [];
                      }
                      favoritesByCountry[country].push(radio);
                    });

                    const favoriteCountries = Object.keys(favoritesByCountry).map(country => ({
                      name: country,
                      count: favoritesByCountry[country].length
                    })).sort((a, b) => b.count - a.count);

                    return favoriteCountries
                      .filter((country) =>
                        searchCountry
                          ? country.name.toLowerCase().includes(searchCountry.toLowerCase())
                          : true
                      )
                      .map((country) => (
                        <button
                          key={country.name}
                          onClick={() => {
                            setSelectedCountry(country.name);
                          }}
                          className="country-item"
                        >
                          {country.name}
                          <sup className="country-count">({country.count})</sup>
                        </button>
                      ));
                  })()
                )
              )
            ) : null}
            </div>
          </div>
        </div>

        {/* Footer com total */}
        <div className="countries-footer">
          <div className="footer-total">
            <span className="footer-label">
              {selectedCountry ? 'Rádios' : 'All'}
            </span>
            <span className="footer-number">
              {selectedCountry 
                ? (() => {
                    if (countriesFilter === 'favorites') {
                      const favoritesByCountry: { [key: string]: RadioStation[] } = {};
                      favorites.forEach(radio => {
                        const country = radio.country || 'Unknown';
                        if (!favoritesByCountry[country]) {
                          favoritesByCountry[country] = [];
                        }
                        favoritesByCountry[country].push(radio);
                      });
                      return favoritesByCountry[selectedCountry]?.length || 0;
                    }
                    return radiosByCountry[selectedCountry]?.length || 0;
                  })()
                : radioStations.length}
            </span>
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
      {isPlaying && !isLoadingAudio && (
        <div className="now-playing">
          <div className="song-artist">
            {nowPlaying?.artist || selectedRadio?.name || 'Rádio'}
          </div>
          <div className="song-title">
            {nowPlaying?.title || (nowPlaying?.artist ? '' : 'Agora tocando')}
          </div>
          {!nowPlaying && selectedRadio && (selectedRadio.city || selectedRadio.country) && (
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
              {selectedRadio.city && selectedRadio.country 
                ? `${selectedRadio.city}, ${selectedRadio.country}`
                : selectedRadio.country || selectedRadio.city || ''}
            </div>
          )}
        </div>
      )}
      {isLoadingAudio && (
        <div className="player-preparing-message" aria-live="polite">
          Preparando estação…
        </div>
      )}

      {/* Controles */}
      <div className="player-controls">
        <button className="control-button">
          <SkipBack className="control-icon" />
        </button>

        <button
          onClick={() => !isLoadingAudio && togglePlay()}
          className="play-button"
          aria-label={isLoadingAudio ? 'Preparando' : isPlaying ? 'Pausar' : 'Reproduzir'}
          aria-busy={isLoadingAudio}
          disabled={isLoadingAudio}
        >
          {isLoadingAudio ? (
            <Loader2 className="play-icon play-icon-loading" size={40} aria-hidden />
          ) : isPlaying ? (
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
