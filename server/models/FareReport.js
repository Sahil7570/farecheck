const mongoose = require('mongoose');

const fareReportSchema = new mongoose.Schema({
  pickupName: {
    type: String,
    required: true,
    trim: true,
  },
  destinationName: {
    type: String,
    required: true,
    trim: true,
  },
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  destinationLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  distance: {
    type: Number, // in kilometers
    required: false
  },
  amount: {
    type: Number,
    required: true,
    min: 10 // Minimum sensible fare
  },
  reportedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  dayOfWeek: {
    type: Number, // 0-6 (Sun-Sat)
    required: true
  },
  hourOfDay: {
    type: Number, // 0-23
    required: true
  }
}, { timestamps: true });

// Create a geospatial index on pickupLocation to allow $geoNear or $near queries
fareReportSchema.index({ pickupLocation: '2dsphere' });
fareReportSchema.index({ destinationLocation: '2dsphere' });

module.exports = mongoose.model('FareReport', fareReportSchema);
