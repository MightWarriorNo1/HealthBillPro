import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'provider' | 'office_staff' | 'admin' | 'billing_staff' | 'billing_viewer' | 'super_admin';
  clinicId?: string;
  providerId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role?: 'provider' | 'office_staff' | 'admin' | 'billing_staff' | 'billing_viewer' | 'super_admin', clinicId?: string, providerId?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const isLoadingProfile = useRef(false);
  const hasInitialized = useRef(false);

  // Check for existing session on mount and subscribe to auth state once
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking existing session on mount...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check result:', session ? 'Session found' : 'No session', session?.user?.email);
        
        if (session?.user) {
          // Only proceed if email is confirmed
          if (session.user.email_confirmed_at) {
            console.log('Session exists and email confirmed, loading profile...');
            if (!isLoadingProfile.current) {
              isLoadingProfile.current = true;
              try {
                await loadUserProfile(session.user);
              } catch (error) {
                console.error('Error loading profile during session check:', error);
                setLoading(false);
                isLoadingProfile.current = false;
              }
            } else {
              console.log('Profile already loading during session check, skipping');
              setLoading(false);
            }
          } else {
            console.log('Session exists but email not confirmed, not authenticating');
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
          }
        } else {
          console.log('No existing session found');
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false);
        isLoadingProfile.current = false;
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Session check timeout - setting loading to false');
      setLoading(false);
      isLoadingProfile.current = false;
    }, 10000); // 10 second timeout

    checkSession().finally(() => {
      clearTimeout(timeoutId);
      hasInitialized.current = true;
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email, 'Email confirmed:', session?.user?.email_confirmed_at);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Only proceed if email is confirmed
        if (session.user.email_confirmed_at) {
          if (!isLoadingProfile.current) {
            console.log('Starting profile load for signed in user');
            isLoadingProfile.current = true;
            setLoading(true);
            await loadUserProfile(session.user);
          } else {
            console.log('Profile already loading, skipping');
          }
        } else {
          console.log('User signed in but email not confirmed, not authenticating');
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        isLoadingProfile.current = false;
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token was refreshed, ensure user profile is still loaded
        if (!user && !isLoadingProfile.current) {
          console.log('Token refreshed, loading profile');
          isLoadingProfile.current = true;
          setLoading(true);
          await loadUserProfile(session.user);
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        // Handle password recovery
        console.log('Password recovery initiated');
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
      // Reset the refs when component unmounts
      isLoadingProfile.current = false;
      hasInitialized.current = false;
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    let profileTimeout: NodeJS.Timeout | undefined;
    
    try {
      console.log('Loading user profile for:', supabaseUser.email);
      
      // Add timeout to prevent infinite loading
      profileTimeout = setTimeout(() => {
        console.warn('Profile loading timeout - setting loading to false');
        setLoading(false);
        isLoadingProfile.current = false;
      }, 15000); // 15 second timeout
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();
        
      clearTimeout(profileTimeout);

      if (error) {
        console.error('Error loading user profile:', error);
        
        // If profile doesn't exist yet (new user) or permission denied, check if email is confirmed
        if (error.code === 'PGRST116' || error.message.includes('No rows found') || error.code === '42501') {
          console.log('User profile not found or permission denied, checking email confirmation status');
          
          // Only authenticate if email is confirmed
          if (supabaseUser.email_confirmed_at) {
            const tempUser: User = {
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: supabaseUser.user_metadata?.name || (supabaseUser.email ? supabaseUser.email.split('@')[0] : 'User'),
              role: (supabaseUser.user_metadata?.role as User['role']) || 'provider',
              clinicId: undefined,
              providerId: undefined
            };
            setUser(tempUser);
            setIsAuthenticated(true);
            console.log('Temp user created successfully:', tempUser.email, tempUser.role);
          } else {
            // Email not confirmed, don't authenticate
            console.log('Email not confirmed, user must verify email first');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
        
        setLoading(false);
        isLoadingProfile.current = false;
        return;
      }

      if (profile) {
        const user: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          clinicId: profile.clinic_id,
          providerId: profile.provider_id
        };
        setUser(user);
        setIsAuthenticated(true);
        setLoading(false);
        isLoadingProfile.current = false;
        console.log('User profile loaded successfully:', user.email, user.role);
      } else {
        // No profile found, set loading to false
        setLoading(false);
        isLoadingProfile.current = false;
        console.log('No profile found for user');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Always set loading to false on error to prevent infinite loading
      setLoading(false);
      isLoadingProfile.current = false;
    } finally {
      // Clear timeout in finally block to ensure it's always cleared
      if (profileTimeout) {
        clearTimeout(profileTimeout);
      }
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Do not flip global loading here to avoid full-screen overlay on failures
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          setLoading(false);
          return { success: false, error: 'Please check your email and click the confirmation link to activate your account.' };
        } else if (error.message.includes('Invalid login credentials')) {
          setLoading(false);
          return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' };
        } else if (error.message.includes('Too many requests')) {
          setLoading(false);
          return { success: false, error: 'Too many login attempts. Please wait a moment before trying again.' };
        } else if (error.message.includes('User not found')) {
          setLoading(false);
          return { success: false, error: 'No account found with this email address. Please sign up first.' };
        } else if (error.message.includes('Invalid email')) {
          setLoading(false);
          return { success: false, error: 'Please enter a valid email address.' };
        } else if (error.message.includes('Password should be at least')) {
          setLoading(false);
          return { success: false, error: 'Password is too short. Please enter a stronger password.' };
        }
        
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Check if email is confirmed
        if (!data.user.email_confirmed_at) {
          setLoading(false);
          return { success: false, error: 'Please check your email and click the confirmation link to activate your account.' };
        }
        
        // The onAuthStateChange handler will handle loading state and profile loading
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Login failed. Please try again.' };
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return { success: false, error: 'An unexpected error occurred. Please try again later.' };
    }
  };

  const signup = async (email: string, password: string, name: string, role: User['role'] = 'provider', clinicId?: string, providerId?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        
        // Handle specific error cases
        if (error.message.includes('User already registered')) {
          return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
        } else if (error.message.includes('Password should be at least')) {
          return { success: false, error: 'Password must be at least 6 characters long.' };
        } else if (error.message.includes('Invalid email') || error.message.includes('email_address_invalid')) {
          return { success: false, error: 'Please enter a valid email address. Make sure it\'s a real email address from a valid domain.' };
        } else if (error.message.includes('Password is too weak')) {
          return { success: false, error: 'Password is too weak. Please choose a stronger password.' };
        } else if (error.message.includes('Signup is disabled')) {
          return { success: false, error: 'New account registration is currently disabled. Please contact support.' };
        } else if (error.message.includes('Email rate limit exceeded')) {
          return { success: false, error: 'Too many signup attempts. Please wait a moment before trying again.' };
        }
        
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create user profile explicitly
        try {
          console.log('Creating user profile for:', data.user.email);
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              role: (data.user.user_metadata?.role as User['role']) || 'provider',
              clinic_id: clinicId || null,
              provider_id: providerId || null
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Try to create profile with minimal data if the first attempt fails
            const { error: retryError } = await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                email: data.user.email || '',
                name: data.user.email?.split('@')[0] || 'User',
                role: 'provider',
                clinic_id: clinicId || null,
                provider_id: providerId || null
              });
            
            if (retryError) {
              console.error('Retry also failed:', retryError);
            } else {
              console.log('User profile created successfully on retry');
            }
          } else {
            console.log('User profile created successfully');
          }
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't fail signup if profile creation fails
        }

        // Check if email is confirmed
        if (!data.user.email_confirmed_at) {
          // Email not confirmed, don't authenticate user yet
          setUser(null);
          setIsAuthenticated(false);
          return { success: true };
        }
        
        // Email is confirmed, proceed with authentication
        await loadUserProfile(data.user);
        return { success: true };
      }

      return { success: false, error: 'Signup failed. Please try again.' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again later.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      isLoadingProfile.current = false;
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Password reset error:', error);
        
        // Handle specific error cases
        if (error.message.includes('User not found')) {
          return { success: false, error: 'No account found with this email address. Please check your email or sign up first.' };
        } else if (error.message.includes('Invalid email')) {
          return { success: false, error: 'Please enter a valid email address.' };
        } else if (error.message.includes('Email rate limit exceeded')) {
          return { success: false, error: 'Too many password reset attempts. Please wait a moment before trying again.' };
        } else if (error.message.includes('Password reset is disabled')) {
          return { success: false, error: 'Password reset is currently disabled. Please contact support.' };
        }
        
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again later.' };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Password should be at least')) {
          return { success: false, error: 'Password must be at least 6 characters long.' };
        } else if (error.message.includes('Password is too weak')) {
          return { success: false, error: 'Password is too weak. Please choose a stronger password.' };
        } else if (error.message.includes('Invalid password')) {
          return { success: false, error: 'Invalid password format. Please choose a different password.' };
        } else if (error.message.includes('User not found')) {
          return { success: false, error: 'User session expired. Please sign in again.' };
        }
        
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again later.' };
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        return { success: false, error: error.message };
      }

      if (data.session?.user) {
        if (!isLoadingProfile.current) {
          isLoadingProfile.current = true;
          await loadUserProfile(data.session.user);
        }
        return { success: true };
      }

      return { success: false, error: 'No session found' };
    } catch (error) {
      console.error('Session refresh error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading, 
      login, 
      signup, 
      logout, 
      resetPassword, 
      updatePassword,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}