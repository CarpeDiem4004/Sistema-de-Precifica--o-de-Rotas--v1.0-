import { loadRoutesLibrary, loadGeocodingLibrary } from '../lib/googleMapsLoader';
import type { DistanceMatrixResponse } from '../types';

export async function getDistanceAndTime(
  enderecoOrigem: string,
  enderecoDestino: string
): Promise<DistanceMatrixResponse> {
  try {
    await loadRoutesLibrary();
    const distanceMatrixService = new google.maps.DistanceMatrixService();
    
    const response = await distanceMatrixService.getDistanceMatrix({
      origins: [enderecoOrigem],
      destinations: [enderecoDestino],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
    });

    if (response.rows[0].elements[0].status === 'OK') {
      const element = response.rows[0].elements[0];
      
      return {
        distancia: element.distance!.value / 1000,
        duracao: element.duration!.text,
        duracaoSegundos: element.duration!.value
      };
    } else {
      throw new Error('Não foi possível calcular a distância');
    }
  } catch (error) {
    console.error('Erro no Distance Matrix:', error);
    throw error;
  }
}

export async function geocodeEndereco(endereco: string): Promise<{lat: number, lng: number} | null> {
  try {
    await loadGeocodingLibrary();
    const geocoder = new google.maps.Geocoder();
    
    const response = await geocoder.geocode({ address: endereco });
    
    if (response.results[0]) {
      const location = response.results[0].geometry.location;
      return {
        lat: location.lat(),
        lng: location.lng()
      };
    }
    return null;
  } catch (error) {
    console.error('Erro no geocoding:', error);
    return null;
  }
}
