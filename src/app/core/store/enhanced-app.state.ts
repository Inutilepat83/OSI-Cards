import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { AICardConfig } from '../../models/card.model';

// Enhanced Cards State with Entity Management
export interface CardsState extends EntityState<AICardConfig> {
  selectedCardId: string | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  lastUpdated: Date | null;
  filters: CardFilters;
  sortBy: CardSortOption;
  searchQuery: string;
}

export interface CardFilters {
  cardType?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: 'active' | 'archived' | 'draft';
}

export interface CardSortOption {
  field: 'created' | 'updated' | 'name' | 'type';
  direction: 'asc' | 'desc';
}

// Create entity adapter for cards
export const cardsAdapter: EntityAdapter<AICardConfig> = createEntityAdapter<AICardConfig>({
  selectId: (card: AICardConfig) => card.id || '',
  sortComparer: (a: AICardConfig, b: AICardConfig) => {
    // Default sort by card title
    return (a.cardTitle || '').localeCompare(b.cardTitle || '');
  },
});

// Enhanced UI State with advanced features
export interface UiState {
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  loading: boolean;
  notifications: NotificationState[];
  modal: ModalState | null;
  breadcrumbs: BreadcrumbItem[];
  search: SearchState;
  layout: LayoutState;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoClose: boolean;
  duration: number;
}

export interface ModalState {
  id: string;
  type: 'confirm' | 'alert' | 'custom';
  title: string;
  content: any;
  size: 'sm' | 'md' | 'lg' | 'xl';
  closable: boolean;
}

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
}

export interface SearchState {
  query: string;
  results: any[];
  isSearching: boolean;
  filters: Record<string, any>;
}

export interface LayoutState {
  isMobile: boolean;
  sidebarCollapsed: boolean;
  currentView: 'grid' | 'list' | 'table';
  itemsPerPage: number;
  currentPage: number;
}

// Enhanced User State with authentication and preferences
export interface UserState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  preferences: UserPreferences;
  permissions: Permission[];
  session: SessionState;
  profile: UserProfile;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface UserProfile {
  bio?: string;
  website?: string;
  socialLinks: SocialLink[];
  preferences: UserPreferences;
  stats: UserStats;
}

export interface SocialLink {
  platform: string;
  url: string;
  username: string;
}

export interface UserStats {
  totalCards: number;
  totalViews: number;
  totalShares: number;
  lastActivity: Date;
}

export interface UserPreferences {
  defaultCardType: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  privacySettings: PrivacySettings;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showStats: boolean;
  allowContact: boolean;
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface SessionState {
  token: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  lastActivity: Date;
}

export type UserRole = 'admin' | 'user' | 'premium' | 'guest';

// Main App State
export interface AppState {
  cards: CardsState;
  ui: UiState;
  user: UserState;
  router: any; // NgRx Router State
}

// Initial states
export const initialCardsState: CardsState = cardsAdapter.getInitialState({
  selectedCardId: null,
  loading: false,
  error: null,
  totalCount: 0,
  lastUpdated: null,
  filters: {},
  sortBy: { field: 'created', direction: 'desc' },
  searchQuery: '',
});

export const initialUiState: UiState = {
  theme: 'auto',
  sidebarOpen: false,
  loading: false,
  notifications: [],
  modal: null,
  breadcrumbs: [],
  search: {
    query: '',
    results: [],
    isSearching: false,
    filters: {},
  },
  layout: {
    isMobile: false,
    sidebarCollapsed: false,
    currentView: 'grid',
    itemsPerPage: 12,
    currentPage: 1,
  },
};

export const initialUserState: UserState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  preferences: {
    defaultCardType: 'company',
    theme: 'auto',
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: true,
    privacySettings: {
      profileVisibility: 'public',
      showEmail: false,
      showStats: true,
      allowContact: true,
    },
  },
  permissions: [],
  session: {
    token: null,
    refreshToken: null,
    expiresAt: null,
    lastActivity: new Date(),
  },
  profile: {
    socialLinks: [],
    preferences: {
      defaultCardType: 'company',
      theme: 'auto',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: true,
      privacySettings: {
        profileVisibility: 'public',
        showEmail: false,
        showStats: true,
        allowContact: true,
      },
    },
    stats: {
      totalCards: 0,
      totalViews: 0,
      totalShares: 0,
      lastActivity: new Date(),
    },
  },
};
