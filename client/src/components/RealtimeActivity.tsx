import { useQuery } from "@tanstack/react-query";

interface Connection {
  id: string;
  ipAddress: string;
  city?: string;
  country?: string;
  riskLevel: 'low' | 'medium' | 'high';
  isVpn: boolean;
  detectionMethod: string;
  timestamp: string;
}

export default function RealtimeActivity() {
  const { data: connections, isLoading } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return { border: 'border-red-500', bg: 'bg-red-50', icon: 'bg-red-600', text: 'text-red-600' };
      case 'medium': return { border: 'border-yellow-500', bg: 'bg-yellow-50', icon: 'bg-yellow-600', text: 'text-yellow-600' };
      default: return { border: 'border-green-500', bg: 'bg-green-50', icon: 'bg-green-600', text: 'text-green-600' };
    }
  };

  const getRiskIcon = (riskLevel: string, isVpn: boolean) => {
    if (riskLevel === 'high') return 'fas fa-eye';
    if (isVpn) return 'fas fa-mask';
    return 'fas fa-check';
  };

  const getRiskLabel = (riskLevel: string, isVpn: boolean) => {
    if (riskLevel === 'high') return 'SURVEILLANCE DETECTED';
    if (isVpn) return 'VPN CONNECTION';
    return 'LEGITIMATE';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 minute ago';
    return `${diffInMinutes} minutes ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Real-time Network Activity</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentConnections = connections?.slice(0, 5) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200" data-testid="realtime-activity">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Real-time Network Activity</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {recentConnections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent network activity detected
          </div>
        ) : (
          <div className="space-y-4">
            {recentConnections.map((connection) => {
              const colors = getRiskColor(connection.riskLevel);
              const icon = getRiskIcon(connection.riskLevel, connection.isVpn);
              const label = getRiskLabel(connection.riskLevel, connection.isVpn);
              
              return (
                <div 
                  key={connection.id}
                  className={`flex items-center justify-between p-4 ${colors.bg} rounded-lg border-l-4 ${colors.border}`}
                  data-testid={`connection-${connection.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center`}>
                      <i className={`${icon} text-white`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900" data-testid={`connection-ip-${connection.id}`}>
                        {connection.ipAddress}
                      </p>
                      <p className="text-sm text-gray-600" data-testid={`connection-location-${connection.id}`}>
                        {connection.city && connection.country 
                          ? `${connection.city}, ${connection.country}${connection.isVpn ? ' (VPN)' : ''}`
                          : 'Location unknown'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${colors.text}`} data-testid={`connection-risk-${connection.id}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-500" data-testid={`connection-time-${connection.id}`}>
                      {formatTimestamp(connection.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
