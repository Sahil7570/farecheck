const axios = require('axios');

class MapsServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'MapsServiceError';
    this.statusCode = statusCode;
  }
}

/**
 * Calculates the driving distance between two coordinates using the Geoapify Routing API.
 * 
 * @param {Object} pickupCoords - { lat: Number, lng: Number }
 * @param {Object} destinationCoords - { lat: Number, lng: Number }
 * @returns {Number} - Distance in kilometers
 * @throws {MapsServiceError} - If the API fails, key is missing, or route cannot be found.
 */
const getDistance = async (pickupCoords, destinationCoords) => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new MapsServiceError('Geoapify API key is missing or invalid in server configuration.', 502);
  }

  try {
    const waypoints = `${pickupCoords.lat},${pickupCoords.lng}|${destinationCoords.lat},${destinationCoords.lng}`;
    
    const response = await axios.get(
      `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=drive&apiKey=${apiKey}`,
      { timeout: 5000 }
    );

    if (!response.data.features || response.data.features.length === 0) {
      throw new MapsServiceError('No viable driving route found between these locations.', 400);
    }

    const meters = response.data.features[0].properties.distance;
    
    if (typeof meters !== 'number') {
      throw new MapsServiceError('Routing API returned an unexpected response format.', 502);
    }

    return Number((meters / 1000).toFixed(1));

  } catch (error) {
    if (error instanceof MapsServiceError) {
      throw error;
    }
    
    console.error('Geoapify Routing API request failed:', error?.response?.data || error.message);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new MapsServiceError('Routing API key is invalid or quota exceeded.', 502);
    }

    throw new MapsServiceError('External routing service is currently unavailable.', 502);
  }
};

/**
 * Searches for places using Geoapify Autocomplete API
 * @param {String} text - Search query
 */
const getAutocomplete = async (text) => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new MapsServiceError('Geoapify API key is missing.', 502);
  }

  try {
    const response = await axios.get(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&filter=countrycode:in&limit=5&apiKey=${apiKey}`,
      { timeout: 5000 }
    );

    if (!response.data.features) return [];

    return response.data.features.map(feature => ({
      name: feature.properties.formatted,
      coords: {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0] // Geoapify returns [lon, lat]
      }
    }));
  } catch (error) {
    console.error('Geoapify Autocomplete error:', error?.response?.data || error.message);
    throw new MapsServiceError('Search service unavailable', 502);
  }
};

module.exports = {
  getDistance,
  getAutocomplete,
  MapsServiceError
};
