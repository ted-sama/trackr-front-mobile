import { StyleSheet } from 'react-native';

export interface Typography {
  headerTitle: object;
  h1: object;
  h2: object;
  h3: object;
  body: object;
  bodyCaption: object;
  bodyBold: object;
  caption: object;
  username: object;
  badge: object;
  button: object;
  categoryTitle: object;
  trackingTabBarButton: object;
  trackingTabBarText: object;
  trackingTabBarText2: object;
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
      fontSize: 20,
      lineHeight: 30,
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
      fontFamily: 'Manrope_500Medium',
      fontSize: 14,
      lineHeight: 21,
      letterSpacing: -0.3,
    },
    bodyCaption: {
      fontFamily: 'Manrope_500Medium',
      fontSize: 12,
      lineHeight: 16,
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
    username: {
      fontFamily: 'Manrope_800ExtraBold',
      fontSize: 14,
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
      fontSize: 17,
      lineHeight: 24,
      letterSpacing: -0.3,
    },
    trackingTabBarButton: {
      fontFamily: 'Manrope_700Bold',
      fontSize: 15,
      letterSpacing: -0.3,
    },
    trackingTabBarText: {
      fontFamily: 'Manrope_700Bold',
      fontSize: 13,
      lineHeight: 20,
      letterSpacing: -0.3,
    },
    trackingTabBarText2: {
      fontFamily: 'Manrope_700Bold',
      fontSize: 12,
      lineHeight: 18,
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