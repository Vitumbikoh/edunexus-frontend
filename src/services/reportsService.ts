import { apiClient } from './apiClient';
import { API_BASE_URL } from '@/config/api';

export const reportsApi = {
  // Fetch report data from any endpoint
  fetchReportData: async (endpoint: string, query?: string, token?: string) => {
    const url = `${endpoint}${query ? `?${query}` : ''}`;
    return apiClient.get(url, token);
  },

  // Export report in Excel or PDF format
  exportReport: async (endpoint: string, query?: string, token?: string) => {
    const url = `${endpoint}${query ? `?${query}` : ''}`;
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get filename from Content-Disposition header or create default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'report';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    } else {
      // Determine file extension from endpoint
      const isExcel = endpoint.includes('/excel');
      const isPDF = endpoint.includes('/pdf');
      filename = `report.${isExcel ? 'xlsx' : isPDF ? 'pdf' : 'csv'}`;
    }

    // Create blob and download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Library specific endpoints
  getLibraryMostBorrowed: (query?: string, token?: string) => {
    return reportsApi.fetchReportData('/admin/reports/library/most-borrowed', query, token);
  },

  getLibraryOverdue: (query?: string, token?: string) => {
    return reportsApi.fetchReportData('/admin/reports/library/overdue', query, token);
  },

  getLibraryBorrowings: (query?: string, token?: string) => {
    return reportsApi.fetchReportData('/admin/reports/library/borrowings', query, token);
  },

  // Library export endpoints
  exportLibraryMostBorrowed: (format: 'excel' | 'pdf', query?: string, token?: string) => {
    return reportsApi.exportReport(`/admin/reports/library/most-borrowed/export/${format}`, query, token);
  },

  exportLibraryOverdue: (format: 'excel' | 'pdf', query?: string, token?: string) => {
    return reportsApi.exportReport(`/admin/reports/library/overdue/export/${format}`, query, token);
  },

  exportLibraryBorrowings: (format: 'excel' | 'pdf', query?: string, token?: string) => {
    return reportsApi.exportReport(`/admin/reports/library/borrowings/export/${format}`, query, token);
  },
};