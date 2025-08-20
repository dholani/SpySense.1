import { pgTable, text, timestamp, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Network Connection Logs
export const networkConnections = pgTable("network_connections", {
  id: text("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  port: integer("port"),
  protocol: text("protocol"),
  connectionType: text("connection_type"), // incoming, outgoing, established
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isVpn: boolean("is_vpn").default(false),
  country: text("country"),
  region: text("region"),
  city: text("city"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  physicalAddress: text("physical_address"),
  isp: text("isp"),
  organization: text("organization"),
  isActive: boolean("is_active").default(true),
});

// Traceroute Data
export const tracerouteData = pgTable("traceroute_data", {
  id: text("id").primaryKey(),
  targetIp: text("target_ip").notNull(),
  hops: json("hops").$type<Array<{
    hop: number;
    ip: string;
    hostname?: string;
    rtt1?: number;
    rtt2?: number;
    rtt3?: number;
  }>>(),
  totalHops: integer("total_hops"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  connectionId: text("connection_id").references(() => networkConnections.id),
});

// Spy/Monitoring Software Detection
export const spySoftwareDetection = pgTable("spy_software_detection", {
  id: text("id").primaryKey(),
  softwareName: text("software_name").notNull(),
  softwareType: text("software_type").notNull(), // spy_app, parental_control, monitoring_tool, keylogger, etc.
  detectionMethod: text("detection_method"), // process, network, registry, file_system
  processName: text("process_name"),
  filePath: text("file_path"),
  registryKey: text("registry_key"),
  networkSignature: text("network_signature"),
  severity: text("severity").notNull(), // low, medium, high, critical
  isActive: boolean("is_active").default(true),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  description: text("description"),
  removalInstructions: text("removal_instructions"),
});

// Device Connections (nearby devices)
export const deviceConnections = pgTable("device_connections", {
  id: text("id").primaryKey(),
  deviceName: text("device_name"),
  deviceType: text("device_type"), // phone, camera, computer, iot, etc.
  macAddress: text("mac_address"),
  ipAddress: text("ip_address"),
  manufacturer: text("manufacturer"),
  operatingSystem: text("operating_system"),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  firstSeen: timestamp("first_seen").defaultNow().notNull(),
  connectionMethod: text("connection_method"), // wifi, bluetooth, ethernet, etc.
  isAuthorized: boolean("is_authorized").default(false),
  riskLevel: text("risk_level"), // low, medium, high
  location: text("location"), // approximate location if detectable
});

// Security Alerts
export const securityAlerts = pgTable("security_alerts", {
  id: text("id").primaryKey(),
  alertType: text("alert_type").notNull(), // suspicious_ip, spy_software, unauthorized_device, etc.
  severity: text("severity").notNull(), // low, medium, high, critical
  title: text("title").notNull(),
  description: text("description").notNull(),
  sourceIp: text("source_ip"),
  deviceId: text("device_id"),
  spywareId: text("spy_software_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  recommendations: text("recommendations"),
});

// System Logs
export const systemLogs = pgTable("system_logs", {
  id: text("id").primaryKey(),
  logType: text("log_type").notNull(), // network, security, system, error
  logLevel: text("log_level").notNull(), // info, warning, error, critical
  message: text("message").notNull(),
  details: json("details"),
  source: text("source"), // which component generated the log
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Insert schemas
export const insertNetworkConnectionSchema = createInsertSchema(networkConnections).omit({ id: true, timestamp: true });
export const insertTracerouteSchema = createInsertSchema(tracerouteData).omit({ id: true, timestamp: true });
export const insertSpySoftwareSchema = createInsertSchema(spySoftwareDetection).omit({ id: true, timestamp: true });
export const insertDeviceConnectionSchema = createInsertSchema(deviceConnections).omit({ id: true, firstSeen: true, lastSeen: true });
export const insertSecurityAlertSchema = createInsertSchema(securityAlerts).omit({ id: true, timestamp: true });
export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({ id: true, timestamp: true });

// Insert types
export type InsertNetworkConnection = z.infer<typeof insertNetworkConnectionSchema>;
export type InsertTraceroute = z.infer<typeof insertTracerouteSchema>;
export type InsertSpySoftware = z.infer<typeof insertSpySoftwareSchema>;
export type InsertDeviceConnection = z.infer<typeof insertDeviceConnectionSchema>;
export type InsertSecurityAlert = z.infer<typeof insertSecurityAlertSchema>;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;

// Select types
export type NetworkConnection = typeof networkConnections.$inferSelect;
export type TracerouteData = typeof tracerouteData.$inferSelect;
export type SpySoftwareDetection = typeof spySoftwareDetection.$inferSelect;
export type DeviceConnection = typeof deviceConnections.$inferSelect;
export type SecurityAlert = typeof securityAlerts.$inferSelect;
export type SystemLog = typeof systemLogs.$inferSelect;