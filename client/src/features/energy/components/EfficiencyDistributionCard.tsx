import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface ObjectEfficiency {
  objectId: number;
  name: string;
  address: string;
  area: number;
  verbrauch: number;
  efficiencyPerM2: number;
  efficiencyClass: string;
  color: string;
}

interface EfficiencyDistributionCardProps {
  objects: ObjectEfficiency[];
  timeRange: string;
}

const getTimeRangeLabel = (timeRange: string) => {
  switch (timeRange) {
    case 'last-year': return '2024';
    case 'last-2year': return '2023';
    case 'last-365-days': return '365Tage';
    default: return timeRange;
  }
};

export default function EfficiencyDistributionCard({ objects, timeRange }: EfficiencyDistributionCardProps) {
  /**
   * DATENQUELLE: /api/test-efficiency-analysis
   * 
   * Diese Komponente zeigt die Verbrauchsverteilung nach Effizienzklassen an.
   * Die Daten stammen aus der API-Endpoint /api/test-efficiency-analysis/{objectId}?timeRange=last-year
   * 
   * Berechnung:
   * - obj.verbrauch = Math.round(efficiency.yearly.totalKwh)
   * - obj.efficiencyPerM2 = Math.round(efficiency.yearly.efficiencyPerM2)
   * - Gesamtverbrauch = Summe aller obj.verbrauch
   * - Prozent pro Klasse = (Klassenverbrauch / Gesamtverbrauch) * 100
   * 
   * 
   * === API IMPLEMENTIERUNG (server/controllers/efficiencyController.ts) ===
   * 
   * 1. OBJEKTDATEN LADEN (Portal-DB):
   *    - Query: SELECT objects WHERE objectid = $1
   *    - Extrahiert: mandant_id, objdata.area, meter (Zähler-IDs)
   *    - Zugriffsprüfung: mandant_id = user.mandantId ODER user.mandantId IN mandant_access
   * 
   * 2. NETZ-ZÄHLER FINDEN:
   *    - Sucht in object.meter nach Pattern "^Z20541" (Netz-Zähler)
   *    - Extrahiert Zähler-ID für Energy-DB Abfrage
   * 
   * 3. ENERGY-DB KONFIGURATION (Settings-DB):
   *    - Query: SELECT settings WHERE category = 'data' AND key_name = 'dbEnergyData_view_day_comp'
   *    - Tabelle: settings
   *    - Settings-DB Eintrag (Beispiel):
   *      {
   *        id: 300,
   *        category: "data",
   *        key_name: "dbEnergyData_view_day_comp",
   *        value: {
   *          dbEnergyData: {
   *            host: "db-external.example.com",
   *            port: 5432,
   *            database: "energy_production",
   *            username: "energy_reader",
   *            password: "***********",
   *            ssl: true,
   *            table: "view_day_comp",
   *            connectionTimeout: 15000
   *          }
   *        }
   *      }
   *    - Extrahiert: host, port, database, user, password für externe Energy-DB
   * 
   * 4. ENERGIEDATEN ABFRAGE (Externe Energy-DB):
   *    - Tabelle: view_day_comp
   *    - Spalten der Tabelle:
   *      • id: bigint (Zähler-ID, z.B. 51515810)
   *      • _time: timestamp (Zeitstempel, z.B. '2024-01-15 00:00:00')
   *      • en_first: bigint (Zählerstand Start in Wh, z.B. 7351263232)
   *      • en_last: bigint (Zählerstand Ende in Wh, z.B. 7423894016)
   *      • days_count: integer (Anzahl Tage, z.B. 31)
   *    
   *    - Zeitraum-Filter (dynamisch):
   *      • last-year: _time >= '2024-01-01' AND _time < '2025-01-01'
   *      • last-2year: _time >= '2023-01-01' AND _time < '2024-01-01'
   *      • last-365-days: _time >= NOW() - INTERVAL '365 days'
   *    
   *    - Query-Logik (CTE):
   *      WITH monthly_data AS (
   *        SELECT 
   *          DATE_TRUNC('month', _time) as month,
   *          MIN(en_first) as month_start,      -- z.B. 7351263232
   *          MAX(en_last) as month_end,         -- z.B. 7423894016
   *          COUNT(*) as days_count,            -- z.B. 31
   *          MIN(_time) as month_first_date,
   *          MAX(_time) as month_last_date
   *        FROM view_day_comp 
   *        WHERE id = $1 AND [Zeitraum-Filter]
   *        GROUP BY DATE_TRUNC('month', _time)
   *      ),
   *      totals AS (
   *        SELECT 
   *          MIN(month_start) as period_start,  -- Erster Zählerstand
   *          MAX(month_end) as period_end,      -- Letzter Zählerstand
   *          SUM(month_end - month_start) as total_kwh,  -- Summe aller Monate
   *          SUM(days_count) as total_days,     -- Gesamtanzahl Tage
   *          COUNT(*) as total_months           -- Anzahl Monate
   *        FROM monthly_data
   *      )
   *    
   *    - Beispiel Rückgabewerte:
   *      • period_start: 7351263232 (Wh)
   *      • period_end: 8176588800 (Wh)
   *      • total_kwh: 825325568 (Wh) → 825325.568 kWh
   *      • total_days: 362
   *      • area: 10555 m²
   *      → efficiencyPerM2 = Math.round(825325.568 / 10555) = 78 kWh/m²
   *      
   * 5. BERECHNUNG:
   *    - totalKwh = (en_last - en_first) / 1000  [Wh → kWh]
   *    - efficiencyPerM2 = Math.round(totalKwh / area)  [kWh/m²]
   * 
   * 6. API RESPONSE:
   *    {
   *      objectId: number,
   *      timeRange: string,
   *      meterId: number,
   *      area: number,
   *      yearly: {
   *        totalKwh: number,           // ← Dashboard verwendet diesen Wert
   *        efficiencyPerM2: number,    // ← Dashboard verwendet diesen Wert
   *        en_first: number,
   *        en_last: number,
   *        unit: "kWh/m²/Jahr"
   *      }
   *    }
   */
  
  // Berechne Klassensummen aus allen Objekten
  const allObjects = objects.filter(obj => obj.efficiencyPerM2 && obj.efficiencyPerM2 > 0);
  
  // Gruppiere nach Effizienzklassen
  const groupedByClass = allObjects.reduce((groups, obj) => {
    const className = obj.efficiencyClass;
    if (!groups[className]) {
      groups[className] = [];
    }
    groups[className].push(obj);
    return groups;
  }, {} as { [key: string]: typeof allObjects });

  // Berechne Gesamtverbrauch einmal vorab  
  const totalAllVerbrauch = allObjects.reduce((sum, obj) => sum + (obj.verbrauch || 0), 0);
  
  // Berechne Summen für jede Klasse (F bis A+)
  const classOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'A+'];
  const pieData = classOrder
    .filter(cls => groupedByClass[cls])
    .map(className => {
      const classObjects = groupedByClass[className];
      const totalVerbrauch = classObjects.reduce((sum, obj) => sum + (obj.verbrauch || 0), 0);
      const percentage = totalAllVerbrauch > 0 ? (totalVerbrauch / totalAllVerbrauch * 100) : 0;
      const firstObj = classObjects[0];
      const objectCount = classObjects.length;
      
      return {
        name: `Klasse ${className}`,
        className: className,
        value: totalVerbrauch,
        percentage: Math.round(percentage),
        color: firstObj.color,
        formattedValue: totalVerbrauch.toLocaleString('de-DE'),
        objectCount: objectCount
      };
    });

  const formatNumber = (num: number) => num.toLocaleString('de-DE');
  const totalKwh = allObjects.reduce((sum, obj) => sum + (obj.verbrauch || 0), 0);

  if (pieData.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="font-medium text-gray-900 mb-4 text-center">
        <span className="font-bold">Verbrauchsverteilung</span> <br /> nach Effizienzklassen
      </h3>
      <div className="text-xs text-gray-600 text-center mb-4">
        Gesamtverbrauch ({getTimeRangeLabel(timeRange)})<br />
        {formatNumber(totalKwh)} kWh
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              label={(props) => {
                const RADIAN = Math.PI / 180;
                const { cx, cy, midAngle, innerRadius, outerRadius, percent, payload } = props;
                const isLarge = percent >= 0.15; // 15% Schwelle
                
                if (isLarge) {
                  // Große Segmente: INNEN, weiße Schrift, OHNE Linien
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  
                  return (
                    <text 
                      x={x} 
                      y={y} 
                      fill="white" 
                      textAnchor="middle" 
                      dominantBaseline="central"
                      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                    >
                      <tspan fontSize="22" fontWeight="700">
                        {payload.className}
                      </tspan>
                      <tspan x={x} dy="20" fontSize="18" fontWeight="600">
                        {Math.round(percent * 100)}%[{payload.objectCount}]
                      </tspan>
                    </text>
                  );
                } else {
                  // Kleine Segmente: AUßEN, schwarze Schrift, MIT Linien
                  const radius = outerRadius + 16;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  
                  return (
                    <text 
                      x={x} 
                      y={y} 
                      fill="black" 
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                    >
                      <tspan fontSize="12" fontWeight="700">
                        {payload.className}
                      </tspan>
                    </text>
                  );
                }
              }}
              labelLine={(props) => {
                const RADIAN = Math.PI / 180;
                const { cx, cy, midAngle, outerRadius, percent } = props;
                
                // Nur für KLEINE Segmente Linien zeichnen
                if (percent >= 0.15) return <line x1={0} y1={0} x2={0} y2={0} stroke="transparent" strokeWidth={0} />;
                
                // Linie von Segment-Rand zu Label
                const r1 = outerRadius + 4;
                const r2 = outerRadius + 14;
                const x1 = cx + r1 * Math.cos(-midAngle * RADIAN);
                const y1 = cy + r1 * Math.sin(-midAngle * RADIAN);
                const x2 = cx + r2 * Math.cos(-midAngle * RADIAN);
                const y2 = cy + r2 * Math.sin(-midAngle * RADIAN);
                
                return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111" strokeWidth={1} />;
              }}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Eigene Legende unter dem Chart */}
      <div className="mt-0 text-sm text-left">
        {pieData.map((entry, index) => (
          <div key={index} className="mb-1">
            <span className="text-gray-700">
              <span 
                className="px-2 py-0.5 rounded text-white font-medium"
                style={{ backgroundColor: entry.color }}
              >
                {entry.name}:
              </span> [{entry.objectCount} Objekte] <br />
              <span className="text-xs">∑ {entry.formattedValue} kWh ({entry.percentage}%)</span>
            </span>
          </div>
        ))}
      </div>
      
      {/* Erklärung oberhalb des Farbschemas */}
      <div className="text-xs text-gray-400 text-center mt-1 mb-1">
        normierte GEG-Analyse : Verbrauch je m²
      </div>
      
      {/* Effizienz-Farbschema */}
      <div className="w-full">
        <div className="flex rounded-md overflow-hidden border border-gray-200 w-full">
          <div className="flex-1 bg-green-500 text-white text-xs text-center py-2 font-medium">
            <div>A+</div>
            <div>≤30</div>
          </div>
          <div className="flex-1 bg-green-400 text-white text-xs text-center py-2 font-medium">
            <div>A</div>
            <div>≤50</div>
          </div>
          <div className="flex-1 bg-yellow-400 text-white text-xs text-center py-2 font-medium">
            <div>B</div>
            <div>≤75</div>
          </div>
          <div className="flex-1 bg-orange-400 text-white text-xs text-center py-2 font-medium">
            <div>C</div>
            <div>≤100</div>
          </div>
          <div className="flex-1 bg-orange-600 text-white text-xs text-center py-2 font-medium">
            <div>D</div>
            <div>≤130</div>
          </div>
          <div className="flex-1 bg-red-500 text-white text-xs text-center py-2 font-medium">
            <div>E</div>
            <div>≤160</div>
          </div>
          <div className="flex-1 bg-red-700 text-white text-xs text-center py-2 font-medium">
            <div>F</div>
            <div>≤200</div>
          </div>
        </div>
      </div>
    </div>
  );
}
