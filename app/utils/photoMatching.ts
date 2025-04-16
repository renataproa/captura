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
  category: string;
  requirements?: string[];
  preferredTimes?: string[];
}

export interface MatchingSummary {
  exactMatches: number;
  nearbyPhotos: number;
  recentPhotos: number;
}

export interface PhotoMatch {
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
  score: number;
  distance?: number;
  matchReasons: string[];
}

// Location coordinates for Boston area landmarks
const LOCATION_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  'Harvard Square': { latitude: 42.3611, longitude: -71.0874 },
  'Museum of Science': { latitude: 42.3667, longitude: -71.0625 },
  'Boston Common': { latitude: 42.3554, longitude: -71.0655 },
  'Faneuil Hall': { latitude: 42.3600, longitude: -71.0568 },
  'Harvard Campus': { latitude: 42.3744, longitude: -71.1169 },
  'TD Garden': { latitude: 42.3662, longitude: -71.0621 },
  'Boston Harbor': { latitude: 42.3601, longitude: -71.0489 },
};

// Distance thresholds in kilometers
const DISTANCE_THRESHOLDS = {
  EXACT: 0.5,    // Within 500m
  CLOSE: 1,      // Within 1km
  NEARBY: 3,     // Within 3km
  MAX: 5         // Maximum distance to consider
};

// Time thresholds in days
const TIME_THRESHOLDS = {
  RECENT: 7,     // Within last week
  MEDIUM: 30,    // Within last month
  MAX: 90        // Within last 3 months
};

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

// Calculate photo score based on various factors
function calculatePhotoScore(
  photo: PhotoMetadata,
  distance: number | undefined,
  request: PhotoRequest
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Location score (max 50 points)
  if (distance !== undefined) {
    if (distance <= DISTANCE_THRESHOLDS.EXACT) {
      score += 50;
      reasons.push('Exact location match');
    } else if (distance <= DISTANCE_THRESHOLDS.CLOSE) {
      score += 40;
      reasons.push('Very close to location');
    } else if (distance <= DISTANCE_THRESHOLDS.NEARBY) {
      score += 30;
      reasons.push('Nearby location');
    } else if (distance <= DISTANCE_THRESHOLDS.MAX) {
      score += 20;
      reasons.push('Within area');
    }
  }

  // Time score (max 30 points)
  const daysSincePhoto = Math.floor((new Date().getTime() - photo.creationTime.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSincePhoto <= TIME_THRESHOLDS.RECENT) {
    score += 30;
    reasons.push('Taken within last week');
  } else if (daysSincePhoto <= TIME_THRESHOLDS.MEDIUM) {
    score += 20;
    reasons.push('Taken within last month');
  } else if (daysSincePhoto <= TIME_THRESHOLDS.MAX) {
    score += 10;
    reasons.push('Taken within last 3 months');
  }

  // Resolution score (max 20 points)
  const megapixels = (photo.width * photo.height) / 1000000;
  if (megapixels >= 12) {
    score += 20;
    reasons.push('High resolution (12MP+)');
  } else if (megapixels >= 8) {
    score += 15;
    reasons.push('Good resolution (8MP+)');
  } else if (megapixels >= 4) {
    score += 10;
    reasons.push('Decent resolution (4MP+)');
  }

  return { score, reasons };
}

export function findMatchingPhotos(photos: PhotoMetadata[], request: PhotoRequest): PhotoMatch[] {
  const requestCoords = LOCATION_COORDINATES[request.location];
  
  return photos
    .map(photo => {
      let distance: number | undefined;
      
      if (photo.location && requestCoords) {
        distance = calculateDistance(
          photo.location.latitude,
          photo.location.longitude,
          requestCoords.latitude,
          requestCoords.longitude
        );
        
        // Skip if beyond max distance
        if (distance > DISTANCE_THRESHOLDS.MAX) {
          return null;
        }
      }

      const { score, reasons } = calculatePhotoScore(photo, distance, request);
      
      const match: PhotoMatch = {
        ...photo,
        score,
        distance,
        matchReasons: reasons
      };
      
      return match;
    })
    .filter((match): match is NonNullable<typeof match> => match !== null)
    .sort((a, b) => b.score - a.score);
}

export function getMatchingSummary(photos: PhotoMetadata[], request: PhotoRequest): MatchingSummary {
  const matches = findMatchingPhotos(photos, request);
  
  const exactMatches = matches.filter(match => 
    match.distance !== undefined && match.distance <= DISTANCE_THRESHOLDS.EXACT
  ).length;

  const nearbyPhotos = matches.filter(match => 
    match.distance !== undefined && 
    match.distance > DISTANCE_THRESHOLDS.EXACT && 
    match.distance <= DISTANCE_THRESHOLDS.NEARBY
  ).length;

  const recentPhotos = matches.filter(match => 
    Math.floor((new Date().getTime() - match.creationTime.getTime()) / (1000 * 60 * 60 * 24)) <= TIME_THRESHOLDS.RECENT
  ).length;

  return {
    exactMatches,
    nearbyPhotos,
    recentPhotos
  };
} 