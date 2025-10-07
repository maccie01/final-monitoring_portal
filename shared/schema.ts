import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
  bigint,
  doublePrecision,
  real
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (used for session-based authentication)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);


// User Profiles Tabelle für Profilnamen und Sidebar-Zugriffsberechtigungen
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(), // Bezeichnung des Profils
  startPage: varchar("start_page", { length: 100 }).default("/maps"), // Standard-Startseite für dieses Profil
  sidebar: jsonb("sidebar").$type<{
    showDashboard?: boolean;
    showMaps?: boolean;
    showNetworkMonitor?: boolean;
    showEfficiencyStrategy?: boolean;
    showObjectManagement?: boolean;
    showLogbook?: boolean;
    showGrafanaDashboards?: boolean;
    showEnergyData?: boolean;
    showSystemSetup?: boolean;
    showUserManagement?: boolean;
    showUser?: boolean;
    showEfficiencyModule?: boolean;
  }>().default({}), // JSON Zugriffsberechtigung für erlaubte Sidebar-Einträge
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users - Zentrale Benutzerverwaltung (Schema exakt nach Dokumentation)
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // VARCHAR Primary Key
  username: varchar("username", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user"), // VARCHAR statt Enum
  mandantId: integer("mandant_id").default(1),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url"),
  userProfileId: integer("user_profile_id"),
  address: jsonb("address"),
  mandantAccess: jsonb("mandant_access").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Mandants (Mandanten)
export const mandants = pgTable("mandants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  info: jsonb("info").$type<{
    adresse?: {
      strasse?: string;
      hausnummer?: string;
      plz?: string;
      ort?: string;
      land?: string;
    };
    kontakt?: {
      email?: string;
      telefon?: string;
      mobil?: string;
      website?: string;
    };
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});


// Objects - Zentrale Objekt-Verwaltung (Schema exakt nach Dokumentation)
export const objects = pgTable("objects", {
  id: serial("id").primaryKey(),
  objectid: bigint("objectid", { mode: "bigint" }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  objectType: varchar("object_type", { length: 50 }), // VARCHAR statt Enum
  status: varchar("status", { length: 50 }).default("active"), // VARCHAR statt Enum
  
  // Adress- und Standortdaten
  postalCode: varchar("postal_code", { length: 10 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Deutschland"),
  
  // Geografische Koordinaten
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Zusätzliche Informationen
  description: text("description"),
  
  // JSONB Datenfelder für flexible Strukturen
  objdata: jsonb("objdata"), // Objektdaten
  objanlage: jsonb("objanlage"), // Anlagendaten
  portdata: jsonb("portdata"), // Port-/Schnittstellendaten
  meter: jsonb("meter"), // Zählerdaten
  dashboard: jsonb("dashboard"), // Dashboard-Konfiguration
  alarm: jsonb("alarm"), // Alarmdaten
  kianalyse: jsonb("kianalyse"), // KI-Analysedaten
  statusdata: jsonb("statusdata"), // Statusdaten (JSONB)
  auswertung: jsonb("auswertung"), // Auswertungsdaten
  report: jsonb("report"), // Reportdaten
  diagramm: jsonb("diagramm"), // Diagrammdaten
  fltemp: jsonb("fltemp"), // Vorlauftemperatur-Daten (Flow)
  rttemp: jsonb("rttemp"), // Rücklauftemperatur-Daten (Return)
  energy: jsonb("energy"), // Energiedaten
  
  // Temperatur-Grenzwert
  temperaturGrenzwert: varchar("temperatur_grenzwert", { length: 50 }),
  
  // Zusätzliche JSONB-Felder (vereinfacht Mandanten-Zugriff)
  mandantAccess: jsonb("mandant_access").default("[]"),
  
  // Hierarchie und Zuordnung  
  mandantId: integer("mandant_id"),
  
  // Zeitstempel
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_objects_objectid").on(table.objectid),
  index("idx_objects_mandant_id").on(table.mandantId),
  index("idx_objects_type").on(table.objectType),
  index("idx_objects_status").on(table.status),
  index("idx_objects_city").on(table.city),
  index("idx_objects_postal_code").on(table.postalCode),
]);

// Object-Mandant Verknüpfungstabelle (ÜBERFLÜSSIG - ersetzt durch objects.mandant_access)
export const objectMandant = pgTable("object_mandant", {
  id: serial("id").primaryKey(),
  objectId: bigint("objectid", { mode: "bigint" }).notNull().unique(),
  mandantId: integer("mandant_id").notNull(),
  mandantRole: varchar("mandant_role", { length: 255 }), // VARCHAR statt Enum
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_object_mandant_objectid").on(table.objectId),
  index("idx_object_mandant_mandant_id").on(table.mandantId),
]);





// system_alerts - Systemalarme (Schema exakt nach Dokumentation)
export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  alertType: varchar("alert_type", { length: 255 }), // VARCHAR(255) statt Enum
  message: text("message").notNull(),
  objectId: bigint("object_id", { mode: "bigint" }), // Verweis auf objects
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});


// day_comp - Tagesverbrauchsdaten (Schema exakt nach Dokumentation)
export const dayComp = pgTable("day_comp", {
  counter: serial("counter").primaryKey(), // BIGSERIAL in docs, aber serial für Drizzle
  time: timestamp("_time").notNull(),
  id: bigint("id", { mode: "bigint" }).notNull(),
  log: bigint("log", { mode: "bigint" }).notNull(), // Objekt-ID-Feld (korrekt)
  tpl: text("tpl"),
  // Energiezähler-Daten
  enFirst: doublePrecision("en_first"), // Energiezählerstand Tagesbeginn
  enLast: doublePrecision("en_last"), // Energiezählerstand Tagesende
  en2First: doublePrecision("en2_first"), // Zweiter Energiezählerstand Tagesbeginn  
  en2Last: doublePrecision("en2_last"), // Zweiter Energiezählerstand Tagesende
  // Volumenzähler-Daten
  volFirst: doublePrecision("vol_first"), // Volumenzählerstand Tagesbeginn
  volLast: doublePrecision("vol_last"), // Volumenzählerstand Tagesende
  // Temperatur-Daten (vollständig nach Dokumentation)
  fltMean: real("flt_mean"), // Durchschnittliche Vorlauftemperatur
  retMean: real("ret_mean"), // Durchschnittliche Rücklauftemperatur  
  fltMax: real("flt_max"), // Maximale Vorlauftemperatur
  retMax: real("ret_max"), // Maximale Rücklauftemperatur
  fltMin: real("flt_min"), // Minimale Vorlauftemperatur
  retMin: real("ret_min"), // Minimale Rücklauftemperatur
  // Durchfluss-Daten
  floMean: real("flo_mean"), // Durchschnittlicher Durchfluss
  floMax: real("flo_max"), // Maximaler Durchfluss
  floMin: real("flo_min"), // Minimaler Durchfluss
  // Leistungsdaten
  powMean: real("pow_mean"), // Durchschnittliche Leistung
  powMax: real("pow_max"), // Maximale Leistung
  powMin: real("pow_min"), // Minimale Leistung
  // Arbeitsfeld
  wrkFirst: real("wrk_first"), // Arbeitsfeld
}, (table) => [
  index("idx_day_comp_time").on(table.time),
  index("idx_day_comp_log").on(table.log), // Objekt-ID-Index
  index("idx_day_comp_time_log").on(table.time, table.log), // Kombiniert
]);

// view_mon_comp - Monatliche Aggregation (PostgreSQL View nach Dokumentation)
export const viewMonComp = pgTable("view_mon_comp", {
  counter: serial("counter").primaryKey(), // row_number() in view
  time: timestamp("_time").notNull(), // month_date
  id: bigint("id", { mode: "bigint" }).notNull(),
  log: bigint("log", { mode: "bigint" }).notNull(),
  objectId: bigint("object_id", { mode: "bigint" }).notNull(), // log → object_id Konvertierung
  tpl: bigint("tpl", { mode: "bigint" }),
  // Energiezähler-Daten (monatlich)
  enFirst: doublePrecision("en_first"),
  enLast: doublePrecision("en_last"),
  // Differenz-Berechnungen für monatliche Verbräuche
  diffEn: doublePrecision("diff_en"), // Monatliche Energie-Differenz
  diffVol: doublePrecision("diff_vol"), // Monatliche Volumen-Differenz
});

// Settings table for system-wide, tenant-specific, and user-specific settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  key_name: varchar("key_name", { length: 255 }).notNull(), // Schlüssel - konsistent mit DB-Spaltenname
  value: jsonb("value").notNull(),
  user_id: varchar("user_id").references(() => users.id),
  mandant_id: integer("mandant_id").references(() => mandants.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_settings_category").on(table.category),
  index("idx_settings_key_name").on(table.key_name),
  index("idx_settings_user_id").on(table.user_id),
  index("idx_settings_mandant_id").on(table.mandant_id),
]);

// logbook_entries - Wartungslogbuch (Schema exakt nach Dokumentation)
export const logbookEntries = pgTable("logbook_entries", {
  id: serial("id").primaryKey(),
  objectId: bigint("object_id", { mode: "bigint" }),
  entryType: varchar("entry_type", { length: 255 }), // VARCHAR(255) statt Enum
  category: varchar("category", { length: 255 }), // VARCHAR(255) statt Enum
  priority: varchar("priority", { length: 255 }), // VARCHAR(255) statt Enum
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 255 }).default("offen"), // VARCHAR(255) statt Enum
  
  // Technician info
  technicianName: varchar("technician_name", { length: 100 }),
  technicianCompany: varchar("technician_company", { length: 100 }),
  technicianContact: varchar("technician_contact", { length: 100 }),
  
  // Time tracking
  scheduledDate: date("scheduled_date"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  workHours: decimal("work_hours", { precision: 4, scale: 2 }),
  
  // Costs
  materialCost: decimal("material_cost", { precision: 10, scale: 2 }),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  
  // Files & attachments
  attachments: jsonb("attachments"), // [{filename, url, type, size}]
  
  // Relations
  relatedAlarmId: integer("related_alarm_id"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: date("follow_up_date"),
  
  createdBy: varchar("created_by"),
  updatedBy: varchar("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_logbook_entries_object_id").on(table.objectId),
  index("idx_logbook_entries_status").on(table.status),
  index("idx_logbook_entries_scheduled_date").on(table.scheduledDate),
]);

// todo_tasks - Aufgaben-Management (Schema exakt nach Dokumentation)
export const todoTasks = pgTable("todo_tasks", {
  id: serial("id").primaryKey(),
  objectId: bigint("object_id", { mode: "bigint" }),
  logbookEntryId: integer("logbook_entry_id"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  priority: varchar("priority", { length: 255 }), // VARCHAR(255) statt Enum
  assignedTo: varchar("assigned_to", { length: 255 }),
  status: varchar("status", { length: 255 }).default("offen"), // VARCHAR(255) statt Enum
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_todo_tasks_object_id").on(table.objectId),
  index("idx_todo_tasks_status").on(table.status),
  index("idx_todo_tasks_due_date").on(table.dueDate),
]);

// Object Groups
export const objectGroups = pgTable("object_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 100 }).notNull().default("standard"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Collaboration Annotations for Real-time Team Monitoring
export const collaborationAnnotations = pgTable("collaboration_annotations", {
  id: serial("id").primaryKey(),
  
  // Target context - what is being annotated
  objectId: bigint("objectid", { mode: "bigint" }),
  contextType: varchar("context_type", { length: 50 }).notNull(), // 'temperature', 'energy', 'alarm', 'dashboard', 'grafana_panel'
  contextId: varchar("context_id", { length: 255 }), // specific identifier (e.g., panel_id, sensor_id)
  
  // Annotation content
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'note', 'warning', 'observation', 'recommendation', 'issue'
  priority: varchar("priority", { length: 20 }).default("normal"), // 'low', 'normal', 'high', 'critical'
  
  // Visual positioning for dashboard/chart annotations
  position: jsonb("position"), // {x: number, y: number, width?: number, height?: number}
  
  // Time context
  timeRange: jsonb("time_range"), // {start: timestamp, end: timestamp} for time-specific annotations
  isTemporary: boolean("is_temporary").default(false), // auto-expire after certain time
  expiresAt: timestamp("expires_at"),
  
  // Collaboration features
  tags: jsonb("tags").$type<string[]>(), // categorization tags
  assignedTo: varchar("assigned_to").references(() => users.id), // assigned team member
  status: varchar("status", { length: 50 }).default("active"), // 'active', 'resolved', 'archived'
  
  // Threading for discussions
  parentId: integer("parent_id"), // for replies/threaded comments - self-reference added in relations
  
  // Metadata
  createdBy: varchar("created_by").notNull().references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_annotations_object_id").on(table.objectId),
  index("idx_annotations_context").on(table.contextType, table.contextId),
  index("idx_annotations_created_by").on(table.createdBy),
  index("idx_annotations_status").on(table.status),
  index("idx_annotations_type").on(table.type),
  index("idx_annotations_parent_id").on(table.parentId),
]);

// Annotation reactions for team engagement
export const annotationReactions = pgTable("annotation_reactions", {
  id: serial("id").primaryKey(),
  annotationId: integer("annotation_id").notNull().references(() => collaborationAnnotations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  reactionType: varchar("reaction_type", { length: 50 }).notNull(), // 'like', 'agree', 'disagree', 'important', 'resolved'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_reactions_annotation_id").on(table.annotationId),
  index("idx_reactions_user_id").on(table.userId),
]);

// Real-time annotation subscriptions for notifications
export const annotationSubscriptions = pgTable("annotation_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  objectId: bigint("objectid", { mode: "bigint" }),
  contextType: varchar("context_type", { length: 50 }), // subscribe to specific context types
  isEnabled: boolean("is_enabled").default(true),
  notificationMethods: jsonb("notification_methods").$type<{
    inApp?: boolean;
    email?: boolean;
    realTime?: boolean;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_subscriptions_user_id").on(table.userId),
  index("idx_subscriptions_object_id").on(table.objectId),
]);

// Object Group Assignments (Many-to-Many relation between objects and object groups)


// TypeScript types for separated agent configurations
export type AgentTriggerConfig = {
  type: "interval" | "schedule" | "manual";
  interval?: number; // minutes for interval type
  schedule?: string; // cron expression for schedule type
};

export type AgentSourceConfig = {
  type: "api" | "database" | "file" | "influxdb2" | "mqtt";
  // API source
  endpoint?: string;
  method?: "GET" | "POST" | "PUT";
  headers?: Record<string, string>;
  // Database source
  query?: string;
  tableName?: string;
  // File source
  filePath?: string;
  // InfluxDB2 source
  connection?: {
    url: string;
    token: string;
    org: string;
    bucket?: string;
  };
  flux?: string;
  parameters?: Record<string, any>;
  // MQTT source
  broker?: string;
  clientId?: string;
  username?: string;
  password?: string;
  topics?: string[];
  qos?: number;
  collection?: {
    duration: number;
    maxMessages?: number;
    bufferTime?: number;
  };
};

export type AgentProcessingConfig = {
  functions?: Array<{
    type: "map" | "filter" | "aggregate" | "calculate";
    field?: string;
    expression?: string;
    condition?: string;
  }>;
  mappings?: Record<string, any>;
};

export type AgentTargetConfig = {
  type: "database" | "api" | "file";
  tableName?: string;
  field?: string;
  fields?: Record<string, string>;
  endpoint?: string;
  method?: "POST" | "PUT" | "PATCH";
  filePath?: string;
};

// Automated agents for data collection and processing
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Separated agent configurations for better modularity
  configTriggerSchema: jsonb("config_trigger_schema").notNull().$type<AgentTriggerConfig>(),
  configSourceSchema: jsonb("config_source_schema").notNull().$type<AgentSourceConfig>(),
  configProcessingSchema: jsonb("config_processing_schema").$type<AgentProcessingConfig>(),
  configTargetSchema: jsonb("config_target_schema").notNull().$type<AgentTargetConfig>(),
  
  status: varchar("status", { length: 50 }).default("active"),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  runCount: integer("run_count").default(0),
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  
  // Relations
  createdBy: varchar("created_by").references(() => users.id),
  mandantId: integer("mandant_id").references(() => mandants.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_agents_status").on(table.status),
  index("idx_agents_next_run").on(table.nextRun),
  index("idx_agents_mandant_id").on(table.mandantId),
]);

// Agent execution logs
export const agentLogs = pgTable("agent_logs", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: varchar("status", { length: 50 }).notNull(), // 'running', 'success', 'error'
  
  // Execution details
  sourceData: jsonb("source_data"), // input data from source
  processedData: jsonb("processed_data"), // data after processing
  targetData: jsonb("target_data"), // data written to target
  
  recordsProcessed: integer("records_processed").default(0),
  recordsCreated: integer("records_created").default(0),
  recordsUpdated: integer("records_updated").default(0),
  recordsErrors: integer("records_errors").default(0),
  
  errorMessage: text("error_message"),
  executionTimeMs: integer("execution_time_ms"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_agent_logs_agent_id").on(table.agentId),
  index("idx_agent_logs_start_time").on(table.startTime),
  index("idx_agent_logs_status").on(table.status),
]);

// Daily outdoor temperatures based on postal code (Tages-Außentemperaturen nach PLZ)
// Temperature-only schema based on German energy monitoring standards (GEG 2024, DIN V 18599, VDI 3807)
export const dailyOutdoorTemperatures = pgTable("daily_outdoor_temperatures", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(), // Datum der Temperaturmessung
  postalCode: varchar("postal_code", { length: 10 }).notNull(), // PLZ des Standorts
  city: varchar("city", { length: 100 }), // Stadtname (optional)

  // Temperaturdaten (min/max/mean - alle deutschen Standards: GEG, DIN V 18599, VDI 3807)
  temperatureMin: decimal("temperature_min", { precision: 4, scale: 1 }), // Tagesminimum in °C
  temperatureMax: decimal("temperature_max", { precision: 4, scale: 1 }), // Tagesmaximum in °C
  temperatureMean: decimal("temperature_mean", { precision: 4, scale: 1 }), // Tagesdurchschnitt in °C (für Heizgradtage)

  // Datenquelle und Qualität
  dataSource: varchar("data_source", { length: 100 }).default("DWD (Bright Sky)"), // Datenquelle: DWD via Bright Sky API
  dataQuality: varchar("data_quality", { length: 20 }).default("good"), // Datenqualität (good, fair, poor)

  // Metadaten
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_daily_temp_date").on(table.date),
  index("idx_daily_temp_postal_code").on(table.postalCode),
  index("idx_daily_temp_date_postal_code").on(table.date, table.postalCode),
  index("idx_daily_temp_city").on(table.city),
]);

// Relations
// Agent relations
export const agentRelations = relations(agents, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [agents.createdBy],
    references: [users.id],
  }),
  mandant: one(mandants, {
    fields: [agents.mandantId], 
    references: [mandants.id],
  }),
  logs: many(agentLogs),
}));

export const agentLogRelations = relations(agentLogs, ({ one }) => ({
  agent: one(agents, {
    fields: [agentLogs.agentId],
    references: [agents.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  mandant: one(mandants, {
    fields: [users.mandantId],
    references: [mandants.id],
  }),
  userProfile: one(userProfiles, {
    fields: [users.userProfileId],
    references: [userProfiles.id],
  }),
  settings: many(settings),
  // Agent relations
  createdAgents: many(agents),
  // Collaboration annotations relations
  createdAnnotations: many(collaborationAnnotations, { relationName: "createdBy" }),
  updatedAnnotations: many(collaborationAnnotations, { relationName: "updatedBy" }),
  assignedAnnotations: many(collaborationAnnotations, { relationName: "assignedTo" }),
  annotationReactions: many(annotationReactions),
  annotationSubscriptions: many(annotationSubscriptions),
}));

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  users: many(users),
}));

export const mandantsRelations = relations(mandants, ({ many }) => ({
  users: many(users),
  objects: many(objects),
  settings: many(settings),
  agents: many(agents),
}));

export const objectsRelations = relations(objects, ({ one, many }) => ({
  mandant: one(mandants, {
    fields: [objects.mandantId],
    references: [mandants.id],
  }),
  systemAlerts: many(systemAlerts),
  // Collaboration annotations for this object
  annotations: many(collaborationAnnotations),
  annotationSubscriptions: many(annotationSubscriptions),
}));






export const systemAlertsRelations = relations(systemAlerts, ({ one }) => ({
  object: one(objects, {
    fields: [systemAlerts.objectId],
    references: [objects.objectid],
  }),
  resolvedByUser: one(users, {
    fields: [systemAlerts.resolvedBy],
    references: [users.id],
  }),
}));

export const dayCompRelations = relations(dayComp, ({ one }) => ({
  object: one(objects, {
    fields: [dayComp.log], // log-Feld als Objekt-ID-Referenz verwenden
    references: [objects.objectid],
  }),
}));

// Insert schemas

export const insertMandantSchema = createInsertSchema(mandants).omit({ id: true, createdAt: true }).extend({
  category: z.string().optional(),
  info: z.object({
    adresse: z.object({
      strasse: z.string().optional(),
      hausnummer: z.string().optional(),
      plz: z.string().optional(),
      ort: z.string().optional(),
      land: z.string().optional(),
    }).optional(),
    kontakt: z.object({
      email: z.string().email().optional().or(z.literal("")),
      telefon: z.string().optional(),
      mobil: z.string().optional(),
      website: z.string().url().optional().or(z.literal("")),
    }).optional(),
  }).optional(),
});
export const insertObjectSchema = createInsertSchema(objects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({ id: true, createdAt: true });
export const insertDayCompSchema = createInsertSchema(dayComp).omit({ counter: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  value: z.any(), // Allow flexible JSONB content for portal configurations
});
export const insertLogbookEntrySchema = createInsertSchema(logbookEntries).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  objectId: z.bigint().or(z.number().transform(n => BigInt(n))).or(z.string().transform(s => BigInt(s))),
});
export const insertTodoTaskSchema = createInsertSchema(todoTasks).omit({ id: true, createdAt: true }).extend({
  objectId: z.bigint().or(z.number().transform(n => BigInt(n))).or(z.string().transform(s => BigInt(s))),
});

// Settings relation
export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.user_id],
    references: [users.id],
  }),
  mandant: one(mandants, {
    fields: [settings.mandant_id],
    references: [mandants.id],
  }),
}));

// Logbook relations
export const logbookEntriesRelations = relations(logbookEntries, ({ one, many }) => ({
  object: one(objects, {
    fields: [logbookEntries.objectId],
    references: [objects.objectid],
  }),
  createdByUser: one(users, {
    fields: [logbookEntries.createdBy],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [logbookEntries.updatedBy],
    references: [users.id],
  }),
  todoTasks: many(todoTasks),
}));

export const todoTasksRelations = relations(todoTasks, ({ one }) => ({
  object: one(objects, {
    fields: [todoTasks.objectId],
    references: [objects.objectid],
  }),
  logbookEntry: one(logbookEntries, {
    fields: [todoTasks.logbookEntryId],
    references: [logbookEntries.id],
  }),
}));

// Object-Mandant relations
export const objectMandantRelations = relations(objectMandant, ({ one }) => ({
  object: one(objects, {
    fields: [objectMandant.objectId],
    references: [objects.objectid],
  }),
  mandant: one(mandants, {
    fields: [objectMandant.mandantId],
    references: [mandants.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
// UserProfile type integrated into User type

export type Mandant = typeof mandants.$inferSelect;
export type ObjectType = typeof objects.$inferSelect;
export type SystemAlert = typeof systemAlerts.$inferSelect;
export type DayComp = typeof dayComp.$inferSelect;

export type InsertMandant = z.infer<typeof insertMandantSchema>;
// InsertUserProfile integrated into InsertUser type
export type InsertObject = z.infer<typeof insertObjectSchema>;
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;
export type InsertDayComp = z.infer<typeof insertDayCompSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type LogbookEntry = typeof logbookEntries.$inferSelect;

// User Activity Logs für User-Aktivitäten-Protokollierung
export const userActivityLogs = pgTable("user_activity_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // 'login', 'logout', 'created_object', 'updated_user', 'deleted_data', 'export_data'
  resourceType: varchar("resource_type", { length: 50 }), // 'object', 'user', 'mandant', 'setting', 'report'
  resourceId: varchar("resource_id", { length: 50 }), // ID der betroffenen Ressource
  details: jsonb("details"), // {objectName: "Test", oldValue: {...}, newValue: {...}}
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6 Support
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_user_activity_logs_user_id").on(table.userId),
  index("idx_user_activity_logs_action").on(table.action),
  index("idx_user_activity_logs_timestamp").on(table.timestamp),
  index("idx_user_activity_logs_resource").on(table.resourceType, table.resourceId),
]);

export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs).omit({ id: true, timestamp: true });
export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type InsertLogbookEntry = z.infer<typeof insertLogbookEntrySchema>;
export type TodoTask = typeof todoTasks.$inferSelect;
export type InsertTodoTask = z.infer<typeof insertTodoTaskSchema>;

// Object Groups schemas
export const insertObjectGroupSchema = createInsertSchema(objectGroups).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertObjectGroup = z.infer<typeof insertObjectGroupSchema>;
export type ObjectGroup = typeof objectGroups.$inferSelect;


// Object-Mandant Types  
export const insertObjectMandantSchema = createInsertSchema(objectMandant).omit({ id: true, createdAt: true });
export type InsertObjectMandant = z.infer<typeof insertObjectMandantSchema>;
export type ObjectMandant = typeof objectMandant.$inferSelect;

// User Profiles Schema und Typen
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// Collaboration Annotations Relations
export const collaborationAnnotationsRelations = relations(collaborationAnnotations, ({ one, many }) => ({
  object: one(objects, {
    fields: [collaborationAnnotations.objectId],
    references: [objects.objectid],
  }),
  createdByUser: one(users, {
    fields: [collaborationAnnotations.createdBy],
    references: [users.id],
    relationName: "createdBy",
  }),
  updatedByUser: one(users, {
    fields: [collaborationAnnotations.updatedBy],
    references: [users.id],
    relationName: "updatedBy",
  }),
  assignedToUser: one(users, {
    fields: [collaborationAnnotations.assignedTo],
    references: [users.id],
    relationName: "assignedTo",
  }),
  // Self-reference for threading
  parent: one(collaborationAnnotations, {
    fields: [collaborationAnnotations.parentId],
    references: [collaborationAnnotations.id],
    relationName: "parent",
  }),
  replies: many(collaborationAnnotations, { relationName: "parent" }),
  reactions: many(annotationReactions),
}));

export const annotationReactionsRelations = relations(annotationReactions, ({ one }) => ({
  annotation: one(collaborationAnnotations, {
    fields: [annotationReactions.annotationId],
    references: [collaborationAnnotations.id],
  }),
  user: one(users, {
    fields: [annotationReactions.userId],
    references: [users.id],
  }),
}));

export const annotationSubscriptionsRelations = relations(annotationSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [annotationSubscriptions.userId],
    references: [users.id],
  }),
  object: one(objects, {
    fields: [annotationSubscriptions.objectId],
    references: [objects.objectid],
  }),
}));

// Collaboration Annotations Schemas and Types
export const insertCollaborationAnnotationSchema = createInsertSchema(collaborationAnnotations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  tags: z.array(z.string()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
});

export type InsertCollaborationAnnotation = z.infer<typeof insertCollaborationAnnotationSchema>;
export type CollaborationAnnotation = typeof collaborationAnnotations.$inferSelect;

export const insertAnnotationReactionSchema = createInsertSchema(annotationReactions).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertAnnotationReaction = z.infer<typeof insertAnnotationReactionSchema>;
export type AnnotationReaction = typeof annotationReactions.$inferSelect;

export const insertAnnotationSubscriptionSchema = createInsertSchema(annotationSubscriptions).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  notificationMethods: z.object({
    inApp: z.boolean().optional(),
    email: z.boolean().optional(),
    realTime: z.boolean().optional(),
  }).optional(),
});
export type InsertAnnotationSubscription = z.infer<typeof insertAnnotationSubscriptionSchema>;
export type AnnotationSubscription = typeof annotationSubscriptions.$inferSelect;

// Agent Schemas and Types
export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRun: true,
  nextRun: true,
  runCount: true,
  errorCount: true,
  lastError: true,
}).extend({
  config: z.object({
    trigger: z.object({
      type: z.enum(["interval", "schedule", "manual"]),
      interval: z.number().optional(),
      schedule: z.string().optional(),
    }),
    source: z.object({
      type: z.enum(["api", "database", "file"]),
      endpoint: z.string().optional(),
      method: z.enum(["GET", "POST", "PUT"]).optional(),
      headers: z.record(z.string()).optional(),
      query: z.string().optional(),
      tableName: z.string().optional(),
      filePath: z.string().optional(),
    }),
    processing: z.object({
      functions: z.array(z.object({
        type: z.enum(["map", "filter", "aggregate", "calculate"]),
        field: z.string().optional(),
        expression: z.string().optional(),
        condition: z.string().optional(),
      })).optional(),
      mappings: z.record(z.any()).optional(),
    }).optional(),
    target: z.object({
      type: z.enum(["database", "api", "file"]),
      tableName: z.string().optional(),
      field: z.string().optional(),
      endpoint: z.string().optional(),
      method: z.enum(["POST", "PUT", "PATCH"]).optional(),
      filePath: z.string().optional(),
    }),
  }),
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export const insertAgentLogSchema = createInsertSchema(agentLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAgentLog = z.infer<typeof insertAgentLogSchema>;
export type AgentLog = typeof agentLogs.$inferSelect;

// Daily Outdoor Temperatures Schemas and Types
export const insertDailyOutdoorTemperatureSchema = createInsertSchema(dailyOutdoorTemperatures).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertDailyOutdoorTemperature = z.infer<typeof insertDailyOutdoorTemperatureSchema>;
export type DailyOutdoorTemperature = typeof dailyOutdoorTemperatures.$inferSelect;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Benutzername erforderlich"),
  password: z.string().min(1, "Passwort erforderlich")
});

export type LoginCredentials = z.infer<typeof loginSchema>;

