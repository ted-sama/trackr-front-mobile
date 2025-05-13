import { StyleSheet } from 'react-native';

export interface Typography {
  headerTitle: object;
  h1: object;
  h2: object;
  h3: object;
  body: object;
  bodyBold: object;
  caption: object;
  badge: object;
  button: object;
  categoryTitle: object;
  socialButton: object;
}

export function useTypography(): Typography {
  return StyleSheet.create({
    headerTitle: {
      fontFamily: 'Manrope_700Bold',
      fontSize: 22,
      letterSpacing: -0.3,
    },
    h1: {
      fontFamily: 'Manrope_700Bold',
      fontSize: 26,
      lineHeight: 34,
      letterSpacing: -0.3,
    },
    h2: {
      fontFamily: 'Manrope_600SemiBold',
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.3,
    },
    h3: {
      fontFamily: 'Manrope_700Bold',
      fontSize: 14,
      letterSpacing: -0.3,
    },
    body: {
      fontFamily: 'Manrope_400Regular',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: -0.3,
    },
    bodyBold: {
      fontFamily: 'Manrope_600SemiBold',
      fontSize: 16,
      lineHeight: 22,
      letterSpacing: -0.3,
    },
    caption: {
      fontFamily: 'Manrope_600SemiBold',
      fontSize: 13,
      letterSpacing: -0.3,
    },
    badge: {
      fontFamily: 'Manrope_600SemiBold',
      fontSize: 12,
      letterSpacing: -0.3,
    },
    button: {
      fontFamily: 'Manrope_500Medium',
      fontSize: 16,
      lineHeight: 22,
      letterSpacing: -0.3,
    },
    categoryTitle: {
      fontFamily: 'Manrope_700Bold',
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: -0.3,
    },
    socialButton: {
      fontFamily: 'Manrope_700Bold',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: -0.3,
    },
  });
} 