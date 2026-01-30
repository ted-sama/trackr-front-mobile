import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
  Text,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import * as ImageManipulator from "expo-image-manipulator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";
import { X, Check } from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ImageCropperProps {
  visible: boolean;
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  aspectRatio: [number, number];
  onCrop: (result: { uri: string; width: number; height: number }) => void;
  onCancel: () => void;
  cropperTitle?: string;
}

export default function ImageCropper({
  visible,
  imageUri,
  imageWidth,
  imageHeight,
  aspectRatio,
  onCrop,
  onCancel,
  cropperTitle = "Crop Image",
}: ImageCropperProps) {
  const typography = useTypography();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate crop area dimensions
  const [targetW, targetH] = aspectRatio;
  const targetRatio = targetW / targetH;

  // Crop area size - fit within screen width with padding
  const cropAreaWidth = SCREEN_WIDTH - 48;
  const cropAreaHeight = cropAreaWidth / targetRatio;
  const overlaySize = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT);
  const overlayVertical = Math.max(0, (containerHeight - cropAreaHeight) / 2);
  const overlayHorizontal = Math.max(0, (SCREEN_WIDTH - cropAreaWidth) / 2);

  // Image scaling - scale to cover the crop area (minimum scale)
  const imageRatio = imageWidth / imageHeight;
  let baseImageWidth: number;
  let baseImageHeight: number;

  if (imageRatio > targetRatio) {
    // Image is wider than crop area - fit by height
    const minScale = cropAreaHeight / imageHeight;
    baseImageHeight = cropAreaHeight;
    baseImageWidth = imageWidth * minScale;
  } else {
    // Image is taller than crop area - fit by width
    const minScale = cropAreaWidth / imageWidth;
    baseImageWidth = cropAreaWidth;
    baseImageHeight = imageHeight * minScale;
  }

  // Gesture values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Store dimensions for worklet
  const baseW = baseImageWidth;
  const baseH = baseImageHeight;
  const cropW = cropAreaWidth;
  const cropH = cropAreaHeight;

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      "worklet";
      const newX = savedTranslateX.value + e.translationX;
      const newY = savedTranslateY.value + e.translationY;

      // Calculate bounds based on current scale
      const currentWidth = baseW * scale.value;
      const currentHeight = baseH * scale.value;
      const maxX = Math.max(0, (currentWidth - cropW) / 2);
      const maxY = Math.max(0, (currentHeight - cropH) / 2);

      translateX.value = Math.min(maxX, Math.max(-maxX, newX));
      translateY.value = Math.min(maxY, Math.max(-maxY, newY));
    })
    .onEnd(() => {
      "worklet";
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      "worklet";
      const newScale = Math.min(Math.max(savedScale.value * e.scale, 1), 5);
      scale.value = newScale;

      // Clamp translation to new bounds
      const currentWidth = baseW * newScale;
      const currentHeight = baseH * newScale;
      const maxX = Math.max(0, (currentWidth - cropW) / 2);
      const maxY = Math.max(0, (currentHeight - cropH) / 2);

      translateX.value = Math.min(maxX, Math.max(-maxX, translateX.value));
      translateY.value = Math.min(maxY, Math.max(-maxY, translateY.value));
    })
    .onEnd(() => {
      "worklet";
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Animated style for the image
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Reset gesture values when modal opens
  const resetGestures = () => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Handle crop
  const handleCrop = async () => {
    setIsProcessing(true);

    try {
      const currentScale = scale.value;
      const currentTranslateX = translateX.value;
      const currentTranslateY = translateY.value;

      // Calculate what portion of the original image is visible in the crop area
      const displayedWidth = baseImageWidth * currentScale;
      const displayedHeight = baseImageHeight * currentScale;

      // The crop area is centered. Translation moves the image.
      const cropCenterOffsetX = -currentTranslateX;
      const cropCenterOffsetY = -currentTranslateY;

      // Convert to original image coordinates
      const scaleToOriginal = imageWidth / displayedWidth;

      const cropWidthOriginal = cropAreaWidth * scaleToOriginal;
      const cropHeightOriginal = cropAreaHeight * scaleToOriginal;

      // Center of crop in original image coordinates
      const centerXOriginal = imageWidth / 2 + cropCenterOffsetX * scaleToOriginal;
      const centerYOriginal = imageHeight / 2 + cropCenterOffsetY * scaleToOriginal;

      // Top-left of crop region
      let originX = centerXOriginal - cropWidthOriginal / 2;
      let originY = centerYOriginal - cropHeightOriginal / 2;

      // Clamp to image bounds
      originX = Math.max(0, Math.min(originX, imageWidth - cropWidthOriginal));
      originY = Math.max(0, Math.min(originY, imageHeight - cropHeightOriginal));

      const finalWidth = Math.min(cropWidthOriginal, imageWidth - originX);
      const finalHeight = Math.min(cropHeightOriginal, imageHeight - originY);

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(finalWidth),
              height: Math.round(finalHeight),
            },
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      onCrop({
        uri: result.uri,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onShow={resetGestures}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onCancel} style={styles.headerButton}>
            <X size={24} color="#fff" />
          </Pressable>
          <Text style={[typography.h3, styles.headerTitle]}>{cropperTitle}</Text>
          <Pressable
            onPress={handleCrop}
            style={[styles.headerButton, styles.confirmButton]}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Check size={24} color="#fff" />
            )}
          </Pressable>
        </View>

        {/* Crop area */}
        <View
          style={styles.cropContainer}
          onLayout={(event) => {
            setContainerHeight(event.nativeEvent.layout.height);
          }}
        >
          <GestureDetector gesture={composedGesture}>
            <Animated.View
              style={[
                styles.imageWrapper,
                {
                  width: baseImageWidth,
                  height: baseImageHeight,
                },
                animatedImageStyle,
              ]}
            >
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: baseImageWidth,
                  height: baseImageHeight,
                }}
                contentFit="cover"
              />
            </Animated.View>
          </GestureDetector>

          <View pointerEvents="none" style={styles.overlayContainer}>
            <View
              style={[
                styles.overlayPane,
                {
                  height: overlayVertical,
                  top: 0,
                  left: 0,
                  right: 0,
                },
              ]}
            />
            <View
              style={[
                styles.overlayPane,
                {
                  height: overlayVertical,
                  bottom: 0,
                  left: 0,
                  right: 0,
                },
              ]}
            />
            <View
              style={[
                styles.overlayPane,
                {
                  top: overlayVertical,
                  bottom: overlayVertical,
                  left: 0,
                  width: overlayHorizontal,
                },
              ]}
            />
            <View
              style={[
                styles.overlayPane,
                {
                  top: overlayVertical,
                  bottom: overlayVertical,
                  right: 0,
                  width: overlayHorizontal,
                },
              ]}
            />
          </View>

          {/* Border around crop area */}
          <View
            style={[
              styles.cropBorder,
              {
                width: cropAreaWidth + 4,
                height: cropAreaHeight + 4,
              },
            ]}
            pointerEvents="none"
          />
        </View>

        {/* Instructions */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={[typography.caption, styles.instructions]}>
            {t("imageCropper.instructions")}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "600",
  },
  cropContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayPane: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  cropBorder: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 6,
  },
  footer: {
    alignItems: "center",
    paddingTop: 16,
  },
  instructions: {
    color: "rgba(255,255,255,0.7)",
  },
});
