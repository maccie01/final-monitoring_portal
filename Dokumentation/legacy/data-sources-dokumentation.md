# Data Sources - Erweiterte Datenquellen für Agenten-System

## Überblick

Dieses Dokument beschreibt erweiterte Datenquellen für das Agenten-System, mit Fokus auf **InfluxDB2** und **MQTT**-Integration. Diese Datenquellen ermöglichen die Anbindung von Zeitreihendatenbanken und IoT-Geräten über Messaging-Protokolle.

## 1. InfluxDB2 Integration

### Überblick
InfluxDB2 ist eine hochperformante Zeitreihendatenbank, die sich ideal für die Speicherung und Abfrage von Sensor-, Monitoring- und IoT-Daten eignet.

### Konfiguration

#### Agent-Konfiguration für InfluxDB2
```json
{
  "name": "InfluxDB2-Sensor-Agent",
  "description": "Sammelt Temperatur- und Energiedaten aus InfluxDB2",
  "configTriggerSchema": {
    "type": "interval",
    "interval": 15
  },
  "configSourceSchema": {
    "type": "influxdb2",
    "connection": {
      "url": "http://localhost:8086",
      "token": "{INFLUXDB_TOKEN}",
      "org": "heizungsmanager",
      "bucket": "sensor_data"
    },
    "query": {
      "flux": "from(bucket: \"sensor_data\") |> range(start: -1h) |> filter(fn: (r) => r._measurement == \"temperature\")",
      "timeRange": "1h"
    }
  },
  "configProcessingSchema": {
    "functions": [
      {
        "type": "map",
        "field": "temperature_celsius",
        "expression": "parseFloat(_value)"
      },
      {
        "type": "filter",
        "condition": "temperature_celsius > -40 && temperature_celsius < 100"
      }
    ]
  },
  "configTargetSchema": {
    "type": "database",
    "tableName": "daily_outdoor_temperatures",
    "field": "temperature_mean"
  }
}
```

### Flux Query Beispiele

#### 1. Temperatur-Daten der letzten Stunde
```flux
from(bucket: "sensor_data")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> filter(fn: (r) => r.location == "hannover")
  |> filter(fn: (r) => r._field == "value")
  |> aggregateWindow(every: 10m, fn: mean, createEmpty: false)
  |> yield(name: "mean_temperature")
```

#### 2. Energieverbrauch nach Objekten
```flux
from(bucket: "energy_data")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "energy_consumption")
  |> filter(fn: (r) => r._field == "kwh")
  |> group(columns: ["object_id"])
  |> aggregateWindow(every: 1h, fn: sum, createEmpty: false)
  |> map(fn: (r) => ({ r with efficiency: r._value / r.area }))
  |> yield(name: "energy_efficiency")
```

#### 3. Alarmschwellen überschritten
```flux
from(bucket: "monitoring")
  |> range(start: -30m)
  |> filter(fn: (r) => r._measurement == "system_status")
  |> filter(fn: (r) => r._value > 80.0 or r._value < 5.0)
  |> map(fn: (r) => ({ 
      r with 
      alert_type: if r._value > 80.0 then "overheat" else "underheat",
      severity: if r._value > 90.0 or r._value < 0.0 then "critical" else "warning"
  }))
  |> yield(name: "temperature_alerts")
```

#### 4. Durchschnittswerte pro Stunde mit Trend
```flux
import "experimental/aggregate"

data = from(bucket: "sensors")
  |> range(start: -7d)
  |> filter(fn: (r) => r._measurement == "efficiency")
  |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)

trend = data
  |> derivative(unit: 1h, nonNegative: false)
  |> map(fn: (r) => ({ r with _value: r._value, trend: if r._value > 0.0 then "rising" else "falling" }))

data
  |> join(tables: {data: data, trend: trend}, on: ["_time", "object_id"])
  |> yield(name: "efficiency_with_trend")
```

### Erweiterte Konfigurationsoptionen

#### Mehrere Buckets abfragen
```json
{
  "configSourceSchema": {
    "type": "influxdb2",
    "connection": {
      "url": "http://influx.monitoring.direct:8086",
      "token": "{INFLUXDB_TOKEN}",
      "org": "portal_org"
    },
    "queries": [
      {
        "name": "temperature_data",
        "bucket": "sensor_data",
        "flux": "from(bucket: \"sensor_data\") |> range(start: -1h) |> filter(fn: (r) => r._measurement == \"temperature\")"
      },
      {
        "name": "energy_data",
        "bucket": "energy_readings", 
        "flux": "from(bucket: \"energy_readings\") |> range(start: -1h) |> filter(fn: (r) => r._measurement == \"power\")"
      }
    ]
  }
}
```

#### Parametrisierte Queries
```json
{
  "configSourceSchema": {
    "type": "influxdb2",
    "connection": {
      "url": "http://localhost:8086",
      "token": "{INFLUXDB_TOKEN}",
      "org": "heizungsmanager",
      "bucket": "dynamic_data"
    },
    "query": {
      "flux": "from(bucket: \"{bucket}\") |> range(start: {timeRange}) |> filter(fn: (r) => r.object_id == \"{objectId}\")",
      "parameters": {
        "bucket": "sensor_data",
        "timeRange": "-1h",
        "objectId": "359404231032203"
      }
    }
  }
}
```

## 2. MQTT Integration

### Überblick
MQTT (Message Queuing Telemetry Transport) ist ein leichtgewichtiges Messaging-Protokoll für IoT-Geräte und Sensor-Netzwerke.

### Basis-Konfiguration

#### MQTT als Datenquelle
```json
{
  "name": "MQTT-IoT-Collector",
  "description": "Sammelt Sensordaten über MQTT",
  "configTriggerSchema": {
    "type": "interval",
    "interval": 5
  },
  "configSourceSchema": {
    "type": "mqtt",
    "connection": {
      "broker": "mqtt://mqtt.monitoring.direct:1883",
      "clientId": "agent_collector_{timestamp}",
      "username": "{MQTT_USER}",
      "password": "{MQTT_PASSWORD}",
      "keepalive": 60,
      "clean": true
    },
    "subscription": {
      "topics": [
        "sensors/+/temperature",
        "sensors/+/humidity", 
        "heating/+/status",
        "alarms/critical/+"
      ],
      "qos": 1
    },
    "collection": {
      "duration": 300,
      "maxMessages": 1000,
      "bufferTime": 10
    }
  },
  "configProcessingSchema": {
    "functions": [
      {
        "type": "map",
        "field": "object_id",
        "expression": "topic.split('/')[1]"
      },
      {
        "type": "map",
        "field": "sensor_type", 
        "expression": "topic.split('/')[2]"
      },
      {
        "type": "filter",
        "condition": "payload && payload.value !== null"
      }
    ]
  },
  "configTargetSchema": {
    "type": "database",
    "tableName": "objects",
    "field": "statusdata"
  }
}
```

### Topic-Verwaltung und Filterung

#### Topic-Filter-Patterns
```json
{
  "configSourceSchema": {
    "type": "mqtt",
    "subscription": {
      "topics": [
        {
          "pattern": "building/+/floor/+/room/+/temp",
          "name": "room_temperatures",
          "filter": {
            "building": ["building_a", "building_b"],
            "floor": [1, 2, 3, 4],
            "room": "*"
          }
        },
        {
          "pattern": "energy/+/consumption",
          "name": "energy_readings",
          "filter": {
            "object_id": ["359404231032203", "359404231032104"]
          }
        },
        {
          "pattern": "alarms/+/+",
          "name": "alarm_messages",
          "filter": {
            "severity": ["critical", "warning"],
            "system": "*"
          }
        }
      ]
    }
  }
}
```

#### Erweiterte Topic-Selektion
```json
{
  "configSourceSchema": {
    "type": "mqtt",
    "connection": {
      "broker": "mqtts://secure-mqtt.portal.direct:8883",
      "ssl": {
        "ca": "/certs/ca.crt",
        "cert": "/certs/client.crt", 
        "key": "/certs/client.key"
      }
    },
    "subscription": {
      "dynamicTopics": {
        "basePattern": "objects/{objectId}/sensors/+",
        "objectIds": [
          "359404231032203",
          "359404231032104", 
          "359404231032301"
        ],
        "sensorTypes": ["temperature", "pressure", "flow", "energy"]
      },
      "qos": 2,
      "retain": false
    },
    "messageProcessing": {
      "format": "json",
      "timestampField": "timestamp",
      "valueField": "value",
      "metadataFields": ["quality", "unit", "source"]
    }
  }
}
```

### Message-Format-Handler

#### JSON-Nachrichten
```json
{
  "messageProcessing": {
    "format": "json",
    "schema": {
      "timestamp": "number",
      "value": "number", 
      "quality": "string",
      "unit": "string",
      "metadata": "object"
    },
    "transformation": {
      "timestamp": "new Date(timestamp * 1000).toISOString()",
      "value": "parseFloat(value)",
      "object_id": "topic.split('/')[1]",
      "sensor_type": "topic.split('/')[3]"
    }
  }
}
```

#### Binary/Buffer-Nachrichten  
```json
{
  "messageProcessing": {
    "format": "binary",
    "decoder": "modbus_rtu",
    "mapping": {
      "temperature": {
        "offset": 0,
        "length": 2,
        "type": "int16",
        "scale": 0.1
      },
      "pressure": {
        "offset": 2, 
        "length": 2,
        "type": "uint16",
        "scale": 0.01
      }
    }
  }
}
```

### Praxis-Beispiele

#### 1. Temperatur-Monitoring
```json
{
  "name": "MQTT-Temperatur-Monitor",
  "configTriggerSchema": {
    "type": "interval", 
    "interval": 10
  },
  "configSourceSchema": {
    "type": "mqtt",
    "connection": {
      "broker": "mqtt://iot.portal.direct:1883",
      "clientId": "temp_monitor_001"
    },
    "subscription": {
      "topics": [
        "sensors/+/temperature",
        "outdoor/+/temp"
      ]
    },
    "collection": {
      "duration": 600,
      "aggregation": "last"
    }
  },
  "configProcessingSchema": {
    "functions": [
      {
        "type": "map",
        "field": "location_id",
        "expression": "topic.split('/')[1]"
      },
      {
        "type": "filter", 
        "condition": "value >= -50 && value <= 100"
      },
      {
        "type": "map",
        "field": "alert_status",
        "expression": "value > 80 ? 'critical' : value > 60 ? 'warning' : 'normal'"
      }
    ]
  },
  "configTargetSchema": {
    "type": "database",
    "tableName": "daily_outdoor_temperatures",
    "fields": {
      "temperature_mean": "value",
      "postal_code": "location_id",
      "data_source": "'mqtt_sensor'"
    }
  }
}
```

#### 2. Energieverbrauch-Sammlung
```json
{
  "name": "MQTT-Energie-Collector",
  "configTriggerSchema": {
    "type": "schedule",
    "schedule": "*/15 * * * *"
  },
  "configSourceSchema": {
    "type": "mqtt", 
    "subscription": {
      "topics": [
        "energy/+/consumption",
        "energy/+/generation",
        "meters/+/kwh"
      ]
    },
    "collection": {
      "duration": 900,
      "aggregation": "sum"
    }
  },
  "configProcessingSchema": {
    "functions": [
      {
        "type": "map",
        "field": "object_id",
        "expression": "topic.split('/')[1]"
      },
      {
        "type": "calculate",
        "field": "efficiency_kwh_m2",
        "expression": "value / building_area"
      }
    ]
  },
  "configTargetSchema": {
    "type": "database",
    "tableName": "objects",
    "field": "energy"
  }
}
```

#### 3. Alarm-Weiterleitung
```json
{
  "name": "MQTT-Alarm-Router", 
  "configTriggerSchema": {
    "type": "interval",
    "interval": 1
  },
  "configSourceSchema": {
    "type": "mqtt",
    "subscription": {
      "topics": [
        "alarms/critical/+",
        "alarms/warning/+", 
        "system/+/fault"
      ],
      "qos": 2
    },
    "collection": {
      "duration": 60,
      "mode": "immediate"
    }
  },
  "configProcessingSchema": {
    "functions": [
      {
        "type": "map", 
        "field": "system_id",
        "expression": "topic.split('/')[2]"
      },
      {
        "type": "map",
        "field": "alert_type",
        "expression": "topic.split('/')[1]"
      }
    ]
  },
  "configTargetSchema": {
    "type": "database",
    "tableName": "system_alerts",
    "fields": {
      "alert_type": "alert_type",
      "message": "payload.message",
      "system_id": "system_id"
    }
  }
}
```

## Erweiterte Konfiguration

### Multi-Source-Kombination
```json
{
  "name": "Multi-Source-Hybrid-Agent",
  "sources": [
    {
      "name": "influx_historical",
      "type": "influxdb2",
      "query": "from(bucket: \"history\") |> range(start: -24h)"
    },
    {
      "name": "mqtt_realtime", 
      "type": "mqtt",
      "topics": ["realtime/+/current"]
    }
  ],
  "configProcessingSchema": {
    "functions": [
      {
        "type": "join",
        "sources": ["influx_historical", "mqtt_realtime"],
        "key": "object_id"
      }
    ]
  }
}
```

### Fehlerbehandlung und Retry-Logic
```json
{
  "configSourceSchema": {
    "type": "mqtt",
    "connection": {
      "broker": "mqtt://mqtt.portal.direct:1883",
      "reconnectPeriod": 5000,
      "connectTimeout": 30000
    },
    "errorHandling": {
      "maxRetries": 3,
      "retryDelay": 1000,
      "exponentialBackoff": true,
      "fallbackTopics": [
        "backup/sensors/+/data"
      ]
    }
  }
}
```

## Integration in das Agenten-System

### Schema-Erweiterung
Die bestehende Agent-Konfiguration wird um diese neuen Source-Typen erweitert:

```typescript
// In shared/schema.ts - Agent config erweitern
source: {
  type: "api" | "database" | "file" | "influxdb2" | "mqtt";
  
  // InfluxDB2 spezifisch
  connection?: {
    url: string;
    token: string;
    org: string;
    bucket?: string;
  };
  query?: {
    flux: string;
    parameters?: Record<string, any>;
  };
  
  // MQTT spezifisch  
  broker?: string;
  subscription?: {
    topics: string[];
    qos?: number;
  };
  collection?: {
    duration: number;
    maxMessages?: number;
  };
}
```

### Implementation Hooks
```typescript
// In agent-system-implementierung.ts erweitern
private async datenVonQuelleAbrufen(quelle: AgentConfig['quelle']): Promise<any[]> {
  switch (quelle.typ) {
    case 'influxdb2':
      return await this.datenVonInfluxDB2Abrufen(quelle);
    
    case 'mqtt':
      return await this.datenVonMQTTAbrufen(quelle);
    
    // ... existing cases
  }
}
```

## Monitoring und Debugging

### InfluxDB2 Query-Performance
```json
{
  "monitoring": {
    "queryTimeout": 30000,
    "maxDataPoints": 10000,
    "performanceLogging": true,
    "cacheResults": {
      "enabled": true,
      "ttl": 300
    }
  }
}
```

### MQTT Connection Health
```json
{
  "monitoring": {
    "connectionStatus": true,
    "messageCount": true,
    "topicStatistics": true,
    "errorRates": true,
    "latencyTracking": true
  }
}
```

---

*Data Sources Dokumentation erstellt: Januar 2025*  
*Integration: Agenten-System kompatibel*  
*Status: Konzept & Implementierung bereit*