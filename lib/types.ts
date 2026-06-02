export type UserRole = "rep" | "manager" | "admin";
export type InsightPriority = "critical" | "opportunity" | "pattern";
export type SubscriptionPlan = "free" | "solo" | "team";
export type UploadStatus = "pending" | "processing" | "complete" | "failed";
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  team_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}
export interface Team {
  id: string;
  name: string;
  owner_id: string;
  seat_count: number;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface Upload {
  id: string;
  user_id: string;
  team_id: string | null;
  file_path: string | null;
  file_name: string;
  status: UploadStatus;
  row_count: number;
  error_message: string | null;
  created_at: string;
}
export interface SalesRecord {
  id: string;
  upload_id: string;
  user_id: string;
  team_id: string | null;
  rep_name: string | null;
  date: string | null;
  time_of_day: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  knocked: number;
  contacted: number;
  pitched: number;
  closed: number;
  deal_value: number;
  product: string | null;
  follow_up_scheduled: boolean;
  notes: string | null;
  created_at: string;
}
export interface Insight {
  id: string;
  upload_id: string | null;
  user_id: string;
  team_id: string | null;
  priority: InsightPriority;
  category: string;
  title: string;
  body: string;
  metric: string | null;
  recommendation: string | null;
  is_dismissed: boolean;
  created_at: string;
}
