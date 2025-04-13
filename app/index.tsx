import { StyleSheet, View, ScrollView, ImageBackground } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import PhotoPicker from './components/PhotoPicker';
import ProfileSwitcher from './components/ProfileSwitcher';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#f7d4d4', '#e6b3e6', '#d4d4f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ProfileSwitcher currentMode="seller" />
        
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={[styles.header, styles.headerSpacing]}>
            <Text variant="displaySmall" style={styles.title}>Captura</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>Your Photo Marketplace</Text>
          </View>

          {/* Stats Panel */}
          <Card style={styles.statsCard} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Your Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text variant="headlineSmall" style={styles.statNumber}>0</Text>
                  <Text variant="bodySmall" style={styles.statLabel}>Scanned Photos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineSmall" style={styles.statNumber}>$0</Text>
                  <Text variant="bodySmall" style={styles.statLabel}>Potential Value</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <PhotoPicker />
              <Button 
                mode="contained" 
                style={styles.actionButton}
                contentStyle={styles.buttonContent}
                icon="chart-bar"
                buttonColor="#ffffff"
                textColor="#6b4d8f"
              >
                View Report
              </Button>
              <Button 
                mode="contained" 
                style={styles.actionButton}
                contentStyle={styles.buttonContent}
                icon="upload"
                buttonColor="#ffffff"
                textColor="#6b4d8f"
              >
                Upload Photos
              </Button>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.recentActivity}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Activity</Text>
            <Card style={styles.activityCard} mode="elevated">
              <Card.Content>
                <Text variant="bodyMedium" style={styles.activityText}>No recent activity</Text>
                <Text variant="bodySmall" style={styles.activitySubtext}>
                  Start by scanning your photos to see your activity here
                </Text>
              </Card.Content>
            </Card>
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
    padding: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  headerSpacing: {
    marginTop: 48,
  },
  title: {
    color: '#ffffff',
    fontWeight: '300',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  statsCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    color: '#6b4d8f',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
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
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
    borderRadius: 12,
    elevation: 4,
  },
  buttonContent: {
    height: 48,
  },
  recentActivity: {
    marginBottom: 24,
  },
  activityCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    elevation: 4,
  },
  activityText: {
    color: '#6b4d8f',
  },
  activitySubtext: {
    color: '#6b4d8f',
    opacity: 0.7,
    marginTop: 4,
  },
});