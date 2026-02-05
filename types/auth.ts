import { User } from "./user";

export interface RegisterResponse extends Partial<User> {
    needsVerification?: boolean;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    expiresAt: string | null;
}

