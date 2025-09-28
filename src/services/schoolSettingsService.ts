import { API_CONFIG } from '@/config/api';

export interface SchoolSettings {
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
  schoolAbout: string;
  schoolLogo?: string;
  schoolMotto?: string;
}

export const schoolSettingsService = {
  async getSettings(token?: string): Promise<SchoolSettings> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/settings`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch school settings');
    }

    const data = await response.json();

    // Check if the response has schoolSettings nested
    const settings = data.schoolSettings || data;

    return {
      schoolName: settings.schoolName || '',
      schoolEmail: settings.schoolEmail || '',
      schoolPhone: settings.schoolPhone || '',
      schoolAddress: settings.schoolAddress || '',
      schoolAbout: settings.schoolAbout || '',
      schoolLogo: settings.schoolLogo || '',
      // Support both `schoolMotto` and `motto` keys from backend
      schoolMotto: settings.schoolMotto || settings.motto || '',
    };
  },
};