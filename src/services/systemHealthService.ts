import { API_CONFIG } from "@/config/api";

export interface SystemHealthData {
  uptime: string;
  activeUsers: number;
  serverStatus: string;
  lastBackup: string;
  databasePerformance: number;
  storageUsage: number;
}

export interface SystemOverview {
  status: string;
  statusMessage: string;
  uptimeSeconds: number;
  uptime30DayPercent: number;
  activeSessions: number;
  alerts: number;
  lastBackupAt?: string | null;
  generatedAt: string;
}

export interface ResourceUsage {
  cpu: { percent: number };
  memory: { percent: number; used: number; total: number };
  disk: { percent: number };
  database: { percent: number; latencyMs?: number };
  generatedAt: string;
}

export interface ServiceStatus {
  name: string;
  status: 'RUNNING' | 'WARNING' | 'DOWN';
  message?: string;
}

class SystemHealthService {
  private getFreshToken(token?: string): string {
    return localStorage.getItem('access_token') || token || '';
  }

  private async fetchWithAuth(url: string, token?: string): Promise<Response> {
    const firstToken = this.getFreshToken(token);
    let response = await fetch(url, {
      headers: { Authorization: `Bearer ${firstToken}` }
    });

    if (response.status === 401) {
      const latestToken = this.getFreshToken(token);
      if (latestToken && latestToken !== firstToken) {
        response = await fetch(url, {
          headers: { Authorization: `Bearer ${latestToken}` }
        });
      }
    }

    return response;
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  private formatRelativeTime(dateValue?: string | null): string {
    if (!dateValue) return 'Unknown';
    const backupTime = new Date(dateValue);
    if (Number.isNaN(backupTime.getTime())) return 'Unknown';
    const now = new Date();
    const diffMs = now.getTime() - backupTime.getTime();
    if (diffMs < 0) return 'Just now';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
  }

  async getSystemHealth(token: string): Promise<SystemHealthData> {
    // Fetch real system data only; if unavailable, return unknown values (no dummy/random data)
    const [overviewResponse, resourcesResponse, servicesResponse] = await Promise.allSettled([
      this.fetchWithAuth(`${API_CONFIG.BASE_URL}/system/overview`, token),
      this.fetchWithAuth(`${API_CONFIG.BASE_URL}/system/resources`, token),
      this.fetchWithAuth(`${API_CONFIG.BASE_URL}/system/services`, token)
    ]);

    const systemData: SystemHealthData = {
      uptime: "Unknown",
      activeUsers: 0,
      serverStatus: "unknown",
      lastBackup: "Unknown",
      databasePerformance: 0,
      storageUsage: 0
    };

    if (overviewResponse.status === 'fulfilled' && overviewResponse.value.ok) {
      const overview: SystemOverview = await overviewResponse.value.json();
      systemData.uptime = this.formatUptime(overview.uptimeSeconds);
      systemData.activeUsers = Number(overview.activeSessions || 0);
      systemData.serverStatus = (overview.status || 'UNKNOWN').toLowerCase();
      systemData.lastBackup = this.formatRelativeTime(overview.lastBackupAt);
    }

    if (resourcesResponse.status === 'fulfilled' && resourcesResponse.value.ok) {
      const resources: ResourceUsage = await resourcesResponse.value.json();
      const dbLatency = Number(resources.database?.latencyMs || 0);
      // Convert query latency to a quality score (lower latency => higher performance)
      // 0-20ms => ~100, 200ms+ => ~0
      const dbPerf = Math.max(0, Math.min(100, Math.round(100 - (dbLatency / 2))));
      systemData.databasePerformance = dbPerf;
      systemData.storageUsage = Math.round(Number(resources.disk?.percent || 0));
    }

    if (servicesResponse.status === 'fulfilled' && servicesResponse.value.ok) {
      const services: ServiceStatus[] = await servicesResponse.value.json();
      const runningServices = services.filter(service => service.status === 'RUNNING').length;
      const totalServices = services.length;
      if (totalServices > 0 && runningServices < totalServices && systemData.serverStatus === 'healthy') {
        systemData.serverStatus = "warning";
      }
    }

    return systemData;
  }

  async getDetailedSystemInfo(token: string) {
    try {
      const [overviewResponse, resourcesResponse, servicesResponse] = await Promise.all([
        this.fetchWithAuth(`${API_CONFIG.BASE_URL}/system/overview`, token),
        this.fetchWithAuth(`${API_CONFIG.BASE_URL}/system/resources`, token),
        this.fetchWithAuth(`${API_CONFIG.BASE_URL}/system/services`, token)
      ]);

      const overview = overviewResponse.ok ? await overviewResponse.json() : null;
      const resources = resourcesResponse.ok ? await resourcesResponse.json() : null;
      const services = servicesResponse.ok ? await servicesResponse.json() : null;

      return {
        overview,
        resources,
        services,
        hasAccess: overviewResponse.ok || resourcesResponse.ok || servicesResponse.ok
      };
    } catch (error) {
      console.error('Failed to fetch detailed system info:', error);
      return {
        overview: null,
        resources: null,
        services: null,
        hasAccess: false
      };
    }
  }
}

export const systemHealthService = new SystemHealthService();
