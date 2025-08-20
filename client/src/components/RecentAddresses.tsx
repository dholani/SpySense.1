import { useQuery } from "@tanstack/react-query";

interface Connection {
  id: string;
  ipAddress: string;
  physicalAddress?: string;
  city?: string;
  country?: string;
  isVpn: boolean;
  timestamp: string;
}

export default function RecentAddresses() {
  const { data: connections, isLoading } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const getPhysicalAddress = (connection: Connection) => {
    if (connection.physicalAddress) {
      return connection.physicalAddress;
    }
    
    if (connection.isVpn) {
      return `VPN Server - ${connection.city || 'Unknown Location'}`;
    }
    
    if (connection.city && connection.country) {
      return `${connection.city}, ${connection.country}`;
    }
    
    return 'Physical address unavailable';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Addresses</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-100 rounded w-48"></div>
                <div className="h-3 bg-gray-100 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get unique recent addresses (limit to 5 most recent)
  const uniqueConnections = connections
    ? connections
        .filter((conn, index, arr) => 
          arr.findIndex(c => c.ipAddress === conn.ipAddress) === index
        )
        .slice(0, 5)
    : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200" data-testid="recent-addresses">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Addresses</h3>
      </div>
      
      <div className="p-6">
        {uniqueConnections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-map-marker-alt text-2xl mb-2"></i>
            <p>No recent addresses found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {uniqueConnections.map((connection, index) => (
              <div 
                key={connection.id}
                className={`${index < uniqueConnections.length - 1 ? 'border-b border-gray-100 pb-3' : ''}`}
                data-testid={`address-${connection.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-mono text-sm text-gray-900" data-testid={`address-ip-${connection.id}`}>
                      {connection.ipAddress}
                    </p>
                    <p className="text-xs text-gray-600 mt-1" data-testid={`address-physical-${connection.id}`}>
                      {getPhysicalAddress(connection)}
                    </p>
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-gray-500" data-testid={`address-time-${connection.id}`}>
                        {formatTimestamp(connection.timestamp)}
                      </p>
                      {connection.isVpn && (
                        <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded">
                          VPN
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    className="text-gray-400 hover:text-blue-600 ml-2 text-xs"
                    title="View on map"
                    data-testid={`button-view-map-${connection.id}`}
                  >
                    <i className="fas fa-external-link-alt"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
