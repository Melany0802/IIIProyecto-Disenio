// App.js
import 'react-native-gesture-handler';  // Asegúrate de que esto sea lo primero en el archivo
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Principal from './components/Principal';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Principal" component={Principal} />
      </Stack.Navigator>
    </NavigationContainer>
  )
} 