import { StyleSheet, View, ScrollView, FlatList, Platform, Image } from 'react-native';
import { Text, Card, Button, Chip, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getMySubmissions, PhotoSubmission, subscribeToRequests } from '../utils/requestStore';

// Define status color and label functions
const getStatusColor = (status: PhotoSubmission['status']) => {
  switch (status) {
    case 'pending_ai':
      return '#f59e0b';
    case 'pending_approval':
      return '#3b82f6';
    case 'accepted':
      return '#10b981';
    case 'rejected':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const getStatusLabel = (status: PhotoSubmission['status']) => {
  switch (status) {
    case 'pending_ai':
      return 'Pending AI Check';
    case 'pending_approval':
      return 'Pending Approval';
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
};

const categories = ['All', 'Pending', 'Accepted', 'Rejected'];

export default function MyUploadsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [submissions, setSubmissions] = useState<PhotoSubmission[]>(getMySubmissions());

  useEffect(() => {
    // Subscribe to updates in the submissions
    const unsubscribe = subscribeToRequests(() => {
      setSubmissions(getMySubmissions());
    });
    
    return () => unsubscribe();
  }, []);

  const filteredSubmissions = selectedCategory === 'All' 
    ? submissions 
    : submissions.filter(submission => {
        if (selectedCategory === 'Pending') {
          return submission.status === 'pending_ai' || submission.status === 'pending_approval';
        }
        return submission.status.toLowerCase() === selectedCategory.toLowerCase();
      });

  const renderSubmission = ({ item }: { item: PhotoSubmission }) => (
    <Card style={styles.requestCard} mode="elevated">
      <Card.Content>
        <View style={styles.submissionHeader}>
          <Text variant="titleMedium" style={styles.requestTitle}>{item.requestTitle}</Text>
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
        
        <View style={styles.photoPreviewContainer}>
          <Image 
            source={{ uri: item.photoUri }} 
            style={styles.photoPreview}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.requestMeta}>
          <Chip icon="map-marker" style={styles.chip}>{item.location}</Chip>
          <Chip icon="tag" style={styles.chip}>{item.category}</Chip>
        </View>
        
        <View style={styles.requestDetails}>
          <View style={styles.detailItem}>
            <Text variant="labelSmall">Submitted</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {new Date(item.timestamp).toLocaleDateString()}
            </Text>
          </View>
          {item.metadata && (
            <View style={styles.detailItem}>
              <Text variant="labelSmall">Resolution</Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {item.metadata.width}x{item.metadata.height}
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="contained" 
          onPress={() => router.push({
            pathname: "/screens/request-details",
            params: { id: item.requestId }
          })}
        >
          View Request
        </Button>
      </Card.Actions>
    </Card>
  );

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
            <Text variant="headlineMedium" style={styles.title}>My Submissions</Text>
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
            {filteredSubmissions.length > 0 ? (
              <FlatList
                data={filteredSubmissions}
                renderItem={renderSubmission}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.requestsList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text variant="titleMedium" style={styles.emptyText}>
                  No submissions found
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  {selectedCategory !== 'All' 
                    ? `No ${selectedCategory.toLowerCase()} submissions`
                    : 'Submit photos for photo requests to see them here'}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}

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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTitle: {
    color: '#6b4d8f',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  photoPreviewContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  requestMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
  },
  statusChip: {
    borderRadius: 16,
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(107, 77, 143, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailValue: {
    color: '#6b4d8f',
    fontWeight: '500',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
  },
}); 