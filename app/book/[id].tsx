import { getBook } from "@/api";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Book } from "@/types";
import { Text, StyleSheet, View, Image, Platform, Pressable, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import TrackingIconButton from "@/components/TrackingIconButton";
import { useTypography } from "@/hooks/useTypography";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Constants for animation
const COLLAPSED_HEIGHT = 60; // Adjust based on font size/line height for ~3 lines
const EXPANDED_HEIGHT = 1000; // Use a large enough value for any description size
const ANIMATION_DURATION = 300; // ms

export default function BookScreen() {
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const [book, setBook] = useState<Book | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const typography = useTypography();
    const insets = useSafeAreaInsets();
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false); // State for description expansion

    // Animation setup for button
    const translateY = useSharedValue(150); 
    const scale = useSharedValue(0.1); 
    const pressScale = useSharedValue(1);

    // Animation setup for description height
    const descriptionMaxHeight = useSharedValue(COLLAPSED_HEIGHT);

    const animatedButtonStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { scale: scale.value },
            ],
        };
    });

    // Animated style for description container
    const animatedDescriptionStyle = useAnimatedStyle(() => {
        return {
            maxHeight: descriptionMaxHeight.value,
            overflow: 'hidden', // Apply overflow hidden here
        };
    });

    // Style for press animation
    const animatedPressStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: pressScale.value }],
        };
    });

    const typeMap = {
        "manga": "Manga",
        "novel": "Roman",
        "light_novel": "Light Novel",
        "web_novel": "Web Novel",
        "comic": "Comic",
        "other": "Autre",
    }

    // Toggle function for description expansion
    const toggleDescription = () => {
        const targetHeight = isDescriptionExpanded ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT;
        descriptionMaxHeight.value = withTiming(targetHeight, { 
            duration: ANIMATION_DURATION,
            easing: Easing.inOut(Easing.ease) // Use a suitable easing function
        });
        setIsDescriptionExpanded(!isDescriptionExpanded);
    };

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const book = await getBook({ id: id as string });
                setBook(book);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Une erreur est survenue');
            } finally {
                setIsLoading(false);
            }
        };
        fetchBook();
    }, [id]);

    // Trigger animation on mount
    useEffect(() => {
        translateY.value = withTiming(0, {
            duration: 500,
            easing: Easing.out(Easing.exp),
        });
        scale.value = withTiming(1, { // Animate scale to 100%
            duration: 750,
            easing: Easing.out(Easing.exp),
        });
    }, []);
    
    if (isLoading) {
        return <Text>Loading...</Text>;
    }

    if (error) {
        return <Text>Error: {error}</Text>;
    }

    const separator = () => {
        return <Text style={{ fontWeight: "900", marginHorizontal: 4, color: colors.secondaryText }}>·</Text>
    }
    const dates = () => {
        if (book?.release_year && book?.end_year) {
            return `${book?.release_year} - ${book?.end_year}`;
        } else if (book?.release_year && !book?.end_year && book?.status === "ongoing") {
            return `${book?.release_year} - en cours`;
        }
        return book?.release_year;
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "right", "left"]}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
                <Image source={{ uri: book?.cover_image }} style={styles.image} />
                <View style={styles.detailsContainer}>
                    {/* Title, author, type, dates and tracking button */}
                    <View style={styles.titleTextContainer}>
                        <View style={{ flex: 3 }}>
                            <Text style={[styles.title, typography.h1, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{book?.title}</Text>
                            <Text style={[styles.author, typography.caption, { color: colors.secondaryText }]} numberOfLines={1} ellipsizeMode="tail">{book?.author}</Text>
                            <View style={[styles.infosContainer]}>
                                <Text style={[typography.caption, { color: colors.secondaryText }]} numberOfLines={1}>{typeMap[book?.type as keyof typeof typeMap]}</Text>
                                {separator()}
                                <Text style={[typography.caption, { color: colors.secondaryText }]} numberOfLines={1}>{dates()}</Text>
                            </View>
                        </View>
                        <View style={styles.trackingContainer}>
                            <TrackingIconButton size={32} isTracking={book?.tracking!} onPress={() => {}} />
                        </View>
                    </View>
                    {/* Description */}
                    <Animated.View style={[styles.descriptionContainer, animatedDescriptionStyle]}>
                        <Text style={[typography.body, { color: colors.text }]}>{book?.description}</Text>
                        {!isDescriptionExpanded && (
                            <LinearGradient
                                // Use background color with varying alpha (Hex8 format)
                                colors={[`${colors.background}00`, `${colors.background}B3`, colors.background]}
                                locations={[0, 0.5, 1]} // Adjust fade start/intensity
                                style={styles.fadeOverlay}
                                pointerEvents="none" // Allow touches to pass through
                            />
                        )}
                    </Animated.View>
                    {/* Toggle Button */}
                    <Pressable onPress={toggleDescription} style={styles.toggleButton}>
                        <Text style={[typography.body, styles.toggleButtonText, { color: colors.primary }]}>
                            {isDescriptionExpanded ? "Réduire" : "Lire la suite"}
                        </Text>
                    </Pressable>
                    {/* Genres */}
                    <View style={[styles.genresContainer, { borderColor: colors.border }]}>
                        <Text style={[typography.body, { color: colors.text }]}>Genres</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Animated Button Container (Handles slide-up and initial scale) */}
            <Animated.View style={[styles.buttonContainer, { bottom: insets.bottom + 16 }, animatedButtonStyle]}>
                {/* Animated Wrapper for Pressable (Handles press scale) */}
                <Animated.View style={[animatedPressStyle]}>
                    <Pressable 
                        style={[styles.button]}
                        onPress={() => console.log("Button Pressed")} 
                        onPressIn={() => {
                            pressScale.value = withTiming(0.97, { duration: 100 });
                        }}
                        onPressOut={() => {
                            pressScale.value = withTiming(1, { duration: 100 });
                        }}
                    >
                        <LinearGradient
                            colors={[colors.primary, '#8A2BE2']}
                            style={[styles.gradient, { borderRadius: styles.button.borderRadius }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={[styles.buttonText, typography.button]}>Gérer le suivi</Text>
                        </LinearGradient>
                    </Pressable>
                </Animated.View>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    detailsContainer: {
        marginTop: 16, // Add some margin if needed between image and details
        paddingBottom: 128,
    },
    image: {
        width: 202.5,
        height: 303.75,
        borderRadius: 6,
        padding: 16,
        alignSelf: "center",
        shadowColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.589)' : 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 8,
    },
    title: {
        marginBottom: 4,
    },
    titleTextContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    author: {
        marginBottom: 4,
    },
    trackingContainer: {
        flex: 1,
        alignItems: "flex-end",
    },
    infosContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    // Styles for the animated button
    buttonContainer: {
        position: 'absolute',
        left: 16, // Match container padding
        right: 16, // Match container padding
        // bottom is set dynamically using insets
    },
    button: {
        // Remove padding, Pressable now only defines shape/shadow/overflow
        // paddingVertical: 14,
        // paddingHorizontal: 24,
        borderRadius: 25, 
        alignSelf: 'stretch',
        alignItems: 'center', 
        justifyContent: 'center',
        shadowColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.589)' : 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        overflow: 'hidden', // Keep this to clip gradient to borderRadius
    },
    gradient: {
        // Remove absolute fill, gradient now defines inner layout + padding
        // ...StyleSheet.absoluteFillObject,
        paddingVertical: 14,   // Keep padding here
        paddingHorizontal: 24, // Keep padding here
        alignSelf: 'stretch',    // Add this to make gradient stretch
        alignItems: 'center', 
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        backgroundColor: 'transparent',
    },
    descriptionContainer: {
        marginTop: 16,
        position: 'relative', // Needed for absolute positioning of the overlay
        // overflow: 'hidden', // Moved to animated style
    },
    fadeOverlay: { // Style for the fade effect
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 30, // Adjust height as needed for the fade effect
    },
    toggleButton: {
        marginTop: 8,
        alignSelf: 'flex-start', // Align to left or center as needed
    },
    toggleButtonText: {
        textDecorationLine: 'underline',
    },
    genresContainer: {
        borderTopWidth: 1,
        marginTop: 24,
        paddingTop: 24,
    }
});