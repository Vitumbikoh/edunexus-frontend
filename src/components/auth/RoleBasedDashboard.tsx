
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/pages/dashboard/Dashboard';

const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // All roles use the same Dashboard component but it renders different content based on role
  return <Dashboard />;
};

export default RoleBasedDashboard;
