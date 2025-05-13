import { User } from "./user";

export interface RegisterResponse {
    message: string;
    user?: User;
}

export interface LoginResponse {
    message: string;
    access_token?: string;
    refresh_token?: string;
    user?: User;
}

export interface RefreshTokenResponse {
    message: string;
    access_token?: string;
}


