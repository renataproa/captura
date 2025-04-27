import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useTheme, SegmentedButtons, Chip, Searchbar, Button } from 'react-native-paper';
import * as Location from 'expo-location';
import debounce from 'lodash/debounce';
import { PhotoRequest, addPhotoRequest, getRequestById, updatePhotoRequest } from '../utils/requestStore';

// Categories from the buyer home screen
const categories = ['Urban', 'Architecture', 'Campus', 'Nature', 'Events', 'Street Art'];

interface Location {
  id: string;
  value: string;
  subtitle?: string;
  distance?: number;
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
    value: "TD Garden",
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

// Helper function to format distance
const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

interface FormData {
  title: string;
  location: string;
  category: string;
  rewards: string;
  deadline: string;
  description: string;
  requirements: string[];
  preferredTimes: string[];
  additionalNotes: string;
  matchedPhotos: number;
  status: 'active' | 'completed' | 'expired';
  submissionCount: number;
  createdAt: Date;
  locationSearch: string;
  selectedLocation: Location | null;
  requesterType: 'individual' | 'brand';
  humanPresence: 'required' | 'not_allowed' | 'optional';
  user: {
    name: string;
    avatar: any;
  };
}

const initialFormData: FormData = {
  title: '',
  location: '',
  category: 'Urban',
  rewards: '$10 Coupon',
  deadline: '3 days',
  description: '',
  requirements: [],
  preferredTimes: [],
  additionalNotes: '',
  matchedPhotos: 0,
  status: 'active',
  submissionCount: 0,
  createdAt: new Date(),
  locationSearch: '',
  selectedLocation: null,
  requesterType: 'individual',
  humanPresence: 'optional',
  user: {
    name: 'Current User',
    avatar: require('../../assets/images/avatar.png')
  }
};

export default function CreateRequest() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();
  
  const isEditMode = params.mode === 'edit';
  const requestId = params.id as string;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Load existing request data if in edit mode
  useEffect(() => {
    if (isEditMode && requestId) {
      const existingRequest = getRequestById(requestId);
      if (existingRequest) {
        // Convert the existing request to form data
        setFormData({
          title: existingRequest.title,
          location: existingRequest.location,
          category: existingRequest.category,
          rewards: existingRequest.rewards,
          deadline: existingRequest.deadline,
          description: existingRequest.description,
          requirements: existingRequest.requirements,
          preferredTimes: existingRequest.preferredTimes || [],
          additionalNotes: existingRequest.additionalNotes || '',
          matchedPhotos: existingRequest.matchedPhotos,
          status: existingRequest.status,
          submissionCount: existingRequest.submissionCount,
          createdAt: existingRequest.createdAt,
          requesterType: existingRequest.requesterType,
          humanPresence: existingRequest.humanPresence,
          user: existingRequest.user,
          locationSearch: existingRequest.location,
          selectedLocation: null // We don't have the exact location object
        });
      }
    }
  }, [isEditMode, requestId]);

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});

      // Search for locations using the query
      const searchResults = await Location.geocodeAsync(query);
      
      if (searchResults.length > 0) {
        // Convert the results to our format
        const formattedResults = await Promise.all(
          searchResults.map(async (result) => {
            // Get the address for each location
            const [address] = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });

            // Calculate distance from current location
            const distance = calculateDistance(
              currentLocation.coords.latitude,
              currentLocation.coords.longitude,
              result.latitude,
              result.longitude
            );

            // Format the main title and subtitle
            const mainTitle = address?.name || '';
            const subtitle = [address?.street, address?.city, address?.region]
              .filter(Boolean)
              .join(', ');

            return {
              id: `${result.latitude},${result.longitude}`,
              value: mainTitle,
              subtitle: subtitle,
              distance: distance,
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

  const debouncedSearch = useMemo(
    () => debounce(searchLocations, 300),
    [searchLocations]
  );

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
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
    if (isEditMode && requestId) {
      // Update existing request
      const existingRequest = getRequestById(requestId);
      if (!existingRequest) return;
      
      const updatedRequest: PhotoRequest = {
        ...existingRequest,
        title: formData.title,
        location: formData.selectedLocation ? formData.selectedLocation.value : formData.location,
        category: formData.category,
        rewards: formData.rewards,
        deadline: formData.deadline,
        description: formData.description,
        requirements: Array.isArray(formData.requirements) && formData.requirements.length > 0 
          ? formData.requirements 
          : ['No specific requirements'],
        preferredTimes: formData.preferredTimes && formData.preferredTimes.length > 0 
          ? formData.preferredTimes 
          : ['Anytime'],
        additionalNotes: formData.additionalNotes || 'No additional notes',
        status: formData.status,
        humanPresence: formData.humanPresence,
        requesterType: formData.requesterType,
        user: formData.user
      };
      
      updatePhotoRequest(updatedRequest);
      router.push("/(tabs)/my-requests");
    } else {
      // Format the rewards value
      let rewardsValue = formData.rewards;
      if (typeof rewardsValue === 'string') {
        // If it's a coupon value, make sure it's formatted correctly
        if (!rewardsValue.includes('Coupon')) {
          rewardsValue = `${rewardsValue} Coupon`;
        }
        
        // Make sure it has a $ sign if it's a number
        if (!rewardsValue.includes('$')) {
          rewardsValue = `$${rewardsValue}`;
        }
      }
      
      // Create new request
      const newRequest: Omit<PhotoRequest, 'ownerId'> = {
        id: Math.random().toString(36).substr(2, 9),
        title: formData.title,
        location: formData.selectedLocation ? formData.selectedLocation.value : formData.location,
        category: formData.category,
        rewards: rewardsValue,
        deadline: formData.deadline,
        description: formData.description || 'No description provided',
        requirements: Array.isArray(formData.requirements) && formData.requirements.length > 0 
          ? formData.requirements 
          : ['No specific requirements'],
        preferredTimes: formData.preferredTimes && formData.preferredTimes.length > 0 
          ? formData.preferredTimes 
          : ['Anytime'],
        additionalNotes: formData.additionalNotes || 'No additional notes',
        matchedPhotos: 0,
        status: 'active',
        submissionCount: 0,
        createdAt: new Date(),
        requesterType: formData.requesterType,
        humanPresence: formData.humanPresence,
        user: {
          name: 'Current User',
          avatar: require('../../assets/images/avatar.png')
        }
      };
      
      addPhotoRequest(newRequest);
      router.push("/(tabs)/my-requests");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepSubtitle}>Step 1 of 4</Text>
            
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
            <Text style={styles.stepSubtitle}>Step 2 of 4</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.searchContainer}>
                <Searchbar
                  placeholder="Search for a location"
                  value={formData.location}
                  onChangeText={(text) => {
                    setFormData({ ...formData, location: text });
                    if (text.length >= 2) {
                      debouncedSearch(text);
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  style={styles.searchBar}
                />
                
                {searchResults.length > 0 && (
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
                        <View style={styles.searchResultContent}>
                          <View style={styles.searchResultMain}>
                            <Text style={styles.searchResultTitle}>{item.value}</Text>
                            {item.subtitle && (
                              <Text style={styles.searchResultSubtitle}>{item.subtitle}</Text>
                            )}
                          </View>
                          {item.distance !== undefined && (
                            <Text style={styles.searchResultDistance}>
                              {formatDistance(item.distance)}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                    style={styles.searchResultsList}
                  />
                )}
              </View>
            </View>
            
            <CategorySelector />
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Requirements</Text>
            <Text style={styles.stepSubtitle}>Step 3 of 4</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Maximum number of photos</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.requirements.join(',')}
                  onValueChange={(value: string) => setFormData({ ...formData, requirements: value.split(',') })}
                  style={styles.picker}
                >
                  {['1', '3', '5', '10', '15', '20'].map((num) => (
                    <Picker.Item key={num} label={num} value={num} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Rewards</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  style={styles.picker}
                  selectedValue={formData.rewards}
                  onValueChange={(value: string) => setFormData({ ...formData, rewards: value })}
                >
                  <Picker.Item label="$10 Coupon" value="$10 Coupon" />
                  <Picker.Item label="$15 Coupon" value="$15 Coupon" />
                  <Picker.Item label="$20 Coupon" value="$20 Coupon" />
                  <Picker.Item label="$25 Coupon" value="$25 Coupon" />
                  <Picker.Item label="$30 Coupon" value="$30 Coupon" />
                </Picker>
              </View>
            </View>
          </View>
        );
      
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Review Request</Text>
            <Text style={styles.stepSubtitle}>Step 4 of 4</Text>
            
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
                  {formData.selectedLocation?.value || formData.location}
                </Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Category:</Text>
                <Text style={styles.reviewValue}>{formData.category}</Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Max Photos:</Text>
                <Text style={styles.reviewValue}>{formData.requirements.join(', ')}</Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Rewards:</Text>
                <Text style={styles.reviewValue}>{formData.rewards}</Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  // Update the category selection UI
  const CategorySelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Categories (Select multiple)</Text>
      <View style={styles.categoriesWrapper}>
        {categories.map((category) => (
          <Chip
            key={category}
            mode="outlined"
            selected={formData.requirements.includes(category)}
            onPress={() => {
              const updatedCategories = formData.requirements.includes(category)
                ? formData.requirements.filter(c => c !== category)
                : [...formData.requirements, category];
              setFormData({ ...formData, requirements: updatedCategories });
            }}
            style={styles.categoryChipNew}
            selectedColor="#007AFF"
            showSelectedOverlay
          >
            {category}
          </Chip>
        ))}
      </View>
      {formData.requirements.length === 0 && (
        <Text style={styles.categoryWarning}>Please select at least one category</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: false,
        title: ''
      }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Photo Request</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={styles.progressStepContainer}>
            <View 
              style={[
                styles.progressStep, 
                currentStep >= step ? styles.progressStepActive : {}
              ]} 
            />
            {step < 4 && (
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
      
      <View style={styles.mainContent}>
        <ScrollView style={styles.content}>
          {renderStep()}
        </ScrollView>
        
        <View style={styles.footer}>
          <Button 
            mode="contained"
            onPress={handleNext}
            style={styles.nextButton}
          >
            {currentStep === 4 ? 'Submit Request' : 'Next'}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    padding: 16,
    paddingTop: 8,
  },
  progressStepContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  progressStepActive: {
    backgroundColor: '#007AFF',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#007AFF',
  },
  mainContent: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  searchContainer: {
    position: 'relative',
    zIndex: 1,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  searchResultsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchResultMain: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    color: '#333',
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  searchResultDistance: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  reviewContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  nextButton: {
    height: 50,
    justifyContent: 'center',
  },
  categoriesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChipNew: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  categoryWarning: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
}); 