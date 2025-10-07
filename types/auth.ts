import { User } from "./user";

export interface RegisterResponse extends Partial<User> {}

export interface LoginResponse {
    type: 'bearer';
    token: string;
    name: string | null;
    abilities: string[];
    lastUsedAt: string | null;
    expiresAt: string | null;
}


