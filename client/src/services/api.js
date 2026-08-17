import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const calculateFare = async (pickupCoords, destinationCoords) => {
  const response = await axios.post(`${API_URL}/fares/estimate`, {
    pickupCoords,
    destinationCoords,
  });
  return response.data;
};

export const searchLocations = async (text) => {
  const response = await axios.get(`${API_URL}/fares/autocomplete`, {
    params: { text }
  });
  return response.data;
};

export const reportFare = async (data) => {
  const response = await axios.post(`${API_URL}/fares`, data);
  return response.data;
};
