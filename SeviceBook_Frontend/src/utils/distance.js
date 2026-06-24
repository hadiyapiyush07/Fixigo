// src/utils/distance.js

/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const toRad = (value) => (value * Math.PI) / 180;
  
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Returns distance in kilometers
};

/**
 * Formats distance to a readable string (e.g. "2.5 km" or "800 m")
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted string
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) return 'Unknown distance';
  
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
};

/**
 * Estimates arrival time based on distance.
 * Assumes average city speed of 20 km/h.
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted ETA string
 */
export const calculateETA = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) return 'Calculating ETA...';
  
  // Speed: 20 km/h = 1 km every 3 mins.
  // Add 2 mins base buffer.
  const etaMins = Math.round((distanceKm * 3) + 2);
  
  if (etaMins < 2) return 'Arriving now';
  if (etaMins >= 60) {
    const hrs = Math.floor(etaMins / 60);
    const mins = etaMins % 60;
    return `${hrs}h ${mins}m`;
  }
  return `~${etaMins} mins`;
};
