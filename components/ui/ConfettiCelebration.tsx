import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Confetti, ConfettiMethods } from 'react-native-fast-confetti';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

export interface ConfettiCelebrationMethods {
  celebrate: () => void;
}

interface ConfettiCelebrationProps {
  onAnimationEnd?: () => void;
}

const ConfettiCelebration = forwardRef<ConfettiCelebrationMethods, ConfettiCelebrationProps>(
  ({ onAnimationEnd }, ref) => {
    const confettiRef = useRef<ConfettiMethods>(null);
    const { colors } = useTheme();

    // Celebration colors - vibrant and festive
    const celebrationColors = [
      colors.completed,
      colors.primary,
      '#FFD700', // Gold
      '#FF6B6B', // Coral
      '#4ECDC4', // Teal
      '#A855F7', // Purple
      '#F97316', // Orange
    ];

    useImperativeHandle(ref, () => ({
      celebrate: () => {
        // Trigger haptic feedback for celebration
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Use a small delay to ensure the ref is properly initialized
        setTimeout(() => {
          confettiRef.current?.restart();
        }, 50);
      },
    }));

    const handleAnimationEnd = () => {
      onAnimationEnd?.();
    };

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Confetti
          ref={confettiRef}
          count={150}
          fallDuration={4000}
          blastDuration={400}
          colors={celebrationColors}
          flakeSize={{ width: 10, height: 20 }}
          fadeOutOnEnd
          autoplay={false}
          onAnimationEnd={handleAnimationEnd}
          sizeVariation={0.3}
          cannonsPositions={[
            { x: 50, y: -20 },
            { x: 200, y: -20 },
            { x: 350, y: -20 },
          ]}
        />
      </View>
    );
  }
);

export default ConfettiCelebration;

