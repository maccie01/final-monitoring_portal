import { useState } from "from "react"";
import { Card, CardContent, CardHeader, CardTitle } from "from "@/components/ui/card"";
import { Button } from "from "@/components/ui/button"";
import { Input } from "from "@/components/ui/input"";
import { Label } from "from "@/components/ui/label"";
import { Switch } from "from "@/components/ui/switch"";
import { Textarea } from "from "@/components/ui/textarea"";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "from "@/components/ui/tabs"";
import { ChevronDown, ChevronUp, Database, Wifi, Copy, CheckCircle2, Save, Edit, Code, Table } from "from "lucide-react"";
import { useToast } from "from "@/hooks/use-toast"";

interface PortalConfig {
  id: string;
  name: string;
  description: string;
  config: any;
  status: 'active' | 'inactive' | 'testing' | 'error';
}

interface CollapsiblePortalCardsProps {
  configs: PortalConfig[];
  onTestConfig: (configId: string) => Promise<void>;
  onActivateConfig: (configId: string) => Promise<void>;
  onCopyData: (fromId: string, toId: string) => Promise<void>;
  onSaveConfig?: (configId: string, config: any) => Promise<void>;
}

export default function CollapsiblePortalCards({
  configs,
  onTestConfig,
  onActivateConfig,
  onCopyData,
  onSaveConfig
}: CollapsiblePortalCardsProps) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editedConfigs, setEditedConfigs] = useState<Record<string, any>>({});
  const [editViewMode, setEditViewMode] = useState<Record<string, 'form' | 'json'>>({});
  const [jsonValues, setJsonValues] = useState<Record<string, string>>({});
  const [isValidJson, setIsValidJson] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const toggleCard = (configId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  const handleAction = async (action: () => Promise<void>, configId: string, actionName: string) => {
    setLoading(prev => ({ ...prev, [configId]: true }));
    try {
      await action();
      toast({
        title: "Erfolg",
        description: `${actionName} erfolgreich ausgeführt`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: `${actionName} fehlgeschlagen`,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [configId]: false }));
    }
  };

  const toggleEditMode = (configId: string) => {
    setEditMode(prev => ({ ...prev, [configId]: !prev[configId] }));
    // Initialize edited config with current values
    if (!editMode[configId]) {
      const config = configs.find(c => c.id === configId);
      if (config) {
        setEditedConfigs(prev => ({ ...prev, [configId]: { ...config.config } }));
        setJsonValues(prev => ({ ...prev, [configId]: JSON.stringify(config.config, null, 2) }));
        setEditViewMode(prev => ({ ...prev, [configId]: 'form' }));
        setIsValidJson(prev => ({ ...prev, [configId]: true }));
      }
    }
  };

  const updateConfigField = (configId: string, field: string, value: any) => {
    setEditedConfigs(prev => ({
      ...prev,
      [configId]: { ...prev[configId], [field]: value }
    }));
    // Update JSON when form fields change
    const updatedConfig = { ...editedConfigs[configId], [field]: value };
    setJsonValues(prev => ({ ...prev, [configId]: JSON.stringify(updatedConfig, null, 2) }));
  };

  const updateJsonValue = (configId: string, jsonString: string) => {
    setJsonValues(prev => ({ ...prev, [configId]: jsonString }));
    // Validate JSON
    try {
      const parsed = JSON.parse(jsonString);
      setIsValidJson(prev => ({ ...prev, [configId]: true }));
      setEditedConfigs(prev => ({ ...prev, [configId]: parsed }));
    } catch {
      setIsValidJson(prev => ({ ...prev, [configId]: false }));
    }
  };

  const toggleViewMode = (configId: string) => {
    const currentMode = editViewMode[configId] || 'form';
    const newMode = currentMode === 'form' ? 'json' : 'form';
    setEditViewMode(prev => ({ ...prev, [configId]: newMode }));
  };

  const saveConfig = async (configId: string) => {
    if (onSaveConfig && editedConfigs[configId]) {
      await handleAction(() => onSaveConfig(configId, editedConfigs[configId]), configId, 'Konfiguration speichern');
      setEditMode(prev => ({ ...prev, [configId]: false }));
    }
  };



  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Portal-Konfigurationen</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {configs.map((config, index) => (
          <div
            key={config.id}
            className={`border rounded-lg ${config.status === 'active' ? 'border-green-300 bg-green-50' : 'border-gray-200'} transition-all duration-200`}
          >
            {/* Header - Always Visible */}
            <div
              className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50"
              onClick={() => toggleCard(config.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {expandedCards[config.id] ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                  <h3 className="font-medium">{config.name}</h3>
                  <span className="text-xs text-gray-500">{config.id}</span>
                </div>
              </div>
            </div>

            {/* Collapsible Content */}
            {expandedCards[config.id] && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        config.status === 'active' ? 'bg-green-100 text-green-800' :
                        config.status === 'testing' ? 'bg-yellow-100 text-yellow-800' :
                        config.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {config.status === 'active' ? 'Aktiv' :
                         config.status === 'testing' ? 'Testing' :
                         config.status === 'error' ? 'Fehler' : 'Inaktiv'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEditMode(config.id);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {editMode[config.id] ? 'Abbrechen' : 'Bearbeiten'}
                      </Button>
                    </div>
                  </div>

                  {editMode[config.id] ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Konfiguration bearbeiten</h4>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleViewMode(config.id)}
                            className="text-xs"
                          >
                            {editViewMode[config.id] === 'form' ? (
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
                            size="sm"
                            onClick={() => saveConfig(config.id)}
                            disabled={loading[config.id] || (editViewMode[config.id] === 'json' && !isValidJson[config.id])}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Speichern
                          </Button>
                        </div>
                      </div>

                      {editViewMode[config.id] === 'form' ? (
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(editedConfigs[config.id] || {}).map(([key, value]) => (
                            <div key={key}>
                              <Label htmlFor={`${config.id}-${key}`}>{key}</Label>
                              {typeof value === 'boolean' ? (
                                <Switch
                                  id={`${config.id}-${key}`}
                                  checked={value}
                                  onCheckedChange={(checked) => updateConfigField(config.id, key, checked)}
                                />
                              ) : typeof value === 'number' ? (
                                <Input
                                  id={`${config.id}-${key}`}
                                  type="number"
                                  value={value.toString()}
                                  onChange={(e) => updateConfigField(config.id, key, parseInt(e.target.value) || 0)}
                                />
                              ) : (
                                <Input
                                  id={`${config.id}-${key}`}
                                  value={value?.toString() || ''}
                                  onChange={(e) => updateConfigField(config.id, key, e.target.value)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <Textarea
                            value={jsonValues[config.id] || ''}
                            onChange={(e) => updateJsonValue(config.id, e.target.value)}
                            className={`font-mono text-sm min-h-[200px] ${!isValidJson[config.id] ? 'border-red-300' : ''}`}
                            placeholder="JSON-Konfiguration..."
                          />
                          {!isValidJson[config.id] && (
                            <p className="text-sm text-red-600 mt-1">Ungültiges JSON-Format</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{config.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                        <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(config.config, null, 2)}
                        </pre>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(() => onTestConfig(config.id), config.id, 'Test')}
                          disabled={loading[config.id]}
                        >
                          <Wifi className="h-4 w-4 mr-1" />
                          {loading[config.id] ? 'Teste...' : 'Testen'}
                        </Button>

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAction(() => onActivateConfig(config.id), config.id, 'Aktivierung')}
                          disabled={loading[config.id] || config.status === 'active'}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {config.status === 'active' ? 'Aktiv' : 'Als aktiv setzen'}
                        </Button>

                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(() => onCopyData(configs[0].id, config.id), config.id, 'Daten kopieren')}
                            disabled={loading[config.id]}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Daten von aktivem Portal kopieren
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}