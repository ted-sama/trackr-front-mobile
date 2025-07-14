export interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    role?: string;
    preferences?: {
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
};