import React from 'react';
import { View, Text } from 'react-native';
import { Star } from 'lucide-react-native';

interface RatingStarsProps {
    rating: number;
    size?: number;
    color?: string;
}

export default function RatingStars({ rating, size = 24, color = '#FFFFFF' }: RatingStarsProps) {
    // sequential-thinking: Plan
    // 1. Calculate number of full stars (Math.floor(rating))
    // 2. If rating has a .5, show a half star (rating % 1 >= 0.5)
    // 3. Fill up to 5 stars with empty stars
    // 4. Use lucide-react-native Star for full, and Star with half opacity for half, and outline for empty

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const stars = [];

    for (let i = 0; i < fullStars; i++) {
        stars.push(
            <Star
                key={`star-full-${i}`}
                size={size}
                color={color}
                fill={color}
                strokeWidth={2}
            />
        );
    }

    if (hasHalfStar) {
        // Render a half star by overlaying two Stars: one filled left half, one outline
        stars.push(
            <View
                key="star-half"
                style={{ width: size, height: size, position: 'relative', marginRight: 2 }}
            >
                {/* Filled left half */}
                <View
                    style={{
                        position: 'absolute',
                        width: size / 2,
                        height: size,
                        overflow: 'hidden',
                        left: 0,
                        top: 0,
                    }}
                >
                    <Star
                        size={size}
                        color={color}
                        fill={color}
                        strokeWidth={2}
                    />
                </View>
                {/* Outline full star */}
                <Star
                    size={size}
                    color={color}
                    fill="transparent"
                    strokeWidth={2}
                />
            </View>
        );
    }

    for (let i = 0; i < emptyStars; i++) {
        stars.push(
            <Star
                key={`star-empty-${i}`}
                size={size}
                color={color}
                fill="transparent"
                strokeWidth={2}
                opacity={0.3}
            />
        );
    }

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {stars}
        </View>
    );
}
