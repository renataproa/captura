import { View, ScrollView, StyleSheet, Pressable, Platform, Image, FlatList, useWindowDimensions, Alert } from 'react-native';
import { Text, useTheme, Button, Surface, Divider, Portal, Modal, IconButton, Banner, Card, Chip, TextInput } from 'react-native-paper';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { findMatchingPhotos, getMatchingSummary, PhotoMetadata, PhotoMatch } from '../utils/photoMatching';
import { format } from 'date-fns';
import * as MediaLibrary from 'expo-media-library';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { 
  getRequestById, 
  getSubmissionsForRequest, 
  PhotoSubmission, 
  deletePhotoSubmission,
  subscribeToRequests
} from '../utils/requestStore';

export interface PhotoRequest {
  id: string;
  title: string;
  location: string;
  category: string;
  rewards: number | string;
  deadline: string;
  description: string;
  requirements: string[];
  preferredTimes?: string[];
  additionalNotes?: string;
  matchedPhotos: number;
  requesterType: string;
  humanPresence: string;
}

interface MatchingSummary {
  exactMatches: number;
  nearbyPhotos: number;
  recentPhotos: number;
}

interface MatchedPhotoDisplay extends PhotoMatch {
  displayDistance?: string;
  displayDate?: string;
  formattedTimestamp?: string;
  selected?: boolean;
}

const mockRequests: Record<string, PhotoRequest> = {
  '1': {
    id: '1',
    title: 'Harvard Square Photos',
    location: 'Harvard Square',
    category: 'Urban',
    rewards: '$200-300',
    deadline: '3 days',
    description: 'Looking for recent photos of Harvard Square area, especially around the main intersection and Harvard Yard.',
    requirements: [
      'High resolution (minimum 12MP)',
      'Taken within the last week',
      'Must include street life and architecture',
      'Good lighting conditions',
      'No heavy editing or filters'
    ],
    preferredTimes: ['Morning', 'Late afternoon'],
    additionalNotes: 'Preference for photos that capture the vibrant atmosphere and historic architecture. Photos with people are acceptable as long as they are not the main focus.',
    matchedPhotos: 0,
    requesterType: 'brand',
    humanPresence: 'optional'
  },
  '2': {
    id: '2',
    title: 'TD Garden Celtics Game',
    location: 'TD Garden, Boston',
    category: 'Sports',
    rewards: '$300-400',
    deadline: '1 week',
    description: 'Need photos from the upcoming Celtics game at TD Garden. Looking for crowd shots, arena atmosphere, and game action.',
    requirements: [
      'Action shots of players',
      'Crowd atmosphere',
      'Arena views',
      'Clear, well-lit shots',
      'Landscape orientation preferred'
    ],
    preferredTimes: ['Evening'],
    additionalNotes: 'Focus on capturing the energy of the game. Looking for photos that show both the action on court and the fan experience.',
    matchedPhotos: 0,
    requesterType: 'individual',
    humanPresence: 'required'
  },
  '3': {
    id: '3',
    title: 'Allbirds at MIT',
    location: 'MIT, Boston',
    category: 'Clothing',
    rewards: '$250-350',
    deadline: '5 days',
    description: 'Looking for photos of students wearing Allbirds in front of MIT Dome. Interested in showing students with Allbirds shoes around campus.',
    requirements: [
      'Day photography',
      'Student lifestyle',
      'Product focus',
      'Must feature Allbirds shoes',
      'Campus setting required'
    ],
    preferredTimes: ['Morning', 'Afternoon'],
    additionalNotes: 'Capture the vibrant atmosphere of MIT with Allbirds branding. Looking for authentic, lifestyle shots of students wearing our shoes in a natural campus setting.',
    matchedPhotos: 0,
    requesterType: 'brand',
    humanPresence: 'required'
  },
  '4': {
    id: '4',
    title: 'Ripple Cafe Ambience',
    location: 'Boylston Street, Boston',
    category: 'Food',
    rewards: '$180-250',
    deadline: '4 days',
    description: 'Looking for quality photos capturing the ambience of Ripple Cafe, including customers enjoying coffee, baristas at work, and our signature latte art.',
    requirements: [
      'Interior photography',
      'Food and beverage shots',
      'Candid customer moments',
      'Barista action shots',
      'Latte art close-ups'
    ],
    preferredTimes: ['Morning rush', 'Afternoon'],
    additionalNotes: 'Focus on the warm and inviting atmosphere of our cafe. Looking for authentic moments that showcase the Ripple Cafe experience.',
    matchedPhotos: 0,
    requesterType: 'brand',
    humanPresence: 'required'
  }
};

const PHOTO_SPACING = 16;

const RequestDetails: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { id, submitted, photoUri } = useLocalSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const requestId = id as string;
  const initialRequest = requestId ? getRequestById(requestId) : null;
  const [request, setRequest] = useState<PhotoRequest | null>(initialRequest || null);
  const [editedRequest, setEditedRequest] = useState<PhotoRequest | null>(initialRequest || null);
  const [isLoading, setIsLoading] = useState(false);
  const [matchedPhotos, setMatchedPhotos] = useState<PhotoMatch[]>([]);
  const [matchingSummary, setMatchingSummary] = useState<MatchingSummary | null>(null);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [submittedPhotos, setSubmittedPhotos] = useState<PhotoSubmission[]>([]);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(submitted === 'true');

  const { width } = useWindowDimensions();
  const PHOTO_WIDTH = width * 0.8;

  useEffect(() => {
    if (requestId) {
      setSubmittedPhotos(getSubmissionsForRequest(requestId));
    }
    
    if (submitted === 'true' && photoUri) {
      setShowSubmissionSuccess(true);
      
      const timer = setTimeout(() => {
        setShowSubmissionSuccess(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [requestId, submitted, photoUri]);

  useEffect(() => {
    const unsubscribe = subscribeToRequests(() => {
      if (requestId) {
        setSubmittedPhotos(getSubmissionsForRequest(requestId));
      }
    });
    
    return () => unsubscribe();
  }, [requestId]);

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

      if (!request) return;
      
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

  const handleDeleteSubmission = (submissionId: string) => {
    Alert.alert(
      "Cancel Submission",
      "Are you sure you want to cancel this submission? This cannot be undone.",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            deletePhotoSubmission(submissionId);
            // The list will update automatically through the subscribeToRequests effect
          }
        }
      ]
    );
  };

  const renderSubmittedPhoto = ({ item }: { item: PhotoSubmission }) => (
    <Card style={styles.submittedPhotoCard} mode="elevated">
      <Card.Content>
        <Image 
          source={{ uri: item.photoUri }} 
          style={styles.submittedPhotoImage}
          resizeMode="cover"
        />
        
        <IconButton
          icon="close"
          size={20}
          style={styles.deletePhotoButton}
          iconColor="#ffffff"
          onPress={() => handleDeleteSubmission(item.id)}
        />
        
        <View style={styles.submissionMeta}>
          <Chip 
            style={[
              styles.statusChip,
              { backgroundColor: getStatusBgColor(item.status) }
            ]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {getStatusLabel(item.status)}
          </Chip>
          
          <Text variant="bodySmall" style={styles.submissionDate}>
            Submitted on {format(new Date(item.timestamp), 'MMM d, yyyy')}
          </Text>
        </View>
        
        {item.metadata && (
          <View style={styles.metadataContainer}>
            <Text variant="bodySmall" style={styles.metadataLabel}>Resolution: </Text>
            <Text variant="bodySmall" style={styles.metadataValue}>
              {item.metadata.width}x{item.metadata.height}
            </Text>
            
            {item.metadata.hasLocation && (
              <>
                <Text variant="bodySmall" style={styles.metadataLabel}>Location Data: </Text>
                <Text variant="bodySmall" style={styles.metadataValue}>Yes</Text>
              </>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
  
  const getStatusColor = (status: PhotoSubmission['status']) => {
    switch (status) {
      case 'pending_ai': return '#f59e0b';
      case 'pending_approval': return '#3b82f6';
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  const getStatusBgColor = (status: PhotoSubmission['status']) => {
    return `${getStatusColor(status)}20`;
  };
  
  const getStatusLabel = (status: PhotoSubmission['status']) => {
    switch (status) {
      case 'pending_ai': return 'Pending AI Check';
      case 'pending_approval': return 'Pending Approval';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

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
                onPress={() => {
                  if (submitted === 'true') {
                    router.push("/");
                  } else {
                    router.back();
                  }
                }}
                style={styles.backButton}
              >
                Back
              </Button>
            </View>

              {showSubmissionSuccess && (
                <Banner
                  visible={true}
                  icon="check-circle"
                  actions={[{ label: 'Dismiss', onPress: () => setShowSubmissionSuccess(false) }]}
                  style={styles.successBanner}
                >
                  Your photo has been submitted successfully! It is now pending approval.
                </Banner>
              )}

            <Card style={styles.mainCard} mode="elevated">
              <Card.Content>
                <View style={styles.metaContainer}>
                  <Chip icon="map-marker" style={styles.chip}>{request.location}</Chip>
                  <Chip icon="tag" style={styles.chip}>{request.category}</Chip>
                    <Chip icon="account" style={styles.chip}>
                      {request.requesterType === 'brand' ? 'Brand' : 'Individual'}
                    </Chip>
                    <Chip 
                      icon={request.humanPresence === 'required' ? 'account-check' : 
                           request.humanPresence === 'not_allowed' ? 'account-off' : 'account-question'} 
                      style={styles.chip}
                    >
                      {request.humanPresence === 'required' ? 'Humans Required' : 
                       request.humanPresence === 'not_allowed' ? 'No Humans' : 'Humans Optional'}
                    </Chip>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text variant="labelSmall">Rewards</Text>
                    <Text variant="titleMedium" style={styles.detailValue}>
                      {request.rewards}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text variant="labelSmall">Deadline</Text>
                    <Text variant="titleMedium" style={styles.detailValue}>
                      {request.deadline}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text variant="labelSmall">AI Matches</Text>
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

              {submittedPhotos.length > 0 && (
                <Card style={styles.submissionsCard} mode="elevated">
                  <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Your Submissions</Text>
                    <Divider style={styles.divider} />
                    <FlatList
                      data={submittedPhotos}
                      renderItem={renderSubmittedPhoto}
                      keyExtractor={item => item.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.submissionsContainer}
                    />
                  </Card.Content>
                </Card>
              )}

            <View style={styles.actionContainer}>
                <Button 
                  mode="contained"
                  onPress={() => router.push({
                    pathname: "/screens/submit-photo",
                    params: { id: request.id }
                  })}
                  style={styles.submitButton}
                  contentStyle={styles.submitButtonContent}
                  icon="camera"
                >
                  Submit New Photo
                </Button>
                
              <Button 
                mode="contained"
                icon="image-search"
                onPress={checkPhotoPermissions}
                style={[styles.viewMatchesButton, { marginTop: 12 }]}
                disabled={isLoading}
                loading={isLoading}
              >
                View Captura AI Matches ({matchingSummary?.exactMatches || 0})
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
                          Found {matchingSummary.exactMatches} Captura AI Matches
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
    marginBottom: 4,
    height: Platform.OS === 'ios' ? 30 : 32,
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
    backgroundColor: '#6b4d8f',
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
  submissionsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  submissionsContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  submittedPhotoCard: {
    width: 240,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  submittedPhotoImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  submissionMeta: {
    marginTop: 12,
    flexDirection: 'column',
    gap: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
    height: 28,
  },
  submissionDate: {
    color: '#666',
    fontSize: 12,
  },
  metadataContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metadataLabel: {
    color: '#6b4d8f',
    fontWeight: '600',
    fontSize: 12,
  },
  metadataValue: {
    color: '#666',
    fontSize: 12,
    marginRight: 12,
  },
  successBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  viewMatchesButton: {
    backgroundColor: '#4A60BB',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
}); 

export default RequestDetails;