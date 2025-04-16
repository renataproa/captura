import { StyleSheet, View, ScrollView, FlatList, Platform } from 'react-native';
import { Text, Card, Button, Chip, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useRouter } from 'expo-router';

// Mock data for photo requests
const mockRequests = [
  {
    id: '1',
    title: 'Boston Common Photos',
    location: 'Boston Common',
    category: 'Landscape',
    budget: '$200-300',
    deadline: '3 days',
    matchedPhotos: 5,
    description: 'Looking for recent photos of Boston Common, especially around the fountain area.'
  },
  {
    id: '2',
    title: 'TD Garden Game Day',
    location: 'TD Garden',
    category: 'Sports',
    budget: '$150-200',
    deadline: '1 week',
    matchedPhotos: 3,
    description: 'Need photos from recent Boston Celtics games, focusing on crowd atmosphere.'
  }
];

const categories = ['All', 'Landscape', 'Sports', 'Events', 'Architecture'];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredRequests = selectedCategory === 'All' 
    ? mockRequests 
    : mockRequests.filter(request => request.category === selectedCategory);

  const renderRequest = ({ item }) => (
    <Card style={styles.requestCard} mode="elevated">
      <Card.Content>
        <Text variant="titleMedium" style={styles.requestTitle}>{item.title}</Text>
        <View style={styles.requestMeta}>
          <Chip icon="map-marker" style={styles.chip}>{item.location}</Chip>
          <Chip icon="tag" style={styles.chip}>{item.category}</Chip>
        </View>
        <Text variant="bodyMedium" style={styles.description}>{item.description}</Text>
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
            pathname: "/(buyer)/request-details",
            params: { requestId: item.id }
          })}
        >
          View Details
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
          <Text variant="headlineMedium" style={styles.title}>Photo Requests</Text>
          <Button 
            mode="contained" 
            icon="plus" 
            onPress={() => router.push("/(buyer)/create-request")}
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

        <FlatList
          data={filteredRequests}
          renderItem={renderRequest}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.requestsList}
          showsVerticalScrollIndicator={false}
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
    paddingBottom: Platform.OS === 'ios' ? 84 : 64, // Add padding for navigation bar
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
  requestsList: {
    padding: 16,
    paddingBottom: 100, // Add padding for navigation bar
  },
  requestCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  requestTitle: {
    marginBottom: 8,
    color: '#6b4d8f',
    fontWeight: '600',
  },
  requestMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
  },
  description: {
    marginBottom: 16,
    color: '#666',
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
}); 