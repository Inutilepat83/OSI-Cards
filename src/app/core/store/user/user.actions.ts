import { createAction, props } from '@ngrx/store';
import { User } from '../enhanced-app.state';

// Authentication Actions
export const login = createAction('[User] Login', props<{ email: string; password: string }>());

export const loginSuccess = createAction(
  '[User] Login Success',
  props<{ user: User; token: string }>()
);

export const loginFailure = createAction('[User] Login Failure', props<{ error: string }>());

export const logout = createAction('[User] Logout');

export const logoutSuccess = createAction('[User] Logout Success');

export const logoutFailure = createAction('[User] Logout Failure', props<{ error: string }>());

// User Profile Actions
export const loadUserProfile = createAction('[User] Load User Profile');

export const loadUserProfileSuccess = createAction(
  '[User] Load User Profile Success',
  props<{ user: User }>()
);

export const loadUserProfileFailure = createAction(
  '[User] Load User Profile Failure',
  props<{ error: string }>()
);

export const updateUserProfile = createAction(
  '[User] Update User Profile',
  props<{ user: Partial<User> }>()
);

export const updateUserProfileSuccess = createAction(
  '[User] Update User Profile Success',
  props<{ user: User }>()
);

export const updateUserProfileFailure = createAction(
  '[User] Update User Profile Failure',
  props<{ error: string }>()
);

// User Preferences Actions
export const updateUserPreferences = createAction(
  '[User] Update User Preferences',
  props<{ preferences: any }>()
);

export const updateUserPreferencesSuccess = createAction(
  '[User] Update User Preferences Success',
  props<{ preferences: any }>()
);

export const updateUserPreferencesFailure = createAction(
  '[User] Update User Preferences Failure',
  props<{ error: string }>()
);

// Password Actions
export const changePassword = createAction(
  '[User] Change Password',
  props<{ currentPassword: string; newPassword: string }>()
);

export const changePasswordSuccess = createAction('[User] Change Password Success');

export const changePasswordFailure = createAction(
  '[User] Change Password Failure',
  props<{ error: string }>()
);

// Session Management
export const refreshToken = createAction('[User] Refresh Token');

export const refreshTokenSuccess = createAction(
  '[User] Refresh Token Success',
  props<{ token: string }>()
);

export const refreshTokenFailure = createAction(
  '[User] Refresh Token Failure',
  props<{ error: string }>()
);

export const checkAuthStatus = createAction('[User] Check Auth Status');

export const setAuthStatus = createAction(
  '[User] Set Auth Status',
  props<{ isAuthenticated: boolean; user: User | null }>()
);

// User Settings
export const loadUserSettings = createAction('[User] Load User Settings');

export const loadUserSettingsSuccess = createAction(
  '[User] Load User Settings Success',
  props<{ settings: any }>()
);

export const loadUserSettingsFailure = createAction(
  '[User] Load User Settings Failure',
  props<{ error: string }>()
);

export const updateUserSettings = createAction(
  '[User] Update User Settings',
  props<{ settings: any }>()
);

export const updateUserSettingsSuccess = createAction(
  '[User] Update User Settings Success',
  props<{ settings: any }>()
);

export const updateUserSettingsFailure = createAction(
  '[User] Update User Settings Failure',
  props<{ error: string }>()
);
