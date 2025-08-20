import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const connections = pgTable("connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: text("ip_address").notNull(),
  port: integer("port"),
  protocol: text("protocol"),
  processName: text("process_name"),
  location: jsonb("location"),
  physicalAddress: text("physical_address"),
  country: text("country"),
  city: text("city"),
  riskLevel: text("risk_level").notNull().default('low'), // low, medium, high
  isVpn: boolean("is_vpn").default(false),
  detectionMethod: text("detection_method").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const spyAlerts = pgTable("spy_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // low, medium, high, critical
  detectionMethod: text("detection_method").notNull(),
  processName: text("process_name"),
  processPath: text("process_path"),
  ipAddress: text("ip_address"),
  confidence: integer("confidence").notNull(), // 0-100
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  resolved: boolean("resolved").default(false),
});

export const geoCache = pgTable("geo_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: text("ip_address").notNull().unique(),
  country: text("country"),
  city: text("city"),
  region: text("region"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  physicalAddress: text("physical_address"),
  isp: text("isp"),
  organization: text("organization"),
  isVpn: boolean("is_vpn").default(false),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const systemScan = pgTable("system_scan", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scanType: text("scan_type").notNull(), // full, quick, process, network
  status: text("status").notNull(), // running, completed, failed
  findings: jsonb("findings"),
  threatsFound: integer("threats_found").default(0),
  duration: integer("duration"), // in seconds
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Insert schemas
export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  timestamp: true,
});

export const insertSpyAlertSchema = createInsertSchema(spyAlerts).omit({
  id: true,
  timestamp: true,
  resolved: true,
});

export const insertGeoCacheSchema = createInsertSchema(geoCache).omit({
  id: true,
  lastUpdated: true,
});

export const insertSystemScanSchema = createInsertSchema(systemScan).omit({
  id: true,
  timestamp: true,
});

// Types
export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type SpyAlert = typeof spyAlerts.$inferSelect;
export type InsertSpyAlert = z.infer<typeof insertSpyAlertSchema>;

export type GeoCache = typeof geoCache.$inferSelect;
export type InsertGeoCache = z.infer<typeof insertGeoCacheSchema>;

export type SystemScan = typeof systemScan.$inferSelect;
export type InsertSystemScan = z.infer<typeof insertSystemScanSchema>;
