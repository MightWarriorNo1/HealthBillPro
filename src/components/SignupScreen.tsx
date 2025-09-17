import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, Building2, User, UserCheck, ArrowRight, 
  ArrowLeft, CheckCircle, AlertCircle, Loader2, Rocket, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface SignupScreenProps {
  onBackToLogin?: () => void;
}

function SignupScreen({ onBackToLogin }: SignupScreenProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'provider' as 'provider' | 'office_staff' | 'admin' | 'billing_staff',
    clinicName: '',
    clinicId: '',
    providerId: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { signup, loading } = useAuth();
  const { clinics, providers } = useData();

  const totalSteps = 3;

  // Persist success state to prevent it from being reset
  useEffect(() => {
    const savedSuccess = localStorage.getItem('signupSuccess');
    if (savedSuccess === 'true') {
      setSuccess(true);
    }
  }, []);

  // Save success state to localStorage
  useEffect(() => {
    if (success) {
      localStorage.setItem('signupSuccess', 'true');
    } else {
      localStorage.removeItem('signupSuccess');
    }
  }, [success]);

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

  // Reset provider selection when clinic changes
  useEffect(() => {
    if (formData.clinicId) {
      setFormData(prev => ({ ...prev, providerId: '' }));
    }
  }, [formData.clinicId]);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.email.trim() && formData.role;
      case 2:
        return formData.password.length >= 6 && formData.password === formData.confirmPassword;
      case 3:
        return formData.clinicId && formData.providerId && formData.agreeToTerms;
      default:
        return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // More comprehensive email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password.length > 72) {
      setError('Password is too long. Maximum 72 characters allowed');
      return;
    }

    const result = await signup(formData.email, formData.password, formData.name, formData.role, formData.clinicId, formData.providerId);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Signup failed. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(34, 197, 94, 0.15) 0%, transparent 50%)`
            }}
          ></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        </div>

        <div className="relative max-w-md w-full z-10">
          <div className={`transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 group-hover:border-white/30 transition-all duration-500">
                
                {/* Success Header */}
                <div className="px-8 py-12 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-2xl opacity-75"></div>
                    <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center">
                      <UserCheck className="text-white" size={48} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-white mb-3">Account Created!</h1>
                  <p className="text-white/80 text-lg">Please check your email to verify your account</p>
            </div>

                {/* Success Content */}
                <div className="px-8 pb-8 text-center">
                  <p className="text-white/80 mb-8 leading-relaxed">
                    We've sent a verification link to <span className="text-green-300 font-semibold">{formData.email}</span>. 
                Please check your email and click the link to activate your account.
              </p>
                  
              <button
                onClick={() => {
                  setSuccess(false);
                  localStorage.removeItem('signupSuccess');
                  onBackToLogin?.();
                }}
                    className="group relative w-full px-8 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-green-500/25 transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      <span>Back to Login</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="relative max-w-lg w-full z-10">
        <div className={`transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Main Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 group-hover:border-white/30 transition-all duration-500">
              
          {/* Header */}
              <div className="px-8 py-8 text-center border-b border-white/10">
            {onBackToLogin && (
              <button
                onClick={onBackToLogin}
                    className="absolute top-6 left-6 text-white/80 hover:text-white transition-all duration-300 hover:scale-110"
              >
                    <ArrowLeft className="w-6 h-6" />
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

                <h1 className="text-3xl font-bold text-white mb-3">Create Account</h1>
                <p className="text-white/80 text-lg">Join the Healthcare Billing System</p>
                
                {/* Progress Steps */}
                <div className="flex items-center justify-center space-x-4 mt-8">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        step <= currentStep 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                          : 'bg-white/20 text-white/60'
                      }`}>
                        {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                      </div>
                      {step < 3 && (
                        <div className={`w-8 h-0.5 mx-2 transition-all duration-300 ${
                          step < currentStep ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/20'
                        }`}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step 1: Basic Information */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Basic Information</h2>
                        <p className="text-white/70">Tell us about yourself</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="name" className="block text-sm font-medium text-white/90">
                  Full Name
                </label>
                          <div className="relative group/input">
                            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm transition-all duration-300 ${focusedField === 'name' ? 'opacity-100' : 'opacity-0'}`}></div>
                            <div className="relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300">
                              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full bg-transparent px-12 py-4 text-white placeholder-white/60 focus:outline-none"
                    placeholder="Enter your full name"
                    required
                  />
                            </div>
                </div>
              </div>

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
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full bg-transparent px-12 py-4 text-white placeholder-white/60 focus:outline-none"
                    placeholder="Enter your email"
                    required
                  />
                            </div>
                </div>
              </div>

                        <div className="space-y-2">
                          <label htmlFor="role" className="block text-sm font-medium text-white/90">
                  Role
                </label>
                          <div className="relative group/input">
                            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm transition-all duration-300 ${focusedField === 'role' ? 'opacity-100' : 'opacity-0'}`}></div>
                            <div className="relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300">
                              <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                                onFocus={() => setFocusedField('role')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full bg-transparent px-12 py-4 text-white focus:outline-none appearance-none"
                                required
                              >
                                <option value="provider" className="bg-slate-800 text-white">Healthcare Provider</option>
                                <option value="office_staff" className="bg-slate-800 text-white">Office Staff</option>
                                <option value="billing_staff" className="bg-slate-800 text-white">Billing Staff</option>
                                <option value="admin" className="bg-slate-800 text-white">Administrator</option>
                </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Security */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Security Setup</h2>
                        <p className="text-white/70">Create a secure password</p>
              </div>

                      <div className="space-y-4">
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
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full bg-transparent px-12 py-4 pr-12 text-white placeholder-white/60 focus:outline-none"
                    placeholder="Create a password"
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
                          {formData.password && (
                            <div className="text-xs text-white/60">
                              Password strength: {formData.password.length >= 8 ? 'Strong' : formData.password.length >= 6 ? 'Medium' : 'Weak'}
                            </div>
                          )}
              </div>

                        <div className="space-y-2">
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90">
                  Confirm Password
                </label>
                          <div className="relative group/input">
                            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm transition-all duration-300 ${focusedField === 'confirmPassword' ? 'opacity-100' : 'opacity-0'}`}></div>
                            <div className="relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300">
                              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                                onFocus={() => setFocusedField('confirmPassword')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full bg-transparent px-12 py-4 pr-12 text-white placeholder-white/60 focus:outline-none"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                          </div>
                          {formData.confirmPassword && (
                            <div className={`text-xs ${formData.password === formData.confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                              {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Practice Information */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Practice Information</h2>
                        <p className="text-white/70">Select your clinic and provider</p>
              </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="clinicId" className="block text-sm font-medium text-white/90">
                            Select Clinic
                          </label>
                          <div className="relative group/input">
                            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm transition-all duration-300 ${focusedField === 'clinicId' ? 'opacity-100' : 'opacity-0'}`}></div>
                            <div className="relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300">
                              <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
                              <select
                                id="clinicId"
                                name="clinicId"
                                value={formData.clinicId}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('clinicId')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full bg-transparent px-12 py-4 text-white focus:outline-none appearance-none"
                                required
                              >
                                <option value="" className="bg-slate-800 text-white">Select a clinic</option>
                                {clinics.filter(clinic => clinic.active).map(clinic => (
                                  <option key={clinic.id} value={clinic.id} className="bg-slate-800 text-white">
                                    {clinic.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="providerId" className="block text-sm font-medium text-white/90">
                            Select Provider
                          </label>
                          <div className="relative group/input">
                            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm transition-all duration-300 ${focusedField === 'providerId' ? 'opacity-100' : 'opacity-0'}`}></div>
                            <div className="relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300">
                              <Stethoscope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
                              <select
                                id="providerId"
                                name="providerId"
                                value={formData.providerId}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('providerId')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full bg-transparent px-12 py-4 text-white focus:outline-none appearance-none"
                                required
                              >
                                <option value="" className="bg-slate-800 text-white">Select a provider</option>
                                {providers
                                  .filter(provider => provider.active && (!formData.clinicId || provider.clinicId === formData.clinicId))
                                  .map(provider => (
                                    <option key={provider.id} value={provider.id} className="bg-slate-800 text-white">
                                      {provider.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <input
                              id="agreeToTerms"
                              name="agreeToTerms"
                              type="checkbox"
                              checked={formData.agreeToTerms}
                              onChange={handleInputChange}
                              className="mt-1 w-5 h-5 text-blue-600 bg-transparent border-2 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <label htmlFor="agreeToTerms" className="text-sm text-white/80 leading-relaxed">
                              I agree to the <span className="text-blue-300 hover:text-blue-200 cursor-pointer">Terms of Service</span> and <span className="text-blue-300 hover:text-blue-200 cursor-pointer">Privacy Policy</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
              {error && (
                    <div className="flex items-center space-x-3 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl text-red-300">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                </div>
              )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-6">
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        currentStep === 1
                          ? 'text-white/40 cursor-not-allowed'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Previous</span>
                    </button>

                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        disabled={!canProceedToNextStep()}
                        className="group relative px-8 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-xl hover:shadow-purple-500/25 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="flex items-center space-x-2">
                          <span>Next</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                    ) : (
              <button
                type="submit"
                        disabled={loading || !canProceedToNextStep()}
                        className="group relative px-8 py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-xl hover:shadow-green-500/25 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <div className="flex items-center space-x-2">
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Rocket className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          )}
                          <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
                    )}
                  </div>
            </form>

                {/* Login Link */}
                <div className="mt-8 text-center">
                  <p className="text-white/70 mb-4">
                    Already have an account?
                  </p>
                <button
                  onClick={onBackToLogin}
                    className="group inline-flex items-center space-x-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30"
                >
                    <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Sign In</span>
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

export default SignupScreen;
