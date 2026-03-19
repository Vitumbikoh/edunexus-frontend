import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { schoolPackageService } from '@/services/schoolPackageService';

export function useSchoolPackage() {
  const { token, isAuthenticated, user } = useAuth();

  const query = useQuery({
    queryKey: ['school-package-config', user?.id],
    queryFn: () => schoolPackageService.getMyPackageConfig(token || undefined),
    enabled: Boolean(isAuthenticated && user && user.role !== 'super_admin'),
    staleTime: 60 * 1000,
  });

  const assignedPackage = query.data?.assignedPackage || 'normal';

  const canAccessFinance = useMemo(() => {
    if (user?.role === 'super_admin') return true;
    return assignedPackage === 'silver' || assignedPackage === 'golden';
  }, [assignedPackage, user?.role]);

  const canAccessLibrary = useMemo(() => {
    if (user?.role === 'super_admin') return true;
    return assignedPackage === 'golden';
  }, [assignedPackage, user?.role]);

  const canAccessHostel = useMemo(() => {
    if (user?.role === 'super_admin') return true;
    return assignedPackage === 'golden';
  }, [assignedPackage, user?.role]);

  return {
    ...query,
    assignedPackage,
    canAccessFinance,
    canAccessLibrary,
    canAccessHostel,
  };
}
