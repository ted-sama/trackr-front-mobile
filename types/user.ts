export interface User {
    id: number;
    username: string;
    email: string;
    avatar: string;
    role: string;
    preferences: {
        [key: string]: any;
    };
    created_at: Date;
    updated_at: Date;
};