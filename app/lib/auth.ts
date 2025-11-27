import { cookies } from "next/headers";
import { USER_ENDPOINTS } from "@/types/user";
import type { PrivateUser } from "@/types/user";

const API = process.env.DJANGO_API_URL;

export async function getCurrentUser(): Promise<PrivateUser | null> {
  const cookieStore = await cookies();

  try {
    const access = cookieStore.get("access_token")?.value;
    if (!access) return null;

    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");

    const res = await fetch(`${API}${USER_ENDPOINTS.ME}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Accept": "application/json",
        "Cookie": cookieHeader,
      },
    });

    if (!res.ok) {
      console.error(`getCurrentUser failed: status=${res.status}`);
      return null;
    }

    // 1. レスポンス全体をJSONとして取得
    const json = await res.json();

    // 2. curlの結果 {"data": {"user": ...}} に合わせて階層を掘る
    // apiFetchAuth がやっていたことをここで行います
    const user = json?.data?.user;

    if (!user) {
        console.error("getCurrentUser: User data not found in response", json);
        return null;
    }

    // 3. 型アサーションして返す
    return user as PrivateUser;

  } catch (err) {
    console.error("getCurrentUser error", err);
    return null;
  }
}