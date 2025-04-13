import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface PhotoData {
  id: string;
  filename: string;
  uri: string;
  creationTime: number;
  formattedDate: string;
  location: {
    latitude: string;
    longitude: string;
  };
  width: number;
  height: number;
  resolution: string;
  selected: boolean;
}

interface PhotoValueReportProps {
  photos: PhotoData[];
  requestLocation: string;
  requestCategory: string;
  onClose: () => void;
}

export default function PhotoValueReport({ 
  photos, 
  requestLocation, 
  requestCategory,
  onClose 
}: PhotoValueReportProps) {
  // Calculate potential value based on photo quality and relevance
  const calculatePhotoValue = (photo: PhotoData): number => {
    // Base value for a photo
    let value = 5;
    
    // Add value based on resolution
    const resolution = photo.width * photo.height;
    if (resolution > 12000000) { // 12MP
      value += 3;
    } else if (resolution > 8000000) { // 8MP
      value += 2;
    }
    
    // Add value based on recency (photos taken in the last 24 hours are worth more)
    const photoDate = new Date(photo.creationTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - photoDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      value += 2; // 24 hours or less
    } else if (hoursDiff < 72) {
      value += 1; // 3 days or less
    }
    
    return value;
  };
  
  // Calculate total potential value
  const totalValue = photos.reduce((sum, photo) => sum + calculatePhotoValue(photo), 0);
  
  // Group photos by date
  const groupPhotosByDate = () => {
    const groups: { [key: string]: PhotoData[] } = {};
    
    photos.forEach(photo => {
      const date = new Date(photo.creationTime);
      const dateKey = format(date, 'MMM d, yyyy');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(photo);
    });
    
    return groups;
  };
  
  const photoGroups = groupPhotosByDate();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photo Value Report</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Matching Photos</Text>
          <Text style={styles.summaryValue}>{photos.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Potential Value</Text>
          <Text style={styles.summaryValue}>${totalValue}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Location</Text>
          <Text style={styles.summaryValue}>{requestLocation}</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
        <Text style={styles.infoText}>
          These photos match your request for {requestCategory} photos at {requestLocation}. 
          The potential value is an estimate based on photo quality and recency.
        </Text>
      </View>
      
      <ScrollView style={styles.photoList}>
        {Object.entries(photoGroups).map(([date, datePhotos]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{date}</Text>
            <View style={styles.photoGrid}>
              {datePhotos.map(photo => (
                <View key={photo.id} style={styles.photoItem}>
                  <Image 
                    source={{ uri: photo.uri }} 
                    style={styles.photoThumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoTime}>{format(new Date(photo.creationTime), 'h:mm a')}</Text>
                    <Text style={styles.photoValue}>${calculatePhotoValue(photo)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Submit Selected Photos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#E8F2FF',
    margin: 16,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  photoList: {
    flex: 1,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  photoItem: {
    width: '33.33%',
    padding: 8,
  },
  photoThumbnail: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  photoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  photoTime: {
    fontSize: 12,
    color: '#666',
  },
  photoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 