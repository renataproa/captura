export interface PhotoRequest {
  id: string;
  title: string;
  location: string;
  category: string;
  rewards: string;
  deadline: string;
  description: string;
  requirements: string[];
  preferredTimes: string[];
  additionalNotes: string;
}

export const mockRequests: Record<string, PhotoRequest> = {
  '1': {
    id: '1',
    title: 'Harvard Square Photos',
    location: 'Harvard Square',
    category: 'Urban',
    rewards: '$200-300',
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
    additionalNotes: 'Preference for photos that capture the vibrant atmosphere and historic architecture. Photos with people are acceptable as long as they are not the main focus.'
  },
  '2': {
    id: '2',
    title: 'Museum of Science Area',
    location: 'Museum of Science',
    category: 'Architecture',
    rewards: '$150-200',
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
    additionalNotes: 'Looking for photos that capture both the modern architecture and the natural setting along the Charles River. Both exterior and interior shots are welcome.'
  }
}; 