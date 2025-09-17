import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, Shield, 
  CheckCircle, AlertCircle, Loader2, User, Key, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

interface LoginScreenProps {
  onBackToLanding?: () => void;
  onShowSignup?: () => void;
  onShowPasswordReset?: () => void;
}

function LoginScreen({ onBackToLanding, onShowSignup, onShowPasswordReset }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login, loading } = useAuth();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Invalid email or password');
    }
    setSubmitting(false);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`
          }}
        ></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse ${isLoaded ? 'animate-bounce' : ''}`}></div>
        <div className={`absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-lg animate-pulse ${isLoaded ? 'animate-bounce' : ''}`} style={{ animationDelay: '1s' }}></div>
        <div className={`absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-lg animate-pulse ${isLoaded ? 'animate-bounce' : ''}`} style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-md w-full z-10">
        <div className={`transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Main Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 group-hover:border-white/30 transition-all duration-500">
              
              {/* Header */}
              <div className="relative px-8 py-12 text-center">
                {onBackToLanding && (
                  <button
                    onClick={onBackToLanding}
                    className="absolute top-6 left-6 text-white/80 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <ArrowRight className="w-6 h-6 rotate-180" />
                  </button>
                )}
                
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-75"></div>
                    <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                      <img 
                        src="/Logo.png" 
                        alt="HealthBill Pro Logo" 
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-3">Welcome Back</h1>
                <p className="text-white/80 text-lg">Sign in to your healthcare billing portal</p>
                
                {/* Trust Indicators */}
                <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-white/70">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span>HIPAA Compliant</span>
                  </div>
                </div>
              </div>

              {/* Login Form */}
              <div className="px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-white/90">
                      Email Address
                    </label>
                    <div className="relative group/input">
                      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm transition-all duration-300 ${focusedField === 'email' ? 'opacity-100' : 'opacity-0'}`}></div>
                      <div className="relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full bg-transparent px-12 py-4 text-white placeholder-white/60 focus:outline-none"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-white/90">
                      Password
                    </label>
                    <div className="relative group/input">
                      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm transition-all duration-300 ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'}`}></div>
                      <div className="relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full bg-transparent px-12 py-4 pr-12 text-white placeholder-white/60 focus:outline-none"
                          placeholder="Enter your password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center space-x-3 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl text-red-300">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group relative w-full px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      {submitting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Zap className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      )}
                      <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
                      {!submitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>

                  {/* Forgot Password */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={onShowPasswordReset}
                      className="text-sm text-white/70 hover:text-white transition-colors group flex items-center justify-center space-x-2 mx-auto"
                    >
                      <Key className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Forgot your password?</span>
                    </button>
                  </div>
                </form>

                {/* Signup Link */}
                <div className="mt-8 text-center">
                  <p className="text-white/70 mb-4">
                    Don't have an account?
                  </p>
                  <button
                    onClick={onShowSignup}
                    className="group inline-flex items-center space-x-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30"
                  >
                    <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;