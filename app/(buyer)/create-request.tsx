import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as MediaLibrary from 'expo-media-library';
import { getMatchingSummary, PhotoMetadata, MatchingSummary } from '../utils/photoMatching';
import { format } from 'date-fns';
import PhotoValueReport from '../components/PhotoValueReport';
import { useTheme, SegmentedButtons, Chip, Searchbar } from 'react-native-paper';
import { mockRequests, PhotoRequest } from './index';
import * as Location from 'expo-location';

// Define PhotoData type to match PhotoValueReport
interface PhotoData {
  id: string;
  filename: string;
  uri: string;
  creationTime: number;
  formattedDate: string;
  location: {
    latitude: string;
    longitude: string;
  };
  width: number;
  height: number;
  resolution: string;
  selected: boolean;
}

// Categories from the buyer home screen
const categories = ['Urban', 'Architecture', 'Campus', 'Nature', 'Events', 'Street Art'];

interface Location {
  id: string;
  value: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface ExpirationOption {
  id: string;
  label: string;
  value: string;
  deadline: string;
}

const locations: Location[] = [
  {
    id: "1",
    value: "Boston Common",
    coordinates: { latitude: 42.3551, longitude: -71.0657 }
  },
  {
    id: "2",
    value: "Faneuil Hall",
    coordinates: { latitude: 42.3600, longitude: -71.0568 }
  },
  {
    id: "3",
    value: "Harvard Square",
    coordinates: { latitude: 42.3736, longitude: -71.1190 }
  },
  {
    id: "4",
    value: "Custom Location",
    coordinates: { latitude: 42.3601, longitude: -71.0549 }
  }
];

const expirationOptions: ExpirationOption[] = [
  {
    id: "1",
    label: "1 day",
    value: "1",
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "2",
    label: "3 days",
    value: "3",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "3",
    label: "1 week",
    value: "7",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Reward options (non-monetary in v0.1)
const rewardOptions = [
  { id: '1', label: '$5 Coupon', value: '5' },
  { id: '2', label: '$10 Coupon', value: '10' },
  { id: '3', label: '$15 Coupon', value: '15' },
  { id: '4', label: '$20 Coupon', value: '20' },
  { id: '5', label: '$25 Coupon', value: '25' },
  { id: '6', label: '$30 Coupon', value: '30' },
];

// Location coordinates for major Boston locations
const LOCATION_COORDINATES = {
  '1': { latitude: 42.3554, longitude: -71.0655 }, // Boston Common
  '2': { latitude: 42.3601, longitude: -71.0549 }, // Faneuil Hall
  '3': { latitude: 42.3744, longitude: -71.1169 }, // Harvard Yard
  '4': { latitude: 42.3466, longitude: -71.0972 }, // Fenway Park
  '5': { latitude: 42.3584, longitude: -71.0598 }, // Downtown
  '6': { latitude: 42.3601, longitude: -71.0942 }, // MIT
} as const;

// Calculate distance between two points in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Convert PhotoMetadata to PhotoData
function convertToPhotoData(photo: PhotoMetadata): PhotoData {
  return {
    id: photo.id,
    filename: photo.filename,
    uri: `file://${photo.filename}`,
    creationTime: photo.creationTime.getTime(),
    formattedDate: format(photo.creationTime, 'MMM d, yyyy'),
    location: photo.location ? {
      latitude: photo.location.latitude.toString(),
      longitude: photo.location.longitude.toString()
    } : {
      latitude: '0',
      longitude: '0'
    },
    width: photo.width,
    height: photo.height,
    resolution: `${photo.width}x${photo.height}`,
    selected: false,
  };
}

// Add this interface for location search results
interface LocationSearchResult {
  id: string;
  name: string;
  address?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export default function CreateRequest() {
  const router = useRouter();
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [userPhotos, setUserPhotos] = useState<PhotoMetadata[]>([]);
  const [matchingSummary, setMatchingSummary] = useState<MatchingSummary | null>(null);
  const [showValueReport, setShowValueReport] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoData[]>([]);
  
  const [formData, setFormData] = useState({
    title: "Back Bay Urban Photography",
    description: "Looking for high-quality urban photos of Back Bay area, similar to recent shots. Particularly interested in architectural details and street scenes.",
    location: '',
    customLocation: '',
    locationSearch: '',
    selectedLocation: null as Location | null,
    categories: ['Urban'] as string[],
    maxPhotos: '5',
    budget: '200-300',
    deadline: '3',
    urgency: 'normal'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchResults, setSearchResults] = useState<Location[]>([]);

  useEffect(() => {
    loadUserPhotos();
  }, []);

  useEffect(() => {
    if (userPhotos.length > 0) {
      const summary = getMatchingSummary(userPhotos, {
        location: locations.find(loc => loc.id === formData.location)?.value || '',
        customLocation: formData.customLocation,
        category: formData.categories.join(', '),
      });
      setMatchingSummary(summary);
    }
  }, [formData.location, formData.customLocation, formData.categories]);

  const loadUserPhotos = async () => {
    try {
      console.log('Requesting photo library permissions...');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Photo library permission denied');
        return;
      }
      
      console.log('Loading photos from library...');
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 50, // Load last 50 photos
      });
      
      console.log(`Found ${assets.length} photos, processing metadata...`);
      
      // Convert assets to PhotoMetadata format
      const photos: PhotoMetadata[] = await Promise.all(
        assets.map(async (asset) => {
          try {
            const info = await MediaLibrary.getAssetInfoAsync(asset);
            return {
              id: asset.id,
              creationTime: new Date(asset.creationTime),
              filename: asset.filename,
              location: info.location,
              width: asset.width,
              height: asset.height,
              uri: info.localUri || asset.uri
            };
          } catch (error) {
            console.error(`Error processing photo ${asset.id}:`, error);
            return {
              id: asset.id,
              creationTime: new Date(asset.creationTime),
              filename: asset.filename,
              width: asset.width,
              height: asset.height,
              uri: asset.uri
            };
          }
        })
      );
      
      // Filter out photos without location data
      const photosWithLocation = photos.filter(photo => photo.location);
      console.log(`Processed ${photos.length} photos, ${photosWithLocation.length} have location data`);
      
      setUserPhotos(photos);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit form
      console.log('Form submitted:', formData);
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = () => {
    // Create a new request object
    const selectedLocation = locations.find(loc => loc.id === formData.location);
    const selectedExpiration = expirationOptions.find(opt => opt.value === formData.deadline);
    
    const newRequest: PhotoRequest = {
      id: (mockRequests.length + 1).toString(),
      title: formData.title,
      description: formData.description,
      location: formData.location === 'custom' ? formData.customLocation : selectedLocation!.value,
      category: formData.categories.join(', '),
      budget: formData.budget,
      deadline: selectedExpiration!.deadline,
      urgency: formData.urgency as 'normal' | 'urgent',
      responseCount: 0,
      matchedPhotos: 0,
      coordinates: formData.location === 'custom' 
        ? { latitude: 42.3601, longitude: -71.0549 } // Default to city center for custom locations
        : selectedLocation!.coordinates
    };

    // Add the new request to mockRequests
    mockRequests.unshift(newRequest);

    // Navigate back to the marketplace
    router.push('/(buyer)');
  };

  const renderLocationMatchingInfo = () => {
    if (!matchingSummary) return null;

    const formatDate = (date: Date) => {
      return format(date, 'MMM d, yyyy');
    };

    return (
      <View style={styles.matchingInfoContainer}>
        <Ionicons name="images-outline" size={24} color="#007AFF" />
        <View style={styles.matchingTextContainer}>
          {matchingSummary.matchCount > 0 ? (
            <>
              <Text style={styles.matchingText}>
                You have {matchingSummary.matchCount} photos from this location
                {matchingSummary.nearbyCount > 0 && ` and ${matchingSummary.nearbyCount} photos nearby`}!
              </Text>
              
              <View style={styles.matchingDetailsContainer}>
                {matchingSummary.recentMatches > 0 && (
                  <View style={styles.matchingDetailItem}>
                    <Ionicons name="time-outline" size={16} color="#007AFF" />
                    <Text style={styles.matchingSubtext}>
                      {matchingSummary.recentMatches} recent photos
                    </Text>
                  </View>
                )}
                
                {matchingSummary.timeRange && (
                  <View style={styles.matchingDetailItem}>
                    <Ionicons name="calendar-outline" size={16} color="#007AFF" />
                    <Text style={styles.matchingSubtext}>
                      {matchingSummary.timeRange}
                    </Text>
                  </View>
                )}
                
                {matchingSummary.newestMatchDate && (
                  <View style={styles.matchingDetailItem}>
                    <Ionicons name="camera-outline" size={16} color="#007AFF" />
                    <Text style={styles.matchingSubtext}>
                      Latest: {formatDate(matchingSummary.newestMatchDate)}
                    </Text>
                  </View>
                )}
              </View>
              
              {matchingSummary.matchCount > 0 && (
                <TouchableOpacity 
                  style={styles.viewMatchesButton}
                  onPress={() => {
                    // Find matching photos
                    const matchingPhotos = userPhotos.filter(photo => {
                      if (!photo.location) return false;
                      
                      const requestCoords = LOCATION_COORDINATES[formData.location as keyof typeof LOCATION_COORDINATES];
                      if (!requestCoords) return false;
                      
                      const distance = calculateDistance(
                        photo.location.latitude,
                        photo.location.longitude,
                        requestCoords.latitude,
                        requestCoords.longitude
                      );
                      
                      return distance <= 0.2; // Within 200m
                    });
                    
                    setSelectedPhotos(matchingPhotos.map(convertToPhotoData));
                    setShowValueReport(true);
                  }}
                >
                  <Text style={styles.viewMatchesButtonText}>View Matching Photos</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </TouchableOpacity>
              )}
            </>
          ) : matchingSummary.nearbyCount > 0 ? (
            <Text style={styles.matchingText}>
              You have {matchingSummary.nearbyCount} photos near this location!
            </Text>
          ) : (
            <Text style={styles.noMatchingText}>
              You don't have any photos from this location yet
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepSubtitle}>Step 1 of 5</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter a title for your request"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the photos you're looking for"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Location & Category</Text>
            <Text style={styles.stepSubtitle}>Step 2 of 5</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <Searchbar
                placeholder="Search for a location"
                onChangeText={(text) => {
                  setFormData({ ...formData, locationSearch: text });
                  searchLocations(text);
                }}
                value={formData.locationSearch}
                style={styles.searchBar}
              />
              
              {searchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.searchResultItem}
                        onPress={() => {
                          setFormData({
                            ...formData,
                            location: item.id,
                            locationSearch: item.value,
                            selectedLocation: item
                          });
                          setSearchResults([]);
                        }}
                      >
                        <Text style={styles.searchResultText}>{item.value}</Text>
                      </TouchableOpacity>
                    )}
                    style={styles.searchResultsList}
                  />
                </View>
              )}
              {renderLocationMatchingInfo()}
            </View>
            
            {formData.location === '6' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Custom Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter location details"
                  value={formData.customLocation}
                  onChangeText={(text) => setFormData({ ...formData, customLocation: text })}
                />
              </View>
            )}
            
            <CategorySelector />
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Requirements</Text>
            <Text style={styles.stepSubtitle}>Step 3 of 5</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Maximum number of photos</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.maxPhotos}
                  onValueChange={(value: string) => setFormData({ ...formData, maxPhotos: value })}
                  style={styles.picker}
                >
                  {['1', '3', '5', '10', '15', '20'].map((num) => (
                    <Picker.Item key={num} label={num} value={num} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Budget Range</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.budget}
                  onValueChange={(value: string) => setFormData({ ...formData, budget: value })}
                  style={styles.picker}
                >
                  {rewardOptions.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Deadline</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.deadline}
                  onValueChange={(value: string) => setFormData({ ...formData, deadline: value })}
                  style={styles.picker}
                >
                  {expirationOptions.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Urgency</Text>
              <SegmentedButtons
                value={formData.urgency}
                onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                buttons={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'urgent', label: 'Urgent' }
                ]}
                style={styles.urgencyButtons}
              />
            </View>
          </View>
        );
      
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Review Request</Text>
            <Text style={styles.stepSubtitle}>Step 5 of 5</Text>
            
            <View style={styles.reviewContainer}>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Title:</Text>
                <Text style={styles.reviewValue}>{formData.title}</Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Description:</Text>
                <Text style={styles.reviewValue}>{formData.description}</Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Location:</Text>
                <Text style={styles.reviewValue}>
                  {formData.location === '6' 
                    ? formData.customLocation 
                    : locations.find(loc => loc.id === formData.location)?.value}
                </Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Category:</Text>
                <Text style={styles.reviewValue}>{formData.categories.join(', ')}</Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Max Photos:</Text>
                <Text style={styles.reviewValue}>{formData.maxPhotos}</Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Budget:</Text>
                <Text style={styles.reviewValue}>{formData.budget}</Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Deadline:</Text>
                <Text style={styles.reviewValue}>
                  {expirationOptions.find(opt => opt.value === formData.deadline)?.label}
                </Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Urgency:</Text>
                <Text style={styles.reviewValue}>{formData.urgency}</Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  // Update the searchLocations function to use real location search
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Request location permissions if not already granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      // Search for locations using the query
      const searchResults = await Location.geocodeAsync(query);
      
      if (searchResults.length > 0) {
        // Convert the results to our format
        const formattedResults: Location[] = await Promise.all(
          searchResults.map(async (result, index) => {
            // Get the address for each location
            const [address] = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });

            const locationName = address 
              ? `${address.name || ''} ${address.street || ''}`
              : `Location ${index + 1}`;

            return {
              id: `${result.latitude},${result.longitude}`,
              value: locationName.trim(),
              coordinates: {
                latitude: result.latitude,
                longitude: result.longitude,
              }
            };
          })
        );

        setSearchResults(formattedResults);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
    }
  };

  // Update the category selection UI
  const CategorySelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Categories (Select multiple)</Text>
      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <Chip
            key={category}
            selected={formData.categories.includes(category)}
            onPress={() => {
              const updatedCategories = formData.categories.includes(category)
                ? formData.categories.filter(c => c !== category)
                : [...formData.categories, category];
              setFormData({ ...formData, categories: updatedCategories });
            }}
            style={[
              styles.categoryChip,
              formData.categories.includes(category) && styles.categoryChipSelected
            ]}
            showSelectedCheck
          >
            {category}
          </Chip>
        ))}
      </View>
      {formData.categories.length === 0 && (
        <Text style={styles.categoryWarning}>Please select at least one category</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {showValueReport ? (
        <PhotoValueReport 
          photos={selectedPhotos}
          requestLocation={locations.find(loc => loc.id === formData.location)?.value || 'Custom Location'}
          requestCategory={formData.categories.join(', ')}
          onClose={() => setShowValueReport(false)}
        />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Photo Request</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4, 5].map((step) => (
              <View key={step} style={styles.progressStepContainer}>
                <View 
                  style={[
                    styles.progressStep, 
                    currentStep >= step ? styles.progressStepActive : {}
                  ]} 
                />
                {step < 5 && (
                  <View 
                    style={[
                      styles.progressLine, 
                      currentStep > step ? styles.progressLineActive : {}
                    ]} 
                  />
                )}
              </View>
            ))}
          </View>
          
          <ScrollView style={styles.content}>
            {renderStep()}
          </ScrollView>
          
          <View style={styles.footer}>
            {currentStep < 5 ? (
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  progressStepActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    padding: 8,
  },
  numberButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  numberInput: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  rewardInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F2FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  rewardInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  reviewContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
  },
  reviewItem: {
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextSelected: {
    color: '#FFF',
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#E0E0E0',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleHandle: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleHandleActive: {
    transform: [{ translateX: 20 }],
  },
  toggleLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  matchingInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  matchingTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  matchingText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  noMatchingText: {
    fontSize: 14,
    color: '#666',
  },
  matchingDetailsContainer: {
    marginTop: 8,
  },
  matchingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  matchingSubtext: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  viewMatchesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  viewMatchesButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginRight: 4,
  },
  urgencyButtons: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 8,
    backgroundColor: '#F8F8F8',
    elevation: 0,
    borderWidth: Platform.OS === 'ios' ? 1 : 0,
    borderColor: '#E0E0E0',
  },
  searchResultsContainer: {
    maxHeight: 200,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchResultText: {
    fontSize: 16,
  },
  searchResultAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 8,
  },
  categoryChip: {
    margin: 4,
    backgroundColor: '#F0F0F0',
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
  },
  categoryWarning: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
}); 