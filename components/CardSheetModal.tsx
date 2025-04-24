import React, { forwardRef, useState } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BottomSheetModal, BottomSheetBackdropProps, BottomSheetView } from '@gorhom/bottom-sheet';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

interface CardSheetModalProps {
  children: React.ReactNode;
  snapPoints?: string[];
  index?: number;
  onDismiss?: () => void;
  contentContainerStyle?: ViewStyle;
  backdropDismiss?: boolean;
}

const CardSheetModal = forwardRef<BottomSheetModal, CardSheetModalProps>(({
  children,
  snapPoints,
  index = 0,
  onDismiss,
  contentContainerStyle,
  backdropDismiss = false,
}, ref) => {
  const { colors } = useTheme();
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  const renderBackdrop = (props: BottomSheetBackdropProps) => {
    const animatedStyle = useAnimatedStyle(() => ({
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      opacity: interpolate(props.animatedIndex.value, [-1, 0], [0, 1], Extrapolation.CLAMP),
    }));
    const handleBackdropPress = () => {
      if (backdropDismiss && ref && typeof ref !== 'function' && ref.current) {
        ref.current.close();
      }
    };
    return (
      <Animated.View
        style={[props.style, styles.backdrop, animatedStyle]}
        pointerEvents={backdropDismiss ? 'auto' : 'none'}
        onTouchEnd={backdropDismiss ? handleBackdropPress : undefined}
      />
    );
  };

  return (
    <BottomSheetModal
      detached
      style={styles.modal}
      ref={ref}
      index={index}
      snapPoints={snapPoints}
      bottomInset={25}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: colors.card,
        borderRadius: 35,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.border,
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginVertical: 8,
      }}
      backdropComponent={renderBackdrop}
      onDismiss={onDismiss}
    >
      <BottomSheetView
        onLayout={(e) => measuredHeight === null && setMeasuredHeight(e.nativeEvent.layout.height)}
        style={[styles.content, contentContainerStyle || {}]}
      >
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  backdrop: {
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
});

export default CardSheetModal; 