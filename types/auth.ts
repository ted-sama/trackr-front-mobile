import { User } from "./user";

export interface RegisterResponse extends Partial<User> {}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    expiresAt: string | null;
}


