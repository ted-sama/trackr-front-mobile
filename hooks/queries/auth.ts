import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

interface CheckEmailResponse {
  exists: boolean;
  verified?: boolean;
}

interface ForgotPasswordResponse {
  message: string;
}

interface ResetPasswordResponse {
  message: string;
}

async function checkEmailRequest(email: string): Promise<CheckEmailResponse> {
  const { data } = await api.post<CheckEmailResponse>('/auth/check-email', { email });
  return data;
}

async function forgotPasswordRequest(email: string): Promise<ForgotPasswordResponse> {
  const { data } = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { email });
  return data;
}

async function resetPasswordRequest(token: string, password: string): Promise<ResetPasswordResponse> {
  const { data } = await api.post<ResetPasswordResponse>('/auth/reset-password', { token, password });
  return data;
}

export function useCheckEmail() {
  return useMutation({
    mutationFn: (email: string) => checkEmailRequest(email),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => forgotPasswordRequest(email),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      resetPasswordRequest(token, password),
  });
}

interface ResendVerificationResponse {
  message: string;
}

async function resendVerificationRequest(email: string): Promise<ResendVerificationResponse> {
  const { data } = await api.post<ResendVerificationResponse>('/auth/resend-verification', { email });
  return data;
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => resendVerificationRequest(email),
  });
}

interface ChangePasswordResponse {
  message: string;
}

async function changePasswordRequest(
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResponse> {
  const { data } = await api.post<ChangePasswordResponse>('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return data;
}

async function deleteAccountRequest(): Promise<void> {
  await api.delete('/me');
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      changePasswordRequest(currentPassword, newPassword),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => deleteAccountRequest(),
  });
}
