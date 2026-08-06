export interface AssociateProfile {
  id: string;
  auth_user_id: string;
  employee_number: string;
  display_name: string | null;
  store_id: string | null;
  role: string;
  language: string;
  active: boolean;
}

export interface StoreInfo {
  id: string;
  name: string;
  region: string;
}
