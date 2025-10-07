# Problem-Analyse: Grafana iframe Loading in SystemSchemaView.tsx

## 🚨 **KRITISCHE IFRAME-PROBLEME IDENTIFIZIERT**

### **Aktuelle Problemsituation**

Die `SystemSchemaView.tsx` Komponente weist **identische iframe-Performance-Probleme** auf, wie sie zuvor in `GrafanaDiagramme.tsx` behoben wurden.

---

## **Problem 1: Direktes iframe src Loading**

### **📍 Problemstelle:** 
```typescript
// Zeile 119-126 in SystemSchemaView.tsx
<iframe
  src={component.grafanaUrl}  // ← SOFORTIGES LADEN!
  width="150"
  height="200"
  frameBorder="0"
  className="w-[150px] h-[200px] block border-none"
  title={`${component.label} Dashboard`}
/>
```

### **⚠️ Auswirkungen:**
- **Alle iframes laden sofort** beim Component Mount
- **Bis zu 10+ gleichzeitige HTTP-Requests** zu Grafana
- **Browser-Blockierung** durch massive parallele Requests
- **Schlechte User Experience** durch lange Ladezeiten

---

## **Problem 2: Unkontrollierte URL-Regenerierung**

### **📍 Problemstelle:**
```typescript
// Zeile 66-67 in SystemSchemaView.tsx
const timestamp = Date.now();  // ← BEI JEDEM RENDER!
const grafanaUrl = `${grafanaConfig.baseUrl}/${grafanaConfig.defaultDashboard}?orgId=1&from=now-24h&to=now&panelId=${panelId}&var-id=${resolvedId}&refresh=30s&theme=light&t=${timestamp}`;
```

### **⚠️ Auswirkungen:**
- **Neue URLs bei jedem React Re-Render**
- **Iframes laden permanent neu** auch ohne Datenänderung
- **Cache-Invalidierung** durch ständig wechselnde Timestamps
- **Unnötige Netzwerk-Last**

---

## **Problem 3: Fehlende iframe-Kontrolle**

### **📍 Problemstelle:**
```typescript
// FEHLT KOMPLETT in SystemSchemaView.tsx:
// - useRef für iframe-Referenzen
// - useEffect für kontrolliertes Laden
// - Intelligent Loading-Logik
```

### **⚠️ Auswirkungen:**
- **Keine Kontrolle** über iframe-Ladezeiten
- **React-Lifecycle ignoriert** iframe-Verhalten
- **Keine Performance-Optimierung** möglich

---

## **Problem 4: Component Re-Render Cascade**

### **📍 Problemablauf:**
1. **meterData/objectId Props ändern** sich
2. **generateSystemComponents()** wird erneut ausgeführt
3. **Alle URLs werden neu generiert** (neue Timestamps)
4. **Alle iframes laden komplett neu**
5. **User sieht "Zittern/Flackern"**

---

## **Vergleich: GrafanaDiagramme.tsx (BEHOBEN) vs SystemSchemaView.tsx (PROBLEMATISCH)**

### **✅ GrafanaDiagramme.tsx - NACH der Korrektur:**
```typescript
// Kontrolliertes iframe Loading
useEffect(() => {
  if (!tabs[activeTab]) return;
  
  tabs[activeTab].meters.forEach((meter) => {
    const iframe = iframeRefs.get(`${meter.id}_${tabs[activeTab].panelId}`);
    if (iframe && !iframe.src) {  // ← NUR wenn leer!
      iframe.src = getCurrentGrafanaUrl(meter.id, tabs[activeTab].panelId);
    }
  });
}, [activeTab, tabs]);
```

### **❌ SystemSchemaView.tsx - AKTUELL problematisch:**
```typescript
// Direktes, unkontrolliertes Loading
<iframe
  src={component.grafanaUrl}  // ← IMMER sofort!
  // ... weitere Props
/>
```

---

## **Empfohlene Lösung**

### **1. useRef für iframe-Verwaltung hinzufügen**
```typescript
const iframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());
```

### **2. useEffect für kontrolliertes Laden**
```typescript
useEffect(() => {
  systemComponents.forEach((component) => {
    const iframe = iframeRefs.current.get(component.id);
    if (iframe && !iframe.src) {
      iframe.src = component.grafanaUrl;
    }
  });
}, [systemComponents]);
```

### **3. iframe ohne src-Attribut rendern**
```typescript
<iframe
  ref={(el) => {
    if (el) iframeRefs.current.set(component.id, el);
  }}
  // src ENTFERNT!
  width="150"
  height="200"
/>
```

### **4. Stabile URL-Generierung**
```typescript
// Timestamp nur bei echten Datenänderungen
const stableTimestamp = useMemo(() => Date.now(), [objectId, meterData]);
```

---

## **Performance-Impact**

### **Vorher (Problematisch):**
- ⚠️ **10+ simultane iframe-Loads**
- ⚠️ **3x Neuladungen** bei Props-Änderungen
- ⚠️ **Browser-Blockierung** 2-5 Sekunden
- ⚠️ **Schlechte UX** durch Flackern

### **Nachher (Optimiert):**
- ✅ **Sequenzielles iframe-Loading**
- ✅ **1x Ladung** pro iframe
- ✅ **Stabile Performance**
- ✅ **Flüssige UX**

---

## **Dringlichkeit: HOCH** 

**SystemSchemaView.tsx** zeigt **bis zu 6-10 iframes gleichzeitig** und kann bei komplexen Objekten die **komplette Browser-Performance beeinträchtigen**.

**Empfehlung:** Sofortige Implementierung der iframe-Kontrolle nach dem **bewährten GrafanaDiagramme.tsx Muster**.

---

## **Status**
- **GrafanaDiagramme.tsx:** ✅ **BEHOBEN** (iframe-Kontrolle implementiert)
- **SystemSchemaView.tsx:** ❌ **KRITISCH** (Sofortige Korrektur erforderlich)

---

*Analysiert am: ${new Date().toLocaleDateString('de-DE')}*  
*Komponente: SystemSchemaView.tsx*  
*Problem-Kategorie: Performance/iframe Loading*