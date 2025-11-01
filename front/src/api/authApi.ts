import api from './axiosInstance';

export async function checkEmailDuplicate(email: string): Promise<{
  duplicate: boolean;
  message: string;
}> {
  // ✅ public API: 이메일 중복 확인은 인증 없이 호출
  const response = await api.get('/auth/check-email', {
    params: { value: email },
    headers: { 'X-Skip-Auth-Refresh': '1' }
  });
  return response.data;
}
