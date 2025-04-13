import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Avatar, Menu } from 'react-native-paper';
import { useRouter } from 'expo-router';

interface ProfileSwitcherProps {
  currentMode: 'buyer' | 'seller';
}

export default function ProfileSwitcher({ currentMode }: ProfileSwitcherProps) {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const router = useRouter();

  const switchProfile = (mode: 'buyer' | 'seller') => {
    setMenuVisible(false);
    if (mode !== currentMode) {
      router.replace(mode === 'buyer' ? '/buyer' : '/');
    }
  };

  return (
    <View style={styles.container}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setMenuVisible(true)}
          >
            <Avatar.Icon 
              size={36} 
              icon={currentMode === 'buyer' ? 'account-search' : 'camera'} 
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <Text variant="labelMedium" style={styles.label}>
                {currentMode === 'buyer' ? 'Buyer Mode' : 'Seller Mode'}
              </Text>
              <Text variant="bodySmall" style={styles.switchText}>
                Tap to switch
              </Text>
            </View>
          </TouchableOpacity>
        }
      >
        <Menu.Item
          onPress={() => switchProfile('buyer')}
          title="Buyer Mode"
          leadingIcon="account-search"
          disabled={currentMode === 'buyer'}
        />
        <Menu.Item
          onPress={() => switchProfile('seller')}
          title="Seller Mode"
          leadingIcon="camera"
          disabled={currentMode === 'seller'}
        />
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    paddingRight: 16,
  },
  avatar: {
    backgroundColor: '#6b4d8f',
  },
  textContainer: {
    marginLeft: 8,
  },
  label: {
    color: '#6b4d8f',
    fontWeight: '500',
  },
  switchText: {
    color: '#666',
    fontSize: 10,
  },
}); 