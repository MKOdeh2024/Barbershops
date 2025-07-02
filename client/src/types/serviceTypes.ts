export interface Service {
  service_id: string | number;
  name: string;
  description?: string;
  estimated_duration: number; // in minutes
  base_price?: number; // Made optional to align with API response
  category?: string;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
