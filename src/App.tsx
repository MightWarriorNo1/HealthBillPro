import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import PasswordResetScreen from './components/PasswordResetScreen';
import ProviderDashboard from './components/ProviderDashboard';
import OfficeStaffDashboard from './components/OfficeStaffDashboard';
import AdminDashboard from './components/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

function AppRoutes() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | 'reset'>('login');

  // Show loading spinner while checking authentication
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

  // If user is authenticated, show their dashboard
  if (isAuthenticated && user) {
    return (
      <Routes>
        <Route 
          path="/" 
          element={
            user.role === 'super_admin' ? <SuperAdminDashboard /> :
            user.role === 'admin' ? <AdminDashboard /> :
            user.role === 'office_staff' ? <OfficeStaffDashboard /> :
            user.role === 'billing_staff' ? <OfficeStaffDashboard /> :
            user.role === 'billing_viewer' ? <ProviderDashboard /> :
            user.role === 'provider' ? <ProviderDashboard /> :
            <Navigate to="/" />
          } 
        />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // Show landing page first, then login if not authenticated
  if (showLanding) {
    return (
      <LandingPage 
        onGetStarted={() => setShowLanding(false)}
        onSignIn={() => { setShowLanding(false); setAuthScreen('login'); }}
        onSignUp={() => { setShowLanding(false); setAuthScreen('signup'); }}
      />
    );
  }

  // Show authentication screens
  switch (authScreen) {
    case 'signup':
      return (
        <SignupScreen 
          onBackToLogin={() => setAuthScreen('login')} 
        />
      );
    case 'reset':
      return (
        <PasswordResetScreen 
          onBackToLogin={() => setAuthScreen('login')} 
        />
      );
    default:
      return (
        <LoginScreen 
          onBackToLanding={() => setShowLanding(true)}
          onShowSignup={() => setAuthScreen('signup')}
          onShowPasswordReset={() => setAuthScreen('reset')}
        />
      );
  }
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="min-h-screen bg-white">
            <AppRoutes />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#0ea5e9',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981',
                    color: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#ef4444',
                    color: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;