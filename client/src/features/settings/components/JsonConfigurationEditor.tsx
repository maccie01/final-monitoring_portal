import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Eye, Edit, Save, Code, Table, Plus, Trash2, AlertCircle, HelpCircle, ChevronRight, ChevronDown } from "lucide-react";

export interface JsonConfigurationEditorProps {
  selectedConfigKey?: string;
  autoAvailableConfigurations?: Record<string, any>;
  availableConfigurations?: Record<string, any>;
  currentConfiguration?: any;
  title?: string;
  isLoading?: boolean;
  onApplyConfiguration?: (config: any, selectedConfig?: string) => void;
  onConfigurationChange?: (configKey: string) => void;
}

const JsonConfigurationEditor: React.FC<JsonConfigurationEditorProps> = ({
  selectedConfigKey = "settingdb",
  autoAvailableConfigurations,
  availableConfigurations,
  currentConfiguration,
  title,
  isLoading = false,
  onApplyConfiguration,
  onConfigurationChange
}) => {
  // Use availableConfigurations if autoAvailableConfigurations is not provided
  const configurations = autoAvailableConfigurations || availableConfigurations || {};
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");
  const [editSubMode, setEditSubMode] = useState<"form" | "json">("form");
  const [newConfig, setNewConfig] = useState("");
  const [tableValues, setTableValues] = useState<Record<string, any>>({});
  const [internalLoading, setInternalLoading] = useState(false);
  const [isValidJson, setIsValidJson] = useState(true);
  const [isValidAscii, setIsValidAscii] = useState(true);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [newFieldType, setNewFieldType] = useState<"string" | "number" | "boolean">("string");

  const fieldTooltips: Record<string, string> = {
    ssl: "SSL-Verschlüsselung aktivieren für sichere Datenübertragung",
    host: "Server-Adresse oder IP der Datenbank",
    port: "Port-Nummer für die Datenbankverbindung (Standard: 5432)",
    database: "Name der Datenbank",
    username: "Benutzername für die Datenbankanmeldung",
    password: "Passwort für die Datenbankanmeldung",
    schema: "Datenbankschema (Standard: public)",
    connectionTimeout: "Timeout für Verbindungsaufbau in Millisekunden"
  };

  useEffect(() => {
    if (!configurations || !selectedConfigKey) return;
    
    const config = configurations[selectedConfigKey];
    if (config) {
      setNewConfig(JSON.stringify(config, null, 2));
      setTableValues(flattenObject(config));
    }
  }, [selectedConfigKey, configurations]);

  const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    const flattened: Record<string, any> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, flattenObject(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    
    return flattened;
  };

  const unflattenObject = (flattened: Record<string, any>): any => {
    const result: any = {};
    
    for (const key in flattened) {
      const keys = key.split('.');
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = flattened[key];
    }
    
    return result;
  };

  const updateJsonValue = (value: string) => {
    setNewConfig(value);
    
    try {
      const parsed = JSON.parse(value);
      setIsValidJson(true);
      setTableValues(flattenObject(parsed));
      
      // Check for non-ASCII characters
      const hasNonAscii = /[^\x00-\x7F]/.test(value);
      setIsValidAscii(!hasNonAscii);
      
    } catch (error) {
      setIsValidJson(false);
    }
  };

  const updateTableValue = (key: string, value: any) => {
    const newTableValues = { ...tableValues };
    newTableValues[key] = value;
    setTableValues(newTableValues);
    
    const unflattenedConfig = unflattenObject(newTableValues);
    setNewConfig(JSON.stringify(unflattenedConfig, null, 2));
  };

  const removeTableField = (key: string) => {
    const newTableValues = { ...tableValues };
    delete newTableValues[key];
    setTableValues(newTableValues);
    
    const unflattenedConfig = unflattenObject(newTableValues);
    setNewConfig(JSON.stringify(unflattenedConfig, null, 2));
  };

  const addNewField = () => {
    if (!newFieldKey.trim()) return;
    
    let processedValue: any = newFieldValue;
    
    if (newFieldType === "number") {
      processedValue = Number(newFieldValue) || 0;
    } else if (newFieldType === "boolean") {
      processedValue = newFieldValue === "true";
    }
    
    updateTableValue(newFieldKey, processedValue);
    
    setNewFieldKey("");
    setNewFieldValue("");
    setNewFieldType("string");
    setIsAddFieldOpen(false);
  };

  const canApply = isValidJson && newConfig.trim() !== "";

  const handleApply = async () => {
    if (!canApply) return;
    
    setInternalLoading(true);
    try {
      const parsedConfig = JSON.parse(newConfig);
      console.log('Applying configuration:', selectedConfigKey, parsedConfig);
      
      if (onApplyConfiguration) {
        onApplyConfiguration(parsedConfig, selectedConfigKey);
      }
    } catch (error) {
      console.error('Error applying configuration:', error);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleConfigurationChange = (configKey: string) => {
    if (onConfigurationChange) {
      onConfigurationChange(configKey);
    }
  };

  const formatDisplayValue = (value: any): string => {
    if (typeof value === 'boolean') {
      return value ? 'Aktiviert' : 'Deaktiviert';
    }
    if (typeof value === 'string' && value.toLowerCase().includes('password')) {
      return '••••••••';
    }
    return String(value);
  };

  const getStatusColor = (value: any): string => {
    if (typeof value === 'boolean') {
      return value ? 'bg-green-500' : 'bg-red-500';
    }
    return 'bg-blue-500';
  };

  const renderHeader = () => {
    return (
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 text-sm">Übersicht</h3>
          <div className="flex items-center gap-2">
            {viewMode === "view" ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewMode("edit");
                    setEditSubMode("form");
                  }}
                  className="h-7 text-xs px-2"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Bearbeiten
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewMode("edit");
                    setEditSubMode("json");
                  }}
                  className="h-7 text-xs px-2"
                >
                  <Code className="h-3 w-3 mr-1" />
                  JSON
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={editSubMode === "form" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditSubMode(editSubMode === "form" ? "json" : "form")}
                  className="h-7 text-xs px-2"
                >
                  {editSubMode === "form" ? (
                    <>
                      <Code className="h-3 w-3 mr-1" />
                      JSON
                    </>
                  ) : (
                    <>
                      <Table className="h-3 w-3 mr-1" />
                      Formular
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("view")}
                  className="h-7 text-xs px-2"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ansicht
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={!canApply || internalLoading}
                  className="h-7 text-xs px-2 flex items-center gap-1"
                  size="sm"
                >
                  {internalLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                      <span>Speichern...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3" />
                      <span>Speichern</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderViewMode = () => {
    return (
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          {renderHeader()}
          
          <div className="p-4">
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(tableValues).map(([key, value], index) => {
                const tooltip = fieldTooltips[key];
                const rowClass = index % 2 === 0 ? 'bg-slate-50/50' : 'bg-white';
                
                return (
                  <div key={key} className={`grid grid-cols-2 gap-4 py-2 px-3 rounded ${rowClass}`}>
                    <div className="flex items-center gap-2 justify-start">
                      {tooltip ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <span className="font-mono text-sm text-slate-600">{key}</span>
                                <HelpCircle className="h-3 w-3 text-slate-400" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-80">
                              <p className="text-sm">{tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="font-mono text-sm text-slate-600">{key}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-end">
                      {typeof value === 'boolean' ? (
                        <Badge variant={value ? "default" : "secondary"} className="text-xs">
                          {value ? "Aktiviert" : "Deaktiviert"}
                        </Badge>
                      ) : (
                        <span className="text-sm font-medium text-right">
                          {key.toLowerCase().includes('password') ? '••••••••' : String(value)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEditMode = () => {
    return (
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          {renderHeader()}
          <div className="p-4">
            {editSubMode === "form" ? renderFormEditor() : renderJsonEditor()}
          </div>
        </div>
      </div>
    );
  };

  const renderFormEditor = () => {
    return (
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div className="grid bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200" style={{gridTemplateColumns: "1fr 1fr 50px"}}>
            <div className="px-4 py-3 font-semibold text-slate-700 border-r border-slate-200 text-sm">
              Feld
            </div>
            <div className="px-4 py-3 font-semibold text-slate-700 border-r border-slate-200 text-sm">
              Wert
            </div>
            <div className="px-4 py-3 font-semibold text-slate-700 text-sm">
              
            </div>
          </div>
          
          <div className="max-h-80 overflow-auto">
            {Object.entries(tableValues).map(([key, value], index) => {
              const tooltip = fieldTooltips[key];
              const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
              
              return (
                <div 
                  key={key} 
                  className={`grid transition-colors hover:bg-slate-50 ${bgClass}`}
                  style={{gridTemplateColumns: "1fr 1fr 50px"}}
                >
                  <div className="px-4 py-3 border-r border-slate-200 font-mono text-sm text-slate-600 flex items-center">
                    {tooltip ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                              <span>{key}</span>
                              <HelpCircle className="h-3 w-3 text-slate-400" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-80">
                            <p className="text-sm">{tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span>{key}</span>
                    )}
                  </div>
                  
                  <div className="px-4 py-3 border-r border-slate-200">
                    {typeof value === 'boolean' ? (
                      <Select
                        value={String(value)}
                        onValueChange={(newValue) => updateTableValue(key, newValue === 'true')}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={key.toLowerCase().includes('password') ? 'password' : (typeof value === 'number' ? 'number' : 'text')}
                        value={String(value)}
                        onChange={(e) => {
                          const newValue = typeof value === 'number' ? Number(e.target.value) : e.target.value;
                          updateTableValue(key, newValue);
                        }}
                        className="h-8 text-sm"
                        placeholder={key.toLowerCase().includes('password') ? 'Passwort eingeben...' : 'Wert eingeben...'}
                      />
                    )}
                  </div>
                  
                  <div className="px-4 py-3 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTableField(key)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Collapsible open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
          <Card className="border-dashed border-slate-300">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Neues Feld hinzufügen
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Erweitert</Badge>
                    {isAddFieldOpen ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Feldname</Label>
                    <Input
                      value={newFieldKey}
                      onChange={(e) => setNewFieldKey(e.target.value)}
                      placeholder="z.B. maxConnections"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Typ</Label>
                    <Select value={newFieldType} onValueChange={(value: "string" | "number" | "boolean") => setNewFieldType(value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">Text</SelectItem>
                        <SelectItem value="number">Zahl</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Wert</Label>
                    {newFieldType === "boolean" ? (
                      <Select value={newFieldValue} onValueChange={setNewFieldValue}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={newFieldType === "number" ? "number" : "text"}
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        placeholder={newFieldType === "number" ? "123" : "Wert eingeben"}
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      onClick={addNewField}
                      disabled={!newFieldKey.trim()}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Hinzufügen
                    </Button>
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  💡 Tipp: Neue Felder werden automatisch zur Konfiguration hinzugefügt und können sofort bearbeitet werden.
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    );
  };

  const renderJsonEditor = () => {
    return (
      <div className="space-y-3">
        <Textarea
          value={newConfig}
          onChange={(e) => updateJsonValue(e.target.value)}
          className={`font-mono text-sm min-h-80 ${
            !isValidJson ? 'border-red-500 bg-red-50' : ''
          }`}
          placeholder="JSON-Konfiguration eingeben..."
        />
        {!isValidJson && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Ungültiges JSON-Format</span>
          </div>
        )}
        {!isValidAscii && (
          <div className="flex items-center gap-2 text-orange-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Nicht-ASCII-Zeichen gefunden</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h3 className="text-lg font-semibold text-slate-800">
              {selectedConfigKey || 'Konfiguration bearbeiten'}
            </h3>
            {selectedConfigKey && (
              <Badge variant="outline" className="text-xs">
                {selectedConfigKey}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {viewMode === "view" ? renderViewMode() : renderEditMode()}
      </CardContent>
    </Card>
  );
};

export { JsonConfigurationEditor };
export const DatabaseConfigurationEditor = JsonConfigurationEditor;
export default JsonConfigurationEditor;