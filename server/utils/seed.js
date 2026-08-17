const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FareReport = require('../models/FareReport');

dotenv.config();

const seedData = [
  // Realistic reports for a route (e.g., Station to City Center)
  {
    pickupName: "Central Station",
    destinationName: "City Center Mall",
    pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] }, // Approx Bangalore
    destinationLocation: { type: 'Point', coordinates: [77.6095, 12.9734] },
    distance: 2.5,
    amount: 80,
    reportedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    dayOfWeek: new Date().getDay(),
    hourOfDay: new Date().getHours()
  },
  {
    pickupName: "Central Station",
    destinationName: "City Center",
    pickupLocation: { type: 'Point', coordinates: [77.5945, 12.9715] },
    destinationLocation: { type: 'Point', coordinates: [77.6090, 12.9730] },
    distance: 2.6,
    amount: 90,
    reportedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    dayOfWeek: new Date().getDay(),
    hourOfDay: new Date().getHours() - 1
  },
  {
    pickupName: "Central Station Area",
    destinationName: "City Center Mall",
    pickupLocation: { type: 'Point', coordinates: [77.5950, 12.9710] },
    destinationLocation: { type: 'Point', coordinates: [77.6095, 12.9734] },
    distance: 2.4,
    amount: 85,
    reportedAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    dayOfWeek: new Date().getDay(),
    hourOfDay: Math.max(0, new Date().getHours() - 2)
  },
  {
    pickupName: "Railway Station",
    destinationName: "Mall",
    pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
    destinationLocation: { type: 'Point', coordinates: [77.6095, 12.9734] },
    distance: 2.5,
    amount: 100,
    reportedAt: new Date(Date.now() - 1000 * 60 * 200), // 3+ hours ago
    dayOfWeek: new Date().getDay(),
    hourOfDay: Math.max(0, new Date().getHours() - 3)
  },
  // Outlier that should be filtered out
  {
    pickupName: "Central Station",
    destinationName: "City Center",
    pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
    destinationLocation: { type: 'Point', coordinates: [77.6095, 12.9734] },
    distance: 2.5,
    amount: 350, // Huge overcharge
    reportedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    dayOfWeek: new Date().getDay(),
    hourOfDay: new Date().getHours()
  }
];

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farecheck';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for seeding...');
    
    // Clear existing
    await FareReport.deleteMany({});
    console.log('Cleared existing reports.');

    // Insert new
    await FareReport.insertMany(seedData);
    console.log('Database seeded with realistic data including outliers!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
};

seedDB();
