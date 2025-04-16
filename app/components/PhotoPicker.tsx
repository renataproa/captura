import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, Portal, Modal, Banner } from 'react-native-paper';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { PhotoMetadata } from '../utils/photoMatching';

interface PhotoPickerProps {
  onPhotosSelected: (photos: PhotoMetadata[]) => void;
  buttonLabel?: string;
}

export default function PhotoPicker({ onPhotosSelected, buttonLabel = "Select Photos" }: PhotoPickerProps) {
  const [permission, setPermission] = useState<MediaLibrary.PermissionResponse | null>(null);
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDevBuildBanner, setShowDevBuildBanner] = useState(Platform.OS === 'android');
  const [selectAll, setSelectAll] = useState(false);

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
        first: 50,
        sortBy: ['creationTime'],
      });

      const photosWithMetadata = await Promise.all(
        assets.map(async (asset) => {
          try {
            const info = await MediaLibrary.getAssetInfoAsync(asset);
            
            const photoData: PhotoMetadata = {
              id: asset.id,
              creationTime: new Date(info.creationTime),
              filename: info.filename,
              location: info.location ? {
                latitude: info.location.latitude,
                longitude: info.location.longitude
              } : undefined,
              width: asset.width,
              height: asset.height,
              uri: Platform.OS === 'ios' ? info.uri : `file://${info.uri}`,
            };

            return photoData;
          } catch (err) {
            console.error('Error loading photo:', err);
            return null;
          }
        })
      );

      const validPhotos = photosWithMetadata.filter((photo): photo is PhotoMetadata => 
        photo !== null
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
    const isSelected = selectedPhotos.some(p => p.id === photo.id);
    if (isSelected) {
      setSelectedPhotos(prev => prev.filter(p => p.id !== photo.id));
    } else {
      setSelectedPhotos(prev => [...prev, photo]);
    }
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setSelectedPhotos(newSelectAll ? photos : []);
  };

  const handlePhotoSelect = () => {
    onPhotosSelected(selectedPhotos);
    setVisible(false);
    setSelectedPhotos([]);
    setSelectAll(false);
  };

  const renderPhoto = ({ item }: { item: PhotoMetadata }) => {
    const isSelected = selectedPhotos.some(p => p.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.photoItem, isSelected && styles.selectedPhoto]}
        onPress={() => togglePhotoSelection(item)}
      >
        <Image 
          source={{ uri: item.uri }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
        {isSelected && (
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
  };

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
        {buttonLabel}
      </Button>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => {
            setVisible(false);
            setSelectedPhotos([]);
            setSelectAll(false);
          }}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalContent}>
            {showDevBuildBanner && (
              <Banner
                visible={true}
                actions={[{
                  label: 'Dismiss',
                  onPress: () => setShowDevBuildBanner(false),
                }]}
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
              <Banner visible={true} icon="alert">
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

            <View style={styles.modalFooter}>
              <Button
                mode="outlined"
                onPress={() => {
                  setVisible(false);
                  setSelectedPhotos([]);
                  setSelectAll(false);
                }}
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
}); 