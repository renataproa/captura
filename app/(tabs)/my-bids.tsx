import { StyleSheet, View, ScrollView, FlatList } from 'react-native';
import { Text, Card, Button, Chip, useTheme, Surface, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useRouter } from 'expo-router';

interface PhotoRequest {
  id: string;
  title: string;
  location: string;
  category: string;
  budget: string;
  deadline: string;
  matchedPhotos: number;
  description: string;
  status: 'active' | 'expired';
  dueDate: Date;
}

// Mock data for matched requests
const mockMatchedRequests: PhotoRequest[] = [
  {
    id: '1',
    title: 'Boston Common Photos',
    location: 'Boston Common',
    category: 'Landscape',
    budget: '$200-300',
    deadline: '3 days',
    matchedPhotos: 5,
    description: 'Looking for recent photos of Boston Common, especially around the fountain area.',
    status: 'active',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
  },
  {
    id: '2',
    title: 'Fenway Park Game Day',
    location: 'Fenway Park',
    category: 'Sports',
    budget: '$150-200',
    deadline: '1 day',
    matchedPhotos: 3,
    description: 'Need photos from recent Red Sox games, focusing on crowd atmosphere.',
    status: 'expired',
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
];

export default function MyBidsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  const filteredRequests = mockMatchedRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const renderRequest = ({ item }: { item: PhotoRequest }) => (
    <Card style={styles.requestCard} mode="elevated">
      <Card.Content>
        <View style={styles.requestHeader}>
          <Text variant="titleMedium" style={styles.requestTitle}>{item.title}</Text>
          <Chip 
            style={[
              styles.statusChip,
              { backgroundColor: item.status === 'active' ? '#e6ffe6' : '#ffe6e6' }
            ]}
          >
            {item.status === 'active' ? 'Active' : 'Expired'}
          </Chip>
        </View>
        
        <View style={styles.requestMeta}>
          <Chip icon="map-marker" style={styles.chip}>{item.location}</Chip>
          <Chip icon="tag" style={styles.chip}>{item.category}</Chip>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailItem}>
            <Text variant="labelSmall">Budget</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>{item.budget}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text variant="labelSmall">Due Date</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>{item.deadline}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text variant="labelSmall">Your Matches</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>{item.matchedPhotos} photos</Text>
          </View>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="contained" 
          onPress={() => router.push({
            pathname: "/photo-matches",
            params: { requestId: item.id }
          })}
        >
          View Matches
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#f7d4d4', '#e6b3e6', '#d4d4f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>My Bids</Text>
        </View>

        <Surface style={styles.filterContainer} elevation={0}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <Chip
              selected={filter === 'all'}
              onPress={() => setFilter('all')}
              style={styles.filterChip}
              showSelectedOverlay
            >
              All
            </Chip>
            <Chip
              selected={filter === 'active'}
              onPress={() => setFilter('active')}
              style={styles.filterChip}
              showSelectedOverlay
            >
              Active
            </Chip>
            <Chip
              selected={filter === 'expired'}
              onPress={() => setFilter('expired')}
              style={styles.filterChip}
              showSelectedOverlay
            >
              Expired
            </Chip>
          </ScrollView>
        </Surface>

        <FlatList
          data={filteredRequests}
          renderItem={renderRequest}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.requestsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No matched photo requests found
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Browse the marketplace to find photo requests that match your collection
                </Text>
              </Card.Content>
            </Card>
          }
        />
      </LinearGradient>
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
  header: {
    padding: 16,
    paddingTop: 20,
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  requestsList: {
    padding: 16,
    paddingBottom: 100, // Add padding for navigation bar
  },
  requestCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    color: '#6b4d8f',
    fontWeight: '600',
    flex: 1,
  },
  statusChip: {
    marginLeft: 8,
  },
  requestMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
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
  },
  detailValue: {
    color: '#6b4d8f',
    fontWeight: '500',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
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
}); 