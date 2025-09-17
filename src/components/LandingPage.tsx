import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Shield, Users, FileText, Clock, 
  CheckCircle, ArrowRight, Lock, Database, BarChart3,
  Zap, Globe, Award, Play, ChevronRight, Check, Phone, Mail,
  MapPin, Heart, Sparkles, TrendingUp, 
  Activity, Brain, Rocket
} from 'lucide-react';
import Logo from './Logo';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

function LandingPage({ onGetStarted, onSignIn, onSignUp }: LandingPageProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const features = [
    {
      icon: Users,
      title: "Provider Portal",
      description: "Secure, intuitive interface for healthcare providers to manage billing entries with spreadsheet-like familiarity.",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop&crop=center",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Role-Based Security",
      description: "Multi-level access control ensuring providers see only their data while admins have full system oversight.",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop&crop=center",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Building2,
      title: "Multi-Clinic Support",
      description: "Manage multiple clinics with separate providers, billing records, and customized permissions.",
      image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600&h=400&fit=crop&crop=center",
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: FileText,
      title: "Claims Management",
      description: "Comprehensive tracking and follow-up system for billing claims with automated issue detection.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop&crop=center",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Reporting",
      description: "Visual dashboards and detailed reports with Excel/PDF export capabilities for stakeholders.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&crop=center",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: Clock,
      title: "Timecard Integration",
      description: "Built-in timecard functionality for billing employees with automated payroll calculations.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&crop=center",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Streamlined Workflow",
      description: "Reduce billing errors and processing time by up to 75% with automated validations and workflows."
    },
    {
      icon: Lock,
      title: "HIPAA Compliant",
      description: "Enterprise-grade security with encrypted data storage and comprehensive audit trails."
    },
    {
      icon: Database,
      title: "Centralized Data",
      description: "All billing information in one secure location with real-time synchronization across all users."
    },
    {
      icon: Globe,
      title: "Cloud-Based Access",
      description: "Access your billing system from anywhere with internet connectivity and automatic backups."
    }
  ];


  const stats = [
    { number: "500+", label: "Healthcare Providers", icon: Users },
    { number: "1M+", label: "Claims Processed", icon: FileText },
    { number: "99.9%", label: "Uptime Guarantee", icon: Shield },
    { number: "75%", label: "Time Savings", icon: Clock }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Revolutionary Header with Glassmorphism */}
      <header className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/10 backdrop-blur-xl shadow-2xl border-b border-white/20' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Logo size={40} />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                HealthBill Pro
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                className="text-white/80 hover:text-white transition-all duration-300 hover:scale-105 px-4 py-2 rounded-lg hover:bg-white/10" 
                onClick={onSignIn}
              >
                Sign In
              </button>
              <button
                onClick={onSignUp}
                className="group relative px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Revolutionary Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Dynamic Background with Mouse Parallax */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`
          }}
        ></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Orbs */}
          <div className={`absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse ${isLoaded ? 'animate-bounce' : ''}`}></div>
          <div className={`absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-lg animate-pulse ${isLoaded ? 'animate-bounce' : ''}`} style={{ animationDelay: '1s' }}></div>
          <div className={`absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-lg animate-pulse ${isLoaded ? 'animate-bounce' : ''}`} style={{ animationDelay: '2s' }}></div>
          <div className={`absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-r from-pink-400/20 to-red-400/20 rounded-full blur-md animate-pulse ${isLoaded ? 'animate-bounce' : ''}`} style={{ animationDelay: '3s' }}></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content with Revolutionary Design */}
            <div className={`space-y-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {/* Trust Badge */}
              <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <Heart className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-white/90">Trusted by 500+ Healthcare Providers</span>
                </div>
                <Sparkles className="w-4 h-4 text-yellow-400 ml-2 group-hover:rotate-12 transition-transform" />
              </div>
              
              {/* Main Headline */}
              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block text-white mb-4">Revolutionize</span>
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                  Healthcare Billing
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl text-white/80 leading-relaxed max-w-2xl">
                Experience the future of healthcare billing with our revolutionary platform. 
                <span className="text-blue-300 font-semibold"> Reduce errors by 95%</span>, 
                <span className="text-purple-300 font-semibold"> save 20+ hours weekly.</span>
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6">
                <button
                  onClick={onSignUp}
                  className="group relative px-10 py-5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-2 transition-all duration-300 flex items-center justify-center space-x-3 overflow-hidden"
                >
                  <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
                
                <button className="group relative px-10 py-5 bg-white/10 backdrop-blur-xl text-white rounded-2xl font-bold text-xl border-2 border-white/30 hover:border-white/50 hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-3">
                  <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Watch Demo</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-8 text-sm text-white/70">
                <div className="flex items-center space-x-2 group">
                  <Check className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-white transition-colors">30-day free trial</span>
                </div>
                <div className="flex items-center space-x-2 group">
                  <Check className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-white transition-colors">No credit card required</span>
                </div>
                <div className="flex items-center space-x-2 group">
                  <Shield className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-white transition-colors">HIPAA compliant</span>
                </div>
              </div>
            </div>
            
            {/* Right Content - Revolutionary Dashboard Mockup */}
            <div className={`relative transform transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {/* Main Dashboard Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl group-hover:shadow-purple-500/10 transition-all duration-500 transform group-hover:scale-105">
                  {/* Browser Header */}
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-lg px-4 py-2">
                      <div className="text-sm text-white/70">HealthBill Pro Dashboard</div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="space-y-6">
                    {/* Header Stats */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-white">Revenue Analytics</h3>
                      <div className="flex items-center space-x-2 text-green-400">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-semibold">+24.5%</span>
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold text-white mb-1">$127,450</div>
                        <div className="text-sm text-white/70">Monthly Revenue</div>
                        <div className="flex items-center mt-2 text-green-400">
                          <ArrowRight className="w-4 h-4 rotate-90" />
                          <span className="text-xs ml-1">+12.3%</span>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold text-white mb-1">99.2%</div>
                        <div className="text-sm text-white/70">Claim Success</div>
                        <div className="flex items-center mt-2 text-green-400">
                          <ArrowRight className="w-4 h-4 rotate-90" />
                          <span className="text-xs ml-1">+2.1%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chart Area */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 h-32 flex items-center justify-center">
                      <div className="flex items-end space-x-2">
                        {[40, 60, 45, 80, 65, 90, 75].map((height, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-t from-blue-400 to-purple-400 rounded-t w-6 animate-pulse"
                            style={{ height: `${height}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Feature Cards */}
              <div className="absolute -top-6 -right-6 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl transform -rotate-12 hover:rotate-0 transition-all duration-500 group">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <Activity className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-white">Live Analytics</span>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl transform rotate-12 hover:rotate-0 transition-all duration-500 group">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-white">Secure</span>
                </div>
              </div>
              
              <div className="absolute top-1/2 -left-8 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl transform -rotate-6 hover:rotate-0 transition-all duration-500 group">
                <div className="flex items-center space-x-3">
                  <Brain className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-white">AI Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary Features Section */}
      <section id="features" className="relative py-32 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full text-white font-medium text-sm mb-8 border border-white/20 group">
              <Sparkles className="w-5 h-5 mr-3 text-yellow-400 group-hover:rotate-12 transition-transform" />
              Revolutionary Features
              <div className="ml-3 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-6xl lg:text-7xl font-bold text-white mb-8">
              Next-Generation
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Healthcare Billing
              </span>
            </h2>
            <p className="text-xl text-white/80 max-w-4xl mx-auto leading-relaxed">
              Experience the future of healthcare billing with our platform. 
              <span className="text-blue-300 font-semibold"> Revolutionary features</span> that transform how you manage billing, 
              <span className="text-purple-300 font-semibold"> maximize revenue</span>, and 
              <span className="text-pink-300 font-semibold"> ensure compliance</span> across your entire practice.
            </p>
          </div>
          
          {/* Revolutionary Interactive Feature Tabs */}
          <div className="mb-24">
            <div className="flex flex-wrap justify-center gap-6 mb-16">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`group relative px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-500 transform hover:scale-105 ${
                    activeFeature === index
                      ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/25'
                      : 'bg-white/10 backdrop-blur-xl text-white/80 hover:text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <span className="relative z-10">{feature.title}</span>
                  {activeFeature === index && (
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                  <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              ))}
            </div>
            
            {/* Revolutionary Active Feature Display */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 group-hover:border-white/30 transition-all duration-500">
              <div className="grid lg:grid-cols-2 gap-0">
                  <div className="p-16">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-r ${features[activeFeature].color} mb-8 group-hover:scale-110 transition-transform duration-300`}>
                    {React.createElement(features[activeFeature].icon, { className: "text-white", size: 40 })}
                  </div>
                    <h3 className="text-4xl font-bold text-white mb-8 group-hover:text-blue-300 transition-colors">{features[activeFeature].title}</h3>
                    <p className="text-xl text-white/80 leading-relaxed mb-10 group-hover:text-white/90 transition-colors">{features[activeFeature].description}</p>
                    <div className="flex items-center text-blue-400 font-semibold text-lg group cursor-pointer">
                      <span>Explore Feature</span>
                      <ChevronRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
                <div className="relative overflow-hidden">
                  <img
                    src={features[activeFeature].image}
                    alt={features[activeFeature].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/20 transition-all duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Revolutionary Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-white/30 transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-purple-500/10">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                  <feature.icon className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">{feature.title}</h3>
                  <p className="text-white/80 leading-relaxed group-hover:text-white/90 transition-colors">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revolutionary Benefits Section */}
      <section className="relative py-32 bg-gradient-to-br from-slate-800 via-purple-800 to-slate-800 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full text-white font-medium text-sm mb-8 border border-white/20 group">
              <CheckCircle className="w-5 h-5 mr-3 text-green-400 group-hover:scale-110 transition-transform" />
              Why Choose Us
              <div className="ml-3 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-6xl lg:text-7xl font-bold text-white mb-8">
              Why Healthcare Providers
              <span className="block bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Choose HealthBill Pro
              </span>
            </h2>
            <p className="text-xl text-white/80 max-w-4xl mx-auto leading-relaxed">
              Join thousands of healthcare providers who trust our revolutionary platform to 
              <span className="text-green-300 font-semibold"> streamline billing operations</span>, 
              <span className="text-blue-300 font-semibold"> maximize revenue potential</span>, and 
              <span className="text-purple-300 font-semibold"> ensure compliance</span> across their entire practice.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {benefits.map((benefit, index) => (
              <div key={index} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-white/30 transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-green-500/10">
                <div className="flex items-start space-x-6">
                    <div className="bg-gradient-to-r from-green-400/20 to-blue-400/20 p-6 rounded-3xl flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 border border-white/20">
                      <benefit.icon className="text-green-400" size={40} />
                  </div>
                  <div className="flex-1">
                      <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-green-300 transition-colors">{benefit.title}</h3>
                      <p className="text-white/80 leading-relaxed text-lg group-hover:text-white/90 transition-colors">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Revolutionary Stats Section */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-16 border border-white/20 shadow-2xl group-hover:shadow-purple-500/10 transition-all duration-500">
              <div className="text-center mb-16">
                <h3 className="text-4xl font-bold text-white mb-6">Trusted by Healthcare Professionals</h3>
                <p className="text-xl text-white/80">Numbers that speak for themselves</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                  <div key={index} className="text-center group/stat">
                    <div className="bg-gradient-to-r from-blue-400/20 to-purple-400/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover/stat:scale-110 group-hover/stat:rotate-12 transition-all duration-300 border border-white/20">
                      <stat.icon className="text-blue-400" size={40} />
                    </div>
                    <div className="text-5xl font-bold text-white mb-3 group-hover/stat:text-blue-300 transition-colors">{stat.number}</div>
                    <div className="text-white/80 font-medium text-lg group-hover/stat:text-white transition-colors">{stat.label}</div>
                  </div>
                ))}
                </div>
            </div>
          </div>
        </div>
      </section>


      

      {/* Revolutionary CTA Section */}
      <section className="py-32 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-16 border border-white/20 shadow-2xl group-hover:shadow-purple-500/10 transition-all duration-500">
              <div className="relative">
                <Award className="text-white mx-auto mb-8 group-hover:scale-110 transition-transform duration-300" size={80} />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
            </div>
              <h2 className="text-6xl lg:text-7xl font-bold text-white mb-8 group-hover:text-blue-300 transition-colors">
                Ready to Transform
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Your Billing?
              </span>
            </h2>
              <p className="text-2xl text-white/80 mb-12 leading-relaxed max-w-4xl mx-auto group-hover:text-white/90 transition-colors">
                Join thousands of healthcare providers who have revolutionized their billing process and 
                <span className="text-blue-300 font-semibold"> increased revenue by 40%</span> with HealthBill Pro.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <button
                onClick={onGetStarted}
                  className="group relative px-12 py-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-2xl shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-2 transition-all duration-300 flex items-center justify-center space-x-4 overflow-hidden"
                >
                  <Rocket className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                  <span>Start Your Free Trial</span>
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
                <button className="group relative px-12 py-6 bg-white/10 backdrop-blur-xl text-white rounded-2xl font-bold text-2xl border-2 border-white/30 hover:border-white/50 hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-4">
                  <Play className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span>Watch Demo</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-8 text-lg text-white/70">
                <div className="flex items-center space-x-3 group">
                  <Check className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-white transition-colors">30-day free trial</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <Check className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-white transition-colors">No setup fees</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <Check className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-white transition-colors">Cancel anytime</span>
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 z-10">
          
          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-white/60 text-sm mb-4 md:mb-0">
                &copy; 2025 HealthBill Pro. All rights reserved. 
                <span className="text-blue-300 font-semibold"> HIPAA Compliant</span> Healthcare Billing Solution.
              </p>
              <div className="flex space-x-8 text-sm text-white/60">
                <span className="hover:text-white transition-colors cursor-pointer group flex items-center">
                  Privacy Policy
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="hover:text-white transition-colors cursor-pointer group flex items-center">
                  Terms of Service
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="hover:text-white transition-colors cursor-pointer group flex items-center">
                  Cookie Policy
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;