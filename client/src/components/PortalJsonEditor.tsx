import React, { useState, useEffect } from "from "react"";
import { Button } from "from "@/components/ui/button"";
import { Card, CardContent } from "from "@/components/ui/card"";
import { Textarea } from "from "@/components/ui/textarea"";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "from "@/components/ui/select"";
import { Label } from "from "@/components/ui/label"";
import { useToast } from "from "@/hooks/use-toast"";
import { Check } from "from "lucide-react"";

interface PortalJsonEditorProps {
  availableConfigs: { [key: string]: any };
  selectedConfigKey: string;
  onConfigChange: (configKey: string) => void;
  onSave: (config: any, configKey: string) => Promise<void>;
  onCancel?: () => void;
}

export function PortalJsonEditor({ 
  availableConfigs, 
  selectedConfigKey, 
  onConfigChange, 
  onSave, 
  onCancel 
}: PortalJsonEditorProps) {
  const [jsonText, setJsonText] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Get current config based on selected key
  const currentConfig = availableConfigs[selectedConfigKey] || {};

  // Initialize JSON text when config changes
  useEffect(() => {
    try {
      setJsonText(JSON.stringify(currentConfig, null, 2));
      setIsValid(true);
    } catch (error) {
      setJsonText('{}');
      setIsValid(false);
    }
  }, [currentConfig, selectedConfigKey]);

  // Validate JSON on text change
  const handleTextChange = (newText: string) => {
    setJsonText(newText);
    try {
      JSON.parse(newText);
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
    }
  };

  const handleSave = async () => {
    if (!isValid) {
      toast({
        title: "Ungültiges JSON",
        description: "Bitte korrigieren Sie die JSON-Syntax",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const parsedValue = JSON.parse(jsonText);
      await onSave(parsedValue, selectedConfigKey);
    } catch (error: any) {
      toast({
        title: "Speicherfehler", 
        description: error.message || "Fehler beim Speichern der Konfiguration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original config
    setJsonText(JSON.stringify(currentConfig, null, 2));
    setIsValid(true);
    if (onCancel) onCancel();
  };

  // Get configuration display options
  const getConfigDisplayName = (key: string) => {
    switch (key) {
      case 'settingdb_neu': return 'Portal-Konfiguration (neu)';
      case 'settingdb_alt': return 'Portal-Konfiguration (alt)';
      case 'settingdb': return 'Portal-Konfiguration (standard)';
      default: return key;
    }
  };

  return (
    <div className="space-y-4">
      {/* Configuration Selector */}
      <div className="space-y-2">
        <Label htmlFor="config-select" className="text-sm font-medium">
          Konfiguration auswählen
        </Label>
        <Select value={selectedConfigKey} onValueChange={onConfigChange}>
          <SelectTrigger className="w-full" data-testid="select-config">
            <SelectValue placeholder="Konfiguration wählen..." />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(availableConfigs).map((configKey) => (
              <SelectItem key={configKey} value={configKey}>
                {getConfigDisplayName(configKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Header with title and buttons */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Datenbank-Konfiguration
        </h3>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-6"
            data-testid="button-cancel-config"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="bg-blue-600 hover:bg-blue-700 px-6"
            data-testid="button-save-config"
          >
            {isSaving ? (
              "Speichern..."
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Speichern
              </>
            )}
          </Button>
        </div>
      </div>

      {/* JSON Editor Card */}
      <Card className={`border ${!isValid ? 'border-red-300' : 'border-gray-200'}`}>
        <CardContent className="p-0">
          <Textarea
            value={jsonText}
            onChange={(e) => handleTextChange(e.target.value)}
            className={`
              font-mono text-sm resize-none border-0 rounded-md
              min-h-[400px] w-full p-4 bg-gray-50
              ${!isValid ? 'bg-red-50 text-red-700' : 'text-gray-700'}
            `}
            placeholder="JSON-Konfiguration eingeben..."
            data-testid="textarea-portal-config"
          />
        </CardContent>
      </Card>

      {!isValid && (
        <p className="text-sm text-red-500 flex items-center">
          Ungültige JSON-Syntax - bitte korrigieren
        </p>
      )}
    </div>
  );
}