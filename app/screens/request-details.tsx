import { View, ScrollView, StyleSheet, Pressable, Platform, Image, FlatList, useWindowDimensions } from 'react-native';
import { Text, useTheme, Button, Surface, Divider, Portal, Modal, IconButton, Banner, Card, Chip, TextInput } from 'react-native-paper';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { findMatchingPhotos, getMatchingSummary, PhotoMetadata, PhotoMatch } from '../utils/photoMatching';
import { format } from 'date-fns';
import * as MediaLibrary from 'expo-media-library';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export interface PhotoRequest {
  id: string;
  title: string;
  location: string;
  category: string;
  budget: number | string;
  deadline: string;
  description: string;
  requirements: string[];
  preferredTimes?: string[];
  additionalNotes?: string;
  matchedPhotos: number;
}

interface MatchingSummary {
  exactMatches: number;
  nearbyPhotos: number;
  recentPhotos: number;
}

const mockRequests: Record<string, PhotoRequest> = {
  '1': {
    id: '1',
    title: 'Public Garden Spring',
    location: 'Boston Public Garden',
    category: 'Nature',
    budget: '$200-300',
    deadline: '4 days',
    description: 'Seeking photos of the Public Garden during spring bloom. Looking for shots of the tulip gardens and swan boats in operation.',
    requirements: [
      'High resolution (minimum 12MP)',
      'Taken within the last week',
      'Must include street life and architecture',
      'Good lighting conditions',
      'No heavy editing or filters'
    ],
    preferredTimes: ['Morning', 'Late afternoon'],
    additionalNotes: 'Preference for photos that capture the vibrant atmosphere and historic architecture.',
    matchedPhotos: 0
  },
  '2': {
    id: '2',
    title: 'Fenway Concert Night',
    location: 'Fenway Park',
    category: 'Events',
    budget: '$300-400',
    deadline: '1 week',
    description: 'Need photos from recent concert events at Fenway Park, focusing on stage setup and crowd energy.',
    requirements: [
      'High resolution (minimum 8MP)',
      'Must show crowd and stage',
      'Night photography experience required',
      'Include wide shots and close-ups'
    ],
    preferredTimes: ['Evening'],
    additionalNotes: 'Looking for dynamic shots that capture the energy of live performances.',
    matchedPhotos: 0
  }
};

const PHOTO_SPACING = 16;

const RequestDetails: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const initialRequest = id ? mockRequests[id as string] : null;
  const [request, setRequest] = useState<PhotoRequest | null>(initialRequest);
  const [editedRequest, setEditedRequest] = useState<PhotoRequest | null>(initialRequest);
  const [isLoading, setIsLoading] = useState(false);
  const [matchedPhotos, setMatchedPhotos] = useState<PhotoMatch[]>([]);
  const [matchingSummary, setMatchingSummary] = useState<MatchingSummary | null>(null);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  const { width } = useWindowDimensions();
  const PHOTO_WIDTH = width * 0.8;

  const handleMatchingPhotos = async () => {
    setIsLoading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access media library was denied');
        return;
      }

      const photos = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 50,
      });

      const assetInfos = await Promise.all(
        photos.assets.map(asset => MediaLibrary.getAssetInfoAsync(asset))
      );

      const photoMetadata: PhotoMetadata[] = assetInfos.map(asset => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        creationTime: new Date(asset.creationTime * 1000),
        width: asset.width,
        height: asset.height,
        location: asset.location ? {
          latitude: asset.location.latitude,
          longitude: asset.location.longitude
        } : undefined
      }));

      const matches = findMatchingPhotos(photoMetadata, request);
      const summary = getMatchingSummary(matches, request);
      
      setMatchedPhotos(matches);
      setMatchingSummary(summary);
    } catch (error) {
      console.error('Error finding matching photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPhotoPermissions = async () => {
    if (!permissionResponse?.granted) {
      const permission = await requestPermission();
      if (!permission.granted) {
        return;
      }
    }
    findMatchingLocalPhotos();
  };

  const findMatchingLocalPhotos = async () => {
    setIsLoading(true);
    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: 50,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      const assetInfos = await Promise.all(
        assets.map(asset => MediaLibrary.getAssetInfoAsync(asset))
      );

      const photosMetadata: PhotoMetadata[] = assetInfos.map(asset => ({
        id: asset.id,
        creationTime: new Date(asset.creationTime * 1000),
        filename: asset.filename,
        location: asset.location ? {
          latitude: asset.location.latitude,
          longitude: asset.location.longitude
        } : undefined,
        width: asset.width,
        height: asset.height,
        uri: asset.uri,
      }));

      handleMatchingPhotos();
    } catch (error) {
      console.error('Error finding matching photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRequestItem = (req: PhotoRequest) => {
    return (
      <View>
        <Text>{req.title}</Text>
      </View>
    );
  };

  const formatTime = (time: string) => {
    return format(new Date(time), 'MMM d, yyyy');
  };

  const renderPhotoMatch = ({ item: photo }: { item: PhotoMatch }) => (
    <Card style={styles.photoCard} mode="elevated">
      <Card.Content>
        <View style={styles.photoHeader}>
          <Image
            source={{ uri: photo.uri }}
            style={styles.photoThumbnail}
            resizeMode="cover"
          />
          <View style={styles.photoInfo}>
            <View style={styles.photoTitleRow}>
              <Text variant="titleMedium" style={styles.photoTitle}>
                Match Score: {photo.score}%
              </Text>
              {photo.distance && (
                <Chip icon="map-marker" style={styles.distanceChip}>
                  {photo.distance.toFixed(1)} km
                </Chip>
              )}
            </View>
            <View style={styles.matchReasons}>
              {photo.matchReasons.map((reason: string, index: number) => (
                <Chip 
                  key={index} 
                  style={styles.reasonChip}
                  textStyle={styles.reasonText}
                >
                  {reason}
                </Chip>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.photoDetails}>
          <View style={styles.detailItem}>
            <Text variant="labelSmall">Time</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {format(photo.creationTime, 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text variant="labelSmall">Resolution</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {photo.width}x{photo.height}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text variant="labelSmall">Size</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {((photo.width * photo.height) / 1000000).toFixed(1)}MP
            </Text>
          </View>
        </View>

        {photo.location && (
          <View style={styles.locationContainer}>
            <Text variant="labelSmall" style={styles.locationLabel}>Location</Text>
            <Text variant="bodySmall" style={styles.locationText}>
              📍 {photo.location.latitude.toFixed(4)}, {photo.location.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const handleSave = () => {
    if (editedRequest) {
      setRequest(editedRequest);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedRequest(request);
    setIsEditing(false);
  };

  if (!request || !editedRequest) {
    return (
      <View style={styles.container}>
        <Text>Request not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: false 
      }} />
      <View style={styles.container}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea}>
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
                  onPress={() => router.back()}
                  style={styles.backButton}
                >
                  Back
                </Button>
              </View>

              <Card style={styles.mainCard} mode="elevated">
                <Card.Content>
                  <View style={styles.metaContainer}>
                    <Chip icon="map-marker" style={styles.chip}>{request.location}</Chip>
                    <Chip icon="tag" style={styles.chip}>{request.category}</Chip>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text variant="labelSmall">Budget</Text>
                      <Text variant="titleMedium" style={styles.detailValue}>
                        {request.budget}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text variant="labelSmall">Deadline</Text>
                      <Text variant="titleMedium" style={styles.detailValue}>
                        {request.deadline}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text variant="labelSmall">Matches</Text>
                      <Text variant="titleMedium" style={styles.detailValue}>
                        {matchingSummary?.exactMatches || 0} photos
                      </Text>
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Description
                  </Text>
                  <Text variant="bodyLarge" style={styles.description}>
                    {request.description}
                  </Text>

                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Requirements
                  </Text>
                  {request.requirements.map((req, index) => (
                    <View key={index} style={styles.requirementItem}>
                      <Text variant="bodyMedium" style={styles.bulletPoint}>•</Text>
                      <Text variant="bodyMedium" style={styles.requirementText}>{req}</Text>
                    </View>
                  ))}

                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Preferred Times
                  </Text>
                  <View style={styles.timeChips}>
                    {request.preferredTimes?.map((time, index) => (
                      <Chip key={index} style={styles.timeChip}>{time}</Chip>
                    ))}
                  </View>

                  {request.additionalNotes && (
                    <>
                      <Text variant="titleMedium" style={styles.sectionTitle}>
                        Additional Notes
                      </Text>
                      <Text variant="bodyMedium" style={styles.notes}>
                        {request.additionalNotes}
                      </Text>
                    </>
                  )}
                </Card.Content>
              </Card>

              <View style={styles.actionContainer}>
                <Button 
                  mode="contained"
                  onPress={() => setShowPhotosModal(true)}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.submitButton}
                  contentStyle={styles.submitButtonContent}
                >
                  View Matching Photos ({matchingSummary?.exactMatches || 0})
                </Button>
              </View>
            </ScrollView>
            
            <Portal>
              <Modal
                visible={showPhotosModal}
                onDismiss={() => setShowPhotosModal(false)}
                contentContainerStyle={[
                  styles.modalContainer,
                  { backgroundColor: theme.colors.background }
                ]}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text variant="titleLarge">Matching Photos</Text>
                    {matchingSummary && (
                      <View style={styles.matchingSummary}>
                        <Text variant="bodyMedium">
                          Found {matchingSummary.exactMatches} exact matches
                          {matchingSummary.nearbyPhotos > 0 && ` and ${matchingSummary.nearbyPhotos} nearby photos`}
                        </Text>
                        {matchingSummary.recentPhotos > 0 && (
                          <Text variant="bodySmall" style={styles.recentMatches}>
                            Including {matchingSummary.recentPhotos} photos from the last 30 days
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  {matchedPhotos.length > 0 ? (
                    <FlatList
                      data={matchedPhotos}
                      renderItem={renderPhotoMatch}
                      keyExtractor={(item, index) => index.toString()}
                      contentContainerStyle={styles.matchesList}
                    />
                  ) : (
                    <View style={styles.noPhotosContainer}>
                      <Text variant="bodyLarge" style={styles.emptyText}>
                        No matching photos found
                      </Text>
                      <Text variant="bodyMedium" style={styles.emptySubtext}>
                        Take some photos at {request.location} or upload existing ones
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalActions}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowPhotosModal(false)}
                      style={styles.modalButton}
                    >
                      Close
                    </Button>
                  </View>
                </View>
              </Modal>
            </Portal>
          </LinearGradient>
        </SafeAreaView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7d4d4',
  },
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
  },
  mainCard: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(107, 77, 143, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailValue: {
    color: '#6b4d8f',
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
  },
  sectionTitle: {
    color: '#6b4d8f',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    marginRight: 8,
    color: '#6b4d8f',
  },
  requirementText: {
    flex: 1,
    color: '#666',
  },
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeChip: {
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
  },
  notes: {
    color: '#666',
    marginBottom: 16,
  },
  actionContainer: {
    paddingHorizontal: 16,
    width: '100%',
  },
  submitButton: {
    borderRadius: 12,
    marginTop: 16,
    marginBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  modalContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalContent: {
    padding: 16,
    backgroundColor: '#fff',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  matchingSummary: {
    alignItems: 'center',
    marginTop: 8,
  },
  recentMatches: {
    color: '#666',
    marginTop: 4,
  },
  photoCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  photoHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  photoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  photoTitle: {
    color: '#6b4d8f',
    fontWeight: '600',
    marginBottom: 8,
  },
  photoTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distanceChip: {
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
    height: 24,
  },
  matchReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  reasonChip: {
    backgroundColor: 'rgba(107, 77, 143, 0.05)',
    height: 24,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 12,
  },
  photoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(107, 77, 143, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  locationContainer: {
    backgroundColor: 'rgba(107, 77, 143, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  locationLabel: {
    marginBottom: 4,
  },
  locationText: {
    color: '#666',
  },
  matchesList: {
    padding: 16,
  },
  summaryTitle: {
    color: '#6b4d8f',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryText: {
    color: '#666',
  },
  noPhotosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b4d8f',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#666',
    opacity: 0.7,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalButton: {
    minWidth: 120,
  },
});

export default RequestDetails;