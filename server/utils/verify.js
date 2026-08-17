const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FareReport = require('../models/FareReport');

dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- FARECHECK PRODUCTION VERIFICATION ---');

  // Test 1: Invalid Locations Validation
  try {
    console.log('\nTesting: Invalid Locations (Expected: 400)');
    await axios.post(`${API_URL}/fares/estimate`, {
      pickupCoords: { lat: 900, lng: 0 },
      destinationCoords: { lat: 0, lng: 0 }
    });
    console.error('❌ Failed: Should have rejected invalid coordinates');
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('✅ Passed: 400 Bad Request returned');
    } else {
      console.error('❌ Failed with unexpected status:', err.response?.status);
    }
  }

  // Test 2: Same Pickup and Destination
  try {
    console.log('\nTesting: Same Pickup/Dest (Expected: 400)');
    await axios.post(`${API_URL}/fares/estimate`, {
      pickupCoords: { lat: 12.9716, lng: 77.5946 },
      destinationCoords: { lat: 12.9716, lng: 77.5946 }
    });
    console.error('❌ Failed: Should have rejected identical locations');
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('✅ Passed: 400 Bad Request returned');
    } else {
      console.error('❌ Failed with unexpected status:', err.response?.status);
    }
  }

  // Test 3: External API Integration
  try {
    console.log('\nTesting: External API Integration');
    // Save current key
    const originalKey = process.env.GEOAPIFY_API_KEY;
    
    // Sub-test 3a: Valid Key -> Should succeed and calculate distance
    try {
      const res = await axios.post(`${API_URL}/fares/estimate`, {
        pickupCoords: { lat: 12.9716, lng: 77.5946 }, // Bangalore Central
        destinationCoords: { lat: 12.9734, lng: 77.6095 } // MG Road
      });
      if (res.data.distance) {
        console.log(`✅ Passed: External API successfully calculated distance (${res.data.distance} km)`);
      } else {
        console.error('❌ Failed: External API did not return distance');
      }
    } catch (err) {
       console.error('❌ Failed: External API threw error with valid key:', err.response?.data || err.message);
    }

    // Sub-test 3b: Invalid Key -> Should fail with 502
    process.env.GEOAPIFY_API_KEY = 'invalid_key_for_testing';
    try {
      const { getDistance } = require('../services/mapsService');
      await getDistance({ lat: 12.9716, lng: 77.5946 }, { lat: 12.9734, lng: 77.6095 });
      console.error('❌ Failed: Should not calculate fare without reliable route distance');
    } catch (err) {
      if (err.statusCode === 502) {
        console.log('✅ Passed: 502 returned for external Geoapify failure');
      } else {
        console.error('❌ Failed with unexpected status:', err);
      }
    }
    
    // Restore
    process.env.GEOAPIFY_API_KEY = originalKey;

  } catch (err) {
    console.error('Unexpected error in Test 3:', err);
  }

  // Test 4: Database Logic (Assuming we somehow bypass the distance check for unit testing the logic)
  // We will test `calculateFairFare` directly to prove logic without burning real API calls.
  console.log('\nTesting: Fare Calculation Logic');
  const { calculateFairFare } = require('../services/fareCalculator');
  
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farecheck');
  await FareReport.deleteMany({}); // Clear DB

  // Sub-test: No data
  let result = await calculateFairFare({lng: 77.5946, lat: 12.9716}, {lng: 77.6095, lat: 12.9734}, 2.5);
  console.log(result.status === 'NO_DATA' ? '✅ Passed: 0 reports -> NO_DATA' : '❌ Failed: Expected NO_DATA');

  // Sub-test: Insufficient data (1 report)
  await FareReport.create({
    pickupName: "A", destinationName: "B",
    pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
    destinationLocation: { type: 'Point', coordinates: [77.6095, 12.9734] },
    distance: 2.5, amount: 80, dayOfWeek: 1, hourOfDay: 12
  });
  result = await calculateFairFare({lng: 77.5946, lat: 12.9716}, {lng: 77.6095, lat: 12.9734}, 2.5);
  console.log(result.status === 'INSUFFICIENT_DATA' ? '✅ Passed: 1 report -> INSUFFICIENT_DATA' : '❌ Failed: Expected INSUFFICIENT_DATA');

  // Sub-test: Outlier filtering (Add 3 normal, 1 extreme)
  await FareReport.create([
    {
      pickupName: "A", destinationName: "B",
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6095, 12.9734] },
      distance: 2.5, amount: 90, dayOfWeek: 1, hourOfDay: 12
    },
    {
      pickupName: "A", destinationName: "B",
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6095, 12.9734] },
      distance: 2.5, amount: 85, dayOfWeek: 1, hourOfDay: 12
    },
    {
      pickupName: "A", destinationName: "B",
      pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
      destinationLocation: { type: 'Point', coordinates: [77.6095, 12.9734] },
      distance: 2.5, amount: 500, dayOfWeek: 1, hourOfDay: 12 // OUTLIER
    }
  ]);
  result = await calculateFairFare({lng: 77.5946, lat: 12.9716}, {lng: 77.6095, lat: 12.9734}, 2.5);
  
  if (result.status === 'SUCCESS' && result.maxFare < 200) {
    console.log(`✅ Passed: Outlier (500) successfully filtered out. Range: ${result.minFare}-${result.maxFare}`);
  } else {
    console.error('❌ Failed: Outlier impacted the results or unexpected status:', result);
  }

  mongoose.disconnect();
  console.log('\n--- VERIFICATION COMPLETE ---');
}

runTests();
