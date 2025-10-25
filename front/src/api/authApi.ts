import api from './axiosInstance';

export async function checkEmailDuplicate(email: string): Promise<{
  duplicate: boolean;
  message: string;
}> {
  const response = await api.get('/auth/check-email', {
    params: { value: email }
  });
  return response.data;
}
