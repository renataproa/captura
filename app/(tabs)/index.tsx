import { StyleSheet, View, ScrollView, ImageBackground } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import PhotoPicker from '../components/PhotoPicker';
import ProfileSwitcher from '../components/ProfileSwitcher';
import { useState, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { PhotoMetadata } from '../utils/photoMatching';
import PhotoValueReport from '../components/PhotoValueReport';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen() {
  const theme = useTheme();
  const [userPhotos, setUserPhotos] = useState<PhotoMetadata[]>([]);
  const [potentialValue, setPotentialValue] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [photoDataForReport, setPhotoDataForReport] = useState<any[]>([]);

  useEffect(() => {
    loadUserPhotos();
  }, []);

  const loadUserPhotos = async (uploadedAssets?: ImagePicker.ImagePickerAsset[]) => {
    try {
      let photos: PhotoMetadata[] = [];

      if (uploadedAssets) {
        // Handle uploaded photos
        photos = uploadedAssets.map(asset => ({
          id: asset.assetId || Date.now().toString(),
          creationTime: new Date(),
          filename: asset.uri.split('/').pop() || 'uploaded-photo.jpg',
          width: asset.width || 800,
          height: asset.height || 600,
          uri: asset.uri,
          location: {
            latitude: 42.3601, // Default to Boston coordinates
            longitude: -71.0549
          }
        }));
      } else {
        // Handle photo library access
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Photo library permission denied');
          return;
        }
        
        const { assets } = await MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
          first: 50,
        });
        
        photos = await Promise.all(
          assets.map(async (asset) => {
            try {
              const info = await MediaLibrary.getAssetInfoAsync(asset);
              let uri = info.localUri || asset.uri;
              
              if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
                uri = `assets-library://asset/asset.JPG?id=${uri.slice(5)}&ext=JPG`;
              }
              
              return {
                id: asset.id,
                creationTime: new Date(asset.creationTime),
                filename: asset.filename,
                location: info.location,
                width: asset.width,
                height: asset.height,
                uri: uri,
              };
            } catch (error) {
              console.error(`Error processing photo ${asset.id}:`, error);
              return {
                id: asset.id,
                creationTime: new Date(asset.creationTime),
                filename: asset.filename,
                width: asset.width,
                height: asset.height,
                uri: asset.uri,
              };
            }
          })
        );
      }

      const photosWithLocation = photos.filter(photo => photo.location);
      setUserPhotos(prevPhotos => [...prevPhotos, ...photos]);
      setScannedCount(prevCount => prevCount + photos.length);
      
      // Convert photos to PhotoData format for the report
      const photoData = photosWithLocation.map(photo => ({
        id: photo.id,
        filename: photo.filename,
        uri: photo.uri,
        creationTime: photo.creationTime.getTime(),
        formattedDate: photo.creationTime.toLocaleDateString(),
        location: photo.location ? {
          latitude: photo.location.latitude.toString(),
          longitude: photo.location.longitude.toString()
        } : {
          latitude: '0',
          longitude: '0'
        },
        width: photo.width,
        height: photo.height,
        resolution: `${photo.width}x${photo.height}`,
        selected: false
      }));
      
      setPhotoDataForReport(prevData => [...prevData, ...photoData]);
      
      // Calculate potential value
      let totalValue = 0;
      photosWithLocation.forEach(photo => {
        let value = 5;
        
        const resolution = photo.width * photo.height;
        if (resolution > 12000000) {
          value += 3;
        } else if (resolution > 8000000) {
          value += 2;
        }
        
        const now = new Date();
        const hoursDiff = (now.getTime() - photo.creationTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          value += 2;
        } else if (hoursDiff < 72) {
          value += 1;
        }
        
        totalValue += value;
      });
      
      setPotentialValue(prevValue => prevValue + totalValue);
      
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
        exif: true,
      });

      if (!result.canceled && result.assets) {
        await loadUserPhotos(result.assets);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {showReport ? (
        <PhotoValueReport
          photos={photoDataForReport}
          requestLocation="All Locations"
          requestCategory="All Categories"
          onClose={() => setShowReport(false)}
        />
      ) : (
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
                    <Text variant="headlineSmall" style={styles.statNumber}>{scannedCount}</Text>
                    <Text variant="bodySmall" style={styles.statLabel}>Scanned Photos</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={styles.statNumber}>${potentialValue}</Text>
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
                  onPress={() => {
                    loadUserPhotos();
                    setShowReport(true);
                  }}
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
                  onPress={handleUpload}
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
      )}
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
