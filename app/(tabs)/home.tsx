import { StyleSheet, View, ScrollView, FlatList, Platform, useWindowDimensions, Image, ImageSourcePropType } from 'react-native';
import { Text, Card, Button, Chip, useTheme, Surface, Searchbar, Banner } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useLocalSearchParams } from 'expo-router';
import { getPhotoRequests, subscribeToRequests } from '../utils/requestStore';

// Define the PhotoRequest type
export interface PhotoRequest {
  id: string;
  title: string;
  location: string;
  category: string;
  rewards: string;
  deadline: string;
  description: string;
  requirements: string[];
  preferredTimes: string[];
  additionalNotes: string;
  matchedPhotos: number;
  requesterType?: 'individual' | 'brand';
  humanPresence?: 'required' | 'not_allowed' | 'optional';
  user?: {
    name: string;
    avatar: ImageSourcePropType;
  };
}

// Update categories to include requester type filters
const categories = ['All', 'Urban', 'Sports', 'Clothing', 'Food', 'Individual', 'Brand'];

// Update the mock data with the specific examples
const mockRequests: Record<string, PhotoRequest> = {
  '1': {
    id: '1',
    title: 'Harvard Square Photos',
    location: 'Harvard Square',
    category: 'Urban',
    rewards: '$20 Coupon',
    deadline: '3 days',
    description: 'Looking for recent photos of Harvard Square area, especially around the main intersection and Harvard Yard.',
    requirements: ['High resolution', 'Good lighting', 'Architectural focus'],
    preferredTimes: ['Morning', 'Afternoon'],
    additionalNotes: 'Preference for photos that capture the historic architecture.',
    matchedPhotos: 0,
    requesterType: 'brand',
    humanPresence: 'optional',
    user: {
      name: 'Harvard University',
      avatar: require('../../assets/images/harvard-logo.png')
    }
  },
  '2': {
    id: '2',
    title: 'TD Garden Celtics Game',
    location: 'TD Garden, Boston',
    category: 'Sports',
    rewards: '$30 Coupon',
    deadline: '1 week',
    description: 'Need photos from the upcoming Celtics game at TD Garden. Looking for crowd shots, arena atmosphere, and game action.',
    requirements: ['Action shots', 'Crowd atmosphere', 'Arena views'],
    preferredTimes: ['Evening'],
    additionalNotes: 'Focus on capturing the energy of the game.',
    matchedPhotos: 0,
    requesterType: 'individual',
    humanPresence: 'required',
    user: {
      name: 'Michael Johnson',
      avatar: require('../../assets/images/avatar.png')
    }
  },
  '3': {
    id: '3',
    title: 'Allbirds at MIT',
    location: 'MIT, Boston',
    category: 'Clothing',
    rewards: '$25 Coupon',
    deadline: '5 days',
    description: 'Looking for photos of students wearing Allbirds in front of MIT Dome. Interested in showing students with Allbirds shoes around campus.',
    requirements: ['Day photography', 'Student lifestyle', 'Product focus'],
    preferredTimes: ['Morning', 'Afternoon'],
    additionalNotes: 'Capture the vibrant atmosphere of MIT with Allbirds branding.',
    matchedPhotos: 0,
    requesterType: 'brand',
    humanPresence: 'required',
    user: {
      name: 'Allbirds',
      avatar: require('../../assets/images/allbirds-logo.png')
    }
  },
  '4': {
    id: '4',
    title: 'Ripple Cafe Ambience',
    location: 'Boylston Street, Boston',
    category: 'Food',
    rewards: '$15 Coupon',
    deadline: '4 days',
    description: 'Looking for quality photos capturing the ambience of Ripple Cafe, including customers enjoying coffee, baristas at work, and our signature latte art.',
    requirements: ['Interior shots', 'Food photography', 'People enjoying coffee'],
    preferredTimes: ['Morning rush', 'Afternoon'],
    additionalNotes: 'Focus on the warm and inviting atmosphere of our cafe. Looking for authentic moments.',
    matchedPhotos: 0,
    requesterType: 'brand',
    humanPresence: 'required',
    user: {
      name: 'Ripple Cafe',
      avatar: require('../../assets/images/ripple-logo.png')
    }
  }
};

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { submitted } = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [requests, setRequests] = useState<PhotoRequest[]>(getPhotoRequests());
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for submission success banner
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(submitted === 'true');

  useEffect(() => {
    // Subscribe to request changes
    const unsubscribe = subscribeToRequests(() => {
      setRequests(getPhotoRequests());
    });

    return () => unsubscribe();
  }, []);

  // Show success banner when navigated with submitted=true parameter
  useEffect(() => {
    if (submitted === 'true') {
      setShowSubmissionSuccess(true);
      
      // Auto-hide the banner after 5 seconds
      const timer = setTimeout(() => {
        setShowSubmissionSuccess(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  // Calculate number of columns based on screen width
  const numColumns = Platform.OS === 'web' && width > 768 ? 2 : 1;

  // Filter requests based on both category and search query
  const filteredRequests = useMemo(() => {
    // First filter by category
    const categoryFiltered = selectedCategory === 'All' 
      ? requests 
      : selectedCategory === 'Individual'
      ? requests.filter(request => request.requesterType === 'individual')
      : selectedCategory === 'Brand'
      ? requests.filter(request => request.requesterType === 'brand')
      : requests.filter(request => request.category === selectedCategory);
    
    // Then filter by search query
    if (!searchQuery.trim()) {
      return categoryFiltered;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return categoryFiltered.filter(request => 
      request.title.toLowerCase().includes(query) ||
      request.description.toLowerCase().includes(query) ||
      request.location.toLowerCase().includes(query) ||
      request.category.toLowerCase().includes(query)
    );
  }, [requests, selectedCategory, searchQuery]);

  const renderRequest = ({ item }: { item: PhotoRequest }) => {
    const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
    
    return (
      <View style={numColumns > 1 ? styles.gridItem : styles.listItem}>
        <Card 
          style={[
            styles.requestCard,
            isMobile && styles.mobileRequestCard
          ]} 
          mode="elevated"
        >
          <Card.Content style={[
            styles.cardContent,
            isMobile && styles.mobileCardContent
          ]}>
            <View style={styles.userAvatarContainer}>
              <Image 
                source={item.user?.avatar}
                style={styles.userAvatar}
              />
            </View>
            <Text variant="titleMedium" style={styles.requestTitle}>{item.title}</Text>
            <View style={styles.requestMeta}>
              <Chip icon="map-marker" style={styles.chip}>{item.location}</Chip>
              <Chip icon="tag" style={styles.chip}>{item.category}</Chip>
            </View>
            <Text 
              variant="bodyMedium" 
              style={[styles.description, isMobile && styles.mobileDescription]}
              numberOfLines={isMobile ? 1 : 2}
            >
              {item.description}
            </Text>
            <View style={styles.requestDetails}>
              <View style={styles.detailItem}>
                <Text variant="labelSmall">Rewards</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{item.rewards}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text variant="labelSmall">Deadline</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{item.deadline}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text variant="labelSmall">AI Matches</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{item.matchedPhotos} photos</Text>
              </View>
            </View>
          </Card.Content>
          <Card.Actions style={isMobile && styles.mobileCardActions}>
            <Button 
              mode="contained" 
              onPress={() => router.push({
                pathname: "/screens/request-details" as const,
                params: { id: item.id }
              })}
              style={isMobile && styles.mobileButton}
              labelStyle={isMobile && styles.mobileButtonLabel}
            >
              View Details
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => router.push({
                pathname: "/screens/submit-photo" as const,
                params: { id: item.id }
              })}
              style={isMobile && styles.mobileButton}
              labelStyle={isMobile && styles.mobileButtonLabel}
            >
              Submit Photo
            </Button>
          </Card.Actions>
        </Card>
      </View>
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
            <Text variant="headlineMedium" style={styles.title}>Marketplace</Text>
            <Button 
              mode="contained" 
              icon="plus" 
              onPress={() => router.push("/screens/create-request")}
              style={styles.createButton}
            >
              Create Request
            </Button>
          </View>

          {/* Success Banner */}
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

          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search requests"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              iconColor={theme.colors.primary}
              clearButtonMode="while-editing"
            />
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
            {filteredRequests.length > 0 ? (
              <FlatList
                data={filteredRequests}
                renderItem={renderRequest}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.requestsList}
                showsVerticalScrollIndicator={false}
                numColumns={numColumns}
                key={`grid-${numColumns}`}
                columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
              />
            ) : (
              <View style={styles.emptyResultsContainer}>
                <Text style={styles.emptyResultsText}>
                  {searchQuery.trim() 
                    ? `No requests found matching "${searchQuery}"`
                    : "No requests found in this category"
                  }
                </Text>
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  style={styles.resetButton}
                >
                  Reset Filters
                </Button>
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
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 0,
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
    minHeight: 350,
  },
  requestCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    height: '100%',
  },
  mobileRequestCard: {
    height: 'auto',
    marginBottom: 0,
  },
  requestTitle: {
    marginBottom: 8,
    color: '#6b4d8f',
    fontWeight: '600',
    fontSize: 20,
    marginRight: 48,
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
    minHeight: 48,
  },
  mobileDescription: {
    marginBottom: 8,
    minHeight: 0,
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
  cardContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingTop: 8,
    position: 'relative', 
  },
  mobileCardContent: {
    paddingVertical: 8,
    paddingBottom: 4,
    gap: 4,
  },
  userAvatarContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    elevation: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  emptyResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    marginTop: 12,
  },
  mobileCardActions: {
    paddingTop: 0,
    paddingBottom: 8,
  },
  mobileButton: {
    height: 36,
  },
  mobileButtonLabel: {
    fontSize: 12,
  },
  successBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
}); 