import api from './axiosInstance';

export async function checkEmailDuplicate(email: string): Promise<{
  duplicate: boolean;
  message: string;
}> {
  // ✅ public API: URL 패턴으로 이미 처리됨 (헤더 불필요)
  const response = await api.get('/auth/check-email', {
    params: { value: email },
  });
  return response.data;
}
