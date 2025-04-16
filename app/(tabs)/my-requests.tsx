import { StyleSheet, View, ScrollView, FlatList, Platform } from 'react-native';
import { Text, Card, Button, Chip, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { PhotoRequest, getMyRequests, subscribeToRequests } from '../utils/requestStore';

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailValue: {
    fontWeight: '500',
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
});

export default function MyRequestsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [requests, setRequests] = useState<PhotoRequest[]>(getMyRequests());

  useEffect(() => {
    const unsubscribe = subscribeToRequests(() => {
      setRequests(getMyRequests());
    });

    return () => unsubscribe();
  }, []);

  const filteredRequests = selectedCategory === 'All' 
    ? requests 
    : requests.filter(request => request.status === selectedCategory.toLowerCase());

  const renderRequest = ({ item }: { item: PhotoRequest }) => (
    <Card style={styles.requestCard} mode="elevated">
      <Card.Content>
        <Text variant="titleMedium" style={styles.requestTitle}>{item.title}</Text>
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
          <View style={styles.detailItem}>
            <Text variant="labelSmall">Budget</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>{item.budget}</Text>
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
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
} 