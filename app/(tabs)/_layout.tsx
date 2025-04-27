import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import NavigationBar from '../components/NavigationBar';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#6b4d8f',
          tabBarInactiveTintColor: '#9e9e9e',
        }}
        tabBar={props => <NavigationBar {...props} />}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            href: '/(tabs)/home',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="my-requests"
          options={{
            title: 'My Requests',
            href: '/(tabs)/my-requests',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="clipboard-list" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="my-uploads"
          options={{
            title: 'My Submissions',
            href: '/(tabs)/my-uploads',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cloud-upload" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            href: '/(tabs)/profile',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
