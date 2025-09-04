export interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    role?: string;
    plan?: "free" | "plus";
    preferences?: {
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
};