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
    isStatsPublic: boolean;
    isActivityPublic: boolean;
    hasPassword: boolean;
    createdAt: string;
    updatedAt: string;
};