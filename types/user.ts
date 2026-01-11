export type VisibilityLevel = 'public' | 'followers' | 'friends' | 'private';

export interface User {
    id: string;
    username: string;
    displayName: string;
    email: string;
    avatar?: string;
    backdropMode: "color" | "image";
    backdropColor: string;
    backdropImage?: string;
    role?: string;
    plan?: "free" | "plus";
    preferences?: {
        [key: string]: any;
    };
    // Legacy boolean privacy fields
    isStatsPublic: boolean;
    isActivityPublic: boolean;
    isLibraryPublic: boolean;
    // New granular visibility fields
    statsVisibility?: VisibilityLevel;
    activityVisibility?: VisibilityLevel;
    libraryVisibility?: VisibilityLevel;
    // Follow counts
    followersCount?: number;
    followingCount?: number;
    // Relationship with current user (only on other user's profiles)
    isFollowedByMe?: boolean;
    isFollowingMe?: boolean;
    isFriend?: boolean;
    hasPassword: boolean;
    createdAt: string;
    updatedAt: string;
};