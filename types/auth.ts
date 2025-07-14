import { User } from "./user";

export interface RegisterResponse {
    message: string;
    user?: User;
}

export interface LoginResponse {
    message: string;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
}

export interface RefreshTokenResponse {
    message: string;
    accessToken?: string;
}


