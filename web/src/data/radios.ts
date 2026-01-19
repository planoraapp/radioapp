export interface RadioStation {
  id: string;
  name: string;
  city: string;
  country: string;
  frequency: string;
  latitude: number;
  longitude: number;
  url: string;
  logo?: string;
}

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'radio-1',
    name: 'BBC Radio 1',
    city: 'London',
    country: 'Reino Unido',
    frequency: '97.7 FM',
    latitude: 51.5074,
    longitude: -0.1278,
    url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',
    logo: 'https://www.bbc.co.uk/radio1/static/images/bbc_radio_one_og.png'
  },
  {
    id: 'radio-2',
    name: 'Radio France Inter',
    city: 'Paris',
    country: 'França',
    frequency: '87.8 FM',
    latitude: 48.8566,
    longitude: 2.3522,
    url: 'https://direct.franceinter.fr/live/franceinter-midfi.mp3',
    logo: 'https://www.franceinter.fr/sites/all/themes/franceinter/images/logo-france-inter.png'
  },
  {
    id: 'radio-3',
    name: 'Radio Nacional de España',
    city: 'Madrid',
    country: 'Espanha',
    frequency: '88.5 FM',
    latitude: 40.4168,
    longitude: -3.7038,
    url: 'https://rtveh.streaming.rtve.es/rne1/main.m3u8',
    logo: 'https://www.rtve.es/radio/img/logos/rne1.png'
  },
  {
    id: 'radio-4',
    name: 'Radio Italia',
    city: 'Milão',
    country: 'Itália',
    frequency: '102.7 FM',
    latitude: 45.4642,
    longitude: 9.1900,
    url: 'https://radioitalia-lh.akamaihd.net/i/radioitalia_1@73018/master.m3u8',
    logo: 'https://www.radioitalia.it/assets/images/logo-radio-italia.png'
  },
  {
    id: 'radio-5',
    name: 'Bayern 3',
    city: 'Munique',
    country: 'Alemanha',
    frequency: '99.2 FM',
    latitude: 48.1351,
    longitude: 11.5820,
    url: 'https://br-br3-live.cast.addradio.de/br/br3/live/mp3/128/stream.mp3',
    logo: 'https://www.br.de/static/img/bayern3/logo-bayern3.png'
  },
  {
    id: 'radio-6',
    name: 'Radio Canada',
    city: 'Toronto',
    country: 'Canadá',
    frequency: '95.1 FM',
    latitude: 43.6532,
    longitude: -79.3832,
    url: 'https://cbc_r1_tor.akacast.akamaistream.net/7/632/451661/v1/rc.akacast.akamaistream.net/cbc_r1_tor',
    logo: 'https://www.cbc.ca/radio/img/cbc-radio-one-logo.png'
  },
  {
    id: 'radio-7',
    name: 'Radio Globo',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    frequency: '98.1 FM',
    latitude: -22.9068,
    longitude: -43.1729,
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/GLOBORADIO.mp3',
    logo: 'https://www.radioglobo.com.br/assets/images/logo-radio-globo.png'
  },
  {
    id: 'radio-8',
    name: 'Rádio Tupi',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    frequency: '1280 AM',
    latitude: -22.9068,
    longitude: -43.1729,
    url: 'https://streaming.live365.com/a05533',
    logo: 'https://www.tupi.fm.br/assets/images/logo-radio-tupi.png'
  }
];
