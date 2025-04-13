import { isWithinInterval, addHours, subHours, parseISO } from 'date-fns';

// Types for photo metadata and request
interface PhotoMetadata {
  creationTime: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface PhotoRequest {
  location: {
    id: string;
    name: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  createdAt: string;
  expiration: string; // in hours
  timeRequirement?: {
    type: 'none' | '24' | '168' | '720' | 'custom';
    customTimeStart?: string;
    customTimeEnd?: string;
  };
}

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Predefined location coordinates for Boston area locations
const LOCATION_COORDINATES = {
  'Boston Common': { latitude: 42.3554, longitude: -71.0655 },
  'Faneuil Hall': { latitude: 42.3600, longitude: -71.0568 },
  'Harvard Campus': { latitude: 42.3744, longitude: -71.1169 },
  'Fenway Park': { latitude: 42.3467, longitude: -71.0972 },
  'Boston Harbor': { latitude: 42.3601, longitude: -71.0489 },
};

// Maximum allowed distance in kilometers for a location match
const MAX_DISTANCE_KM = 0.5; // 500 meters

export function matchPhotoToRequest(
  photo: PhotoMetadata,
  request: PhotoRequest
): { isMatch: boolean; reason?: string } {
  // Check if photo has required metadata
  if (!photo.creationTime) {
    return { isMatch: false, reason: 'Photo missing time metadata' };
  }

  // Check time requirement if specified
  if (request.timeRequirement && request.timeRequirement.type !== 'none') {
    const photoTime = parseISO(photo.creationTime);
    const now = new Date();

    let isTimeValid = false;
    let timeReason = '';

    switch (request.timeRequirement.type) {
      case '24':
      case '168':
      case '720': {
        const hours = parseInt(request.timeRequirement.type);
        const startTime = subHours(now, hours);
        isTimeValid = isWithinInterval(photoTime, { start: startTime, end: now });
        if (!isTimeValid) {
          timeReason = `Photo must be taken within the last ${hours} hours`;
        }
        break;
      }
      case 'custom': {
        if (request.timeRequirement.customTimeStart && request.timeRequirement.customTimeEnd) {
          const startTime = parseISO(request.timeRequirement.customTimeStart);
          const endTime = parseISO(request.timeRequirement.customTimeEnd);
          isTimeValid = isWithinInterval(photoTime, { start: startTime, end: endTime });
          if (!isTimeValid) {
            timeReason = `Photo must be taken between ${startTime.toLocaleDateString()} and ${endTime.toLocaleDateString()}`;
          }
        }
        break;
      }
    }

    if (!isTimeValid) {
      return { isMatch: false, reason: timeReason };
    }
  }

  // Check location if provided
  if (photo.location) {
    // Get location coordinates
    let requestCoords;
    if (request.location.coordinates) {
      requestCoords = request.location.coordinates;
    } else if (request.location.name in LOCATION_COORDINATES) {
      requestCoords = LOCATION_COORDINATES[request.location.name as keyof typeof LOCATION_COORDINATES];
    } else {
      return { isMatch: false, reason: 'Unknown location' };
    }

    // Check location match
    const distance = calculateDistance(
      photo.location.latitude,
      photo.location.longitude,
      requestCoords.latitude,
      requestCoords.longitude
    );

    if (distance > MAX_DISTANCE_KM) {
      return {
        isMatch: false,
        reason: `Photo location too far (${distance.toFixed(2)}km from requested location)`
      };
    }
  }

  // Check request expiration
  const photoTime = parseISO(photo.creationTime);
  const requestTime = parseISO(request.createdAt);
  const expirationTime = addHours(requestTime, parseInt(request.expiration));

  const isExpirationValid = isWithinInterval(new Date(), {
    start: requestTime,
    end: expirationTime,
  });

  if (!isExpirationValid) {
    return {
      isMatch: false,
      reason: 'Request has expired'
    };
  }

  return { isMatch: true };
}

// Helper function to get matching photos for a request
export function getMatchingPhotos(
  photos: PhotoMetadata[],
  request: PhotoRequest
): { matches: PhotoMetadata[]; unmatchedReasons: Map<string, string> } {
  const matches: PhotoMetadata[] = [];
  const unmatchedReasons = new Map<string, string>();

  photos.forEach((photo) => {
    const { isMatch, reason } = matchPhotoToRequest(photo, request);
    if (isMatch) {
      matches.push(photo);
    } else if (reason) {
      unmatchedReasons.set(photo.creationTime, reason);
    }
  });

  return { matches, unmatchedReasons };
} 