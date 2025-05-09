import { api } from './index';
import { LoginResponse } from '@/types/auth';
interface RegisterParams {
    username: string;
    email: string;
    password: string;
}

interface LoginParams {
    email: string;
    password: string;
}

export const register = async ({ username, email, password }: RegisterParams) => {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
};

export const login = async ({ email, password }: LoginParams): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};