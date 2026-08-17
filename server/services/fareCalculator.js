const FareReport = require('../models/FareReport');

function calculateStraightLineDistance(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const calculateFairFare = async (pickupCoords, destinationCoords, actualDistanceKm) => {
  // Strict rule: if actual distance is missing (API failed), we shouldn't guess anything.
  if (!actualDistanceKm) {
    throw new Error("Cannot calculate fare without a reliable road distance.");
  }

  // Dynamic search radius based on trip length
  // e.g., 20km trip -> 3km search radius. 2km trip -> 1km search radius.
  const baseRadius = Math.max(1000, Math.min(3000, actualDistanceKm * 200));
  
  // 1. Find reports near the pickup location
  const reportsNearPickup = await FareReport.find({
    pickupLocation: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [pickupCoords.lng, pickupCoords.lat]
        },
        $maxDistance: baseRadius
      }
    }
  }).sort({ reportedAt: -1 }).limit(100);

  // 2. Filter to those that also end near the destination
  let similarReports = reportsNearPickup.filter(report => {
    const destLon = report.destinationLocation.coordinates[0];
    const destLat = report.destinationLocation.coordinates[1];
    const distanceToDest = calculateStraightLineDistance(
      [destinationCoords.lng, destinationCoords.lat],
      [destLon, destLat]
    );
    return distanceToDest <= (baseRadius / 1000); 
  });

  // 3. Filter by distance similarity to ensure apples-to-apples comparison
  similarReports = similarReports.filter(report => {
    if (!report.distance) return true; // keep if no distance recorded previously
    const diffRatio = Math.abs(report.distance - actualDistanceKm) / actualDistanceKm;
    return diffRatio <= 0.3; // Trip distance must be within +/- 30%
  });

  if (similarReports.length === 0) {
    return {
      hasData: false,
      status: 'NO_DATA',
      message: "No recent fare data for this route."
    };
  }

  // 4. Outlier Filtering (Interquartile Range)
  const amounts = similarReports.map(r => r.amount).sort((a, b) => a - b);
  
  let validAmounts = amounts;
  if (amounts.length >= 4) {
    const q1 = amounts[Math.floor((amounts.length / 4))];
    const q3 = amounts[Math.ceil((amounts.length * (3 / 4))) - 1];
    const iqr = q3 - q1;
    
    // Very tight bounds to prevent single extreme values from swaying the result
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    validAmounts = amounts.filter(a => a >= lowerBound && a <= upperBound);
  }

  if (validAmounts.length === 0) validAmounts = amounts;

  // 5. Strict Minimum Sample Size
  if (validAmounts.length < 2) {
    return {
      hasData: false,
      status: 'INSUFFICIENT_DATA',
      message: "Insufficient data to confidently estimate a fare.",
      reportCount: validAmounts.length
    };
  }

  // 6. Calculate Metrics
  const sum = validAmounts.reduce((a, b) => a + b, 0);
  const average = Math.round(sum / validAmounts.length);
  
  let minFare = Math.min(...validAmounts);
  let maxFare = Math.max(...validAmounts);
  
  if (maxFare - minFare < 10) {
    minFare = Math.max(10, average - 10);
    maxFare = average + 10;
  }

  const recentValidReports = similarReports
    .filter(r => validAmounts.includes(r.amount))
    .slice(0, 5)
    .map(r => ({
      amount: r.amount,
      reportedAt: r.reportedAt,
      timeAgo: Math.round((new Date() - new Date(r.reportedAt)) / 60000)
    }));

  return {
    hasData: true,
    status: 'SUCCESS',
    average,
    minFare,
    maxFare,
    reportCount: validAmounts.length,
    recentReports: recentValidReports
  };
};

module.exports = {
  calculateFairFare
};
