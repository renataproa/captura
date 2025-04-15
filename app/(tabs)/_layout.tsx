import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import NavigationBar from '../components/NavigationBar';
import { View } from 'react-native';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={props => <NavigationBar {...props} />}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            href: '/(tabs)/home',
          }}
        />
        <Tabs.Screen
          name="my-bids"
          options={{
            title: 'My Bids',
            href: '/(tabs)/my-bids',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            href: '/(tabs)/profile',
          }}
        />
      </Tabs>
    </View>
  );
}
