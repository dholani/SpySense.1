import { useQuery } from "@tanstack/react-query";

interface Connection {
  id: string;
  ipAddress: string;
  country?: string;
  city?: string;
  riskLevel: 'low' | 'medium' | 'high';
  isVpn: boolean;
  timestamp: string;
}

export default function GeographicInsights() {
  const { data: connections } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Process connections to get geographic insights
  const getGeographicStats = () => {
    if (!connections) return { highRiskCount: 0, vpnLocations: 0, safeConnections: 0 };
    
    // Only consider connections from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentConnections = connections.filter(
      conn => new Date(conn.timestamp) > oneDayAgo
    );
    
    const highRiskCount = recentConnections.filter(conn => conn.riskLevel === 'high').length;
    const vpnLocations = recentConnections.filter(conn => conn.isVpn).length;
    const safeConnections = recentConnections.filter(conn => conn.riskLevel === 'low').length;
    
    return { highRiskCount, vpnLocations, safeConnections };
  };

  const stats = getGeographicStats();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200" data-testid="geographic-insights">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Geographic Insights</h3>
      </div>
      
      <div className="p-6">
        {/* Placeholder for interactive map */}
        <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center mb-4" data-testid="world-map-placeholder">
          <div className="text-center">
            <i className="fas fa-globe text-gray-400 text-3xl mb-2"></i>
            <p className="text-gray-500 text-sm">Interactive World Map</p>
            <p className="text-gray-400 text-xs">IP location visualization</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between" data-testid="stat-high-risk">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span className="text-sm text-gray-700">High Risk Areas</span>
            </div>
            <span className="text-sm font-medium" data-testid="high-risk-count">
              {stats.highRiskCount}
            </span>
          </div>
          
          <div className="flex items-center justify-between" data-testid="stat-vpn-locations">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
              <span className="text-sm text-gray-700">VPN Locations</span>
            </div>
            <span className="text-sm font-medium" data-testid="vpn-locations-count">
              {stats.vpnLocations}
            </span>
          </div>
          
          <div className="flex items-center justify-between" data-testid="stat-safe-connections">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Safe Connections</span>
            </div>
            <span className="text-sm font-medium" data-testid="safe-connections-count">
              {stats.safeConnections}
            </span>
          </div>
        </div>
        
        {connections && connections.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Based on {connections.length} total connections monitored
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
