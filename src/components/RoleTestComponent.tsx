import React from 'react';
import { useAuth } from '../context/AuthContext';

function RoleTestComponent() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg m-4">
      <h3 className="font-bold text-lg mb-2">Role Debug Information</h3>
      <div className="space-y-2 text-sm">
        <div><strong>User ID:</strong> {user.id}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Name:</strong> {user.name}</div>
        <div><strong>Role:</strong> <span className="font-bold text-blue-600">{user.role}</span></div>
        <div><strong>Clinic ID:</strong> {user.clinicId || 'None'}</div>
        <div><strong>Provider ID:</strong> {user.providerId || 'None'}</div>
      </div>
    </div>
  );
}

export default RoleTestComponent;
