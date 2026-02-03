// Database types for Supabase

export type UserRole = "player" | "owner" | "admin";

export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled";

export type TournamentStatus = "draft" | "published" | "closed" | "in_progress" | "completed" | "cancelled";

export type RegistrationStatus = "pending" | "confirmed" | "present" | "absent" | "withdrawn" | "cancelled";

export type PaymentStatus = "pending" | "paid" | "refunded";

export type PaymentMethod = "store" | "stripe";

export type GameType = "magic" | "pokemon" | "onepiece" | "yugioh" | "other";

export type TournamentFormat = "swiss" | "single_elimination" | "round_robin" | "other";

export type RecurringFrequency = "weekly" | "biweekly" | "monthly";

// Profile
export interface Profile {
  id: string;
  role: UserRole;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  preferred_games: GameType[];
  elo: Record<string, number>;
  stats: {
    played: number;
    won: number;
    top3: number;
  };
  badges: string[];
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = "pending" | "approved" | "rejected";

// Owner (extends Profile for role = 'owner')
export interface Owner {
  id: string;
  business_name: string;
  vat_number: string | null;
  business_email: string | null;
  business_phone: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  stripe_customer_id: string | null;
  application_status?: ApplicationStatus;
  created_at: string;
}

// Store
export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  social_links: Record<string, string>;
  opening_hours: Record<string, string>;
  logo_url: string | null;
  banner_url: string | null;
  gallery_images?: string[];
  is_active: boolean;
  approval_status?: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

// Tournament
export interface Tournament {
  id: string;
  store_id: string;
  name: string;
  game: GameType;
  format: TournamentFormat;
  description: string | null;
  rules: string | null;
  prizes: string | null;
  start_date: string;
  start_time: string;
  end_date: string | null;
  end_time: string | null;
  max_participants: number | null;
  min_participants: number;
  entry_fee: number;
  registration_closes_minutes_before: number;
  status: TournamentStatus;
  image_url: string | null;
  is_recurring: boolean;
  recurring_schedule_id: string | null;
  league_id: string | null;
  results: TournamentResult[];
  created_at: string;
  updated_at: string;
}

export interface TournamentResult {
  position: number;
  player_id: string;
  points: number;
}

// Recurring Schedule
export interface RecurringSchedule {
  id: string;
  store_id: string;
  name: string;
  template: Partial<Tournament>;
  frequency: RecurringFrequency;
  day_of_week: number | null;
  day_of_month: number | null;
  time: string;
  is_active: boolean;
  next_occurrence: string | null;
  created_at: string;
}

// League
export interface League {
  id: string;
  store_id: string;
  name: string;
  game: GameType;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: TournamentStatus;
  standings: LeagueStanding[];
  created_at: string;
}

export interface LeagueStanding {
  player_id: string;
  points: number;
  tournaments_played: number;
  wins: number;
}

// Registration
export interface Registration {
  id: string;
  tournament_id: string;
  player_id: string;
  status: RegistrationStatus;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  checked_in_at: string | null;
  position: number | null;
  points: number | null;
  created_at: string;
  updated_at: string;
}

// Tournament Template
export interface TournamentTemplate {
  id: string;
  owner_id: string;
  name: string;
  template: Partial<Tournament>;
  created_at: string;
}

// Tournament message (owner-only write, participants read-only)
export interface TournamentMessage {
  id: string;
  tournament_id: string;
  author_id: string;
  message: string;
  created_at: string;
}

// Notification
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// Extended types with relations
export interface TournamentWithStore extends Tournament {
  store: Store;
}

export interface TournamentWithRegistrations extends Tournament {
  registrations: (Registration & { player: Profile })[];
}

export interface StoreWithOwner extends Store {
  owner: Owner;
}

export interface StoreWithTournaments extends Store {
  tournaments: Tournament[];
}

// Form types
export interface CreateStoreInput {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  banner_url?: string;
  gallery_images?: string[];
  latitude?: number | null;
  longitude?: number | null;
  social_links?: Record<string, string>;
  opening_hours?: Record<string, string>;
}

export interface CreateTournamentInput {
  store_id: string;
  name: string;
  game: GameType;
  format: TournamentFormat;
  start_date: string;
  start_time: string;
  description?: string;
  rules?: string;
  prizes?: string;
  image_url?: string;
  max_participants?: number;
  min_participants?: number;
  entry_fee?: number;
  registration_closes_minutes_before?: number;
  is_recurring?: boolean;
  recurring_schedule_id?: string | null;
}

export interface CreateOwnerInput {
  business_name: string;
  vat_number?: string;
  business_email?: string;
  business_phone?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
