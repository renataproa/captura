import { StyleSheet, View, ScrollView, FlatList, Platform, Image, useWindowDimensions } from 'react-native';
import { Text, Card, Button, Chip, useTheme, Surface, Menu, Divider, Portal, Dialog, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { PhotoRequest, getMyRequests, subscribeToRequests, updateRequestStatus, getSubmissionsForRequest } from '../utils/requestStore';

const categories = ['All', 'Active', 'Completed', 'Expired'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return '#4CAF50';
    case 'completed':
      return '#2196F3';
    case 'expired':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 24,
  },
  createButton: {
    borderRadius: 20,
  },
  categoriesContainer: {
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    flex: 1,
  },
  requestsList: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 84 : 64,
  },
  requestCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  requestTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  requestMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    height: 28,
  },
  statusChip: {
    height: 28,
  },
  description: {
    marginBottom: 16,
    color: '#666',
  },
  requestDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailValue: {
    fontWeight: '500',
  },
  rewardsValue: {
    fontWeight: '600',
    color: '#6b4d8f',
  },
  rewardsChip: {
    backgroundColor: 'rgba(107, 77, 143, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    padding: 8,
    borderRadius: 8,
  },
  submissionPreviewContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  previewLabel: {
    color: '#6b4d8f',
    marginBottom: 8,
  },
  previewScroll: {
    paddingBottom: 4,
  },
  previewImageContainer: {
    marginRight: 8,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  submissionStatusDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    bottom: 4,
    right: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  previewPlaceholder: {
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlaceholderText: {
    color: '#6b4d8f',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default function MyRequestsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [requests, setRequests] = useState<PhotoRequest[]>(getMyRequests());
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PhotoRequest | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'completed' | 'expired'>('active');
  const { width } = useWindowDimensions();

  useEffect(() => {
    const unsubscribe = subscribeToRequests(() => {
      setRequests(getMyRequests());
    });

    return () => unsubscribe();
  }, []);

  const handleEditRequest = (request: PhotoRequest) => {
    router.push({
      pathname: "/screens/create-request",
      params: { 
        id: request.id,
        mode: 'edit'
      }
    });
    setMenuVisible(null);
  };

  const openStatusDialog = (request: PhotoRequest) => {
    setSelectedRequest(request);
    setSelectedStatus(request.status);
    setStatusDialogVisible(true);
    setMenuVisible(null);
  };

  const handleStatusChange = () => {
    if (selectedRequest) {
      updateRequestStatus(selectedRequest.id, selectedStatus);
      setStatusDialogVisible(false);
      setSelectedRequest(null);
    }
  };

  const filteredRequests = selectedCategory === 'All' 
    ? requests 
    : requests.filter(request => request.status === selectedCategory.toLowerCase());

  const renderRequest = ({ item }: { item: PhotoRequest }) => {
    const submissions = getSubmissionsForRequest(item.id);
    const previewWidth = width * 0.28;
    
    return (
      <Card style={styles.requestCard} mode="elevated">
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.requestTitle}>{item.title}</Text>
            <IconButton
              icon="dots-vertical"
              size={24}
              onPress={() => setMenuVisible(item.id)}
            />
            <Menu
              visible={menuVisible === item.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={{ x: 10, y: 10 }}
              contentStyle={{ backgroundColor: theme.colors.surface }}
            >
              <Menu.Item 
                leadingIcon="pencil" 
                onPress={() => handleEditRequest(item)} 
                title="Edit Request" 
              />
              <Menu.Item 
                leadingIcon="refresh" 
                onPress={() => openStatusDialog(item)} 
                title="Change Status" 
              />
              <Divider />
              <Menu.Item 
                leadingIcon="delete-outline" 
                onPress={() => {/* Handle delete later */}} 
                title="Delete" 
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>
          <View style={styles.requestMeta}>
            <Chip icon="map-marker" style={styles.chip}>{item.location}</Chip>
            <Chip icon="tag" style={styles.chip}>{item.category}</Chip>
            <Chip 
              style={[
                styles.statusChip,
                { backgroundColor: `${getStatusColor(item.status)}20` }
              ]}
              textStyle={{ color: getStatusColor(item.status) }}
            >
              {getStatusLabel(item.status)}
            </Chip>
          </View>
          <Text variant="bodyMedium" style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
          <View style={styles.requestDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text variant="labelSmall">Rewards</Text>
                <View style={styles.rewardsChip}>
                  <Text variant="bodyMedium" style={[styles.detailValue, styles.rewardsValue]}>
                    {item.rewards}
                  </Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text variant="labelSmall">Deadline</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{item.deadline}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text variant="labelSmall">Submissions</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{item.submissionCount}</Text>
              </View>
            </View>
          </View>
          
          {submissions.length > 0 && (
            <View style={styles.submissionPreviewContainer}>
              <Text variant="labelSmall" style={styles.previewLabel}>
                Photo Submissions ({submissions.length})
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.previewScroll}
              >
                {submissions.map((submission) => (
                  <View key={submission.id} style={styles.previewImageContainer}>
                    <Image 
                      source={{ uri: submission.photoUri }} 
                      style={[styles.previewImage, { width: previewWidth, height: previewWidth }]} 
                      resizeMode="cover"
                    />
                    <View 
                      style={[
                        styles.submissionStatusDot, 
                        { 
                          backgroundColor: getStatusColor(
                            submission.status === 'pending_approval' ? 'active' : 
                            submission.status === 'accepted' ? 'completed' : 'expired'
                          )
                        }
                      ]}
                    />
                  </View>
                ))}
                {submissions.length < item.submissionCount && (
                  <View style={[styles.previewPlaceholder, { width: previewWidth, height: previewWidth }]}>
                    <Text style={styles.previewPlaceholderText}>
                      +{item.submissionCount - submissions.length} more
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="outlined" 
            onPress={() => router.push({
              pathname: "/screens/request-details",
              params: { id: item.id }
            })}
          >
            View Details
          </Button>
          <Button 
            mode="contained" 
            onPress={() => router.push({
              pathname: "/screens/request-submissions",
              params: { requestId: item.id }
            })}
          >
            View Submissions
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={['#f7d4d4', '#e6b3e6', '#d4d4f7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>My Requests</Text>
            <Button 
              mode="contained" 
              icon="plus" 
              onPress={() => router.push("/screens/create-request")}
              style={styles.createButton}
            >
              Create Request
            </Button>
          </View>

          <Surface style={styles.categoriesContainer} elevation={0}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map(category => (
                <Chip
                  key={category}
                  selected={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                  style={styles.categoryChip}
                  showSelectedOverlay
                >
                  {category}
                </Chip>
              ))}
            </ScrollView>
          </Surface>

          <View style={styles.listContainer}>
            <FlatList
              data={filteredRequests}
              renderItem={renderRequest}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.requestsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
          
          <Portal>
            <Dialog visible={statusDialogVisible} onDismiss={() => setStatusDialogVisible(false)}>
              <Dialog.Title>Change Request Status</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                  Select a new status for this request:
                </Text>
                <View style={styles.statusOptions}>
                  <Chip
                    selected={selectedStatus === 'active'}
                    onPress={() => setSelectedStatus('active')}
                    style={[styles.statusOption, { backgroundColor: selectedStatus === 'active' ? '#4CAF5020' : theme.colors.surfaceVariant }]}
                    textStyle={{ color: '#4CAF50' }}
                  >
                    Active
                  </Chip>
                  <Chip
                    selected={selectedStatus === 'completed'}
                    onPress={() => setSelectedStatus('completed')}
                    style={[styles.statusOption, { backgroundColor: selectedStatus === 'completed' ? '#2196F320' : theme.colors.surfaceVariant }]}
                    textStyle={{ color: '#2196F3' }}
                  >
                    Completed
                  </Chip>
                  <Chip
                    selected={selectedStatus === 'expired'}
                    onPress={() => setSelectedStatus('expired')}
                    style={[styles.statusOption, { backgroundColor: selectedStatus === 'expired' ? '#F4433620' : theme.colors.surfaceVariant }]}
                    textStyle={{ color: '#F44336' }}
                  >
                    Expired
                  </Chip>
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setStatusDialogVisible(false)}>Cancel</Button>
                <Button mode="contained" onPress={handleStatusChange}>Update</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
} 