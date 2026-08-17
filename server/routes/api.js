const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const FareReport = require('../models/FareReport');
const { calculateFairFare } = require('../services/fareCalculator');
const { getDistance, MapsServiceError } = require('../services/mapsService');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /api/fares - Report a new fare
router.post('/fares', [
  body('pickupName').trim().notEmpty().withMessage('Pickup name is required'),
  body('destinationName').trim().notEmpty().withMessage('Destination name is required'),
  body('pickupCoords.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid pickup latitude is required'),
  body('pickupCoords.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid pickup longitude is required'),
  body('destinationCoords.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid destination latitude is required'),
  body('destinationCoords.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid destination longitude is required'),
  body('amount').isNumeric().custom(value => value > 0 && value <= 10000).withMessage('Amount must be between 1 and 10000'),
  validate
], async (req, res) => {
  try {
    const { pickupName, destinationName, pickupCoords, destinationCoords, amount } = req.body;

    let distance = null;
    try {
      distance = await getDistance(pickupCoords, destinationCoords);
    } catch (err) {
      if (err instanceof MapsServiceError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('Unexpected Maps Error:', err);
      return res.status(502).json({ error: 'External routing service is currently unavailable.' });
    }

    const now = new Date();
    const newReport = new FareReport({
      pickupName,
      destinationName,
      pickupLocation: {
        type: 'Point',
        coordinates: [pickupCoords.lng, pickupCoords.lat]
      },
      destinationLocation: {
        type: 'Point',
        coordinates: [destinationCoords.lng, destinationCoords.lat]
      },
      distance,
      amount: Number(amount),
      dayOfWeek: now.getDay(),
      hourOfDay: now.getHours()
    });

    await newReport.save();
    res.status(201).json({ message: 'Fare reported successfully', report: newReport });
  } catch (error) {
    console.error('Error saving fare:', error);
    res.status(503).json({ error: 'Database service is currently unavailable.' });
  }
});

// POST /api/fares/estimate - Calculate estimate based on route
router.post('/fares/estimate', [
  body('pickupCoords.lat').isFloat({ min: -90, max: 90 }),
  body('pickupCoords.lng').isFloat({ min: -180, max: 180 }),
  body('destinationCoords.lat').isFloat({ min: -90, max: 90 }),
  body('destinationCoords.lng').isFloat({ min: -180, max: 180 }),
  validate
], async (req, res) => {
  try {
    const { pickupCoords, destinationCoords } = req.body;

    // Check if locations are identical to prevent bad API calls
    if (pickupCoords.lat === destinationCoords.lat && pickupCoords.lng === destinationCoords.lng) {
      return res.status(400).json({ error: 'Pickup and destination cannot be the exact same location.' });
    }

    let distance = null;
    try {
      distance = await getDistance(pickupCoords, destinationCoords);
    } catch (err) {
      if (err instanceof MapsServiceError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('Unexpected Maps Error:', err);
      return res.status(502).json({ error: 'External routing service is currently unavailable.' });
    }

    const estimate = await calculateFairFare(pickupCoords, destinationCoords, distance);

    res.json({
      ...estimate,
      distance
    });
  } catch (error) {
    console.error('Error calculating estimate:', error);
    res.status(503).json({ error: 'Internal service unavailable. Please try again later.' });
  }
});

// GET /api/fares/autocomplete - Location search
router.get('/fares/autocomplete', async (req, res) => {
  try {
    const { text } = req.query;
    if (!text || text.length < 2) {
      return res.json([]);
    }
    
    // We will implement getAutocomplete in mapsService
    const { getAutocomplete } = require('../services/mapsService');
    const results = await getAutocomplete(text);
    res.json(results);
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(502).json({ error: 'Search service unavailable.' });
  }
});

module.exports = router;
