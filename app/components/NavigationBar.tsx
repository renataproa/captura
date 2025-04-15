import { View, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Surface, BottomNavigation, useTheme } from 'react-native-paper';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export default function NavigationBar({ navigation, state }: BottomTabBarProps) {
  const theme = useTheme();

  const routes = [
    { 
      key: 'home',
      title: 'Home',
      focusedIcon: 'home',
      unfocusedIcon: 'home-outline',
    },
    { 
      key: 'my-bids',
      title: 'My Bids',
      focusedIcon: 'image',
      unfocusedIcon: 'image-outline',
    },
    { 
      key: 'profile',
      title: 'Profile',
      focusedIcon: 'account',
      unfocusedIcon: 'account-outline',
    }
  ];

  return (
    <Surface style={styles.container} elevation={4}>
      <BottomNavigation
        navigationState={{ index: state.index, routes }}
        onIndexChange={index => navigation.navigate(state.routeNames[index])}
        renderScene={() => null}
        barStyle={styles.bar}
        activeColor={theme.colors.primary}
        inactiveColor={theme.colors.outline}
        compact={Platform.OS === 'ios'}
        labeled={true}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  bar: {
    backgroundColor: 'transparent',
    height: Platform.OS === 'ios' ? 84 : 64,
  }
}); 