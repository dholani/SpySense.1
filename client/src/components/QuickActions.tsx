import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function QuickActions() {
  const { toast } = useToast();
  const [tracerouteTarget, setTracerouteTarget] = useState('');
  const [showTracerouteInput, setShowTracerouteInput] = useState(false);

  const systemScanMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/scan/system');
    },
    onSuccess: () => {
      toast({
        title: "System scan started",
        description: "Full system scan is now running. You'll be notified when it's complete.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Scan failed",
        description: error.message || "Failed to start system scan",
        variant: "destructive",
      });
    },
  });

  const tracerouteMutation = useMutation({
    mutationFn: async (target: string) => {
      return await apiRequest('POST', '/api/traceroute', { target });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Traceroute completed",
        description: `Traceroute to ${response.target} completed with ${response.hops?.length || 0} hops.`,
      });
      setTracerouteTarget('');
      setShowTracerouteInput(false);
    },
    onError: (error: any) => {
      toast({
        title: "Traceroute failed",
        description: error.message || "Failed to run traceroute",
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (type: 'connections' | 'alerts' | 'scans') => {
      const response = await fetch(`/api/export/${type}?format=csv`);
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export completed",
        description: "Your data has been exported successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    },
  });

  const handleTraceroute = () => {
    if (!tracerouteTarget.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid IP address or domain name.",
        variant: "destructive",
      });
      return;
    }
    
    tracerouteMutation.mutate(tracerouteTarget.trim());
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200" data-testid="quick-actions">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </div>
      
      <div className="p-6 space-y-3">
        <button 
          onClick={() => systemScanMutation.mutate()}
          disabled={systemScanMutation.isPending}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-left flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-full-system-scan"
        >
          <i className={`fas ${systemScanMutation.isPending ? 'fa-spinner fa-spin' : 'fa-search'}`}></i>
          <span>{systemScanMutation.isPending ? 'Running Scan...' : 'Full System Scan'}</span>
        </button>
        
        <div className="space-y-2">
          {!showTracerouteInput ? (
            <button 
              onClick={() => setShowTracerouteInput(true)}
              className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-left flex items-center space-x-3"
              data-testid="button-show-traceroute"
            >
              <i className="fas fa-route"></i>
              <span>Run Traceroute</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tracerouteTarget}
                  onChange={(e) => setTracerouteTarget(e.target.value)}
                  placeholder="Enter IP address or domain"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  data-testid="input-traceroute-target"
                  onKeyPress={(e) => e.key === 'Enter' && handleTraceroute()}
                />
                <button
                  onClick={() => setShowTracerouteInput(false)}
                  className="text-gray-400 hover:text-gray-600 px-2"
                  data-testid="button-cancel-traceroute"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <button 
                onClick={handleTraceroute}
                disabled={tracerouteMutation.isPending || !tracerouteTarget.trim()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-left flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-run-traceroute"
              >
                <i className={`fas ${tracerouteMutation.isPending ? 'fa-spinner fa-spin' : 'fa-route'}`}></i>
                <span>{tracerouteMutation.isPending ? 'Running...' : 'Start Traceroute'}</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-left flex items-center space-x-3 group"
            data-testid="button-export-dropdown"
          >
            <i className="fas fa-file-export"></i>
            <span>Export Logs</span>
            <i className="fas fa-chevron-down ml-auto group-hover:rotate-180 transition-transform"></i>
          </button>
          
          {/* Export options - would typically be a dropdown */}
          <div className="mt-2 space-y-1">
            <button 
              onClick={() => exportMutation.mutate('connections')}
              disabled={exportMutation.isPending}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
              data-testid="button-export-connections"
            >
              <i className="fas fa-network-wired w-4 mr-2"></i>
              {exportMutation.isPending ? 'Exporting...' : 'Export Connections'}
            </button>
            
            <button 
              onClick={() => exportMutation.mutate('alerts')}
              disabled={exportMutation.isPending}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
              data-testid="button-export-alerts"
            >
              <i className="fas fa-exclamation-triangle w-4 mr-2"></i>
              {exportMutation.isPending ? 'Exporting...' : 'Export Alerts'}
            </button>
            
            <button 
              onClick={() => exportMutation.mutate('scans')}
              disabled={exportMutation.isPending}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
              data-testid="button-export-scans"
            >
              <i className="fas fa-search w-4 mr-2"></i>
              {exportMutation.isPending ? 'Exporting...' : 'Export Scans'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
