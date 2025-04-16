import { StyleSheet, View, ScrollView, FlatList, Platform, useWindowDimensions } from 'react-native';
import { Text, Card, Button, Chip, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { getPhotoRequests, subscribeToRequests } from '../utils/requestStore';

// Define the PhotoRequest type
export interface PhotoRequest {
  id: string;
  title: string;
  location: string;
  category: string;
  budget: string;
  deadline: string;
  description: string;
  requirements: string[];
  preferredTimes: string[];
  additionalNotes: string;
  matchedPhotos: number;
}

// Update categories to match available requests
const categories = ['All', 'Urban', 'Architecture'];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [requests, setRequests] = useState<PhotoRequest[]>(getPhotoRequests());

  useEffect(() => {
    // Subscribe to request changes
    const unsubscribe = subscribeToRequests(() => {
      setRequests(getPhotoRequests());
    });

    return () => unsubscribe();
  }, []);

  // Calculate number of columns based on screen width
  const numColumns = Platform.OS === 'web' && width > 768 ? 2 : 1;

  const filteredRequests = selectedCategory === 'All' 
    ? requests 
    : requests.filter(request => request.category === selectedCategory);

  const renderRequest = ({ item }: { item: PhotoRequest }) => (
    <View style={numColumns > 1 ? styles.gridItem : styles.listItem}>
      <Card 
        style={[styles.requestCard]} 
        mode="elevated"
      >
        <Card.Content>
          <Text variant="titleMedium" style={styles.requestTitle}>{item.title}</Text>
          <View style={styles.requestMeta}>
            <Chip icon="map-marker" style={styles.chip}>{item.location}</Chip>
            <Chip icon="tag" style={styles.chip}>{item.category}</Chip>
          </View>
          <Text 
            variant="bodyMedium" 
            style={styles.description}
            numberOfLines={2}
          >
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
              <Text variant="labelSmall">Matches</Text>
              <Text variant="bodyMedium" style={styles.detailValue}>{item.matchedPhotos} photos</Text>
            </View>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="contained" 
            onPress={() => router.push({
              pathname: "/screens/request-details" as const,
              params: { id: item.id }
            })}
          >
            View Details
          </Button>
        </Card.Actions>
      </Card>
    </View>
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
            <Text variant="headlineMedium" style={styles.title}>Photo Requests</Text>
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
              contentContainerStyle={[
                styles.requestsList,
                numColumns > 1 && { alignItems: 'center' }
              ]}
              showsVerticalScrollIndicator={false}
              numColumns={numColumns}
              key={numColumns}
              columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
            />
          </View>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7d4d4', // Match the gradient start color
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
  listContainer: {
    flex: 1,
    marginBottom: Platform.OS === 'ios' ? 84 : 64,
  },
  requestsList: {
    padding: 16,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  listItem: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 16,
    alignSelf: 'center',
  },
  gridItem: {
    width: '48.5%',
    marginBottom: 16,
  },
  requestCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    height: Platform.OS === 'web' ? '100%' : 'auto',
  },
  requestTitle: {
    marginBottom: 8,
    color: '#6b4d8f',
    fontWeight: '600',
    fontSize: 20,
  },
  requestMeta: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
    height: 28,
  },
  description: {
    marginBottom: 16,
    color: '#666',
    flex: Platform.OS === 'web' ? 1 : 0,
    minHeight: Platform.OS === 'web' ? 60 : 'auto',
    maxHeight: Platform.OS === 'web' ? undefined : 48,
    lineHeight: 20,
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(107, 77, 143, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginTop: 'auto',
    marginBottom: 8,
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
}); 