import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, MapPin, Activity, Eye, Network, Download, Settings } from 'lucide-react';

interface Connection {
  id: string;
  ipAddress: string;
  port: number | null;
  protocol: string | null;
  processName: string | null;
  location: any;
  physicalAddress: string | null;
  country: string | null;
  city: string | null;
  riskLevel: string;
  isVpn: boolean | null;
  detectionMethod: string;
  timestamp: string;
}

interface SpyAlert {
  id: string;
  title: string;
  description: string;
  ipAddress: string | null;
  processName: string | null;
  detectionMethod: string;
  timestamp: string;
  severity: string;
  processPath: string | null;
  confidence: number;
  resolved: boolean | null;
}

interface DashboardStats {
  activeConnections: number;
  detectedThreats: number;
  vpnConnections: number;
  monitoredProcesses: number;
}

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    refetchInterval: 5000,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<SpyAlert[]>({
    queryKey: ['/api/alerts/unresolved'],
    refetchInterval: 3000,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="dashboard-container">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">
              Network Security Monitor
            </h1>
            <p className="text-gray-600">Real-time surveillance and threat detection</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline" size="sm" data-testid="button-settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-active-connections">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
              <Network className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-active-connections">
                {statsLoading ? '...' : stats?.activeConnections || 0}
              </div>
              <p className="text-xs text-gray-600">Network connections monitored</p>
            </CardContent>
          </Card>

          <Card data-testid="card-detected-threats">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Detected Threats</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="text-detected-threats">
                {statsLoading ? '...' : stats?.detectedThreats || 0}
              </div>
              <p className="text-xs text-gray-600">Security alerts raised</p>
            </CardContent>
          </Card>

          <Card data-testid="card-vpn-connections">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">VPN Connections</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-vpn-connections">
                {statsLoading ? '...' : stats?.vpnConnections || 0}
              </div>
              <p className="text-xs text-gray-600">Protected connections</p>
            </CardContent>
          </Card>

          <Card data-testid="card-monitored-processes">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitored Processes</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" data-testid="text-monitored-processes">
                {statsLoading ? '...' : stats?.monitoredProcesses || 0}
              </div>
              <p className="text-xs text-gray-600">System processes scanned</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Spy Detection Alerts */}
          <Card data-testid="card-spy-alerts">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-red-600" />
                Spy Detection Alerts
              </CardTitle>
              <CardDescription>
                Real-time surveillance and threat detection results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alertsLoading ? (
                <div className="text-center py-4" data-testid="loading-alerts">Loading alerts...</div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {alerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start justify-between rounded-lg border p-3"
                      data-testid={`alert-${alert.id}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{alert.title}</h4>
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{alert.description}</p>
                        <div className="text-xs text-gray-500">
                          {alert.processName && <span>Process: {alert.processName}</span>}
                          {alert.ipAddress && <span className="ml-2">IP: {alert.ipAddress}</span>}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(alert.confidence * 100)}% confidence
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500" data-testid="no-alerts">
                  <Eye className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p>No threats detected</p>
                  <p className="text-sm">Your system appears secure</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Network Connections */}
          <Card data-testid="card-network-connections">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Network Connections
              </CardTitle>
              <CardDescription>
                Live monitoring of IP addresses and geographic locations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionsLoading ? (
                <div className="text-center py-4" data-testid="loading-connections">Loading connections...</div>
              ) : connections && connections.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {connections.slice(0, 10).map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                      data-testid={`connection-${connection.id}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono">{connection.ipAddress}</code>
                          <Badge 
                            className={`text-xs ${getRiskLevelColor(connection.riskLevel)}`}
                          >
                            {connection.riskLevel}
                          </Badge>
                          {connection.isVpn && (
                            <Badge variant="secondary" className="text-xs">VPN</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          {connection.physicalAddress || `${connection.city || 'Unknown'}, ${connection.country || 'Unknown'}`}
                        </p>
                        <div className="text-xs text-gray-500">
                          {connection.processName && <span>Process: {connection.processName}</span>}
                          {connection.protocol && (
                            <span className="ml-2">Protocol: {connection.protocol.toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                        data-testid={`button-view-location-${connection.id}`}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500" data-testid="no-connections">
                  <Network className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p>No active connections</p>
                  <p className="text-sm">Monitoring will begin automatically</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}