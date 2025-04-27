import { StyleSheet, View, ScrollView, Image, FlatList, TouchableOpacity, Platform, Alert, Linking } from 'react-native';
import { Text, Card, Button, useTheme, Portal, Modal, IconButton, Checkbox, Banner } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { PhotoMetadata } from '../utils/photoMatching';
import PhotoValueReport from '../components/PhotoValueReport';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function ProfileScreen() {
  const theme = useTheme();
  const [userPhotos, setUserPhotos] = useState<PhotoMetadata[]>([]);
  const [potentialValue, setPotentialValue] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [photoDataForReport, setPhotoDataForReport] = useState<any[]>([]);
  const [earnedToDate, setEarnedToDate] = useState(125); // Hardcoded value for now
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [accessiblePhotos, setAccessiblePhotos] = useState<PhotoMetadata[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoMetadata[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  // For alternative photo selection method if MediaLibrary has issues
  const requestImagePickerPermission = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return result.granted;
  };

  const fetchAccessiblePhotos = useCallback(async () => {
    console.log('fetchAccessiblePhotos called');
    setIsLibraryLoading(true);
    
    try {
      // Check if we have permissions already from the hook state
      if (!permissionResponse?.granted) {
        console.log('Permission not granted, requesting...');
        const newPermission = await requestPermission();
        console.log('New permission status:', newPermission.status);
        
        if (!newPermission.granted) {
          console.log('Permission still not granted after request');
          // Try to show the user how to fix this
          Alert.alert(
            "Permission Required",
            "Photo library access is needed. Please grant permission in your device settings.",
            [
              { 
                text: "Open Settings", 
                onPress: () => {
                  try {
                    // This is a more reliable way to direct to settings
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    } else {
                      Linking.openSettings();
                    }
                  } catch (err) {
                    console.error('Error opening settings:', err);
                  }
                } 
              },
              { text: "Try Alternate Method", onPress: useImagePickerFallback },
              { text: "Cancel", style: "cancel" }
            ]
          );
          setIsLibraryLoading(false);
          return;
        }
      }
      
      console.log('Fetching assets...');
      // Use a try/catch specifically for the getAssetsAsync call
      try {
        const { assets } = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.photo,
          first: 50,
          sortBy: [MediaLibrary.SortBy.creationTime],
        });
        
        console.log(`Found ${assets.length} assets`);
        
        const photoData = await Promise.all(
          assets.map(async (asset) => {
            try {
              // Get asset info for additional metadata
              const info = await MediaLibrary.getAssetInfoAsync(asset);
              
              // On iOS, convert ph:// URLs to proper file URLs if needed
              let uri = info.uri;
              if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
                try {
                  // For iOS, use localUri as a fallback which should be a file:// URL
                  uri = info.localUri || uri;
                  
                  // If we still have issues, attempt to copy the file to app cache
                  if (uri.startsWith('ph://')) {
                    const fileExtension = info.filename.split('.').pop() || 'jpg';
                    const destUri = `${FileSystem.cacheDirectory}temp_${Date.now()}.${fileExtension}`;
                    await FileSystem.copyAsync({
                      from: uri,
                      to: destUri
                    });
                    uri = destUri;
                  }
                } catch (error) {
                  console.log('Error handling iOS photo URL:', error);
                  // Final fallback
                  uri = info.localUri || uri;
                }
              }
              
              return {
                id: asset.id,
                creationTime: new Date(asset.creationTime),
                filename: asset.filename,
                location: info.location,
                width: asset.width,
                height: asset.height,
                uri: uri,
              } as PhotoMetadata;
            } catch (error) {
              console.error(`Error processing photo ${asset.id}:`, error);
              return {
                id: asset.id,
                creationTime: new Date(asset.creationTime),
                filename: asset.filename,
                width: asset.width,
                height: asset.height,
                uri: asset.uri,
              } as PhotoMetadata;
            }
          })
        );
        
        setAccessiblePhotos(photoData);
      } catch (assetError) {
        console.error('Error fetching or processing assets:', assetError);
        Alert.alert(
          "Error Loading Photos",
          "Could not load your photos. Would you like to try an alternate method?",
          [
            { text: "Try Alternate Method", onPress: useImagePickerFallback },
            { text: "Cancel", style: "cancel" }
          ]
        );
      }
    } catch (error) {
      console.error('Error in fetchAccessiblePhotos:', error);
      Alert.alert(
        "Error",
        "There was a problem accessing your photos. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLibraryLoading(false);
    }
  }, [permissionResponse, requestPermission]);

  const handleManageLibrary = async () => {
    console.log('handleManageLibrary pressed');
    // Simply show the modal without accessing photos yet
    setShowLibraryModal(true);
  };

  // Fallback to ImagePicker if MediaLibrary is not working
  const useImagePickerFallback = async () => {
    console.log('Using ImagePicker fallback');
    setIsLibraryLoading(true);
    
    try {
      const permissionGranted = await requestImagePickerPermission();
      
      if (!permissionGranted) {
        Alert.alert("Permission Denied", "Cannot access your photos without permission.");
        setIsLibraryLoading(false);
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
        exif: true,
      });
      
      if (!result.canceled && result.assets.length > 0) {
        console.log(`Selected ${result.assets.length} photos via ImagePicker`);
        
        const photoMetadata: PhotoMetadata[] = result.assets.map(asset => ({
          id: asset.assetId || `temp-${Date.now()}-${Math.random()}`,
          uri: asset.uri,
          filename: asset.uri.split('/').pop() || 'photo.jpg',
          creationTime: new Date(),
          width: asset.width || 800,
          height: asset.height || 600,
          location: asset.exif?.GPSLatitude && asset.exif?.GPSLongitude 
            ? { 
                latitude: asset.exif.GPSLatitude, 
                longitude: asset.exif.GPSLongitude 
              } 
            : undefined
        }));
        
        setAccessiblePhotos(photoMetadata);
      }
    } catch (error) {
      console.error('Error using ImagePicker fallback:', error);
      Alert.alert("Error", "Could not access photos. Please try again.");
    } finally {
      setIsLibraryLoading(false);
    }
  };

  const handleWebUpload = async () => {
    try {
      if (Platform.OS !== 'web') return;
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        multiple: true,
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets.length > 0) {
        const uploadedPhotos = result.assets.map((asset: DocumentPicker.DocumentPickerAsset) => ({
          id: Date.now().toString() + Math.random().toString(),
          creationTime: new Date(),
          filename: asset.name || 'uploaded-photo.jpg',
          width: 800, // Default width
          height: 600, // Default height
          uri: asset.uri,
          location: {
            latitude: 42.3601, // Default to Boston coordinates
            longitude: -71.0549
          }
        }));
        
        setAccessiblePhotos(prev => [...prev, ...uploadedPhotos]);
      }
    } catch (error) {
      console.error('Error uploading web photos:', error);
    }
  };

  const togglePhotoSelection = (photo: PhotoMetadata) => {
    const isSelected = selectedPhotos.some(p => p.id === photo.id);
    if (isSelected) {
      setSelectedPhotos(prev => prev.filter(p => p.id !== photo.id));
      setIsAllSelected(false);
    } else {
      setSelectedPhotos(prev => [...prev, photo]);
      if (selectedPhotos.length + 1 === accessiblePhotos.length) {
        setIsAllSelected(true);
      }
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos([...accessiblePhotos]);
    }
    setIsAllSelected(!isAllSelected);
  };

  const handleAddSelectedPhotos = () => {
    loadUserPhotos(selectedPhotos);
    setShowLibraryModal(false);
    setSelectedPhotos([]);
    setIsAllSelected(false);
  };

  const loadUserPhotos = async (photosToAdd: PhotoMetadata[]) => {
    try {
      if (!photosToAdd || photosToAdd.length === 0) {
        console.log('No photos provided');
        return;
      }
      
      const photosWithLocation = photosToAdd.filter(photo => photo.location);
      setUserPhotos(prevPhotos => [...prevPhotos, ...photosWithLocation]);
      setScannedCount(prevCount => prevCount + photosToAdd.length);
      
      // Convert photos to PhotoData format for the report
      const photoData = photosWithLocation.map(photo => ({
        id: photo.id,
        filename: photo.filename,
        uri: photo.uri,
        creationTime: photo.creationTime.getTime(),
        formattedDate: photo.creationTime.toLocaleDateString(),
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
        selected: false
      }));
      
      setPhotoDataForReport(prevData => [...prevData, ...photoData]);
      
      // Calculate potential value
      let totalValue = 0;
      photosWithLocation.forEach(photo => {
        let value = 5;
        
        const resolution = photo.width * photo.height;
        if (resolution > 12000000) {
          value += 3;
        } else if (resolution > 8000000) {
          value += 2;
        }
        
        const now = new Date();
        const hoursDiff = (now.getTime() - photo.creationTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          value += 2;
        } else if (hoursDiff < 72) {
          value += 1;
        }
        
        totalValue += value;
      });
      
      setPotentialValue(prevValue => prevValue + totalValue);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const renderPhotoItem = ({ item }: { item: PhotoMetadata }) => {
    const isSelected = selectedPhotos.some(p => p.id === item.id);
    
    return (
      <TouchableOpacity
        style={[styles.photoItem, isSelected && styles.selectedPhotoItem]}
        onPress={() => togglePhotoSelection(item)}
      >
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        <View style={styles.checkbox}>
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => togglePhotoSelection(item)}
          />
        </View>
        {item.location && (
          <View style={styles.locationIndicator}>
            <Text style={styles.locationIndicatorText}>📍</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {showReport ? (
        <PhotoValueReport
          photos={photoDataForReport}
          requestLocation="All Locations"
          requestCategory="All Categories"
          onClose={() => setShowReport(false)}
        />
      ) : (
        <LinearGradient
          colors={['#f7d4d4', '#e6b3e6', '#d4d4f7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <ScrollView style={styles.scrollView}>
            {/* Page Title */}
            <View style={styles.pageHeader}>
              <Text variant="headlineMedium" style={styles.pageTitle}>My Profile</Text>
            </View>
            
            {/* Profile Avatar */}
            <View style={styles.avatarContainer}>
              <Image 
                source={require('../../assets/images/avatar.png')} 
                style={styles.avatar} 
              />
              <Text variant="titleLarge" style={styles.userName}>John Doe</Text>
              <Text variant="bodyMedium" style={styles.userStatus}>Photographer</Text>
            </View>

            {/* Stats Panel */}
            <Card style={styles.statsCard} mode="elevated">
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>Your Stats</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={styles.statNumber}>{scannedCount}</Text>
                    <Text variant="bodySmall" style={styles.statLabel}>Scanned Photos</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={styles.statNumber}>${potentialValue}</Text>
                    <Text variant="bodySmall" style={styles.statLabel}>Potential Value Detected</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={styles.statNumber}>${earnedToDate}</Text>
                    <Text variant="bodySmall" style={styles.statLabel}>Savings to Date</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionButtons}>
                <Button 
                  mode="contained" 
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                  icon="image-multiple"
                  buttonColor="#ffffff"
                  textColor="#6b4d8f"
                  loading={isLibraryLoading}
                  onPress={handleManageLibrary}
                >
                  Manage Captura Library
                </Button>
                <Button 
                  mode="contained" 
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                  icon="chart-bar"
                  buttonColor="#ffffff"
                  textColor="#6b4d8f"
                  onPress={() => {
                    setShowReport(true);
                  }}
                >
                  View Scan Results
                </Button>
              </View>
            </View>
          </ScrollView>

          {/* Photo Library Modal */}
          <Portal>
            <Modal
              visible={showLibraryModal}
              onDismiss={() => {
                setShowLibraryModal(false);
                setSelectedPhotos([]);
                setIsAllSelected(false);
              }}
              contentContainerStyle={styles.modal}
              dismissable={true}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text variant="headlineMedium" style={styles.modalTitle}>Manage Captura Library</Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => {
                      setShowLibraryModal(false);
                      setSelectedPhotos([]);
                      setIsAllSelected(false);
                    }}
                  />
                </View>

                <Button
                  mode="contained"
                  onPress={useImagePickerFallback}
                  style={styles.selectPhotosButton}
                  icon="image"
                  contentStyle={styles.selectPhotosButtonContent}
                >
                  Select Photos
                </Button>

                <View style={styles.selectionBar}>
                  <Button
                    mode="text"
                    onPress={toggleSelectAll}
                    style={styles.selectAllButton}
                    disabled={accessiblePhotos.length === 0}
                  >
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Text style={styles.selectionCount}>
                    {selectedPhotos.length} photos selected
                  </Text>
                </View>

                {accessiblePhotos.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <Banner visible={true} icon="information" style={styles.banner}>
                      No photos selected. Tap "Select Photos" to browse your library.
                    </Banner>
                  </View>
                ) : (
                  <FlatList
                    data={accessiblePhotos}
                    renderItem={renderPhotoItem}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    numColumns={Platform.OS === 'web' ? 3 : 2}
                    contentContainerStyle={styles.photoGrid}
                  />
                )}

                <View style={styles.modalFooter}>
                  <Button
                    mode="contained"
                    onPress={handleAddSelectedPhotos}
                    disabled={selectedPhotos.length === 0}
                    style={styles.addButton}
                  >
                    Add Selected Photos
                  </Button>
                </View>
              </View>
            </Modal>
          </Portal>
        </LinearGradient>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  headerSpacing: {
    marginTop: 8,
  },
  title: {
    color: '#ffffff',
    fontWeight: '300',
    letterSpacing: 2,
  },
  statsCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    color: '#6b4d8f',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    minWidth: '28%',
  },
  statNumber: {
    color: '#6b4d8f',
    fontWeight: '600',
  },
  statLabel: {
    color: '#6b4d8f',
    opacity: 0.7,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
    borderRadius: 12,
    elevation: 4,
  },
  buttonContent: {
    height: 48,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
  },
  userName: {
    color: '#ffffff',
    fontWeight: '600',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  userStatus: {
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  profileTitleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileTitle: {
    color: '#ffffff',
    fontWeight: '300',
    letterSpacing: 1,
    fontSize: 36,
  },
  subtitle: {
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },
  pageHeader: {
    alignItems: 'flex-start',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  pageTitle: {
    color: '#ffffff',
    fontWeight: '500',
  },
  modal: {
    backgroundColor: 'white',
    margin: Platform.OS === 'web' ? 20 : 0,
    borderRadius: Platform.OS === 'web' ? 12 : 0,
    padding: 20,
    height: Platform.OS === 'web' ? undefined : '100%',
    maxHeight: Platform.OS === 'web' ? '90%' : '100%',
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    alignSelf: 'center',
    width: Platform.OS === 'web' ? '80%' : '100%',
  },
  modalContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: Platform.OS === 'ios' ? 12 : 0,
  },
  modalTitle: {
    color: '#6b4d8f',
    fontWeight: '500',
  },
  selectPhotosButton: {
    marginBottom: 16,
    backgroundColor: '#6b4d8f',
    borderRadius: 30,
    paddingVertical: 4,
  },
  selectPhotosButtonContent: {
    height: 48,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  banner: {
    marginBottom: 16,
    width: '100%',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  addButton: {
    backgroundColor: '#6b4d8f',
    width: '100%',
    borderRadius: 8,
  },
  photoGrid: {
    paddingBottom: 16,
  },
  photoItem: {
    width: Platform.OS === 'web' ? '32%' : '48%',
    aspectRatio: 1,
    margin: Platform.OS === 'web' ? '0.66%' : '1%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  selectedPhotoItem: {
    borderWidth: 2,
    borderColor: '#6b4d8f',
  },
  checkbox: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
  },
  locationIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 2,
  },
  locationIndicatorText: {
    fontSize: 12,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectAllButton: {
    marginRight: 16,
  },
  selectionCount: {
    color: '#6b4d8f',
    fontWeight: '500',
  },
}); 