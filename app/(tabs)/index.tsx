import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function Index() {
  const { colors, currentTheme } = useTheme();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />   
      <View style={styles.content}>
        <Text style={[styles.welcomeText, { color: colors.text }]}>
          Bienvenue sur Trackr, votre application de suivi et découverte de mangas !
        </Text>
        
        {/* <Link href="/discover" asChild>
          <TouchableOpacity style={[styles.discoverButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="compass" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Découvrir des mangas</Text>
          </TouchableOpacity>
        </Link> */}
        
        <View style={styles.themeContainer}>
          <ThemeToggle />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  themeContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});
