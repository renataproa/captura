import React from 'react';
import { View, StyleSheet, Platform, Image, ScrollView, FlatList } from 'react-native';
import { Text, Button, useTheme, Portal, Modal, IconButton, Chip, Banner, Card } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { PhotoMetadata } from '../utils/photoMatching';
import { getRequestById, addPhotoSubmission } from '../utils/requestStore';

export default function SubmitPhotoScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const request = id ? getRequestById(id as string) : null;
  
  const [selectedImage, setSelectedImage] = useState<PhotoMetadata | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Check if basic permissions are granted
  useEffect(() => {
    (async () => {
      if (!mediaPermission?.granted) {
        const permission = await requestMediaPermission();
        if (!permission.granted) {
          setError('Media library access is required to select photos');
        }
      }
      
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      
      // Request location permission for metadata
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (!locationPermission.granted) {
        console.log('Location permission not granted - some features may be limited');
      }
    })();
  }, []);

  const takePhoto = async () => {
    try {
      if (!cameraPermission?.granted) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          setError('Camera permission is required to take photos');
          return;
        }
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
        exif: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const currentLocation = await Location.getCurrentPositionAsync({});
        
        setSelectedImage({
          id: Date.now().toString(),
          uri: asset.uri,
          filename: asset.uri.split('/').pop() || 'photo.jpg',
          width: asset.width || 800,
          height: asset.height || 600,
          creationTime: new Date(),
          location: currentLocation ? {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude
          } : undefined
        });
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      setError('Failed to take photo. Please try again.');
    }
  };

  const selectFromLibrary = async () => {
    try {
      if (!mediaPermission?.granted) {
        const permission = await requestMediaPermission();
        if (!permission.granted) {
          setError('Media library access is required to select photos');
          return;
        }
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        exif: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Try to get location from image if available, otherwise use current location
        let location = undefined;
        
        try {
          const currentLocation = await Location.getCurrentPositionAsync({});
          location = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude
          };
        } catch (err) {
          console.log('Could not get current location:', err);
        }
        
        setSelectedImage({
          id: asset.assetId || Date.now().toString(),
          uri: asset.uri,
          filename: asset.uri.split('/').pop() || 'photo.jpg',
          width: asset.width || 800,
          height: asset.height || 600,
          creationTime: new Date(),
          location
        });
      }
    } catch (err) {
      console.error('Error selecting from library:', err);
      setError('Failed to select photo. Please try again.');
    }
  };

  const uploadFromWeb = async () => {
    if (Platform.OS !== 'web') return;
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        setSelectedImage({
          id: Date.now().toString(),
          uri: asset.uri,
          filename: asset.name || 'uploaded-photo.jpg',
          width: 800, // Default width for web uploads
          height: 600, // Default height for web uploads
          creationTime: new Date(),
          location: {
            latitude: 42.3601, // Default to Boston coordinates for web uploads
            longitude: -71.0549
          }
        });
      }
    } catch (err) {
      console.error('Error uploading from web:', err);
      setError('Failed to upload photo. Please try again.');
    }
  };

  const submitPhoto = async () => {
    if (!selectedImage) {
      setError('Please select or take a photo first');
      return;
    }
    
    if (!request) {
      setError('Request information not found');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Add the submission to the store
      const submissionId = Date.now().toString();
      addPhotoSubmission({
        id: submissionId,
        requestId: request.id,
        requestTitle: request.title,
        location: request.location,
        category: request.category,
        photoUri: selectedImage.uri,
        status: 'pending_approval',
        timestamp: new Date(),
        metadata: {
          width: selectedImage.width,
          height: selectedImage.height, 
          hasLocation: selectedImage.location ? true : false,
          creationTime: selectedImage.creationTime
        }
      });
      
      // Show success state
      setSubmitting(false);
      setSubmissionSuccess(true);
      
      // Automatically navigate to request details after a delay
      setTimeout(() => {
        router.push({
          pathname: "/screens/request-details",
          params: { 
            id: request.id, 
            submitted: 'true', 
            photoUri: selectedImage.uri,
            submissionId: submissionId
          }
        });
      }, 2000); // 2 second delay to show the success message
    } catch (err) {
      console.error('Error submitting photo:', err);
      setError('Failed to submit photo. Please try again.');
      setSubmitting(false);
    }
  };

  if (!request) {
    return (
      <View style={styles.container}>
        <Text>Request not found</Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: false 
      }} />
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#f7d4d4', '#e6b3e6', '#d4d4f7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
              <Button 
                mode="contained" 
                icon="arrow-left"
                onPress={() => {
                  if (submissionSuccess) {
                    router.push("/");
                  } else {
                    router.back();
                  }
                }}
                style={styles.backButton}
              >
                Back
              </Button>
              <Text variant="headlineMedium" style={styles.title}>
                {submissionSuccess ? "Submission Complete" : "Submit Photo"}
              </Text>
            </View>

            {submissionSuccess ? (
              <>
                <Card style={styles.successCard}>
                  <Card.Content style={styles.successContent}>
                    <IconButton
                      icon="check-circle"
                      iconColor="#10b981"
                      size={56}
                      style={styles.successIcon}
                    />
                    <Text variant="headlineSmall" style={styles.successTitle}>
                      Photo Successfully Submitted!
                    </Text>
                    <Text variant="bodyMedium" style={styles.successMessage}>
                      Your photo has been submitted for "{request.title}" and is now pending approval.
                    </Text>
                    <Image 
                      source={{ uri: selectedImage?.uri }} 
                      style={styles.submittedImage} 
                      resizeMode="contain"
                    />
                  </Card.Content>
                </Card>

                <Card style={styles.requestCard}>
                  <Card.Content>
                    <Text variant="titleLarge" style={styles.requestTitle}>{request.title}</Text>
                    <View style={styles.metaContainer}>
                      <Chip icon="map-marker" style={styles.chip}>{request.location}</Chip>
                      <Chip icon="tag" style={styles.chip}>{request.category}</Chip>
                    </View>
                    <View style={styles.rewardsContainer}>
                      <Text variant="bodyMedium" style={styles.rewardsLabel}>Rewards:</Text>
                      <Text variant="bodyLarge" style={styles.rewardsValue}>{request.rewards}</Text>
                    </View>
                    <Text variant="bodyMedium" style={styles.description}>
                      {request.description}
                    </Text>
                  </Card.Content>
                </Card>

                <View style={styles.submitContainer}>
                  <Button 
                    mode="contained"
                    icon="home"
                    onPress={() => router.push("/")}
                    style={styles.goHomeButton}
                  >
                    Return to Home
                  </Button>
                  <Button 
                    mode="outlined"
                    icon="image-multiple"
                    onPress={() => router.push({
                      pathname: "/screens/request-details",
                      params: { id: request.id, submitted: 'true', photoUri: selectedImage?.uri }
                    })}
                    style={styles.viewDetailsButton}
                  >
                    View Request Details
                  </Button>
                </View>
              </>
            ) : (
              <>
                <Card style={styles.requestCard}>
                  <Card.Content>
                    <Text variant="titleLarge" style={styles.requestTitle}>{request.title}</Text>
                    <View style={styles.metaContainer}>
                      <Chip icon="map-marker" style={styles.chip}>{request.location}</Chip>
                      <Chip icon="tag" style={styles.chip}>{request.category}</Chip>
                    </View>
                    <Text variant="bodyMedium" style={styles.description}>
                      {request.description}
                    </Text>
                  </Card.Content>
                </Card>

                {error && (
                  <Banner 
                    visible={true} 
                    icon="alert" 
                    actions={[{ label: 'Dismiss', onPress: () => setError(null) }]}
                    style={styles.errorBanner}
                  >
                    {error}
                  </Banner>
                )}

                <Card style={styles.photoCard}>
                  <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Select Photo</Text>
                    
                    {selectedImage ? (
                      <View style={styles.selectedImageContainer}>
                        <Image 
                          source={{ uri: selectedImage.uri }} 
                          style={styles.selectedImage} 
                          resizeMode="contain"
                        />
                        <IconButton 
                          icon="close" 
                          size={24} 
                          onPress={() => setSelectedImage(null)}
                          style={styles.removeImageButton}
                        />
                        {selectedImage.location && (
                          <Chip icon="map-marker" style={styles.locationChip}>
                            Has Location Data
                          </Chip>
                        )}
                      </View>
                    ) : (
                      <View style={styles.photoOptions}>
                        <Button 
                          mode="contained" 
                          icon="camera" 
                          onPress={takePhoto}
                          style={styles.photoOptionButton}
                        >
                          Take Photo
                        </Button>
                        <Button 
                          mode="contained" 
                          icon="image" 
                          onPress={selectFromLibrary}
                          style={styles.photoOptionButton}
                        >
                          Choose from Library
                        </Button>
                        {Platform.OS === 'web' && (
                          <Button 
                            mode="contained" 
                            icon="upload" 
                            onPress={uploadFromWeb}
                            style={styles.photoOptionButton}
                          >
                            Upload Photo
                          </Button>
                        )}
                      </View>
                    )}
                  </Card.Content>
                </Card>

                <View style={styles.submitContainer}>
                  <Button 
                    mode="contained"
                    icon="send"
                    onPress={submitPhoto}
                    disabled={!selectedImage || submitting}
                    loading={submitting}
                    style={styles.submitButton}
                  >
                    Submit Photo
                  </Button>
                </View>
              </>
            )}
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7d4d4',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 16,
    borderRadius: 20,
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
  },
  requestCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  requestTitle: {
    color: '#6b4d8f',
    fontWeight: '600',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
  },
  description: {
    color: '#666',
  },
  photoCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  sectionTitle: {
    color: '#6b4d8f',
    fontWeight: '600',
    marginBottom: 16,
  },
  photoOptions: {
    gap: 12,
    marginBottom: 16,
  },
  photoOptionButton: {
    backgroundColor: '#6b4d8f',
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
  locationChip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorBanner: {
    marginBottom: 16,
  },
  submitContainer: {
    marginVertical: 20,
  },
  submitButton: {
    backgroundColor: '#6b4d8f',
    paddingVertical: 8,
  },
  successCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  successContent: {
    alignItems: 'center',
    padding: 16,
  },
  successIcon: {
    margin: 16,
  },
  successTitle: {
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  submittedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  goHomeButton: {
    backgroundColor: '#6b4d8f',
    marginBottom: 12,
  },
  viewDetailsButton: {
    borderColor: '#6b4d8f',
  },
  rewardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  rewardsLabel: {
    color: '#6b4d8f',
    marginRight: 8,
  },
  rewardsValue: {
    color: '#6b4d8f',
    fontWeight: '600',
  },
}); 