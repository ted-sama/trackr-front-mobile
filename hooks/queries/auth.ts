import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

interface CheckEmailResponse {
  exists: boolean;
}

async function checkEmailRequest(email: string): Promise<CheckEmailResponse> {
  const { data } = await api.post<CheckEmailResponse>('/auth/check-email', { email });
  return data;
}

export function useCheckEmail() {
  return useMutation({
    mutationFn: (email: string) => checkEmailRequest(email),
  });
}
