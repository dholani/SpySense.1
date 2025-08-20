import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { networkMonitor } from "./services/networkMonitor";
import { spyDetector } from "./services/spyDetector";
import { geoLocationService } from "./services/geoLocation";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Start network monitoring with real-time broadcasting
  networkMonitor.startMonitoring((connection) => {
    broadcast({
      type: 'new_connection',
      data: connection
    });
  });

  // API Routes

  // Get dashboard statistics
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getConnectionStats();
      res.json(stats);
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      res.status(500).json({ message: 'Failed to get dashboard statistics' });
    }
  });

  // Get recent connections
  app.get('/api/connections', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const connections = await storage.getConnections(limit);
      res.json(connections);
    } catch (error) {
      console.error('Failed to get connections:', error);
      res.status(500).json({ message: 'Failed to get connections' });
    }
  });

  // Search connections
  app.get('/api/connections/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: 'Search query required' });
      }
      
      const connections = await storage.searchConnections(query);
      res.json(connections);
    } catch (error) {
      console.error('Failed to search connections:', error);
      res.status(500).json({ message: 'Failed to search connections' });
    }
  });

  // Get connections by risk level
  app.get('/api/connections/risk/:level', async (req, res) => {
    try {
      const riskLevel = req.params.level;
      const connections = await storage.getConnectionsByRiskLevel(riskLevel);
      res.json(connections);
    } catch (error) {
      console.error('Failed to get connections by risk level:', error);
      res.status(500).json({ message: 'Failed to get connections by risk level' });
    }
  });

  // Get spy alerts
  app.get('/api/alerts', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const alerts = await storage.getSpyAlerts(limit);
      res.json(alerts);
    } catch (error) {
      console.error('Failed to get spy alerts:', error);
      res.status(500).json({ message: 'Failed to get spy alerts' });
    }
  });

  // Get unresolved spy alerts
  app.get('/api/alerts/unresolved', async (req, res) => {
    try {
      const alerts = await storage.getUnresolvedSpyAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Failed to get unresolved alerts:', error);
      res.status(500).json({ message: 'Failed to get unresolved alerts' });
    }
  });

  // Resolve spy alert
  app.patch('/api/alerts/:id/resolve', async (req, res) => {
    try {
      const alertId = req.params.id;
      const resolvedAlert = await storage.resolveSpyAlert(alertId);
      
      if (!resolvedAlert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      broadcast({
        type: 'alert_resolved',
        data: resolvedAlert
      });
      
      res.json(resolvedAlert);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      res.status(500).json({ message: 'Failed to resolve alert' });
    }
  });

  // Run system scan
  app.post('/api/scan/system', async (req, res) => {
    try {
      // Start scan asynchronously
      spyDetector.runFullSystemScan().then((results) => {
        broadcast({
          type: 'scan_completed',
          data: results
        });
      }).catch((error) => {
        console.error('System scan failed:', error);
        broadcast({
          type: 'scan_failed',
          data: { error: error.message }
        });
      });
      
      res.json({ message: 'System scan started', status: 'running' });
    } catch (error) {
      console.error('Failed to start system scan:', error);
      res.status(500).json({ message: 'Failed to start system scan' });
    }
  });

  // Get system scans history
  app.get('/api/scans', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const scans = await storage.getSystemScans(limit);
      res.json(scans);
    } catch (error) {
      console.error('Failed to get system scans:', error);
      res.status(500).json({ message: 'Failed to get system scans' });
    }
  });

  // Run traceroute
  app.post('/api/traceroute', async (req, res) => {
    try {
      const { target } = req.body;
      if (!target) {
        return res.status(400).json({ message: 'Target IP address required' });
      }
      
      const traceroute = await networkMonitor.runTraceroute(target);
      res.json({ target, hops: traceroute });
    } catch (error) {
      console.error('Traceroute failed:', error);
      res.status(500).json({ message: 'Traceroute failed' });
    }
  });

  // Get geographic data for IP
  app.get('/api/geo/:ip', async (req, res) => {
    try {
      const ipAddress = req.params.ip;
      const geoData = await geoLocationService.getLocationData(ipAddress);
      
      if (!geoData) {
        return res.status(404).json({ message: 'Location data not found' });
      }
      
      res.json(geoData);
    } catch (error) {
      console.error('Failed to get geographic data:', error);
      res.status(500).json({ message: 'Failed to get geographic data' });
    }
  });

  // Export data
  app.get('/api/export/:type', async (req, res) => {
    try {
      const exportType = req.params.type;
      const format = req.query.format as string || 'json';
      
      let data: any = [];
      
      switch (exportType) {
        case 'connections':
          data = await storage.getConnections(10000); // Large limit for export
          break;
        case 'alerts':
          data = await storage.getSpyAlerts(10000);
          break;
        case 'scans':
          data = await storage.getSystemScans(1000);
          break;
        default:
          return res.status(400).json({ message: 'Invalid export type' });
      }
      
      if (format === 'csv') {
        // Convert to CSV format
        if (data.length === 0) {
          return res.status(204).send();
        }
        
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map((item: any) => 
          Object.values(item).map(val => 
            typeof val === 'string' ? `"${val}"` : val
          ).join(',')
        );
        
        const csv = [headers, ...rows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${exportType}-export.csv"`);
        res.send(csv);
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error('Export failed:', error);
      res.status(500).json({ message: 'Export failed' });
    }
  });

  return httpServer;
}
