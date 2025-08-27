export interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  }
  
  export interface AuthResult {
    token: string | null;
    user: User | null;
  }