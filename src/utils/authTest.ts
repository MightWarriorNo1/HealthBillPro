// Simple authentication test utilities
import { supabase } from '../lib/supabase';

export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection test passed');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};

export const testUserProfileTable = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('User profiles table test failed:', error);
      return false;
    }
    console.log('User profiles table test passed');
    return true;
  } catch (error) {
    console.error('User profiles table test error:', error);
    return false;
  }
};

export const runAuthTests = async (): Promise<{ connection: boolean; userProfiles: boolean }> => {
  console.log('Running authentication tests...');
  
  const connection = await testSupabaseConnection();
  const userProfiles = await testUserProfileTable();
  
  console.log('Authentication tests completed:', { connection, userProfiles });
  
  return { connection, userProfiles };
};
