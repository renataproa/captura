import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, Portal, Modal, Banner } from 'react-native-paper';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { matchPhotoToRequest, getMatchingPhotos } from '../utils/photoMatching';
import * as ImagePicker from 'expo-image-picker';

interface PhotoMetadata {
  id: string;
  uri: string;
  creationTime: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  selected: boolean;
  filename?: string;
  width?: number;
  height?: number;
}

interface ProcessedPhoto {
  id: string;
  uri: string;
  metadata: PhotoMetadata;
}

type PhotoLoadResult = PhotoMetadata | null;

interface PhotoPickerProps {
  onPhotosSelected: (photos: any[]) => void;
  requestFilter?: {
    location: {
      id: string;
      name: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    createdAt: string;
    expiration: string;
  };
}

export default function PhotoPicker({ onPhotosSelected, requestFilter }: PhotoPickerProps) {
  const [permission, setPermission] = useState<MediaLibrary.PermissionResponse | null>(null);
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDevBuildBanner, setShowDevBuildBanner] = useState(Platform.OS === 'android');
  const [selectAll, setSelectAll] = useState(false);
  const [unmatchedReasons, setUnmatchedReasons] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      
      setPermission(mediaPermission);
      
      if (!mediaPermission.granted) {
        setError('Photo library access is required to select photos');
      } else if (!locationPermission.granted) {
        setError('Location permission is recommended for better photo metadata');
      }
    } catch (err) {
      setError('Error requesting permissions');
      console.error('Permission error:', err);
    }
  };

  const loadPhotos = async () => {
    if (!permission?.granted) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 20,
        sortBy: ['creationTime'],
      });

      const photosWithMetadata = await Promise.all(
        assets.map(async (asset) => {
          try {
            // Get the asset info first
            const info = await MediaLibrary.getAssetInfoAsync(asset);
            
            // Use the localUri from asset info
            const localUri = info.localUri || asset.uri;

            // Create photo metadata without processing
            const photoData: PhotoMetadata = {
              id: asset.id,
              uri: localUri,
              creationTime: new Date(info.creationTime).toISOString(),
              location: info.location ? {
                latitude: info.location.latitude,
                longitude: info.location.longitude
              } : undefined,
              selected: false,
              filename: info.filename,
              width: asset.width,
              height: asset.height
            };

            return photoData;
          } catch (err) {
            console.error('Error loading photo:', err);
            return null;
          }
        })
      );

      // Filter out any failed loads and ensure type safety
      const validPhotos = photosWithMetadata.filter((photo): photo is PhotoMetadata => 
        photo !== null && 
        typeof photo === 'object' &&
        'id' in photo &&
        'uri' in photo &&
        'selected' in photo
      );
      
      if (validPhotos.length === 0) {
        setError('No photos could be loaded');
      } else {
        setPhotos(validPhotos);
      }
    } catch (err) {
      setError('Error loading photos');
      console.error('Load photos error:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePhotoSelection = (photo: PhotoMetadata) => {
    const updatedPhotos = photos.map((p) => 
      p.id === photo.id ? { ...p, selected: !p.selected } : p
    );
    setPhotos(updatedPhotos);
    setSelectedPhotos(updatedPhotos.filter(p => p.selected));
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const updatedPhotos = photos.map(photo => ({
      ...photo,
      selected: newSelectAll
    }));
    setPhotos(updatedPhotos);
    setSelectedPhotos(newSelectAll ? updatedPhotos : []);
  };

  const handlePhotoSelect = () => {
    // Process selected photos
    const processedPhotos = selectedPhotos.map(photo => ({
      ...photo,
      formattedDate: photo.creationTime 
        ? format(new Date(photo.creationTime), 'MMM dd, yyyy HH:mm')
        : 'Unknown date',
      resolution: photo.width && photo.height 
        ? `${photo.width}x${photo.height}`
        : 'Unknown resolution'
    }));
    
    console.log('Processed photos:', processedPhotos);
    setVisible(false);
  };

  const processPhotos = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const processedPhotos = await Promise.all(
        result.assets.map(async (photo: ImagePicker.ImagePickerAsset) => {
          try {
            // For ImagePicker assets, we need to use the URI to get the asset info
            const assets = await MediaLibrary.getAssetsAsync({
              first: 1,
              sortBy: MediaLibrary.SortBy.creationTime,
              mediaType: MediaLibrary.MediaType.photo,
            });
            
            const matchingAsset = assets.assets.find(asset => asset.uri === photo.uri);
            if (!matchingAsset) {
              console.error('Could not find matching asset for selected photo');
              return null;
            }

            const info = await MediaLibrary.getAssetInfoAsync(matchingAsset.id);
            const metadata: PhotoMetadata = {
              id: info.id,
              uri: info.localUri || info.uri,
              creationTime: new Date(info.creationTime).toISOString(),
              location: info.location ? {
                latitude: info.location.latitude,
                longitude: info.location.longitude
              } : undefined,
              selected: false,
              filename: info.filename,
              width: info.width,
              height: info.height,
            };

            // If there's a request filter, check if the photo matches
            if (requestFilter) {
              const { isMatch, reason } = matchPhotoToRequest(metadata, requestFilter);
              if (!isMatch && reason) {
                setUnmatchedReasons(prev => new Map(prev.set(info.id, reason)));
                return null;
              }
            }

            const processedPhoto: ProcessedPhoto = {
              id: info.id,
              uri: info.localUri || info.uri,
              metadata,
            };

            return processedPhoto;
          } catch (err) {
            console.error('Error processing photo:', err);
            return null;
          }
        })
      );

      const validPhotos = processedPhotos.filter((photo: ProcessedPhoto | null): photo is ProcessedPhoto => photo !== null);
      setSelectedPhotos(validPhotos.map(photo => photo.metadata));
      onPhotosSelected(validPhotos);

    } catch (err) {
      setError('Failed to process photos. Please try again.');
      console.error('Error in processPhotos:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderPhoto = ({ item }: { item: PhotoMetadata }) => (
    <TouchableOpacity
      style={[styles.photoItem, item.selected && styles.selectedPhoto]}
      onPress={() => togglePhotoSelection(item)}
    >
      <Image 
        source={{ uri: item.uri }} 
        style={styles.thumbnail}
        resizeMode="cover"
        onError={(error) => {
          console.error('Image loading error:', error.nativeEvent.error);
          // Update the photo's URI to use the asset URI as fallback
          if (item.uri.startsWith('ph://')) {
            const updatedPhotos = photos.map((p) => 
              p.id === item.id ? { ...p, uri: `asset://${item.uri.slice(5)}` } : p
            );
            setPhotos(updatedPhotos);
          }
        }}
      />
      {item.selected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
      {item.location && (
        <View style={styles.locationIndicator}>
          <Text style={styles.locationIndicatorText}>📍</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <Button
        mode="contained"
        onPress={() => {
          loadPhotos();
          setVisible(true);
        }}
        style={styles.selectButton}
        icon="image-multiple"
        loading={loading}
        buttonColor="#ffffff"
        textColor="#6b4d8f"
      >
        Select Photos
      </Button>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalContent}>
            {showDevBuildBanner && (
              <Banner
                visible={true}
                actions={[
                  {
                    label: 'Dismiss',
                    onPress: () => setShowDevBuildBanner(false),
                  }
                ]}
              >
                For full media library access on Android, please use a development build.
              </Banner>
            )}

            <View style={styles.modalHeader}>
              <Text variant="headlineMedium" style={styles.modalTitle}>Select Photos</Text>
              <Button
                mode="text"
                onPress={toggleSelectAll}
                textColor="#6b4d8f"
              >
                {selectAll ? 'Deselect All' : 'Select All'}
              </Button>
            </View>

            {error ? (
              <Banner
                visible={true}
                icon="alert"
              >
                {error}
              </Banner>
            ) : (
              <FlatList
                data={photos}
                renderItem={renderPhoto}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={styles.photoGrid}
              />
            )}

            {unmatchedReasons.size > 0 && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningTitle}>Some photos didn't match the request criteria:</Text>
                {Array.from(unmatchedReasons.entries()).map(([id, reason]) => (
                  <Text key={id} style={styles.warningText}>• {reason}</Text>
                ))}
              </View>
            )}

            <View style={styles.modalFooter}>
              <Button
                mode="outlined"
                onPress={() => setVisible(false)}
                style={styles.footerButton}
                textColor="#6b4d8f"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handlePhotoSelect}
                style={[styles.footerButton, styles.selectButton]}
                disabled={selectedPhotos.length === 0}
                buttonColor="#6b4d8f"
              >
                Select ({selectedPhotos.length})
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  selectButton: {
    marginBottom: 8,
    borderRadius: 12,
    elevation: 4,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: '80%',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    color: '#6b4d8f',
    fontWeight: '500',
  },
  photoGrid: {
    padding: 4,
  },
  photoItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  selectedPhoto: {
    borderWidth: 2,
    borderColor: '#6b4d8f',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6b4d8f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  locationIndicatorText: {
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerButton: {
    marginLeft: 8,
  },
  warningContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#F57C00',
    marginBottom: 4,
  },
}); 