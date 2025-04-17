import { Stack } from 'expo-router';
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function TrackingSettingsScreen() {
  const router = useRouter();
  // Récupérez l'ID du livre si nécessaire
  const { bookId } = useLocalSearchParams(); 

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Paramètres de suivi pour le livre {bookId}</Text>
      {/* ... Votre formulaire ici ... */}

    </View>
  );
}
