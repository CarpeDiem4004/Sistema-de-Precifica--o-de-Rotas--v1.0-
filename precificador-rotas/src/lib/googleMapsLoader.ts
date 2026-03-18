import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Coloque sua API Key no .env como VITE_GOOGLE_MAPS_API_KEY
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

let initialized = false;

function ensureInitialized() {
  if (!initialized) {
    setOptions({ key: GOOGLE_MAPS_API_KEY, v: 'weekly' });
    initialized = true;
  }
}

export async function loadRoutesLibrary() {
  ensureInitialized();
  return await importLibrary('routes') as google.maps.RoutesLibrary;
}

export async function loadGeocodingLibrary() {
  ensureInitialized();
  return await importLibrary('geocoding') as google.maps.GeocodingLibrary;
}
