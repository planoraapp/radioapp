import { useEffect, useRef, useState } from 'react';
import { RadioStation } from '../data/radios';

// Helper para logs apenas em desenvolvimento
const logError = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args);
  }
};

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  nowPlaying: { artist: string; title: string } | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setStation: (station: RadioStation | null) => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [nowPlaying, setNowPlaying] = useState<{ artist: string; title: string } | null>(null);

  // Criar elemento de áudio uma vez
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'none';
      // Removido crossOrigin = 'anonymous' para permitir tocar streams sem CORS habilitado
      // Isso conserta o erro "Format not supported" em muitas estações
      // audioRef.current.crossOrigin = 'anonymous';

      // Função para parsear StreamTitle no formato "Artista - Título" ou "Título"
      const parseStreamTitle = (streamTitle: string) => {
        if (!streamTitle || streamTitle.trim() === '') {
          setNowPlaying(null);
          return;
        }

        // Formato comum: "Artista - Título" ou "Artista - Título - Álbum"
        // Também pode ser apenas "Título" ou "Artista: Título"
        const separators = [' - ', ' – ', ' — ', ': ', ' | '];
        let artist = '';
        let title = streamTitle.trim();

        for (const sep of separators) {
          const parts = streamTitle.split(sep);
          if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts.slice(1).join(sep).trim();
            // Remover informações extras como " - Álbum" se houver mais separadores
            for (const sep2 of separators) {
              if (title.includes(sep2)) {
                title = title.split(sep2)[0].trim();
              }
            }
            break;
          }
        }

        // Se não encontrou separador, tratar tudo como título
        if (!artist) {
          artist = '';
          title = streamTitle.trim();
        }

        setNowPlaying({ artist, title });
      };

      // Função para verificar metadados disponíveis
      const checkMetadata = () => {
        if (!audioRef.current) return;

        try {
          const audio = audioRef.current as any;

          // Método 1: Firefox expõe metadados através de mozGetMetadata()
          if (typeof audio.mozGetMetadata === 'function') {
            try {
              const metadata = audio.mozGetMetadata();
              if (metadata && metadata.streamTitle) {
                parseStreamTitle(metadata.streamTitle);
                return;
              }
            } catch (e) {
              // Ignorar erros
            }
          }

          // Método 2: Tentar ler de propriedade title se disponível
          if (audio.title && audio.title !== audio.src && !audio.title.startsWith('http')) {
            parseStreamTitle(audio.title);
            return;
          }

          // Método 3: Tentar acessar metadados através de eventos customizados
          // Alguns navegadores expõem metadados através de eventos
          // (Não há API padrão, então dependemos de recursos específicos do navegador)
        } catch (e) {
          // Ignorar erros ao tentar acessar metadados
        }
      };

      // Interval para verificar metadados periodicamente
      let metadataInterval: NodeJS.Timeout | null = null;

      // Event listeners
      audioRef.current.addEventListener('loadstart', () => {
        setIsLoading(true);
        setError(null);
        setNowPlaying(null); // Limpar metadados anteriores

        // Tentar buscar metadados de endpoint JSON da estação (Icecast/Shoutcast)
        if (audioRef.current && audioRef.current.src && audioRef.current.src !== '') {
          fetchStationMetadata(audioRef.current.src, parseStreamTitle).catch(() => {
            // Ignorar erros silenciosamente
          });
        }
      });

      audioRef.current.addEventListener('canplay', () => {
        setIsLoading(false);
      });

      audioRef.current.addEventListener('play', () => {
        setIsPlaying(true);
        // Verificar metadados a cada 15 segundos enquanto está tocando
        // (reduzido para evitar sobrecarga e violações de performance)
        metadataInterval = setInterval(() => {
          checkMetadata();
          // Tentar buscar de endpoint JSON também (apenas se não tiver metadados ainda)
          if (audioRef.current && audioRef.current.src) {
            // Verificar estado atual de nowPlaying através de uma função
            // (não podemos usar nowPlaying diretamente aqui por causa do closure)
            fetchStationMetadata(audioRef.current.src, parseStreamTitle).catch(() => {
              // Ignorar erros silenciosamente
            });
          }
        }, 15000); // A cada 15 segundos para reduzir carga
        checkMetadata(); // Verificar imediatamente
        // Tentar buscar de endpoint JSON uma vez ao iniciar
        if (audioRef.current && audioRef.current.src) {
          fetchStationMetadata(audioRef.current.src, parseStreamTitle).catch(() => {
            // Ignorar erros
          });
        }
      });

      audioRef.current.addEventListener('pause', () => {
        setIsPlaying(false);
        if (metadataInterval) {
          clearInterval(metadataInterval);
          metadataInterval = null;
        }
      });

      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          setDuration(audioRef.current.duration || 0);
        }
        // Não verificar metadados durante timeupdate para evitar violações de performance
        // Metadados são verificados periodicamente no interval e em eventos específicos
      });

      audioRef.current.addEventListener('error', (e) => {
        setIsLoading(false);
        setIsPlaying(false);
        const audioError = audioRef.current?.error;
        if (audioError) {
          // Ignorar erros de abort que são normais ao mudar de estação
          if (audioError.code === MediaError.MEDIA_ERR_ABORTED) {
            return; // Não definir erro para abortos (mudanças normais)
          }

          let errorMessage = 'Erro ao carregar o stream de rádio';
          switch (audioError.code) {
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = 'Erro de rede ao carregar o stream';
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = 'Erro ao decodificar o stream';
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Formato de stream não suportado';
              break;
          }
          // Só mostrar erros importantes (não abortos)
          setError(errorMessage);
          // Log apenas erros importantes
          if (audioError.code !== MediaError.MEDIA_ERR_ABORTED) {
            logError('Erro de áudio:', errorMessage, audioError);
          }
        }
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const setStation = (station: RadioStation | null) => {
    if (audioRef.current) {
      // Se já está tocando uma rádio, pausar
      if (isPlaying) {
        audioRef.current.pause();
      }

      if (station && typeof station.url === 'string' && station.url.trim() !== '') {
        // Atualizar URL do áudio
        audioRef.current.src = station.url;
        audioRef.current.load(); // Recarregar o elemento
        setCurrentStation(station);
        setError(null);
      } else {
        audioRef.current.src = '';
        audioRef.current.load();
        setCurrentStation(null);
        setIsPlaying(false);
        if (station) {
          setError('Estação sem URL de stream');
        } else {
          setError(null);
        }
      }
    }
  };

  const play = () => {
    if (audioRef.current && currentStation) {
      audioRef.current.play().catch((err) => {
        // Ignorar erros de abort que são normais ao mudar de estação rapidamente
        if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
          // Não mostrar erro para abortos ou permissões negadas
          return;
        }
        // Só logar e mostrar erros importantes
        if (err.message && !err.message.includes('interrupted') && !err.message.includes('Abort')) {
          logError('Erro ao reproduzir:', err);
          setError('Erro ao iniciar reprodução. Verifique se o stream está disponível.');
        }
        setIsPlaying(false);
      });
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const toggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // Atualizar URL quando a estação mudar (sem tocar automaticamente)
  useEffect(() => {
    if (currentStation && audioRef.current && audioRef.current.src !== currentStation.url) {
      pause(); // Sempre pausar ao mudar de estação
      audioRef.current.src = currentStation.url;
      audioRef.current.load();
      setIsPlaying(false); // Garantir que não está tocando
    }
  }, [currentStation]);

  return {
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    nowPlaying,
    play,
    pause,
    toggle,
    setStation,
  };
}

/**
 * Tenta buscar metadados de endpoint JSON da estação (Icecast/Shoutcast)
 * Muitas estações expõem /status-json.xsl ou /7.html que contém informações sobre o que está tocando
 */
async function fetchStationMetadata(
  streamUrl: string,
  onMetadata: (streamTitle: string) => void
): Promise<void> {
  try {
    // Tentar extrair URL base do stream
    let baseUrl: string;
    try {
      const url = new URL(streamUrl);
      baseUrl = `${url.protocol}//${url.host}${url.port ? `:${url.port}` : ''}`;
    } catch {
      // Se não for URL válida, não tentar buscar metadados
      return;
    }

    // Endpoints comuns para metadados de estações de rádio
    const metadataEndpoints = [
      `${baseUrl}/status-json.xsl`, // Icecast
      `${baseUrl}/status-json.xsl?mount=/${streamUrl.split('/').pop()}`, // Icecast com mount
      `${baseUrl}/7.html`, // Shoutcast (precisa parsing HTML)
      `${baseUrl}/stats?json=1`, // Alternativa
    ];

    // Tentar buscar de cada endpoint (paralelo, mas parar no primeiro sucesso)
    for (const endpoint of metadataEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();

            // Icecast formato
            if (data.icestats?.source) {
              const source = Array.isArray(data.icestats.source)
                ? data.icestats.source[0]
                : data.icestats.source;
              if (source?.yp_currently_playing || source?.server_name) {
                const title = source.yp_currently_playing || source.server_description || '';
                if (title) {
                  onMetadata(title);
                  return; // Sucesso, parar
                }
              }
            }

            // Outros formatos JSON
            if (data.nowplaying || data.current_track) {
              const title = data.nowplaying || data.current_track || '';
              if (title) {
                onMetadata(title);
                return; // Sucesso, parar
              }
            }

            // Shoutcast formato alternativo
            if (data.ServerStatus?.StreamStatus) {
              const streamStatus = data.ServerStatus.StreamStatus;
              if (streamStatus.SONGTITLE) {
                onMetadata(streamStatus.SONGTITLE);
                return; // Sucesso, parar
              }
            }
          }
        }
      } catch (e) {
        // Continuar tentando outros endpoints
        continue;
      }
    }
  } catch (e) {
    // Ignorar todos os erros - muitos streams não têm endpoints de metadados
    // ou têm CORS restritivo, isso é esperado
  }
}
