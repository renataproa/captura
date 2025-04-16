import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import { Text, Card, Button, Chip, useTheme, Surface, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

interface PhotoRequest {
  id: string;
  title: string;
  location: string;
  category: string;
  budget: string;
  deadline: string;
  matchedPhotos: number;
  description: string;
  requirements: string[];
  preferredTimes: string[];
  additionalNotes: string;
}

// Mock data - in a real app, this would come from an API
const mockRequests: Record<string, PhotoRequest> = {
  '1': {
    id: '1',
    title: 'Boston Common Photos',
    location: 'Boston Common',
    category: 'Landscape',
    budget: '$200-300',
    deadline: '3 days',
    matchedPhotos: 5,
    description: 'Looking for recent photos of Boston Common, especially around the fountain area.',
    requirements: [
      'High resolution (minimum 12MP)',
      'Taken within the last 24 hours',
      'Must include the fountain area',
      'Good lighting conditions',
      'No heavy editing or filters'
    ],
    preferredTimes: ['Morning', 'Late afternoon'],
    additionalNotes: 'Preference for photos that capture the natural beauty and activity in the park. Photos with people are acceptable as long as they are not the main focus.'
  },
  '2': {
    id: '2',
    title: 'TD Garden Game Day',
    location: 'TD Garden',
    category: 'Sports',
    budget: '$150-200',
    deadline: '1 week',
    matchedPhotos: 3,
    description: 'Need photos from recent Boston Celtics games, focusing on crowd atmosphere.',
    requirements: [
      'Minimum 8MP resolution',
      'Taken during a game in the last week',
      'Must show crowd engagement',
      'Clear, well-lit shots',
      'Action shots preferred'
    ],
    preferredTimes: ['During games', 'Pre-game atmosphere'],
    additionalNotes: 'Looking for photos that capture the energy and excitement of game day. Both interior and exterior shots of the stadium are welcome.'
  }
};

export default function RequestDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { requestId } = useLocalSearchParams();
  const request = mockRequests[requestId as string];
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text variant="headlineMedium">Request not found</Text>
          <Button mode="contained" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmitPhotos = async () => {
    setIsSubmitting(true);
    // Here you would implement the photo submission logic
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    setIsSubmitting(false);
    router.push({
      pathname: "/(tabs)/my-bids",
      params: { submitted: "true" }
    } as const);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#f7d4d4', '#e6b3e6', '#d4d4f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Button 
              mode="contained" 
              icon="arrow-left"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              Back
            </Button>
            <Text variant="headlineMedium" style={styles.title}>{request.title}</Text>
          </View>

          <Card style={styles.mainCard} mode="elevated">
            <Card.Content>
              <View style={styles.metaContainer}>
                <Chip icon="map-marker" style={styles.chip}>{request.location}</Chip>
                <Chip icon="tag" style={styles.chip}>{request.category}</Chip>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text variant="labelSmall">Budget</Text>
                  <Text variant="titleMedium" style={styles.detailValue}>
                    {request.budget}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="labelSmall">Deadline</Text>
                  <Text variant="titleMedium" style={styles.detailValue}>
                    {request.deadline}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="labelSmall">Matches</Text>
                  <Text variant="titleMedium" style={styles.detailValue}>
                    {request.matchedPhotos} photos
                  </Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Description
              </Text>
              <Text variant="bodyLarge" style={styles.description}>
                {request.description}
              </Text>

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Requirements
              </Text>
              {request.requirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Text variant="bodyMedium" style={styles.bulletPoint}>•</Text>
                  <Text variant="bodyMedium" style={styles.requirementText}>{req}</Text>
                </View>
              ))}

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Preferred Times
              </Text>
              <View style={styles.timeChips}>
                {request.preferredTimes.map((time, index) => (
                  <Chip key={index} style={styles.timeChip}>{time}</Chip>
                ))}
              </View>

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Additional Notes
              </Text>
              <Text variant="bodyMedium" style={styles.notes}>
                {request.additionalNotes}
              </Text>
            </Card.Content>
          </Card>

          <View style={styles.actionContainer}>
            <Button 
              mode="contained"
              onPress={handleSubmitPhotos}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              Submit Matching Photos
            </Button>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  header: {
    padding: 16,
    paddingTop: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
  },
  mainCard: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(107, 77, 143, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailValue: {
    color: '#6b4d8f',
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
  },
  sectionTitle: {
    color: '#6b4d8f',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    marginRight: 8,
    color: '#6b4d8f',
  },
  requirementText: {
    flex: 1,
    color: '#666',
  },
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeChip: {
    backgroundColor: 'rgba(107, 77, 143, 0.1)',
  },
  notes: {
    color: '#666',
    marginBottom: 16,
  },
  actionContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  submitButton: {
    borderRadius: 12,
  },
  submitButtonContent: {
    height: 48,
  },
}); 