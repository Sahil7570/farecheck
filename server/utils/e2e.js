const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2E() {
  console.log('--- STARTING E2E GEOAPIFY TEST ---');
  let pickup = null;
  let destination = null;

  // 1. Test Autocomplete
  try {
    console.log('\n[1] Testing Autocomplete (Real Indian Locations)...');
    
    // Simulating rapid typing / debouncing
    console.log('Simulating rapid typing for "Koramangala"...');
    axios.get(`${API_URL}/fares/autocomplete?text=Ko`).catch(()=>{});
    axios.get(`${API_URL}/fares/autocomplete?text=Koram`).catch(()=>{});
    const autocompleteRes = await axios.get(`${API_URL}/fares/autocomplete?text=Koramangala`);
    
    if (autocompleteRes.data && autocompleteRes.data.length > 0) {
      pickup = autocompleteRes.data[0];
      console.log(`✅ Autocomplete success. Picked up: ${pickup.name}`);
      console.log(`   Coords: lat=${pickup.coords.lat}, lng=${pickup.coords.lng}`);
    } else {
      console.error('❌ Autocomplete failed: No results for Koramangala');
      return;
    }

    const destRes = await axios.get(`${API_URL}/fares/autocomplete?text=Indiranagar`);
    if (destRes.data && destRes.data.length > 0) {
      destination = destRes.data[0];
      console.log(`✅ Autocomplete success. Destination: ${destination.name}`);
      console.log(`   Coords: lat=${destination.coords.lat}, lng=${destination.coords.lng}`);
    } else {
      console.error('❌ Autocomplete failed: No results for Indiranagar');
      return;
    }
  } catch (error) {
    console.error('❌ Autocomplete error:', error.message);
    return;
  }

  // 2. Test Empty / No Results Autocomplete
  try {
    console.log('\n[2] Testing Autocomplete (No Results)...');
    const emptyRes = await axios.get(`${API_URL}/fares/autocomplete?text=Xyz123RandomNowherePlace`);
    if (emptyRes.data && emptyRes.data.length === 0) {
      console.log('✅ Empty autocomplete correctly returns 0 results');
    } else {
      console.error('❌ Failed: Expected 0 results but got some', emptyRes.data);
    }
  } catch (error) {
    console.error('❌ Autocomplete error:', error.message);
  }

  // 3. Complete Flow: Estimate -> Submit
  try {
    console.log('\n[3] Testing Complete Flow (Estimate -> Submit)');
    console.log('Fetching Estimate...');
    
    const estimateRes = await axios.post(`${API_URL}/fares/estimate`, {
      pickupCoords: pickup.coords,
      destinationCoords: destination.coords
    });

    console.log(`✅ Estimate returned! Distance: ${estimateRes.data.distance} km`);
    console.log(`   Status: ${estimateRes.data.status}`);

    // Submit a fare to this route
    console.log('Submitting a real fare report...');
    const submitRes = await axios.post(`${API_URL}/fares`, {
      pickupName: pickup.name,
      destinationName: destination.name,
      pickupCoords: pickup.coords,
      destinationCoords: destination.coords,
      amount: 150
    });
    console.log(`✅ Submit success! DB ID: ${submitRes.data.report._id}`);

    // Fetch estimate again to see if it includes the new report
    const estimateRes2 = await axios.post(`${API_URL}/fares/estimate`, {
      pickupCoords: pickup.coords,
      destinationCoords: destination.coords
    });
    console.log(`✅ Second Estimate Status: ${estimateRes2.data.status}`);
    
  } catch (error) {
    console.error('❌ Flow error:', error.response?.data || error.message);
  }

  // 4. Test Invalid API Key Fallback
  try {
    console.log('\n[4] Testing Invalid API Key Failure');
    const originalKey = process.env.GEOAPIFY_API_KEY;
    
    // Note: In an HTTP call to the active server, the server is running with the correct key.
    // To test this effectively via HTTP, we'd need a route that temporarily overrides the key,
    // or we can test the module directly in Node.
    const { getDistance } = require('../services/mapsService');
    process.env.GEOAPIFY_API_KEY = 'invalid_key_testing';
    
    try {
      await getDistance(pickup.coords, destination.coords);
      console.error('❌ Failed: getDistance should have thrown an error');
    } catch (err) {
      if (err.statusCode === 502) {
         console.log('✅ Passed: Invalid API key properly throws 502');
      } else {
         console.error('❌ Failed: Expected 502 error', err);
      }
    }
    process.env.GEOAPIFY_API_KEY = originalKey; // restore
  } catch (err) {
    console.error('Unexpected error:', err);
  }

  console.log('\n--- E2E TEST COMPLETE ---');
}

runE2E();
