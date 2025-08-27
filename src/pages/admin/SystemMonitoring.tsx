import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Zap,
  Monitor,
  RefreshCw
} from 'lucide-react';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: number;
}

interface SystemService {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'warning';
  uptime: string;
  lastChecked: string;
}

interface ServerStatus {
  cpu: SystemMetric;
  memory: SystemMetric;
  disk: SystemMetric;
  network: SystemMetric;
  activeUsers: number;
  totalRequests: number;
  responseTime: number;
}

const SystemMonitoring: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<ServerStatus>({
    cpu: { id: 'cpu', name: 'CPU Usage', value: 45, unit: '%', status: 'healthy', threshold: 80 },
    memory: { id: 'memory', name: 'Memory Usage', value: 68, unit: '%', status: 'warning', threshold: 85 },
    disk: { id: 'disk', name: 'Disk Usage', value: 32, unit: '%', status: 'healthy', threshold: 90 },
    network: { id: 'network', name: 'Network I/O', value: 156, unit: 'Mbps', status: 'healthy', threshold: 1000 },
    activeUsers: 127,
    totalRequests: 8432,
    responseTime: 245
  });

  const [services, setServices] = useState<SystemService[]>([
    {
      id: 'api',
      name: 'API Server',
      status: 'running',
      uptime: '15 days, 7 hours',
      lastChecked: '2 minutes ago'
    },
    {
      id: 'database',
      name: 'Database Server',
      status: 'running',
      uptime: '15 days, 7 hours',
      lastChecked: '2 minutes ago'
    },
    {
      id: 'cache',
      name: 'Cache Service',
      status: 'running',
      uptime: '15 days, 7 hours',
      lastChecked: '2 minutes ago'
    },
    {
      id: 'email',
      name: 'Email Service',
      status: 'warning',
      uptime: '2 days, 12 hours',
      lastChecked: '5 minutes ago'
    },
    {
      id: 'backup',
      name: 'Backup Service',
      status: 'running',
      uptime: '15 days, 7 hours',
      lastChecked: '1 hour ago'
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update with simulated new data
    setSystemStatus(prev => ({
      ...prev,
      cpu: { ...prev.cpu, value: Math.floor(Math.random() * 80) + 10 },
      memory: { ...prev.memory, value: Math.floor(Math.random() * 80) + 20 },
      activeUsers: Math.floor(Math.random() * 50) + 100,
      totalRequests: prev.totalRequests + Math.floor(Math.random() * 100),
      responseTime: Math.floor(Math.random() * 100) + 200
    }));
    
    setIsRefreshing(false);
  };

  useEffect(() => {
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor system health, performance metrics, and service status
          </p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={isRefreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.responseTime}ms</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-lg font-semibold text-green-600">Healthy</span>
            </div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CPU Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    {systemStatus.cpu.name}
                  </CardTitle>
                  <CardDescription>Current CPU utilization</CardDescription>
                </div>
                <Badge variant={systemStatus.cpu.status === 'healthy' ? 'default' : 'destructive'}>
                  {systemStatus.cpu.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{systemStatus.cpu.value}{systemStatus.cpu.unit}</span>
                    <span>Threshold: {systemStatus.cpu.threshold}{systemStatus.cpu.unit}</span>
                  </div>
                  <Progress 
                    value={systemStatus.cpu.value} 
                    className={`h-2 ${systemStatus.cpu.value > systemStatus.cpu.threshold ? 'bg-red-100' : 'bg-green-100'}`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    {systemStatus.memory.name}
                  </CardTitle>
                  <CardDescription>Current memory utilization</CardDescription>
                </div>
                <Badge variant={systemStatus.memory.status === 'healthy' ? 'default' : 'secondary'}>
                  {systemStatus.memory.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{systemStatus.memory.value}{systemStatus.memory.unit}</span>
                    <span>Threshold: {systemStatus.memory.threshold}{systemStatus.memory.unit}</span>
                  </div>
                  <Progress 
                    value={systemStatus.memory.value} 
                    className={`h-2 ${systemStatus.memory.value > systemStatus.memory.threshold ? 'bg-red-100' : 'bg-green-100'}`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Disk Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {systemStatus.disk.name}
                  </CardTitle>
                  <CardDescription>Current disk utilization</CardDescription>
                </div>
                <Badge variant={systemStatus.disk.status === 'healthy' ? 'default' : 'destructive'}>
                  {systemStatus.disk.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{systemStatus.disk.value}{systemStatus.disk.unit}</span>
                    <span>Threshold: {systemStatus.disk.threshold}{systemStatus.disk.unit}</span>
                  </div>
                  <Progress 
                    value={systemStatus.disk.value} 
                    className={`h-2 ${systemStatus.disk.value > systemStatus.disk.threshold ? 'bg-red-100' : 'bg-green-100'}`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Network I/O */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    {systemStatus.network.name}
                  </CardTitle>
                  <CardDescription>Current network throughput</CardDescription>
                </div>
                <Badge variant={systemStatus.network.status === 'healthy' ? 'default' : 'destructive'}>
                  {systemStatus.network.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{systemStatus.network.value} {systemStatus.network.unit}</span>
                    <span>Limit: {systemStatus.network.threshold} {systemStatus.network.unit}</span>
                  </div>
                  <Progress 
                    value={(systemStatus.network.value / systemStatus.network.threshold) * 100} 
                    className="h-2 bg-green-100"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Services</CardTitle>
              <CardDescription>
                Status of critical system services and their uptime
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(service.status)}
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <Badge 
                        variant={service.status === 'running' ? 'default' : service.status === 'warning' ? 'secondary' : 'destructive'}
                      >
                        {service.status}
                      </Badge>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Uptime: {service.uptime}</div>
                      <div>Last checked: {service.lastChecked}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Memory usage is approaching threshold (68% of 85% limit). Consider scaling resources.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All backup operations completed successfully at 02:00 AM.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Recent System Logs</CardTitle>
                <CardDescription>Latest system events and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>System backup completed successfully</span>
                    <span className="text-muted-foreground">2 hours ago</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Database connection pool optimized</span>
                    <span className="text-muted-foreground">4 hours ago</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Security scan completed - no threats found</span>
                    <span className="text-muted-foreground">6 hours ago</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>System maintenance window scheduled</span>
                    <span className="text-muted-foreground">1 day ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemMonitoring;
