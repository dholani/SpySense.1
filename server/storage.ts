import { type Connection, type InsertConnection, type SpyAlert, type InsertSpyAlert, type GeoCache, type InsertGeoCache, type SystemScan, type InsertSystemScan } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Connections
  getConnections(limit?: number): Promise<Connection[]>;
  getConnectionsByRiskLevel(riskLevel: string): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  searchConnections(query: string): Promise<Connection[]>;
  
  // Spy Alerts
  getSpyAlerts(limit?: number): Promise<SpyAlert[]>;
  getUnresolvedSpyAlerts(): Promise<SpyAlert[]>;
  createSpyAlert(alert: InsertSpyAlert): Promise<SpyAlert>;
  resolveSpyAlert(id: string): Promise<SpyAlert | undefined>;
  
  // Geo Cache
  getGeoByIP(ipAddress: string): Promise<GeoCache | undefined>;
  createGeoCache(geo: InsertGeoCache): Promise<GeoCache>;
  updateGeoCache(ipAddress: string, geo: Partial<InsertGeoCache>): Promise<GeoCache | undefined>;
  
  // System Scans
  getSystemScans(limit?: number): Promise<SystemScan[]>;
  getLatestSystemScan(): Promise<SystemScan | undefined>;
  createSystemScan(scan: InsertSystemScan): Promise<SystemScan>;
  updateSystemScan(id: string, updates: Partial<InsertSystemScan>): Promise<SystemScan | undefined>;
  
  // Statistics
  getConnectionStats(): Promise<{
    activeConnections: number;
    detectedThreats: number;
    uniqueIPs: number;
    vpnConnections: number;
  }>;
}

export class MemStorage implements IStorage {
  private connections: Map<string, Connection> = new Map();
  private spyAlerts: Map<string, SpyAlert> = new Map();
  private geoCache: Map<string, GeoCache> = new Map();
  private systemScans: Map<string, SystemScan> = new Map();

  async getConnections(limit = 100): Promise<Connection[]> {
    const allConnections = Array.from(this.connections.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return allConnections.slice(0, limit);
  }

  async getConnectionsByRiskLevel(riskLevel: string): Promise<Connection[]> {
    return Array.from(this.connections.values())
      .filter(c => c.riskLevel === riskLevel)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    const id = randomUUID();
    const connection: Connection = {
      ...insertConnection,
      id,
      timestamp: new Date(),
    };
    this.connections.set(id, connection);
    return connection;
  }

  async searchConnections(query: string): Promise<Connection[]> {
    return Array.from(this.connections.values())
      .filter(c => 
        c.ipAddress.includes(query) ||
        c.city?.toLowerCase().includes(query.toLowerCase()) ||
        c.country?.toLowerCase().includes(query.toLowerCase()) ||
        c.processName?.toLowerCase().includes(query.toLowerCase())
      );
  }

  async getSpyAlerts(limit = 100): Promise<SpyAlert[]> {
    const allAlerts = Array.from(this.spyAlerts.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return allAlerts.slice(0, limit);
  }

  async getUnresolvedSpyAlerts(): Promise<SpyAlert[]> {
    return Array.from(this.spyAlerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createSpyAlert(insertAlert: InsertSpyAlert): Promise<SpyAlert> {
    const id = randomUUID();
    const alert: SpyAlert = {
      ...insertAlert,
      id,
      timestamp: new Date(),
      resolved: false,
    };
    this.spyAlerts.set(id, alert);
    return alert;
  }

  async resolveSpyAlert(id: string): Promise<SpyAlert | undefined> {
    const alert = this.spyAlerts.get(id);
    if (alert) {
      alert.resolved = true;
      this.spyAlerts.set(id, alert);
      return alert;
    }
    return undefined;
  }

  async getGeoByIP(ipAddress: string): Promise<GeoCache | undefined> {
    return Array.from(this.geoCache.values()).find(g => g.ipAddress === ipAddress);
  }

  async createGeoCache(insertGeo: InsertGeoCache): Promise<GeoCache> {
    const id = randomUUID();
    const geo: GeoCache = {
      ...insertGeo,
      id,
      lastUpdated: new Date(),
    };
    this.geoCache.set(id, geo);
    return geo;
  }

  async updateGeoCache(ipAddress: string, updates: Partial<InsertGeoCache>): Promise<GeoCache | undefined> {
    const existing = Array.from(this.geoCache.values()).find(g => g.ipAddress === ipAddress);
    if (existing) {
      const updated: GeoCache = {
        ...existing,
        ...updates,
        lastUpdated: new Date(),
      };
      this.geoCache.set(existing.id, updated);
      return updated;
    }
    return undefined;
  }

  async getSystemScans(limit = 50): Promise<SystemScan[]> {
    const allScans = Array.from(this.systemScans.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return allScans.slice(0, limit);
  }

  async getLatestSystemScan(): Promise<SystemScan | undefined> {
    const scans = await this.getSystemScans(1);
    return scans[0];
  }

  async createSystemScan(insertScan: InsertSystemScan): Promise<SystemScan> {
    const id = randomUUID();
    const scan: SystemScan = {
      ...insertScan,
      id,
      timestamp: new Date(),
    };
    this.systemScans.set(id, scan);
    return scan;
  }

  async updateSystemScan(id: string, updates: Partial<InsertSystemScan>): Promise<SystemScan | undefined> {
    const scan = this.systemScans.get(id);
    if (scan) {
      const updated: SystemScan = {
        ...scan,
        ...updates,
      };
      this.systemScans.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getConnectionStats(): Promise<{
    activeConnections: number;
    detectedThreats: number;
    uniqueIPs: number;
    vpnConnections: number;
  }> {
    const connections = Array.from(this.connections.values());
    const alerts = Array.from(this.spyAlerts.values());
    
    // Consider connections from last hour as "active"
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activeConnections = connections.filter(c => new Date(c.timestamp) > oneHourAgo).length;
    
    const detectedThreats = alerts.filter(a => !a.resolved && a.severity !== 'low').length;
    
    // Count unique IPs from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentConnections = connections.filter(c => new Date(c.timestamp) > oneDayAgo);
    const uniqueIPs = new Set(recentConnections.map(c => c.ipAddress)).size;
    
    const vpnConnections = connections.filter(c => c.isVpn && new Date(c.timestamp) > oneDayAgo).length;
    
    return {
      activeConnections,
      detectedThreats,
      uniqueIPs,
      vpnConnections,
    };
  }
}

export const storage = new MemStorage();
