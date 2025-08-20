import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import StatusCards from "@/components/StatusCards";
import RealtimeActivity from "@/components/RealtimeActivity";
import SpyDetectionAlerts from "@/components/SpyDetectionAlerts";
import GeographicInsights from "@/components/GeographicInsights";
import RecentAddresses from "@/components/RecentAddresses";
import QuickActions from "@/components/QuickActions";
import IPMonitoringTable from "@/components/IPMonitoringTable";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('offline');
  const queryClient = useQueryClient();

  // WebSocket connection for real-time updates
  useWebSocket({
    onConnect: () => setConnectionStatus('online'),
    onDisconnect: () => setConnectionStatus('offline'),
    onMessage: (message) => {
      // Handle real-time updates
      switch (message.type) {
        case 'new_connection':
          // Invalidate connections cache to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
          break;
        case 'alert_resolved':
        case 'new_alert':
          queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
          break;
        case 'scan_completed':
        case 'scan_failed':
          queryClient.invalidateQueries({ queryKey: ['/api/scans'] });
          queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
          break;
      }
    }
  });

  // Get dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" data-testid="page-title">Security Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">Real-time device monitoring and surveillance detection</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connectionStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} data-testid="connection-indicator"></div>
                <span className="text-sm font-medium text-gray-700" data-testid="connection-status">
                  {connectionStatus === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                data-testid="button-export-report"
              >
                <i className="fas fa-download mr-2"></i>
                Export Report
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Status Cards */}
          <StatusCards stats={stats} />
          
          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Real-time Activity - Takes 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-6">
              <RealtimeActivity />
              <SpyDetectionAlerts />
            </div>
            
            {/* Sidebar Widgets */}
            <div className="space-y-6">
              <GeographicInsights />
              <RecentAddresses />
              <QuickActions />
            </div>
          </div>
          
          {/* Detailed IP Monitoring Table */}
          <div className="mt-8">
            <IPMonitoringTable />
          </div>
        </main>
      </div>
    </div>
  );
}
