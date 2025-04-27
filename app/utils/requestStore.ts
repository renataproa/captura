import { PhotoRequest as BasePhotoRequest } from '../(tabs)/home';
import { ImageSourcePropType } from 'react-native';

export interface PhotoRequest extends BasePhotoRequest {
  status: 'active' | 'completed' | 'expired';
  submissionCount: number;
  createdAt: Date;
  ownerId: string; // To track who created the request
  requesterType: 'individual' | 'brand';
  humanPresence: 'required' | 'not_allowed' | 'optional';
  user: {
    name: string;
    avatar: ImageSourcePropType;
  };
}

export interface PhotoSubmission {
  id: string;
  requestId: string;
  requestTitle: string;
  location: string;
  category: string;
  photoUri: string;
  status: 'pending_ai' | 'pending_approval' | 'accepted' | 'rejected';
  timestamp: Date;
  metadata?: {
    width: number;
    height: number;
    hasLocation: boolean;
    creationTime: Date;
  };
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
    rewards: '$20 Coupon',
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
    ownerId: 'user2', // Changed from CURRENT_USER_ID
    requesterType: 'brand',
    humanPresence: 'optional',
    user: {
      name: 'Harvard University',
      avatar: require('../../assets/images/harvard-logo.png')
    }
  },
  {
    id: '2',
    title: 'TD Garden Celtics Game',
    location: 'TD Garden, Boston',
    category: 'Sports',
    rewards: '$30 Coupon',
    deadline: '1 week',
    description: 'Need photos from the upcoming Celtics game at TD Garden. Looking for crowd shots, arena atmosphere, and game action.',
    requirements: [
      'Action shots of players',
      'Crowd atmosphere',
      'Arena views',
      'Clear, well-lit shots',
      'Landscape orientation preferred'
    ],
    preferredTimes: ['Evening'],
    additionalNotes: 'Focus on capturing the energy of the game. Looking for photos that show both the action on court and the fan experience.',
    matchedPhotos: 0,
    status: 'active',
    submissionCount: 2,
    createdAt: new Date(),
    ownerId: CURRENT_USER_ID, // This one stays as CURRENT_USER_ID
    requesterType: 'individual',
    humanPresence: 'required',
    user: {
      name: 'Michael Johnson',
      avatar: require('../../assets/images/avatar.png')
    }
  },
  {
    id: '3',
    title: 'Allbirds at MIT',
    location: 'MIT, Boston',
    category: 'Clothing',
    rewards: '$25 Coupon',
    deadline: '5 days',
    description: 'Looking for photos of students wearing Allbirds in front of MIT Dome. Interested in showing students with Allbirds shoes around campus.',
    requirements: [
      'Day photography',
      'Student lifestyle',
      'Product focus',
      'Must feature Allbirds shoes',
      'Campus setting required'
    ],
    preferredTimes: ['Morning', 'Afternoon'],
    additionalNotes: 'Capture the vibrant atmosphere of MIT with Allbirds branding. Looking for authentic, lifestyle shots of students wearing our shoes in a natural campus setting.',
    matchedPhotos: 0,
    status: 'active',
    submissionCount: 0,
    createdAt: new Date(),
    ownerId: 'user2', // Different user's request
    requesterType: 'brand',
    humanPresence: 'required',
    user: {
      name: 'Allbirds',
      avatar: require('../../assets/images/allbirds-logo.png')
    }
  },
  {
    id: '4',
    title: 'Ripple Cafe Ambience',
    location: 'Boylston Street, Boston',
    category: 'Food',
    rewards: '$15 Coupon',
    deadline: '4 days',
    description: 'Looking for quality photos capturing the ambience of Ripple Cafe, including customers enjoying coffee, baristas at work, and our signature latte art.',
    requirements: [
      'Interior photography',
      'Food and beverage shots',
      'Candid customer moments',
      'Barista action shots',
      'Latte art close-ups'
    ],
    preferredTimes: ['Morning rush', 'Afternoon'],
    additionalNotes: 'Focus on the warm and inviting atmosphere of our cafe. Looking for authentic moments that showcase the Ripple Cafe experience.',
    matchedPhotos: 0,
    status: 'active',
    submissionCount: 1,
    createdAt: new Date(),
    ownerId: 'user3', // Different user's request
    requesterType: 'brand',
    humanPresence: 'required',
    user: {
      name: 'Ripple Cafe',
      avatar: require('../../assets/images/ripple-logo.png')
    }
  }
];

// Initial mock data for submissions
const initialSubmissions: PhotoSubmission[] = [
  {
    id: 'sub1',
    requestId: '2',
    requestTitle: 'TD Garden Celtics Game',
    location: 'TD Garden, Boston',
    category: 'Sports',
    photoUri: 'https://picsum.photos/800/600', // Placeholder image
    status: 'accepted',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    metadata: {
      width: 800,
      height: 600,
      hasLocation: true,
      creationTime: new Date(Date.now() - 72 * 60 * 60 * 1000)
    }
  },
  {
    id: 'sub2',
    requestId: '3',
    requestTitle: 'Allbirds at MIT',
    location: 'MIT, Boston',
    category: 'Clothing',
    photoUri: 'https://picsum.photos/800/600?random=1', // Different placeholder
    status: 'pending_approval',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    metadata: {
      width: 1200,
      height: 800,
      hasLocation: true,
      creationTime: new Date(Date.now() - 36 * 60 * 60 * 1000)
    }
  }
];

// Store state
let photoRequests = [...initialRequests];
let photoSubmissions = [...initialSubmissions];
let listeners: (() => void)[] = [];

// Get all requests
export function getPhotoRequests(): PhotoRequest[] {
  return photoRequests;
}

// Get only my requests
export function getMyRequests(): PhotoRequest[] {
  return photoRequests.filter(request => request.ownerId === CURRENT_USER_ID);
}

// Get a specific request by ID
export function getRequestById(id: string): PhotoRequest | undefined {
  return photoRequests.find(request => request.id === id);
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

// Update an existing request
export function updatePhotoRequest(request: PhotoRequest) {
  // Only allow updating if the request belongs to the current user
  if (request.ownerId !== CURRENT_USER_ID) {
    console.error('Cannot update a request that does not belong to the current user');
    return;
  }
  
  photoRequests = photoRequests.map(r => 
    r.id === request.id ? request : r
  );
  notifyListeners();
}

// Change request status
export function updateRequestStatus(requestId: string, newStatus: 'active' | 'completed' | 'expired') {
  const request = photoRequests.find(r => r.id === requestId);
  
  if (!request) {
    console.error(`Request with ID ${requestId} not found`);
    return;
  }
  
  if (request.ownerId !== CURRENT_USER_ID) {
    console.error('Cannot update status of a request that does not belong to the current user');
    return;
  }
  
  photoRequests = photoRequests.map(r => 
    r.id === requestId 
      ? { ...r, status: newStatus } 
      : r
  );
  notifyListeners();
}

// Get all my submissions
export function getMySubmissions(): PhotoSubmission[] {
  return photoSubmissions;
}

// Get submissions for a specific request
export function getSubmissionsForRequest(requestId: string): PhotoSubmission[] {
  return photoSubmissions.filter(submission => submission.requestId === requestId);
}

// Add a new photo submission
export function addPhotoSubmission(submission: PhotoSubmission) {
  photoSubmissions = [...photoSubmissions, submission];
  
  // Update the request's submission count
  const request = photoRequests.find(r => r.id === submission.requestId);
  if (request) {
    photoRequests = photoRequests.map(r =>
      r.id === submission.requestId
        ? { ...r, submissionCount: r.submissionCount + 1 }
        : r
    );
  }
  
  notifyListeners();
}

// Update submission status
export function updateSubmissionStatus(
  submissionId: string, 
  newStatus: 'pending_ai' | 'pending_approval' | 'accepted' | 'rejected'
) {
  photoSubmissions = photoSubmissions.map(s =>
    s.id === submissionId
      ? { ...s, status: newStatus }
      : s
  );
  notifyListeners();
}

// Delete a photo submission
export function deletePhotoSubmission(submissionId: string) {
  const submission = photoSubmissions.find(s => s.id === submissionId);
  
  if (!submission) {
    console.error(`Submission with ID ${submissionId} not found`);
    return;
  }
  
  // Remove the submission
  photoSubmissions = photoSubmissions.filter(s => s.id !== submissionId);
  
  // Update the request's submission count
  const request = photoRequests.find(r => r.id === submission.requestId);
  if (request && request.submissionCount > 0) {
    photoRequests = photoRequests.map(r =>
      r.id === submission.requestId
        ? { ...r, submissionCount: r.submissionCount - 1 }
        : r
    );
  }
  
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