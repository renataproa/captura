import { StyleSheet, View, ScrollView, Image } from 'react-native';
import { Text, Card, Button, Chip, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Stack } from 'expo-router';

interface PhotoSubmission {
  id: string;
  photographerId: string;
  photographerName: string;
  photoUrl: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  price: number;
  metadata: {
    location: string;
    takenAt: Date;
    resolution: string;
  };
}

const mockSubmissions: PhotoSubmission[] = [
  {
    id: '1',
    photographerId: 'photo1',
    photographerName: 'John Smith',
    photoUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae',
    submittedAt: new Date(),
    status: 'pending',
    price: 250,
    metadata: {
      location: 'Boston Public Garden',
      takenAt: new Date(),
      resolution: '4000x3000'
    }
  },
  {
    id: '2',
    photographerId: 'photo2',
    photographerName: 'Emma Davis',
    photoUrl: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8',
    submittedAt: new Date(),
    status: 'approved',
    price: 300,
    metadata: {
      location: 'Boston Public Garden',
      takenAt: new Date(),
      resolution: '3840x2160'
    }
  },
  {
    id: '3',
    photographerId: 'photo3',
    photographerName: 'Michael Chen',
    photoUrl: 'https://images.unsplash.com/photo-1576843776838-032ac46fbb93',
    submittedAt: new Date(),
    status: 'pending',
    price: 275,
    metadata: {
      location: 'Boston Public Garden',
      takenAt: new Date(),
      resolution: '4096x2160'
    }
  }
];

const getStatusColor = (status: PhotoSubmission['status']) => {
  switch (status) {
    case 'pending':
      return '#f59e0b';
    case 'approved':
      return '#10b981';
    case 'rejected':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const getStatusLabel = (status: PhotoSubmission['status']) => {
  switch (status) {
    case 'pending':
      return 'Pending Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
};

export default function RequestSubmissionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { requestId } = useLocalSearchParams();
  const [submissions, setSubmissions] = useState<PhotoSubmission[]>(mockSubmissions);

  const handleApprove = (submissionId: string) => {
    setSubmissions(prev => 
      prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, status: 'approved' } 
          : sub
      )
    );
  };

  const handleReject = (submissionId: string) => {
    setSubmissions(prev => 
      prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, status: 'rejected' } 
          : sub
      )
    );
  };

  const renderSubmission = (submission: PhotoSubmission) => (
    <Card key={submission.id} style={styles.submissionCard} mode="elevated">
      <Card.Content>
        <View style={styles.submissionHeader}>
          <View style={styles.photographerInfo}>
            <Text variant="titleMedium" style={styles.photographerName}>
              {submission.photographerName}
            </Text>
            <Chip 
              style={[
                styles.statusChip,
                { backgroundColor: `${getStatusColor(submission.status)}20` }
              ]}
              textStyle={{ color: getStatusColor(submission.status) }}
            >
              {getStatusLabel(submission.status)}
            </Chip>
          </View>
          <Text variant="titleLarge" style={styles.price}>
            ${submission.price}
          </Text>
        </View>

        <Image
          source={{ uri: submission.photoUrl }}
          style={styles.submissionImage}
          resizeMode="cover"
        />

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Text variant="labelSmall">Location</Text>
            <Text variant="bodyMedium" style={styles.metadataValue}>
              {submission.metadata.location}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text variant="labelSmall">Taken</Text>
            <Text variant="bodyMedium" style={styles.metadataValue}>
              {submission.metadata.takenAt.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text variant="labelSmall">Resolution</Text>
            <Text variant="bodyMedium" style={styles.metadataValue}>
              {submission.metadata.resolution}
            </Text>
          </View>
        </View>

        {submission.status === 'pending' && (
          <View style={styles.actions}>
            <Button 
              mode="outlined" 
              onPress={() => handleReject(submission.id)}
              style={[styles.actionButton, styles.rejectButton]}
              textColor="#ef4444"
            >
              Reject
            </Button>
            <Button 
              mode="contained" 
              onPress={() => handleApprove(submission.id)}
              style={[styles.actionButton, styles.approveButton]}
              buttonColor="#10b981"
            >
              Approve
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ 
        headerShown: false 
      }} />
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={['#f7d4d4', '#e6b3e6', '#d4d4f7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Button 
              mode="contained" 
              icon="arrow-left"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              Back
            </Button>
            <Text variant="headlineSmall" style={styles.title}>Submissions</Text>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.content}>
              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statNumber}>
                    {submissions.length}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Total
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statNumber}>
                    {submissions.filter(s => s.status === 'pending').length}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Pending
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statNumber}>
                    {submissions.filter(s => s.status === 'approved').length}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Approved
                  </Text>
                </View>
              </View>

              {submissions.map(renderSubmission)}
            </View>
          </ScrollView>
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
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  backButton: {
    borderRadius: 12,
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#6b4d8f',
    fontWeight: '600',
  },
  statLabel: {
    color: '#6b4d8f',
    opacity: 0.7,
  },
  submissionCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  photographerInfo: {
    flex: 1,
  },
  photographerName: {
    color: '#6b4d8f',
    fontWeight: '600',
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  price: {
    color: '#10b981',
    fontWeight: '600',
  },
  submissionImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f3f4f6',
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(107, 77, 143, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  metadataItem: {
    alignItems: 'center',
  },
  metadataValue: {
    color: '#6b4d8f',
    fontWeight: '500',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
    minWidth: 100,
  },
  approveButton: {
    borderColor: '#10b981',
  },
  rejectButton: {
    borderColor: '#ef4444',
  },
}); 