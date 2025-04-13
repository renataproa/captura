import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, FlatList } from 'react-native';
import { Text, Card, Button, Searchbar, Chip, IconButton, FAB, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import ProfileSwitcher from '../components/ProfileSwitcher';

// Updated categories based on the location context (Boston area)
const MOCK_CATEGORIES = [
  'Urban', 'Architecture', 'Campus', 'Nature', 'Events', 'Street Art'
];

// Mock requests based on the provided photos
const MOCK_REQUESTS = [
  {
    id: '1',
    title: 'Boston Common Evening Shots',
    category: 'Urban',
    location: 'Boston Common, MA',
    coordinates: {
      latitude: 42.3597934869923,
      longitude: -71.1012445285736
    },
    budget: {
      min: 200,
      max: 300
    },
    description: "Looking for evening/sunset photos of Boston Common. Particularly interested in shots that capture the park's atmosphere and urban surroundings.",
    timePreference: 'Evening preferred',
    deadline: '2025-04-20',
    status: 'Open',
    responses: 3,
    imageUrl: 'https://picsum.photos/500/300?random=1'
  },
  {
    id: '2',
    title: 'Faneuil Hall Market Photos',
    category: 'Architecture',
    location: 'Faneuil Hall, Boston',
    coordinates: {
      latitude: 42.366733333333336,
      longitude: -71.06252216666667
    },
    budget: {
      min: 150,
      max: 250
    },
    description: 'Need high-quality photos of Faneuil Hall marketplace. Looking for both interior and exterior shots showing the historic architecture and modern market life.',
    timePreference: 'Daytime',
    deadline: '2025-04-15',
    status: 'Urgent',
    responses: 1,
    imageUrl: 'https://picsum.photos/500/300?random=2'
  },
  {
    id: '3',
    title: 'Harvard Campus Spring Photos',
    category: 'Campus',
    location: 'Harvard University, Cambridge',
    coordinates: {
      latitude: 42.36102,
      longitude: -71.08447216666667
    },
    budget: {
      min: 175,
      max: 275
    },
    description: 'Seeking spring photos of Harvard campus. Interested in architectural details, student life, and blooming trees around the campus.',
    timePreference: 'Morning or late afternoon',
    deadline: '2025-04-10',
    status: 'Open',
    responses: 2,
    imageUrl: 'https://picsum.photos/500/300?random=3'
  }
];

export default function BuyerHomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const router = useRouter();

  const renderPhotoRequest = ({ item }: { item: typeof MOCK_REQUESTS[0] }) => (
    <Card style={[styles.photoCard, viewMode === 'list' && styles.photoCardList]}>
      <Card.Cover source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <Badge
        visible={item.status === 'Urgent'}
        style={styles.urgentBadge}
      >
        URGENT
      </Badge>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.photoDetails}>
          <View style={styles.locationContainer}>
            <Text variant="bodySmall" style={styles.location}>📍 {item.location}</Text>
            <View style={styles.chipContainer}>
              <Chip compact style={styles.categoryChip}>{item.category}</Chip>
              <Chip compact style={styles.responseChip}>{item.responses} responses</Chip>
            </View>
          </View>
          <Text variant="titleMedium" style={styles.price}>
            ${item.budget.min}-${item.budget.max}
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.deadline}>
          Deadline: {item.deadline}
        </Text>
      </Card.Content>
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
        <ProfileSwitcher currentMode="buyer" />
        
        <View style={[styles.header, styles.headerSpacing]}>
          <Text variant="displaySmall" style={styles.title}>Discover</Text>
          <IconButton
            icon={viewMode === 'grid' ? 'view-list' : 'view-grid'}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={styles.viewModeButton}
            iconColor="#ffffff"
          />
        </View>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search photo requests by location or category"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#6b4d8f"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {MOCK_CATEGORIES.map((category) => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(
                selectedCategory === category ? null : category
              )}
              style={styles.categoryChip}
              selectedColor="#6b4d8f"
            >
              {category}
            </Chip>
          ))}
        </ScrollView>

        <FlatList
          data={MOCK_REQUESTS}
          renderItem={renderPhotoRequest}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={styles.photoGrid}
        />

        <FAB
          icon="plus"
          label="New Request"
          style={styles.fab}
          onPress={() => {
            router.push('./create-request');
          }}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    color: '#ffffff',
    fontWeight: '300',
    letterSpacing: 2,
  },
  viewModeButton: {
    margin: 0,
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  categoriesContainer: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  categoryChip: {
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  responseChip: {
    marginLeft: 4,
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
  },
  photoGrid: {
    padding: 8,
    paddingBottom: 80,
  },
  photoCard: {
    flex: 1,
    margin: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
  },
  photoCardList: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  cardImage: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: 150,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    color: '#6b4d8f',
    fontWeight: '500',
  },
  photoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  locationContainer: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  location: {
    color: '#666',
    marginBottom: 4,
  },
  price: {
    color: '#6b4d8f',
    fontWeight: '600',
  },
  deadline: {
    color: '#666',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6b4d8f',
  },
  headerSpacing: {
    marginTop: 48,
  },
  urgentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ff4d4d',
  },
}); 