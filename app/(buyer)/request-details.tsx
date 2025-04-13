import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text, Button, Chip, Badge, useTheme, Portal, Modal } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { mockRequests, PhotoRequest } from './index';
import * as MediaLibrary from 'expo-media-library';
import { PhotoMetadata } from '../utils/photoMatching';

interface MatchedPhoto {
  id: string;
  uri: string;
  creationTime: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  matchScore: number;
  distance: number;
  selected: boolean;
}

export default function RequestDetails() {
  const router = useRouter();
  const theme = useTheme();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [request] = useState(() => mockRequests.find((r: PhotoRequest) => r.id === requestId));
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<MatchedPhoto | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatchedPhotos();
  }, []);

  const loadMatchedPhotos = async () => {
    try {
      setLoading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted' || !request) {
        setLoading(false);
        return;
      }

      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 50,
      });

      console.log('Found assets:', assets.length);

      const processedPhotos = await Promise.all(
        assets.map(async (asset) => {
          try {
            const info = await MediaLibrary.getAssetInfoAsync(asset);
            console.log('Asset info:', {
              id: asset.id,
              uri: info.localUri || asset.uri,
              location: info.location,
              creationTime: asset.creationTime
            });

            if (!info.location) {
              console.log('No location for photo:', asset.id);
              return null;
            }

            const distance = calculateDistance(
              info.location.latitude,
              info.location.longitude,
              request.coordinates.latitude,
              request.coordinates.longitude
            );

            console.log('Distance for photo:', asset.id, distance);

            // Increase distance threshold to 1km for testing
            if (distance > 1.0) {
              console.log('Photo too far:', asset.id, distance);
              return null;
            }

            const matchScore = calculateMatchScore(distance, new Date(asset.creationTime));

            return {
              id: asset.id,
              uri: info.localUri || asset.uri,
              creationTime: new Date(asset.creationTime),
              location: {
                latitude: info.location.latitude,
                longitude: info.location.longitude,
              },
              matchScore,
              distance,
              selected: false
            } as MatchedPhoto;
          } catch (error) {
            console.error(`Error processing photo ${asset.id}:`, error);
            return null;
          }
        })
      );

      const validPhotos = processedPhotos
        .filter((photo): photo is MatchedPhoto => photo !== null)
        .sort((a, b) => b.matchScore - a.matchScore);

      console.log('Valid matched photos:', validPhotos.length);
      setMatchedPhotos(validPhotos);
    } catch (error) {
      console.error('Error loading matched photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setMatchedPhotos(prev => prev.map(photo => 
      photo.id === photoId ? { ...photo, selected: !photo.selected } : photo
    ));
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const calculateMatchScore = (distance: number, photoDate: Date): number => {
    const maxDistance = 0.2; // 200m
    const distanceScore = 1 - (distance / maxDistance);
    
    const now = new Date();
    const daysDiff = (now.getTime() - photoDate.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysDiff / 365)); // Higher score for more recent photos

    return (distanceScore * 0.7) + (recencyScore * 0.3); // 70% distance, 30% recency
  };

  if (!request) {
    return (
      <View style={styles.container}>
        <Text>Request not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.title}>{request.title}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.row}>
            <Chip icon="map-marker">{request.location}</Chip>
            <Chip icon="currency-usd">${request.budget}</Chip>
            {request.urgency === 'urgent' && (
              <Badge style={styles.urgentBadge}>URGENT</Badge>
            )}
          </View>

          <Text style={styles.description}>{request.description}</Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <Text>Due: {request.deadline}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="images" size={20} color={theme.colors.primary} />
              <Text>{matchedPhotos.length} matched photos</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
              <Text>{request.responseCount} responses</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="pricetag" size={20} color={theme.colors.primary} />
              <Text>{request.category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Matched Photos</Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            {loading ? "Loading photos..." : 
             matchedPhotos.length > 0 ? 
             "These photos from your library match the request's location and criteria" :
             "No matching photos found in your library"}
          </Text>

          {matchedPhotos.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.photoGrid}
            >
              {matchedPhotos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={[
                    styles.photoCard,
                    photo.selected && styles.photoCardSelected
                  ]}
                  onPress={() => togglePhotoSelection(photo.id)}
                  onLongPress={() => {
                    setSelectedPhoto(photo);
                    setShowPhotoModal(true);
                  }}
                >
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.photo}
                  />
                  {photo.selected && (
                    <View style={styles.selectedOverlay}>
                      <Ionicons name="checkmark-circle" size={24} color="white" />
                    </View>
                  )}
                  <View style={styles.photoInfo}>
                    <Text variant="bodySmall" style={styles.photoDate}>
                      {photo.creationTime.toLocaleDateString()}
                    </Text>
                    <Text variant="bodySmall" style={[styles.photoDistance, { color: theme.colors.primary }]}>
                      {(photo.distance * 1000).toFixed(0)}m away
                    </Text>
                    <Text variant="bodySmall" style={styles.photoScore}>
                      Match: {(photo.matchScore * 100).toFixed(0)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {matchedPhotos.length > 0 && (
          <Button
            mode="contained"
            style={styles.submitButton}
            onPress={() => {
              const selectedPhotos = matchedPhotos.filter(p => p.selected);
              console.log('Selected photos:', selectedPhotos);
              // Handle photo submission
            }}
          >
            Submit Selected Photos ({matchedPhotos.filter(p => p.selected).length})
          </Button>
        )}
      </View>

      <Portal>
        <Modal
          visible={showPhotoModal}
          onDismiss={() => setShowPhotoModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          {selectedPhoto && (
            <View>
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={styles.modalPhoto}
              />
              <View style={styles.modalInfo}>
                <Text variant="titleMedium">Photo Details</Text>
                <Text>Date: {selectedPhoto.creationTime.toLocaleDateString()}</Text>
                <Text>Distance: {(selectedPhoto.distance * 1000).toFixed(0)}m from request location</Text>
                <Text>Match Score: {(selectedPhoto.matchScore * 100).toFixed(0)}%</Text>
                <Text>Location: {selectedPhoto.location.latitude.toFixed(6)}, {selectedPhoto.location.longitude.toFixed(6)}</Text>
              </View>
              <Button
                mode="contained"
                onPress={() => setShowPhotoModal(false)}
              >
                Close
              </Button>
            </View>
          )}
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: '45%',
  },
  sectionTitle: {
    marginBottom: 4,
    fontWeight: '600',
  },
  subtitle: {
    color: '#666',
    marginBottom: 12,
  },
  photoGrid: {
    marginHorizontal: -16,
  },
  photoCard: {
    width: 200,
    marginHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photo: {
    width: '100%',
    height: 150,
  },
  photoInfo: {
    padding: 8,
  },
  photoDate: {
    color: '#666',
  },
  photoDistance: {
    // Style will be applied inline with theme color
  },
  urgentBadge: {
    backgroundColor: '#ff4444',
    color: 'white',
  },
  submitButton: {
    marginTop: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalPhoto: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalInfo: {
    gap: 8,
    marginBottom: 16,
  },
  photoCardSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  photoScore: {
    color: '#666',
    marginTop: 4,
  },
}); 