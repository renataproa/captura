import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, Card, Button, Searchbar, Chip, IconButton, FAB, Badge, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import ProfileSwitcher from '../components/ProfileSwitcher';
import { Ionicons } from '@expo/vector-icons';

// Define the PhotoRequest type
export interface PhotoRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  budget: string;
  deadline: string;
  urgency: 'normal' | 'urgent';
  responseCount: number;
  matchedPhotos?: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Mock data for photo requests
export const mockRequests: PhotoRequest[] = [
  {
    id: '1',
    title: "Back Bay Architecture Photos",
    description: "Looking for recent photos of Back Bay area architecture and urban scenes. Particularly interested in shots that capture the neighborhood's character and architectural details.",
    location: "Back Bay, Boston",
    category: "Architecture",
    budget: "200-300",
    deadline: "April 20, 2025",
    urgency: "normal",
    responseCount: 2,
    matchedPhotos: 0,
    coordinates: {
      latitude: 42.361686,
      longitude: -71.090844
    }
  },
  {
    id: '2',
    title: "Faneuil Hall Market Photos",
    description: "Need photos of Faneuil Hall Marketplace during busy hours. Looking for shots that show the vibrant market atmosphere and historic architecture.",
    location: "Faneuil Hall",
    category: "Architecture",
    budget: "150-250",
    deadline: "April 15, 2025",
    urgency: "urgent",
    responseCount: 3,
    matchedPhotos: 2,
    coordinates: {
      latitude: 42.3601,
      longitude: -71.0549
    }
  },
  {
    id: '3',
    title: "Harvard Campus Spring Photos",
    description: "Seeking spring photos of Harvard campus. Interested in shots of blooming trees, historic buildings, and student life.",
    location: "Harvard Campus",
    category: "Campus",
    budget: "175-275",
    deadline: "April 10, 2025",
    urgency: "normal",
    responseCount: 7,
    matchedPhotos: 4,
    coordinates: {
      latitude: 42.3744,
      longitude: -71.1169
    }
  }
];

const categories = ['All', 'Urban', 'Architecture', 'Campus', 'Nature', 'Events', 'Street Art'];

export default function BuyerHome() {
  const router = useRouter();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredRequests = mockRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || request.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRequestPress = (request: PhotoRequest) => {
    router.push({
      pathname: '/(buyer)/request-details',
      params: { requestId: request.id }
    });
  };

  const renderRequestCard = ({ item }: { item: PhotoRequest }) => (
    <TouchableOpacity 
      style={styles.requestCard}
      onPress={() => handleRequestPress(item)}
    >
      <View style={styles.requestHeader}>
        <Text variant="titleMedium" style={styles.requestTitle}>{item.title}</Text>
        {item.urgency === 'urgent' && (
          <Badge style={styles.urgentBadge}>URGENT</Badge>
        )}
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.detailText}>{item.location}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.detailText}>Due: {item.deadline}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.detailText}>${item.budget}</Text>
        </View>
      </View>

      <Text 
        variant="bodyMedium" 
        style={styles.description} 
        numberOfLines={2}
      >
        {item.description}
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Ionicons name="images" size={16} color={theme.colors.primary} />
          <Text variant="bodySmall">{item.matchedPhotos} matched photos</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="people" size={16} color={theme.colors.primary} />
          <Text variant="bodySmall">{item.responseCount} responses</Text>
        </View>
        <Chip 
          compact 
          style={styles.categoryChip}
        >
          {item.category}
        </Chip>
      </View>
    </TouchableOpacity>
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
        <View style={styles.content}>
          <ProfileSwitcher currentMode="buyer" />
          
          <View style={styles.header}>
            <Text variant="displaySmall" style={styles.title}>Discover</Text>
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

          <View style={styles.categoriesContainer}>
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Chip
                  selected={selectedCategory === item}
                  onPress={() => setSelectedCategory(item)}
                  style={styles.categoryChip}
                  showSelectedOverlay
                >
                  {item}
                </Chip>
              )}
              keyExtractor={item => item}
              contentContainerStyle={styles.categoriesList}
            />
          </View>

          <FlatList
            data={filteredRequests}
            renderItem={renderRequestCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.requestsList}
          />

          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/(buyer)/create-request')}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    color: '#ffffff',
    fontWeight: '300',
    letterSpacing: 2,
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
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  urgentBadge: {
    backgroundColor: '#ff4444',
    color: 'white',
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    flex: 1,
    fontWeight: '600',
  },
  requestDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    color: '#666',
  },
  description: {
    color: '#666',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoriesList: {
    padding: 8,
  },
  requestsList: {
    paddingVertical: 8,
  },
}); 