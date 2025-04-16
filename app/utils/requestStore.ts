import { PhotoRequest as BasePhotoRequest } from '../(tabs)/home';

export interface PhotoRequest extends BasePhotoRequest {
  status: 'active' | 'completed' | 'expired';
  submissionCount: number;
  createdAt: Date;
  ownerId: string; // To track who created the request
}

// Mock current user ID (in a real app, this would come from authentication)
export const CURRENT_USER_ID = 'user1';

// Initial mock data
const initialRequests: PhotoRequest[] = [
  {
    id: '1',
    title: 'Harvard Square Photos',
    location: 'Harvard Square',
    category: 'Urban',
    budget: '$200-300',
    deadline: '3 days',
    description: 'Looking for recent photos of Harvard Square area, especially around the main intersection and Harvard Yard.',
    requirements: [
      'High resolution (minimum 12MP)',
      'Taken within the last week',
      'Must include street life and architecture',
      'Good lighting conditions',
      'No heavy editing or filters'
    ],
    preferredTimes: ['Morning', 'Late afternoon'],
    additionalNotes: 'Preference for photos that capture the vibrant atmosphere and historic architecture. Photos with people are acceptable as long as they are not the main focus.',
    matchedPhotos: 0,
    status: 'active',
    submissionCount: 4,
    createdAt: new Date(),
    ownerId: CURRENT_USER_ID
  },
  {
    id: '2',
    title: 'Museum of Science Area',
    location: 'Museum of Science',
    category: 'Architecture',
    budget: '$150-200',
    deadline: '1 week',
    description: 'Need photos from the Museum of Science area, focusing on the building and Charles River views.',
    requirements: [
      'Minimum 8MP resolution',
      'Taken during daylight hours',
      'Must show the museum building or river views',
      'Clear, well-lit shots',
      'Landscape orientation preferred'
    ],
    preferredTimes: ['Daytime', 'Sunset'],
    additionalNotes: 'Looking for photos that capture both the modern architecture and the natural setting along the Charles River. Both exterior and interior shots are welcome.',
    matchedPhotos: 0,
    status: 'active',
    submissionCount: 2,
    createdAt: new Date(),
    ownerId: CURRENT_USER_ID
  },
  {
    id: '3',
    title: 'Boston Common Winter',
    location: 'Boston Common',
    category: 'Nature',
    budget: '$250-350',
    deadline: '5 days',
    description: 'Looking for winter scenes from Boston Common, especially around Frog Pond and the winter activities.',
    requirements: [
      'High resolution photos',
      'Must capture winter atmosphere',
      'Include people enjoying winter activities',
      'Both day and evening shots welcome'
    ],
    preferredTimes: ['Morning', 'Evening'],
    additionalNotes: 'Interested in shots that show the vibrant winter life in the park.',
    matchedPhotos: 0,
    status: 'active',
    submissionCount: 0,
    createdAt: new Date(),
    ownerId: 'user2' // Different user's request
  }
];

// Store state
let photoRequests = [...initialRequests];
let listeners: (() => void)[] = [];

// Get all requests
export function getPhotoRequests(): PhotoRequest[] {
  return photoRequests;
}

// Get only my requests
export function getMyRequests(): PhotoRequest[] {
  return photoRequests.filter(request => request.ownerId === CURRENT_USER_ID);
}

// Add a new request
export function addPhotoRequest(request: Omit<PhotoRequest, 'ownerId'>) {
  const newRequest = {
    ...request,
    ownerId: CURRENT_USER_ID
  };
  photoRequests = [...photoRequests, newRequest];
  notifyListeners();
}

// Subscribe to changes
export function subscribeToRequests(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

// Notify all listeners of changes
function notifyListeners() {
  listeners.forEach(listener => listener());
} 