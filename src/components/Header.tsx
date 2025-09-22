import { LogOut, User, Shield, Building2, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

interface HeaderProps {
  title: string;
  subtitle: string;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

function Header({ title, subtitle, onMenuToggle, isMenuOpen }: HeaderProps) {
  const { user, logout } = useAuth();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="h-5 w-5 text-red-600" />;
      case 'admin':
        return <Building2 className="h-5 w-5 text-red-500" />;
      case 'office_staff':
      case 'billing_staff':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'provider':
      case 'billing_viewer':
        return <User className="h-5 w-5 text-green-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'office_staff':
        return 'Office Staff';
      case 'billing_staff':
        return 'Billing Staff';
      case 'provider':
        return 'Provider';
      case 'billing_viewer':
        return 'Billing Viewer';
      default:
        return 'User';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 w-full z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile menu button */}
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            
            {/* Desktop sidebar toggle button */}
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="hidden lg:block p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title={isMenuOpen ? 'Hide Sidebar' : 'Show Sidebar'}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            
            <Logo size={32} className="sm:hidden" showText={false} />
            <Logo size={40} className="hidden sm:block" showText={false} />
            
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate hidden sm:block">
                {subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              {getRoleIcon(user?.role || '')}
              <span className="text-xs sm:text-sm font-medium text-gray-900 hidden sm:inline">
                {getRoleLabel(user?.role || '')}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-800 transition-colors px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <LogOut size={16} className="sm:hidden" />
              <LogOut size={18} className="hidden sm:block" />
              <span className="text-xs sm:text-sm hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;