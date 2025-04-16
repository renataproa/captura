import { StyleSheet, View, ScrollView, FlatList, Platform } from 'react-native';
import { Text, Card, Button, Chip, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';

interface PhotoUpload {
  id: string;
  requestTitle: string;
  status: 'pending_ai' | 'pending_approval' | 'accepted' | 'rejected';
  timestamp: Date;
  location: string;
  category: string;
}

// Mock data for uploads
const mockUploads: PhotoUpload[] = [
  {
    id: '1',
    requestTitle: 'Charles River Rowing',
    status: 'pending_approval',
    timestamp: new Date(),
    location: 'Charles River',
    category: 'Sports',
  },
  {
    id: '2',
    requestTitle: 'Beacon Hill Streets',
    status: 'accepted',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    location: 'Beacon Hill',
    category: 'Architecture',
  },
];

const getStatusColor = (status: PhotoUpload['status']) => {
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

const getStatusLabel = (status: PhotoUpload['status']) => {
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
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredUploads = selectedCategory === 'All' 
    ? mockUploads 
    : mockUploads.filter(upload => {
        if (selectedCategory === 'Pending') {
          return upload.status === 'pending_ai' || upload.status === 'pending_approval';
        }
        return upload.status.toLowerCase() === selectedCategory.toLowerCase();
      });

  const renderUpload = ({ item }: { item: PhotoUpload }) => (
    <Card style={styles.requestCard} mode="elevated">
      <Card.Content>
        <Text variant="titleMedium" style={styles.requestTitle}>{item.requestTitle}</Text>
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
        <View style={styles.requestDetails}>
          <View style={styles.detailItem}>
            <Text variant="labelSmall">Submitted</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {new Date(item.timestamp).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text variant="labelSmall">Status</Text>
            <Text 
              variant="bodyMedium" 
              style={[styles.detailValue, { color: getStatusColor(item.status) }]}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </Card.Content>
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
            <Text variant="headlineMedium" style={styles.title}>My Uploads</Text>
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
              data={filteredUploads}
              renderItem={renderUpload}
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
  requestTitle: {
    color: '#6b4d8f',
    fontWeight: '600',
    marginBottom: 8,
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
  },
  detailValue: {
    color: '#6b4d8f',
    fontWeight: '500',
    marginTop: 4,
  },
}); 