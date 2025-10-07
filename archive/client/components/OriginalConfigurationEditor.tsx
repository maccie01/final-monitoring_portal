import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Send, AlertCircle, CheckCircle, Table, Code, Edit, HelpCircle } from "lucide-react";

interface OriginalConfigurationEditorProps {
  reportedConfiguration?: any;
  desiredConfiguration?: any;
  onApplyConfiguration?: (config: string) => void;
  isLoading?: boolean;
}

export function OriginalConfigurationEditor({
  reportedConfiguration,
  desiredConfiguration,
  onApplyConfiguration,
  isLoading = false
}: OriginalConfigurationEditorProps) {
  // Extract only the config portion from the shadows
  const reportedConfig = reportedConfiguration?.config || {};
  const desiredConfig = desiredConfiguration?.config || {};

  // Debug logging to understand the data structure
  console.log('[OriginalConfigurationEditor] Shadow data received:');
  console.log('  reportedConfiguration:', reportedConfiguration);
  console.log('  desiredConfiguration:', desiredConfiguration);
  console.log('  reportedConfig extracted:', reportedConfig);
  console.log('  desiredConfig extracted:', desiredConfig);
  console.log('  reportedConfig keys:', Object.keys(reportedConfig));
  console.log('  desiredConfig keys:', Object.keys(desiredConfig));
  const [newConfig, setNewConfig] = useState("");
  const [isValidJson, setIsValidJson] = useState(true);
  const [isValidAscii, setIsValidAscii] = useState(true);
  const [viewMode, setViewMode] = useState<"json" | "table">("table");
  const [tableValues, setTableValues] = useState<Record<string, any>>({});
  const [tooltips, setTooltips] = useState<Record<string, any>>({});
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  // Load tooltips from external source via backend proxy
  useEffect(() => {
    const loadTooltips = async () => {
      try {
        const response = await fetch('/api/configuration-tooltips');
        const tooltipData = await response.json();
        setTooltips(tooltipData);
      } catch (error) {
        console.warn('Failed to load configuration tooltips:', error);
      }
    };
    
    loadTooltips();
  }, []);

  // Store the original flattened config for comparison
  const [originalFlattenedConfig, setOriginalFlattenedConfig] = useState<Record<string, any>>({});

  // Initialize table values from combined reported and desired configuration
  useEffect(() => {
    if (reportedConfiguration || desiredConfiguration) {
      const flattenedReported = flattenObject(reportedConfig);
      const flattenedDesired = flattenObject(desiredConfig);
      
      // Combine reported and desired values (desired takes precedence for display)
      const combinedValues = { ...flattenedReported };
      Object.keys(flattenedDesired).forEach(key => {
        if (key in combinedValues) {
          combinedValues[key] = flattenedDesired[key];
        }
      });
      
      setTableValues(combinedValues);
      setOriginalFlattenedConfig(combinedValues);
    }
  }, [reportedConfiguration, desiredConfiguration]);

  useEffect(() => {
    if (newConfig) {
      // Validate JSON
      try {
        JSON.parse(newConfig);
        setIsValidJson(true);
      } catch {
        setIsValidJson(false);
      }

      // Validate ASCII
      const isAscii = /^[\x00-\x7F]*$/.test(newConfig);
      setIsValidAscii(isAscii);
    } else {
      setIsValidJson(true);
      setIsValidAscii(true);
    }
  }, [newConfig]);

  // Flatten nested object to dot notation for table view
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

  // Unflatten dot notation back to nested object
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

  // Generate delta configuration (only changed values)
  const generateDelta = (newValues: Record<string, any>, originalValues: Record<string, any>): any => {
    const delta: Record<string, any> = {};
    
    for (const key in newValues) {
      if (newValues[key] !== originalValues[key]) {
        delta[key] = newValues[key];
      }
    }
    
    return unflattenObject(delta);
  };

  // Update JSON when table values change
  useEffect(() => {
    if (viewMode === "table" && Object.keys(originalFlattenedConfig).length > 0) {
      const delta = generateDelta(tableValues, originalFlattenedConfig);
      
      if (Object.keys(delta).length > 0) {
        setNewConfig(JSON.stringify(delta, null, 2));
      } else {
        setNewConfig("");
      }
    }
  }, [tableValues, viewMode, originalFlattenedConfig]);

  const canApply = newConfig.trim() && isValidJson && isValidAscii;

  const handleApply = () => {
    if (canApply && onApplyConfiguration) {
      // Generate delta from table values and send only changed values
      if (viewMode === 'table' && Object.keys(originalFlattenedConfig).length > 0) {
        const delta = generateDelta(tableValues, originalFlattenedConfig);
        console.log('[OriginalConfigurationEditor] Sending delta:', JSON.stringify(delta, null, 2));
        onApplyConfiguration(JSON.stringify(delta));
      } else {
        // For JSON mode, send the raw config
        onApplyConfiguration(newConfig);
      }
      setNewConfig("");
    }
  };

  // Check if desired configuration is a subset of reported configuration
  const isDesiredSynchronized = (desired: any, reported: any): boolean => {
    if (!desired || !reported) return false;
    
    const checkSubset = (desiredObj: any, reportedObj: any): boolean => {
      for (const key in desiredObj) {
        if (!(key in reportedObj)) return false;
        
        const desiredValue = desiredObj[key];
        const reportedValue = reportedObj[key];
        
        if (typeof desiredValue === 'object' && desiredValue !== null) {
          if (typeof reportedValue !== 'object' || reportedValue === null) return false;
          if (!checkSubset(desiredValue, reportedValue)) return false;
        } else {
          if (desiredValue !== reportedValue) return false;
        }
      }
      return true;
    };
    
    return checkSubset(desired, reported);
  };
  
  const configurationsMatch = isDesiredSynchronized(desiredConfig, reportedConfig);
  const configurationStatus = configurationsMatch ? "synchronized" : "pending";

  // Get tooltip for a configuration key
  const getTooltip = (key: string): string | null => {
    // Split the key to get category and parameter (e.g., "juno.period" -> "juno", "period")
    const parts = key.split('.');
    if (parts.length === 2) {
      const [category, param] = parts;
      return tooltips[category]?.[param] || null;
    }
    return null;
  };

  const renderConfigurationView = (config: any) => {
    if (!config) return null;

    const flatConfig = flattenObject(config);

    if (viewMode === "json") {
      return (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <pre className="text-sm overflow-auto max-h-64 text-slate-800 dark:text-slate-200">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <TooltipProvider>
        <div 
          className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950"
          onClick={(e) => {
            // Close tooltip when clicking outside of tooltip triggers
            if (!(e.target as HTMLElement).closest('[data-tooltip-trigger]')) {
              setOpenTooltip(null);
            }
          }}
        >
          <div className="grid grid-cols-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="px-2 sm:px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
              Configuration Key
            </div>
            <div className="px-2 sm:px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
              Value
            </div>
          </div>
          <div className="max-h-64 overflow-auto">
            {Object.entries(flatConfig).map(([key, value], index) => {
              const tooltip = getTooltip(key);
              
              return (
                <div 
                  key={key} 
                  className={`grid grid-cols-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                    index % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/50 dark:bg-slate-900/20'
                  }`}
                >
                  <div className="px-2 sm:px-4 py-2 sm:py-3 border-r border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-600 dark:text-slate-400 break-all">
                    {tooltip ? (
                      <Tooltip open={openTooltip === key} onOpenChange={(open) => setOpenTooltip(open ? key : null)}>
                        <TooltipTrigger asChild>
                          <div 
                            className="flex items-start gap-1 cursor-help touch-manipulation select-none"
                            data-tooltip-trigger
                            onClick={(e) => {
                              // On mobile devices, toggle tooltip on click
                              if ('ontouchstart' in window) {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenTooltip(openTooltip === key ? null : key);
                              }
                            }}
                            onMouseEnter={() => {
                              // On desktop, show on hover
                              if (!('ontouchstart' in window)) {
                                setOpenTooltip(key);
                              }
                            }}
                            onMouseLeave={() => {
                              // On desktop, hide on mouse leave
                              if (!('ontouchstart' in window)) {
                                setOpenTooltip(null);
                              }
                            }}
                          >
                            <span className="break-all">{key}</span>
                            <HelpCircle className="h-3 w-3 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-80 z-50">
                          <p className="text-sm">{tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="break-all">{key}</span>
                    )}
                  </div>
                  <div className="px-2 sm:px-4 py-2 sm:py-3 font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium break-all">
                    {String(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-6">
      {/* Global View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Device Configuration</h2>
          <Badge variant={configurationStatus === "pending" ? "secondary" : "default"}>
            {configurationStatus === "pending" ? "Update Pending" : "Synchronized"}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View:</span>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "json" | "table")}>
            <TabsList className="bg-slate-100 dark:bg-slate-800">
              <TabsTrigger value="json" className="flex items-center gap-1 sm:gap-2 text-xs">
                <Code className="h-3 w-3" />
                <span className="hidden sm:inline">JSON</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-1 sm:gap-2 text-xs">
                <Table className="h-3 w-3" />
                <span className="hidden sm:inline">Table</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Reported Configuration (Read-only) */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-slate-800 dark:text-slate-200">
            Reported Configuration (From Device)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportedConfig && Object.keys(reportedConfig).length > 0 ? (
            renderConfigurationView(reportedConfig)
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center text-slate-500 dark:text-slate-400">
              No configuration data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Desired Configuration (if any) */}
      {desiredConfig && Object.keys(desiredConfig).length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2 text-slate-800 dark:text-slate-200">
              <AlertCircle className={`h-5 w-5 ${configurationStatus === "pending" ? "text-orange-500" : "text-green-500"}`} />
              <span>Desired Configuration (From External Service)</span>
            </CardTitle>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {configurationStatus === "pending" 
                ? "Device needs to apply these configuration changes" 
                : "These configuration values are confirmed on the device"
              }
            </div>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg border ${
              configurationStatus === "pending" 
                ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800" 
                : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
            }`}>
              {renderConfigurationView(desiredConfig)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Editor */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-slate-800 dark:text-slate-200">Apply New Configuration</CardTitle>
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {viewMode === "table" ? "Table Editor" : "JSON Editor"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {viewMode === "json" ? (
            <div>
              <Label htmlFor="config-editor" className="text-slate-700 dark:text-slate-300">Configuration JSON</Label>
              <Textarea
                id="config-editor"
                value={newConfig}
                onChange={(e) => setNewConfig(e.target.value)}
                placeholder="Enter valid JSON configuration..."
                className="min-h-[200px] font-mono text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                disabled={isLoading}
              />
            </div>
          ) : (
            reportedConfig && Object.keys(reportedConfig).length > 0 ? (
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Configuration Parameters</Label>
                <TooltipProvider>
                  <div 
                    className="border border-slate-200 dark:border-slate-800 rounded-lg max-h-[400px] overflow-auto bg-white dark:bg-slate-950"
                    onClick={(e) => {
                      // Close tooltip when clicking outside of tooltip triggers
                      if (!(e.target as HTMLElement).closest('[data-tooltip-trigger]')) {
                        setOpenTooltip(null);
                      }
                    }}
                  >
                    <div className="grid grid-cols-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <div className="px-2 sm:px-4 py-2 sm:py-3 border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Configuration Key</div>
                      <div className="px-2 sm:px-4 py-2 sm:py-3 border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Current/Pending Value</div>
                      <div className="px-2 sm:px-4 py-2 sm:py-3 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">New Value</div>
                    </div>
                    {Object.entries(tableValues).map(([key, value], index) => {
                      const flattenedReported = flattenObject(reportedConfig);
                      const flattenedDesired = flattenObject(desiredConfig);
                      const reportedValue = flattenedReported[key];
                      const desiredValue = flattenedDesired[key];
                      const currentValue = desiredValue !== undefined ? desiredValue : reportedValue;
                      const hasPendingChange = desiredValue !== undefined && desiredValue !== reportedValue;
                      const hasNewChange = value !== currentValue;
                      const tooltip = getTooltip(key);
                      
                      return (
                        <div 
                          key={key} 
                          className={`grid grid-cols-3 transition-all duration-200 ${
                            hasNewChange
                              ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500 dark:border-l-blue-400' 
                              : hasPendingChange
                                ? 'bg-orange-50 dark:bg-orange-950/20 border-l-4 border-l-orange-500 dark:border-l-orange-400'
                                : index % 2 === 0 
                                  ? 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50' 
                                  : 'bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-900/70'
                          }`}
                        >
                          <div className="px-2 sm:px-4 py-2 sm:py-3 border-r border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-600 dark:text-slate-400 break-all">
                            {tooltip ? (
                              <Tooltip open={openTooltip === key} onOpenChange={(open) => setOpenTooltip(open ? key : null)}>
                                <TooltipTrigger asChild>
                                  <div 
                                    className="flex items-start gap-1 cursor-help touch-manipulation select-none" 
                                    data-tooltip-trigger
                                    onClick={(e) => {
                                      // On mobile devices, toggle tooltip on click
                                      if ('ontouchstart' in window) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenTooltip(openTooltip === key ? null : key);
                                      }
                                    }}
                                    onMouseEnter={() => {
                                      // On desktop, show on hover
                                      if (!('ontouchstart' in window)) {
                                        setOpenTooltip(key);
                                      }
                                    }}
                                    onMouseLeave={() => {
                                      // On desktop, hide on mouse leave
                                      if (!('ontouchstart' in window)) {
                                        setOpenTooltip(null);
                                      }
                                    }}
                                  >
                                    <span className="break-all">{key}</span>
                                    <HelpCircle className="h-3 w-3 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-80 z-50">
                                  <p className="text-sm">{tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="break-all">{key}</span>
                            )}
                          </div>
                          <div className="px-2 sm:px-4 py-2 sm:py-3 border-r border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm break-all">
                            <span className={hasPendingChange ? "text-orange-600 dark:text-orange-400" : "text-slate-500 dark:text-slate-500"}>
                              {String(currentValue)}
                            </span>
                          </div>
                          <div className="px-2 sm:px-4 py-2 sm:py-3">
                            <Input
                              value={String(value)}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                // Try to convert to appropriate type
                                let convertedValue: any = newValue;
                                if (!isNaN(Number(newValue)) && newValue !== '') {
                                  convertedValue = Number(newValue);
                                } else if (newValue === 'true' || newValue === 'false') {
                                  convertedValue = newValue === 'true';
                                }
                                
                                setTableValues(prev => ({
                                  ...prev,
                                  [key]: convertedValue
                                }));
                              }}
                              className="font-mono text-xs sm:text-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-900 h-8 sm:h-9"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TooltipProvider>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    {Object.keys(tableValues).some(key => {
                      const flattenedDesired = flattenObject(desiredConfig);
                      const flattenedReported = flattenObject(reportedConfig);
                      return flattenedDesired[key] !== undefined && flattenedDesired[key] !== flattenedReported[key];
                    }) && (
                      <span className="text-orange-600 dark:text-orange-400 font-medium">
                        {Object.keys(tableValues).filter(key => {
                          const flattenedDesired = flattenObject(desiredConfig);
                          const flattenedReported = flattenObject(reportedConfig);
                          return flattenedDesired[key] !== undefined && flattenedDesired[key] !== flattenedReported[key];
                        }).length} changes pending
                      </span>
                    )}
                    {Object.keys(tableValues).some(key => {
                      const flattenedReported = flattenObject(reportedConfig);
                      const flattenedDesired = flattenObject(desiredConfig);
                      const currentValue = flattenedDesired[key] !== undefined ? flattenedDesired[key] : flattenedReported[key];
                      return tableValues[key] !== currentValue;
                    }) && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {Object.keys(tableValues).filter(key => {
                          const flattenedReported = flattenObject(reportedConfig);
                          const flattenedDesired = flattenObject(desiredConfig);
                          const currentValue = flattenedDesired[key] !== undefined ? flattenedDesired[key] : flattenedReported[key];
                          return tableValues[key] !== currentValue;
                        }).length} changes detected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 dark:text-slate-400 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                No reported configuration available to edit
              </div>
            )
          )}

          {/* Validation Messages */}
          <div className="space-y-2">
            {newConfig && !isValidJson && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Invalid JSON format</span>
              </div>
            )}
            {newConfig && !isValidAscii && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Configuration contains non-ASCII characters</span>
              </div>
            )}
            {canApply && (
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Configuration is valid and ready to apply</span>
              </div>
            )}
          </div>

          {/* Apply Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              onClick={handleApply}
              disabled={!canApply || isLoading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? "Applying..." : "Apply Configuration"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}