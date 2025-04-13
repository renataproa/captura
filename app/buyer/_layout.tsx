import { Stack } from 'expo-router';

export default function BuyerLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="create-request" 
        options={{ 
          headerShown: false 
        }} 
      />
    </Stack>
  );
} 