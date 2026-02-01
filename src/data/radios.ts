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
  isMajor?: boolean; // Estações maiores/principais
}

export const RADIO_STATIONS: RadioStation[] = [];
