// Konstante JSON-Daten für Tabellen-Einträge (Demo-Daten)
const DEMO_OBJECTS = [
  {"objectId": "207210027", "name": "Wallensteinstrasse 108", "gruppe": "Netz", "status": "critical", "vl": 61, "rl": 47, "update": "2025-06-29 14:02", "location": "Hannover", "type": "Netzwächter", "meter": {"Z20141": "12205151", "Z20541": "12205152"}},
  {"objectId": "207315076", "name": "Nordfeldstr.18A", "gruppe": "Kessel", "status": "critical", "vl": 59, "rl": 46, "update": "2025-06-29 14:01", "location": "Hannover", "type": "Kesselwächter", "meter": {"Z20142": "12205153", "Z20143": "12205154"}},
  {"objectId": "207210027", "name": "Ahornstraße 10", "gruppe": "Wärmepumpe", "status": "critical", "vl": 55, "rl": 51, "update": "2025-06-29 14:02", "location": "Hannover", "type": "Wärmepumpenwächter", "meter": {"Z20241": "12205155", "Z20242": "12205156"}},
  {"objectId": "207315038", "name": "Wallensteinstr. 106", "gruppe": "Netz", "status": "warning", "vl": 57, "rl": 42, "update": "2025-06-29 14:02", "location": "Hannover", "type": "Netzwächter", "meter": {"Z20542": "12205157"}},
  {"objectId": "207315064", "name": "Lauhof 1", "gruppe": "Kessel", "status": "warning", "vl": 52, "rl": 38, "update": "2025-06-29 14:02", "location": "Hannover", "type": "Kesselwächter", "meter": {"Z20141": "12205158"}},
  {"objectId": "208106016", "name": "Walter-Gropius Str. 32-34", "gruppe": "Wärmepumpe", "status": "normal", "vl": 54, "rl": 45, "update": "2025-06-29 14:01", "location": "Neustadt", "type": "Wärmepumpenwächter", "meter": {"Z20243": "12205159"}}
];

let currentObjectId = getUrlParameter('objectId') || getUrlParameter('id') || getUrlParameter('objid') || '207315076';
let currentTabNr = 0;
let lastMeter = {};
let lastPortdata = null;
let lastFullData = null;
let currentConfig = null;

// --- Hilfsfunktionen wie in grafana-tabs-id.html ---
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Wächter-Modus prüfen
function isWaechterMode() {
    const typParam = getUrlParameter('typ');
    return typParam === 'waechter' || typParam === 'netzwaechter' || typParam === 'kesselwaechter' || typParam === 'waermepumpenwaechter';
}

// Wächter-Typ ermitteln
function getWaechterType() {
    const typParam = getUrlParameter('typ');
    return typParam || 'standard';
}

// ID-Interpreter: Unterstützt direkte IDs und Zähler-Referenzen
function resolveId(id, meter) {
    if (!id) return id;
    
    // Prüfe ob ID mit Z oder z beginnt (Zähler-Referenz)
    if (id.match(/^[Zz]/)) {
        // Suche in meter-Objekt nach der Zähler-Referenz
        const meterId = meter[id.toUpperCase()];
        if (meterId) {
            console.log(`🔍 Zähler-Referenz ${id} → ${meterId}`);
            return meterId.toString();
        } else {
            console.warn(`⚠️ Zähler-Referenz ${id} nicht in meter gefunden`);
            return id; // Fallback: verwende ursprüngliche ID
        }
    }
    
    // Direkte ID (beginnt nicht mit Z/z)
    console.log(`🔍 Direkte ID: ${id}`);
    return id;
}

function onklick(id) {
  const element = document.getElementById(id);
  const button = element.previousElementSibling;
  if (!element.className.includes('w3-show')) {
    element.className += ' w3-show';
    button.className += ' active';
    const firstButton = element.querySelector('.auswahl-button');
    if (firstButton && !firstButton.classList.contains('active')) {
      const firstId = firstButton.getAttribute('data-id');
      if (firstId) {
        updateIframe(id, firstId);
      }
    }
  } else {
    element.className = element.className.replace(' w3-show', '');
    button.className = button.className.replace(' active', '');
  }
}

// Histogramm ein/ausblenden
function toggleHistogram(accordionId) {
    const histogramDiv = document.getElementById(`histogram_${accordionId}`);
    if (histogramDiv) {
        const isVisible = histogramDiv.style.display !== 'none';
        
        // Icon-Status ändern
        const icon = event.target;
        
        if (isVisible) {
            // Histogramm ausblenden
            histogramDiv.style.display = 'none';
            icon.classList.remove('w3-text-teal');
            icon.classList.add('w3-text-gray');
        } else {
            // Erst Accordion aufklappen, dann Histogramm einblenden
            const accordionElement = document.getElementById(accordionId);
            const accordionButton = accordionElement.previousElementSibling;
            if (accordionElement && !accordionElement.className.includes('w3-show')) {
                accordionElement.className += ' w3-show';
                accordionButton.className += ' active';
            }
            
            // Dann Histogramm einblenden
            histogramDiv.style.display = 'block';
            icon.classList.remove('w3-text-gray');
            icon.classList.add('w3-text-teal');
        }
    }
    
    // Event-Bubbling verhindern, damit das Accordion nicht zugeklappt wird
    event.stopPropagation();
}

function updateIframe(accordionId, selectedId, vargraf) {
    // Standardwert für grafvar oder leer
    const grafvar = vargraf || '';

    // Extrahiere den Variablennamen und den vollständigen Parameter
    const varParam = grafvar.split('&')[0]; // Erster Parameter, z. B. var-timeDuration=1mo
    const varName = varParam.split('=')[0]; // Variablenname, z. B. var-timeDuration

    // ID auflösen (direkte ID oder Zähler-Referenz)
    const resolvedId = resolveId(selectedId, lastMeter);

    const accordion = document.getElementById(accordionId);
    const iframes = accordion.querySelectorAll('iframe.diaframe');
    iframes.forEach(iframe => {
        let url = iframe.src;
        const urlParts = url.split('&');

        // Prüfe und aktualisiere var-id
        const indexVarId = urlParts.findIndex(part => part.startsWith('var-id'));
        if (indexVarId !== -1) {
            urlParts[indexVarId] = `var-id=${resolvedId}`;
        } else {
            urlParts.push(`var-id=${resolvedId}`);
        }

        // Prüfe, ob varName in der URL vorhanden ist
        const indexVarParam = urlParts.findIndex(part => part.startsWith(`${varName}=`));
        if (indexVarParam !== -1) {
            // Ersetze bestehenden Parameter
            urlParts[indexVarParam] = varParam;
        } else {
            // Füge neuen Parameter hinzu
            urlParts.push(varParam);
        }

        // Setze die neue URL
        iframe.src = urlParts.join('&');
    });

    // Setze die 'active'-Klasse für den geklickten Button
    const buttons = accordion.querySelectorAll('.auswahl-button');
    buttons.forEach(button => {
        if (button.getAttribute('data-id') === selectedId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function setTime1(timeFrom, timeTo, buttonText) {
  const iframes = document.querySelectorAll('.diaframe');
  if (!iframes.length) return;
  iframes.forEach(iframe => {
    try {
      const urlObj = new URL(iframe.src);
      const params = new URLSearchParams(urlObj.search);
      params.set('from', `now-${timeFrom}`);
      params.set('to', timeTo || 'now');
      urlObj.search = params.toString();
      iframe.src = urlObj.toString();
    } catch (error) {}
  });
  const button = document.getElementById('droptime1');
  if (button) {
    button.innerHTML = `<i class="fa fa-clock-o"></i> ${buttonText}`;
  }
}

async function getObjectConfig(objid) {
  try {
    // Versuche zuerst API-Aufruf
    let data = null;
    try {
      const response = await fetch(`/api/objects/${objid}/static`);
      if (response.ok) {
        const responseData = await response.json();
        data = responseData.data || responseData;
        console.log(`✅ API-Daten geladen für Objekt ${objid}`);
      } else {
        throw new Error(`API-Fehler: ${response.status}`);
      }
    } catch (apiError) {
      console.warn(`⚠️ API nicht verfügbar: ${apiError.message} - verwende Demo-Daten`);
      
      // Fallback auf Demo-Daten
      const demoObject = DEMO_OBJECTS.find(obj => obj.objectId === objid);
      if (demoObject) {
        data = demoObject;
        console.log(`✅ Demo-Daten gefunden für Objekt ${objid}`);
      } else {
        // Verwende erstes Demo-Objekt als Fallback
        data = DEMO_OBJECTS[0];
        console.log(`⚠️ Objekt ${objid} nicht in Demo-Daten gefunden - verwende erstes Demo-Objekt`);
      }
    }

    lastPortdata = data.portdata || null;
    lastMeter = data.meter || {};
    lastFullData = data;

    // Wächter-Modus prüfen
    const isWaechter = isWaechterMode();
    console.log(`🔧 Wächter-Modus: ${isWaechter ? 'Aktiv' : 'Inaktiv'}`);

    // Portdata-Array wie in grafana-tabs-id.html
    let portdataArray = null;
    if (data && data.portdata) {
      if (Array.isArray(data.portdata)) {
        portdataArray = data.portdata;
      } else if (typeof data.portdata === 'object' && data.portdata.site) {
        portdataArray = [data.portdata];
      }
    }

    // Wenn Wächter-Modus aktiv ist, ignoriere portdata komplett
    if (isWaechter) {
      console.log(`🔧 Wächter-Modus aktiv - portdata wird ignoriert, Tabs werden aus meter generiert.`);
      
      // Fallback: Intelligente Tabs basierend auf meter-Daten (wie in grafana-tabs-id.html)
      const meter = data.meter || {};
      const portdataArray = [];
      
      // Prüfe auf Netz-Zähler (Z20541, Z20542)
      const netzIds = [];
      if (meter.Z20541) netzIds.push({id: "Z20541", idlabel: "Netz1"});
      if (meter.Z20542) netzIds.push({id: "Z20542", idlabel: "Netz2"});
      
      if (netzIds.length > 0) {
        console.log(`✅ Netz-Zähler gefunden: ${netzIds.map(n => `${n.id} → ${meter[n.id]}`).join(', ')}`);
        const netzTab = {
          site: [
            {
              label: "Wärmezähler Netz",
              panelId: "16",
              interval: "&from=now-4d&to=now",
              panelId2: "3",
              histogram: [4, 5, 7],
              panelIdWidth: "180px",
              auswahl: netzIds
            }
          ],
          grafana: "https://graf.heatcare.one",
          dashboard: "d-solo/eelav0ybil2wwd/ws-heatcare",
          sitelabel: "Netzwächter"
        };
        portdataArray.push(netzTab);
      }
      
      // Prüfe auf Kessel-Zähler (Z20141, Z20142, Z20143)
      const kesselIds = [];
      if (meter.Z20141) kesselIds.push({id: "Z20141", idlabel: "Kessel1"});
      if (meter.Z20142) kesselIds.push({id: "Z20142", idlabel: "Kessel2"});
      if (meter.Z20143) kesselIds.push({id: "Z20143", idlabel: "Kessel3"});
      
      if (kesselIds.length > 0) {
        console.log(`✅ Kessel-Zähler gefunden: ${kesselIds.map(k => `${k.id} → ${meter[k.id]}`).join(', ')}`);
        const kesselTab = {
          site: [
            {
              label: "Wärmezähler Kessel",
              panelId: "19",
              interval: "&from=now-4d&to=now",
              panelId2: "3",
              histogram: [4, 5, 7],
              panelIdWidth: "180px",
              auswahl: kesselIds
            }
          ],
          grafana: "https://graf.heatcare.one",
          dashboard: "d-solo/eelav0ybil2wwd/ws-heatcare",
          sitelabel: "Kesselwächter"
        };
        portdataArray.push(kesselTab);
      }
      
      // Prüfe auf Wärmepumpen-Zähler (Z20241, Z20242, Z20243)
      const waermepumpenIds = [];
      if (meter.Z20241) waermepumpenIds.push({id: "Z20241", idlabel: "Wärmepumpe1"});
      if (meter.Z20242) waermepumpenIds.push({id: "Z20242", idlabel: "Wärmepumpe2"});
      if (meter.Z20243) waermepumpenIds.push({id: "Z20243", idlabel: "Wärmepumpe3"});
      
      if (waermepumpenIds.length > 0) {
        console.log(`✅ Wärmepumpen-Zähler gefunden: ${waermepumpenIds.map(w => `${w.id} → ${meter[w.id]}`).join(', ')}`);
        const waermepumpenTab = {
          site: [
            {
              label: "Wärmezähler Wärmepumpen",
              panelId: "19",
              interval: "&from=now-4d&to=now",
              panelId2: "3",
              histogram: [4, 5, 7],
              panelIdWidth: "180px",
              auswahl: waermepumpenIds
            }
          ],
          grafana: "https://graf.heatcare.one",
          dashboard: "d-solo/eelav0ybil2wwd/ws-heatcare",
          sitelabel: "Wärmepumpenwächter"
        };
        portdataArray.push(waermepumpenTab);
      }
      
      // Fallback: Mindestens einen Tab erstellen
      if (portdataArray.length === 0) {
        console.log(`⚠️ Keine bekannten Zähler gefunden - prüfe auf Dummy-Tab...`);
        const meterIds = Object.keys(meter);
        if (meterIds.length > 0) {
          const firstId = meterIds[0];
          const dummyTab = {
            site: [
              {
                id: firstId,
                label: `Dummy-Zähler (${firstId})`,
                panelId: "3",
                interval: "&from=now-4d&to=now",
                panelIdWidth: "180px"
              }
            ],
            grafana: "https://graf.heatcare.one",
            dashboard: "d-solo/eelav0ybil2wwd/ws-heatcare",
            sitelabel: "Dummy-Tab"
          };
          portdataArray.push(dummyTab);
          console.log('✅ Dummy-Tab generiert:', dummyTab);
        } else {
          console.log('❌ Keine meter-IDs vorhanden, kein Dummy-Tab möglich.');
        }
      }
      
      console.log(`✅ Intelligente Tabs erstellt: ${portdataArray.length} Tabs`);
      return portdataArray;
    }

    if (!portdataArray) throw new Error('Keine portdata-Daten vorhanden');
    return portdataArray;
  } catch (e) {
    throw e;
  }
}

async function generateTabs(objid, config) {
  let html = `<div class="w3-row"><div class="w3-left" id="auswahltab">`;
  config.forEach((tab, index) => {
    const isActive = index === currentTabNr;
    const buttonClass = `w3-bar-item w3-border-top w3-border-right auswahl-tab w3-button${isActive ? ' active' : ''}`;
    html += `<button onclick="selectTab('${index}','${objid}')" class="${buttonClass}" data-tapId="${index}">${tab.sitelabel}</button>`;
  });
  html += `</div><div class="w3-dropdown-hover w3-right"><button id="droptime1" class="w3-button w3-round w3-teal" style="width: 200px"><i class="fa fa-clock-o"></i> Zeitraum </button><div class="w3-dropdown-content w3-bar-block w3-border" style="left:0">`;
  html += `<a href="javascript:void(0)" class="w3-bar-item w3-button" onclick="setTime1('1d', '', 'letzte 24h')">letzte 24h</a>`;
  html += `<a href="javascript:void(0)" class="w3-bar-item w3-button" onclick="setTime1('3d', '', 'letzte 3 Tage')">letzte 3 Tage</a>`;
  html += `<a href="javascript:void(0)" class="w3-bar-item w3-button" onclick="setTime1('7d', '', 'letzte 7 Tage')">letzte 7 Tage</a>`;
  html += `<a href="javascript:void(0)" class="w3-bar-item w3-button" onclick="setTime1('14d', '', 'letzte 14 Tage')">letzte 14 Tage</a>`;
  html += `<a href="javascript:void(0)" class="w3-bar-item w3-button" onclick="setTime1('1M', '', 'letzter Monat')">letzter Monat</a>`;
  html += `<a href="javascript:void(0)" class="w3-bar-item w3-button" onclick="setTime1('6M', '', 'letzte 6 Monate')">letzte 6 Monate</a>`;
  html += `<a href="javascript:void(0)" class="w3-bar-item w3-button" onclick="setTime1('12M', '', 'letzte 365 Tage')">letzte 365 Tage</a>`;
  html += `<a href="javascript:void(0)" class="w3-bar-item w3-button" onclick="setTime1('1y/y', 'now-1y/y', 'letztes Jahr')">letztes Jahr</a>`;
  html += `<a href="javascript:void(0)" class="w3-bar-item w3-button" onclick="setTime1('2y/y', 'now-2y/y', 'vorletztes Jahr')">vorletztes Jahr</a>`;
  html += `</div></div></div>`;
  return html;
}

async function generateContent(tabNr, objid, config) {
    // Verwende die Konfiguration des ausgewählten Tabs
    const tabConfig = config[tabNr] || config[0];
    
    if (!tabConfig || !tabConfig.site) {
        // Debug-Ausgabe, falls keine Daten
        return `<div class="w3-container w3-red w3-padding"><p><strong>Keine portdata verfügbar für Objekt ${objid}</strong></p><p>API-Antwort: ${JSON.stringify(config, null, 2)}</p></div>`;
    }

    const grafana = tabConfig.grafana || "https://graf.heatcare.one";
    const dashboard = tabConfig.dashboard || "d-solo/eelav0ybil2wwd/ws-heatcare";
    const interval = tabConfig.interval || "&from=now-3d&to=now";

    let html = '<div class="w3-accordion">';
    
    tabConfig.site.forEach((f, index) => {
        if (!f.label || !f.panelId) return;
        
        const accordionId = `taps${index + 1}`;
        const height = f.height || '250px';
        // Verwende f.id falls vorhanden, sonst erste ID aus auswahl Array (auch bei nur 1 Eintrag), sonst objid
        let urlId = f.id || (f.auswahl && f.auswahl.length > 0 ? f.auswahl[0].id : objid);
        // ID auflösen (direkte ID oder Zähler-Referenz)
        urlId = resolveId(urlId, lastMeter);
        const panelInterval = f.interval || interval;
        
        // Grafana URL generieren
        const iframeUrl = `${grafana}/${dashboard}?orgId=1${panelInterval}&panelId=${f.panelId}&var-id=${urlId}&__feature.dashboardSceneSolo`;
        // LOG-Ausgabe: iframe-URL und HTML
        console.log(`[IFRAME] ${f.label}:`, iframeUrl);
        const iframeHtml = `<iframe class="diaframe" style="height:${height}" src="${iframeUrl}" id="id_${accordionId}"></iframe>`;
        console.log(`[IFRAME-HTML] ${f.label}:`, iframeHtml);
        
        // Prüfe, ob das Accordion aufgeklappt sein soll (erstes Element ODER panel: "show")
        const isActive = index === 0 || f.panel === "show";
        const accordionClass = `w3-accordion-content w3-container w3-light-grey ${isActive ? 'w3-show' : 'w3-hide'}`;
        const buttonClass = `w3-button w3-block w3-left-align${isActive ? ' active' : ''}`;

        // Histogramm-Toggle Icon (falls Histogramm vorhanden)
        const hasHistogram = f.histogram && Array.isArray(f.histogram) && f.histogram.length >= 3;
        const histogramToggle = hasHistogram ? `<span class="histogram-toggle" onclick="toggleHistogram('${accordionId}')" style="cursor:pointer; user-select:none;">
            <i class="fa fa-bar-chart w3-text-gray" style="font-size: 18px;"></i>
            <span class="w3-small w3-text-gray" style="margin-left:4px;vertical-align:middle;">Histogramm</span>
        </span>` : '';

        html += `<button onclick="onklick('${accordionId}')" class="${buttonClass}"> .. ${f.label}${histogramToggle}</button>`;
        html += `<div id="${accordionId}" class="w3-container w3-leftbar w3-border-gray ${accordionClass}">`;

        // Auswahl-Buttons (nur wenn mehr als 1 Eintrag vorhanden)
        if (f.auswahl && Array.isArray(f.auswahl) && f.auswahl.length > 1) {
            html += '<div class="auswahl-bar w3-container w3-bar w3-margin-top">';
            html += '<span class="w3-bar-item w3-padding-small">Auswahl: </span>';
            f.auswahl.forEach((auswahl, auswahlIndex) => {
                if (!auswahl.id || !auswahl.idlabel) return;
                const isFirst = auswahlIndex === 0;
                const resolvedId = resolveId(auswahl.id, lastMeter);
                html += `<button onclick="updateIframe('${accordionId}', '${auswahl.id}')" class="w3-padding-small auswahl-button w3-border-left w3-bar-item ${isFirst ? ' active' : ''}" data-id="${auswahl.id}" data-resolved-id="${resolvedId}">${auswahl.idlabel}</button>`;
            });
            html += '</div>';
        }

        // Zweites Panel (falls vorhanden)
        if (f.panelId2) {
            const iframeUrl2 = `${grafana}/${dashboard}?orgId=1${panelInterval}&panelId=${f.panelId2}&var-id=${urlId}&__feature.dashboardSceneSolo`;
            const panelWidth = f.panelIdWidth || '50%';
            html += '<div class="w3-row">';
            html += `<div class="w3-col w3-mobile" style="width:${panelWidth}">`;
            html += `<iframe class="diaframe" style="height:${height}" src="${iframeUrl}" id="id_col1_${accordionId}"></iframe>`;
            html += '</div>';
            html += `<div class="w3-col w3-mobile w3-hide-small" style="width:calc(100% - ${panelWidth})">`;
            html += `<iframe class="diaframe" style="height:${height}" src="${iframeUrl2}" id="id_col2_${accordionId}"></iframe>`;
            html += '</div>';
            html += '</div>';
        } else if (f.panelId) {
            // Einzelnes Panel
            html += `<iframe class="diaframe" style="height:${height}" src="${iframeUrl}" id="id_${accordionId}"></iframe>`;
        }

        // Histogram (falls vorhanden)
        if (f.histogram && Array.isArray(f.histogram) && f.histogram.length >= 3) {
            const histogramHeight = f.histogramheight || '200px';
            html += `<div id="histogram_${accordionId}" class="w3-row" style="display:none;">`;
            html += '<div class="w3-col w3-mobile w3-third">';
            html += `<iframe class="diaframe" style="height:${histogramHeight}" src="${grafana}/${dashboard}?orgId=1${panelInterval}&panelId=${f.histogram[0]}&var-id=${urlId}&__feature.dashboardSceneSolo" id="id_col1_${accordionId}_histo"></iframe>`;
            html += '</div>';
            html += '<div class="w3-col w3-mobile w3-third">';
            html += `<iframe class="diaframe" style="height:${histogramHeight}" src="${grafana}/${dashboard}?orgId=1${panelInterval}&panelId=${f.histogram[1]}&var-id=${urlId}&__feature.dashboardSceneSolo" id="id_col2_${accordionId}_histo"></iframe>`;
            html += '</div>';
            html += '<div class="w3-col w3-mobile w3-third">';
            html += `<iframe class="diaframe" style="height:${histogramHeight}" src="${grafana}/${dashboard}?orgId=1${panelInterval}&panelId=${f.histogram[2]}&var-id=${urlId}&__feature.dashboardSceneSolo" id="id_col3_${accordionId}_histo"></iframe>`;
            html += '</div>';
            html += '</div>';
        }

        html += '</div>';
    });

    html += '</div>';
    return html;
}

async function selectTab(tapId, objid) {
  currentTabNr = parseInt(tapId);
  document.getElementById("object-content").innerHTML = await generateContent(currentTabNr, currentObjectId, currentConfig);
  document.getElementById("object-tabs").innerHTML = await generateTabs(currentObjectId, currentConfig);
  const tabs = document.querySelectorAll('.auswahl-tab');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-tapId') === tapId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

async function selectObject(objid) {
  currentObjectId = objid;
  currentTabNr = 0;
  try {
    currentConfig = await getObjectConfig(currentObjectId);
    document.getElementById("object-content").innerHTML = await generateContent(currentTabNr, currentObjectId, currentConfig);
    document.getElementById("object-tabs").innerHTML = await generateTabs(currentObjectId, currentConfig);
    const tabs = document.querySelectorAll('.auswahl-tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-tapId') === currentTabNr.toString()) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  } catch (e) {
    document.getElementById("object-content").innerHTML = `<div class='w3-container w3-red w3-padding'><p><strong>Fehler beim Laden der Daten:</strong></p><p>${e.message}</p></div>`;
    document.getElementById("object-tabs").innerHTML = '';
  }
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
  selectObject(currentObjectId);
}); 