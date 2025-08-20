import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Connection {
  id: string;
  ipAddress: string;
  port?: number;
  protocol?: string;
  processName?: string;
  city?: string;
  country?: string;
  physicalAddress?: string;
  riskLevel: 'low' | 'medium' | 'high';
  isVpn: boolean;
  detectionMethod: string;
  timestamp: string;
}

export default function IPMonitoringTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();

  const { data: allConnections, isLoading } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: searchResults } = useQuery<Connection[]>({
    queryKey: ['/api/connections/search', { q: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  const tracerouteMutation = useMutation({
    mutationFn: async (target: string) => {
      return await apiRequest('POST', '/api/traceroute', { target });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Traceroute completed",
        description: `Traceroute to ${response.target} completed.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Traceroute failed",
        description: error.message || "Failed to run traceroute",
        variant: "destructive",
      });
    },
  });

  const connections = searchQuery.length > 2 ? (searchResults || []) : (allConnections || []);
  
  // Pagination
  const totalPages = Math.ceil(connections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedConnections = connections.slice(startIndex, startIndex + itemsPerPage);

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleTraceroute = (ip: string) => {
    tracerouteMutation.mutate(ip);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">IP Address Monitoring Log</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded mb-2"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200" data-testid="ip-monitoring-table">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">IP Address Monitoring Log</h3>
          <div className="flex items-center space-x-3">
            <input 
              type="text" 
              placeholder="Search IPs, locations..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              data-testid="input-search-connections"
            />
            <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200" data-testid="button-filter">
              <i className="fas fa-filter"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-6 font-medium text-gray-700">IP Address</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Location</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Physical Address</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Method</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Risk Level</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Timestamp</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedConnections.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 px-6 text-center text-gray-500">
                  {searchQuery ? 'No connections found matching your search' : 'No connections found'}
                </td>
              </tr>
            ) : (
              paginatedConnections.map((connection) => (
                <tr key={connection.id} className="hover:bg-gray-50" data-testid={`connection-row-${connection.id}`}>
                  <td className="py-4 px-6">
                    <div className="font-mono text-sm text-gray-900" data-testid={`table-ip-${connection.id}`}>
                      {connection.ipAddress}
                    </div>
                    {connection.port && (
                      <div className="text-xs text-gray-500">Port: {connection.port}</div>
                    )}
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900" data-testid={`table-city-${connection.id}`}>
                      {connection.city || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center" data-testid={`table-country-${connection.id}`}>
                      {connection.country || 'Unknown'}
                      {connection.isVpn && (
                        <span className="ml-1 bg-yellow-100 text-yellow-800 text-xs px-1 py-0.5 rounded">VPN</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900" data-testid={`table-address-${connection.id}`}>
                      {connection.physicalAddress ? (
                        connection.physicalAddress.length > 50 
                          ? `${connection.physicalAddress.substring(0, 50)}...`
                          : connection.physicalAddress
                      ) : (
                        'Address unavailable'
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-700" data-testid={`table-method-${connection.id}`}>
                      {connection.detectionMethod}
                    </span>
                    {connection.processName && (
                      <div className="text-xs text-gray-500">Process: {connection.processName}</div>
                    )}
                  </td>
                  
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskBadgeColor(connection.riskLevel)}`} data-testid={`table-risk-${connection.id}`}>
                      {connection.riskLevel === 'high' ? 'High Risk' : 
                       connection.riskLevel === 'medium' ? 'Medium Risk' : 'Low Risk'}
                    </span>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900" data-testid={`table-timestamp-${connection.id}`}>
                      {formatTimestamp(connection.timestamp)}
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleTraceroute(connection.ipAddress)}
                        disabled={tracerouteMutation.isPending}
                        className="text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50"
                        title="Run traceroute"
                        data-testid={`button-traceroute-${connection.id}`}
                      >
                        <i className={`fas ${tracerouteMutation.isPending ? 'fa-spinner fa-spin' : 'fa-route'}`}></i>
                      </button>
                      
                      <button 
                        className="text-gray-400 hover:text-gray-600 text-sm" 
                        title="Block IP"
                        data-testid={`button-block-${connection.id}`}
                      >
                        <i className="fas fa-ban"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {connections.length > itemsPerPage && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700" data-testid="pagination-info">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, connections.length)} of {connections.length} entries
            </p>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-previous-page"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-next-page"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
