import { cookies } from 'next/headers';
import type { User, AuthResult } from './types';

export async function getAuthenticatedUser(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  
  // トークンがない場合
  if (!token) {
    return { token: null, user: null };
  }
  
  // 現在のトークンで試す
  try {
    const response = await fetch(`${process.env.DJANGO_API_URL}/api/v1/auth/user/`, {
      headers: { 
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (response.ok) {
      const user = await response.json();
      return { token: token.value, user };
    }
  } catch (error) {
    console.error('User fetch failed:', error);
  }
  
  // トークンが無効な場合
  return { token: null, user: null };
}

export async function getCurrentUser(): Promise<User | null> {
  const { user } = await getAuthenticatedUser();
  return user;
}