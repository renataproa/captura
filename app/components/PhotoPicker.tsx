import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, Portal, Modal, Banner } from 'react-native-paper';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { format } from 'date-fns';

interface PhotoMetadata {
  id: string;
  uri: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  creationTime?: number;
  selected?: boolean;
  filename?: string;
  width?: number;
  height?: number;
}

export default function PhotoPicker() {
  const [permission, setPermission] = useState<MediaLibrary.PermissionResponse | null>(null);
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDevBuildBanner, setShowDevBuildBanner] = useState(Platform.OS === 'android');

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

  const extractMetadata = async (asset: MediaLibrary.Asset): Promise<PhotoMetadata> => {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(asset);
      let location = info.location;

      // If no location in metadata, try to get the current location
      if (!location && permission?.granted) {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High
          });
          location = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude
          };
        } catch (err) {
          console.log('Could not get current location:', err);
        }
      }

      return {
        id: asset.id,
        uri: asset.uri,
        location,
        creationTime: info.creationTime,
        selected: false,
        filename: info.filename,
        width: asset.width,
        height: asset.height
      };
    } catch (err) {
      console.error('Error extracting metadata:', err);
      return {
        id: asset.id,
        uri: asset.uri,
        selected: false
      };
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
        assets.map(asset => extractMetadata(asset))
      );

      setPhotos(photosWithMetadata);
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

  const renderPhoto = ({ item }: { item: PhotoMetadata }) => (
    <TouchableOpacity
      style={[styles.photoItem, item.selected && styles.selectedPhoto]}
      onPress={() => togglePhotoSelection(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
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
            
            <Text variant="titleLarge" style={styles.modalTitle}>
              Select Photos
            </Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Button onPress={requestPermissions}>Retry</Button>
              </View>
            ) : permission?.granted ? (
              <>
                <FlatList
                  data={photos}
                  renderItem={renderPhoto}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  style={styles.photoGrid}
                  onEndReachedThreshold={0.5}
                />
                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setVisible(false)}
                    style={styles.actionButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handlePhotoSelect}
                    style={styles.actionButton}
                    disabled={selectedPhotos.length === 0}
                  >
                    Select ({selectedPhotos.length})
                  </Button>
                </View>
              </>
            ) : (
              <View style={styles.permissionContainer}>
                <Text>Please grant photo library access to continue</Text>
                <Button onPress={requestPermissions}>Grant Access</Button>
              </View>
            )}
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
  modalTitle: {
    padding: 16,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  photoGrid: {
    flex: 1,
    padding: 4,
  },
  photoItem: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 4,
  },
  thumbnail: {
    flex: 1,
    borderRadius: 8,
  },
  selectedPhoto: {
    opacity: 0.7,
  },
  checkmark: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#6b4d8f',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 16,
  },
  locationIndicator: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIndicatorText: {
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  actionButton: {
    minWidth: 100,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 12,
  },
}); 