import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

interface PasswordResetScreenProps {
  onBackToLogin?: () => void;
}

function PasswordResetScreen({ onBackToLogin }: PasswordResetScreenProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    const result = await resetPassword(email);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to send reset email. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-8 text-center">
              <CheckCircle className="mx-auto mb-3 text-white" size={48} />
              <h1 className="text-2xl font-bold text-white mb-2">Reset Email Sent!</h1>
              <p className="text-green-100">Check your email for reset instructions</p>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>. 
                Please check your email and follow the instructions to reset your password.
              </p>
              <button
                onClick={onBackToLogin}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-blue-50 to-light-red-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-light-blue-500 to-light-red-500 px-6 py-8 text-center">
            {onBackToLogin && (
              <button
                onClick={onBackToLogin}
                className="absolute top-4 left-4 text-white hover:text-white/80 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex justify-center mb-4">
              <img 
                src="/Logo.png" 
                alt="HealthBill Pro Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-white/80">Enter your email to receive reset instructions</p>
          </div>

          {/* Reset Form */}
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-light-red-50 border border-light-red-200 rounded-lg text-light-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary focus:ring-2 focus:ring-light-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending Reset Email...' : 'Send Reset Email'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <button
                  onClick={onBackToLogin}
                  className="text-light-blue-600 hover:text-light-blue-700 font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetScreen;
