export interface User {
  id?: number;
  username: string;
  role: string;
  createdAt?: string;
  
  kelasId?: number | null;
  kelasNama?: string | null;
  kartuUid?: string | null;
  kartuId?: number | null;
}