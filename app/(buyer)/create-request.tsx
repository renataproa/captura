import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// Categories from the buyer home screen
const categories = ['Urban', 'Architecture', 'Campus', 'Nature', 'Events', 'Street Art'];

// Mock location data for Boston area
const locations = [
  { id: '1', name: 'Boston Common' },
  { id: '2', name: 'Faneuil Hall' },
  { id: '3', name: 'Harvard Campus' },
  { id: '4', name: 'Fenway Park' },
  { id: '5', name: 'Boston Harbor' },
  { id: '6', name: 'Custom Location' },
];

// Expiration time options
const expirationOptions = [
  { id: '1', label: '3 hours', value: '3' },
  { id: '2', label: '6 hours', value: '6' },
  { id: '3', label: '12 hours', value: '12' },
  { id: '4', label: '24 hours', value: '24' },
  { id: '5', label: '3 days', value: '72' },
  { id: '6', label: '1 week', value: '168' },
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

export default function CreateRequest() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: categories[0],
    location: locations[0].id,
    customLocation: '',
    expiration: expirationOptions[0].value,
    hasMaxPhotos: false,
    maxPhotos: '5',
    reward: rewardOptions[0].value,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit form
      console.log('Form submitted:', formData);
      // Navigate back to home screen
      router.back();
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
    // In a real app, this would send the data to a backend
    console.log('Form submitted:', formData);
    router.back();
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
            <Text style={styles.stepTitle}>Category & Location</Text>
            <Text style={styles.stepSubtitle}>Step 2 of 5</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryContainer}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      formData.category === category && styles.categoryChipSelected
                    ]}
                    onPress={() => setFormData({ ...formData, category })}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      formData.category === category && styles.categoryChipTextSelected
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.location}
                  onValueChange={(value: string) => setFormData({ ...formData, location: value })}
                  style={styles.picker}
                >
                  {locations.map((location) => (
                    <Picker.Item key={location.id} label={location.name} value={location.id} />
                  ))}
                </Picker>
              </View>
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
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Time & Quantity</Text>
            <Text style={styles.stepSubtitle}>Step 3 of 5</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Expiration Time</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.expiration}
                  onValueChange={(value: string) => setFormData({ ...formData, expiration: value })}
                  style={styles.picker}
                >
                  {expirationOptions.map((option) => (
                    <Picker.Item key={option.id} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <TouchableOpacity 
                style={styles.toggleContainer}
                onPress={() => setFormData({ ...formData, hasMaxPhotos: !formData.hasMaxPhotos })}
              >
                <View style={[styles.toggle, formData.hasMaxPhotos && styles.toggleActive]}>
                  <View style={[styles.toggleHandle, formData.hasMaxPhotos && styles.toggleHandleActive]} />
                </View>
                <Text style={styles.toggleLabel}>Set maximum number of photos</Text>
              </TouchableOpacity>

              {formData.hasMaxPhotos && (
                <View style={[styles.numberInputContainer, { marginTop: 12 }]}>
                  <TouchableOpacity 
                    style={styles.numberButton}
                    onPress={() => {
                      const currentValue = parseInt(formData.maxPhotos);
                      if (currentValue > 1) {
                        setFormData({ ...formData, maxPhotos: String(currentValue - 1) });
                      }
                    }}
                  >
                    <Ionicons name="remove" size={24} color="#007AFF" />
                  </TouchableOpacity>
                  <Text style={styles.numberInput}>{formData.maxPhotos}</Text>
                  <TouchableOpacity 
                    style={styles.numberButton}
                    onPress={() => {
                      const currentValue = parseInt(formData.maxPhotos);
                      setFormData({ ...formData, maxPhotos: String(currentValue + 1) });
                    }}
                  >
                    <Ionicons name="add" size={24} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        );
      
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Reward</Text>
            <Text style={styles.stepSubtitle}>Step 4 of 5</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Reward per Accepted Photo</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.reward}
                  onValueChange={(value: string) => setFormData({ ...formData, reward: value })}
                  style={styles.picker}
                >
                  {rewardOptions.map((option) => (
                    <Picker.Item key={option.id} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.rewardInfoContainer}>
              <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
              <Text style={styles.rewardInfoText}>
                In this demo version, rewards are non-monetary coupons. In the full version, you'll be able to offer cash rewards.
              </Text>
            </View>
          </View>
        );
      
      case 5:
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
                <Text style={styles.reviewLabel}>Category:</Text>
                <Text style={styles.reviewValue}>{formData.category}</Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Location:</Text>
                <Text style={styles.reviewValue}>
                  {formData.location === '6' 
                    ? formData.customLocation 
                    : locations.find(loc => loc.id === formData.location)?.name}
                </Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Expiration:</Text>
                <Text style={styles.reviewValue}>
                  {expirationOptions.find(opt => opt.value === formData.expiration)?.label}
                </Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Max Photos:</Text>
                <Text style={styles.reviewValue}>{formData.maxPhotos}</Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Reward:</Text>
                <Text style={styles.reviewValue}>
                  {rewardOptions.find(opt => opt.value === formData.reward)?.label}
                </Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
}); 