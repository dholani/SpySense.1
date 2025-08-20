import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SpyAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectionMethod: string;
  processName?: string;
  processPath?: string;
  ipAddress?: string;
  confidence: number;
  timestamp: string;
  resolved: boolean;
}

export default function SpyDetectionAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery<SpyAlert[]>({
    queryKey: ['/api/alerts/unresolved'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return await apiRequest('PATCH', `/api/alerts/${alertId}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: "Alert resolved",
        description: "The security alert has been marked as resolved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve alert",
        variant: "destructive",
      });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' };
      case 'high': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' };
      case 'medium': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600' };
      default: return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' };
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'fas fa-exclamation-triangle';
      case 'medium':
        return 'fas fa-search';
      default:
        return 'fas fa-info-circle';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 minute ago';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Surveillance Detection Alerts</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unresolvedAlerts = alerts || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200" data-testid="spy-detection-alerts">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Surveillance Detection Alerts</h3>
          {unresolvedAlerts.length > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {unresolvedAlerts.length} active
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {unresolvedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-shield-check text-green-500 text-4xl mb-4"></i>
            <p className="text-gray-500">No active security alerts</p>
            <p className="text-sm text-gray-400 mt-1">Your system appears to be secure</p>
          </div>
        ) : (
          <div className="space-y-4">
            {unresolvedAlerts.map((alert) => {
              const colors = getSeverityColor(alert.severity);
              const icon = getSeverityIcon(alert.severity);
              
              return (
                <div 
                  key={alert.id}
                  className={`${colors.bg} ${colors.border} border rounded-lg p-4`}
                  data-testid={`alert-${alert.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <i className={`${icon} ${colors.icon} mt-1`}></i>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900" data-testid={`alert-title-${alert.id}`}>
                            {alert.title}
                          </h4>
                          <button
                            onClick={() => resolveAlertMutation.mutate(alert.id)}
                            disabled={resolveAlertMutation.isPending}
                            className="text-gray-400 hover:text-gray-600 text-sm"
                            data-testid={`button-resolve-${alert.id}`}
                          >
                            {resolveAlertMutation.isPending ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-times"></i>
                            )}
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1" data-testid={`alert-description-${alert.id}`}>
                          {alert.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                          <span data-testid={`alert-timestamp-${alert.id}`}>
                            {formatTimestamp(alert.timestamp)}
                          </span>
                          <span>Method: {alert.detectionMethod}</span>
                          <span>Confidence: {alert.confidence}%</span>
                          {alert.severity && (
                            <span className={`capitalize ${colors.text} font-medium`}>
                              {alert.severity} severity
                            </span>
                          )}
                        </div>
                        
                        {(alert.processName || alert.ipAddress) && (
                          <div className="mt-2 text-xs text-gray-600">
                            {alert.processName && (
                              <span className="bg-gray-100 px-2 py-1 rounded mr-2">
                                Process: {alert.processName}
                              </span>
                            )}
                            {alert.ipAddress && (
                              <span className="bg-gray-100 px-2 py-1 rounded">
                                IP: {alert.ipAddress}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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
