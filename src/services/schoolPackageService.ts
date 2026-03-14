import { API_CONFIG } from '@/config/api';

export type PackageId = 'normal' | 'silver' | 'golden';

export interface SchoolPackageConfig {
  schoolId: string;
  schoolName: string;
  assignedPackage: PackageId;
  currency: string;
  pricing: Record<PackageId, number>;
  packages: Array<{
    id: PackageId;
    name: string;
    description: string;
    modules: string[];
    roleAccess: {
      admin: string;
      teacher: string;
      student: string;
      finance: string;
    };
    price: number;
  }>;
}

export const schoolPackageService = {
  async getMyPackageConfig(token?: string): Promise<SchoolPackageConfig> {
    const authToken = token || localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    const response = await fetch(`${API_CONFIG.BASE_URL}/school-packages/me`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to fetch package config (${response.status})`);
    }

    return response.json();
  },
};
