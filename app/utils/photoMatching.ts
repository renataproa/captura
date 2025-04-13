import { Asset } from 'expo-media-library';

export interface PhotoMetadata {
  id: string;
  creationTime: Date;
  filename: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  width: number;
  height: number;
  uri: string;
}

export interface PhotoRequest {
  location: string;
  customLocation?: string;
  category: string;
}

export interface MatchingSummary {
  matchCount: number;
  nearbyCount: number;
  recentMatches: number;
  oldestMatchDate?: Date;
  newestMatchDate?: Date;
  timeRange?: string;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Location coordinates for Boston area landmarks
const LOCATION_COORDINATES = {
  'Boston Common': { latitude: 42.3554, longitude: -71.0655 },
  'Faneuil Hall': { latitude: 42.3600, longitude: -71.0568 },
  'Harvard Campus': { latitude: 42.3744, longitude: -71.1169 },
  'Fenway Park': { latitude: 42.3467, longitude: -71.0972 },
  'Boston Harbor': { latitude: 42.3601, longitude: -71.0489 },
};

// Check if a photo was taken recently (within last 30 days)
function isRecentPhoto(photoDate: Date): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return photoDate >= thirtyDaysAgo;
}

// Format time range for display
function formatTimeRange(oldest: Date, newest: Date): string {
  const now = new Date();
  const diffInDays = Math.floor((newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 7) {
    return 'within the last week';
  } else if (diffInDays < 30) {
    return 'within the last month';
  } else if (diffInDays < 90) {
    return 'within the last 3 months';
  } else if (diffInDays < 365) {
    return 'within the last year';
  } else {
    return 'over the past year';
  }
}

export function findMatchingPhotos(photos: PhotoMetadata[], request: PhotoRequest): PhotoMetadata[] {
  // Maximum distance in kilometers to consider a photo "matching" a location
  const MAX_DISTANCE = 1; // 1km radius

  return photos.filter(photo => {
    // Skip photos without location data
    if (!photo.location) return false;

    let isLocationMatch = false;

    if (request.customLocation) {
      // For custom locations, we'll need to implement geocoding in the future
      // For now, return true to not exclude custom locations
      isLocationMatch = true;
    } else {
      const requestCoords = LOCATION_COORDINATES[request.location as keyof typeof LOCATION_COORDINATES];
      if (requestCoords && photo.location) {
        const distance = calculateDistance(
          photo.location.latitude,
          photo.location.longitude,
          requestCoords.latitude,
          requestCoords.longitude
        );
        isLocationMatch = distance <= MAX_DISTANCE;
      }
    }

    return isLocationMatch;
  });
}

export function getMatchingSummary(photos: PhotoMetadata[], request: PhotoRequest): MatchingSummary {
  const matches = findMatchingPhotos(photos, request);
  const exactMatches = matches.filter(photo => {
    if (!photo.location) return false;
    const requestCoords = LOCATION_COORDINATES[request.location as keyof typeof LOCATION_COORDINATES];
    if (!requestCoords) return false;
    
    const distance = calculateDistance(
      photo.location.latitude,
      photo.location.longitude,
      requestCoords.latitude,
      requestCoords.longitude
    );
    return distance <= 0.2; // Within 200m
  });

  // Count recent matches (photos taken within last 30 days)
  const recentMatches = exactMatches.filter(photo => isRecentPhoto(photo.creationTime)).length;

  // Find oldest and newest match dates
  const matchDates = exactMatches.map(photo => photo.creationTime);
  const oldestMatchDate = matchDates.length > 0 ? new Date(Math.min(...matchDates.map(d => d.getTime()))) : undefined;
  const newestMatchDate = matchDates.length > 0 ? new Date(Math.max(...matchDates.map(d => d.getTime()))) : undefined;

  // Calculate time range if we have both dates
  let timeRange: string | undefined;
  if (oldestMatchDate && newestMatchDate) {
    timeRange = formatTimeRange(oldestMatchDate, newestMatchDate);
  }

  return {
    matchCount: exactMatches.length,
    nearbyCount: matches.length - exactMatches.length,
    recentMatches,
    oldestMatchDate,
    newestMatchDate,
    timeRange,
  };
} 