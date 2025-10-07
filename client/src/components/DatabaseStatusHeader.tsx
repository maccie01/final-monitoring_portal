import React, { useState, useEffect } from "from "react"";
import { Alert, AlertDescription } from "from "@/components/ui/alert"";
import { Database, X } from "from "lucide-react"";
import { getStatusIcon } from "from "./shared/energy-utils"";
import { Button } from "from "@/components/ui/button"";

interface DatabaseStatus {
  settingdbOnline: boolean;
  usingFallback: boolean;
  activeDatabase: string;
  fallbackDatabase: string;
}

export default function DatabaseStatusHeader() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const checkDatabaseStatus = async (retryCount = 0) => {
    try {
      const response = await fetch('/api/database/status', {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking database status:', error);
      
      // Retry up to 2 times with delay
      if (retryCount < 2) {
        setTimeout(() => {
          checkDatabaseStatus(retryCount + 1);
        }, 1000 * (retryCount + 1)); // 1s, then 2s delay
      } else {
        setIsLoading(false);
        // Set a basic fallback status to avoid crashes
        setStatus({
          settingdbOnline: true,
          usingFallback: false,
          activeDatabase: 'Standard-Settingdb',
          fallbackDatabase: 'Lokale Neon-Datenbank'
        });
      }
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkDatabaseStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !status || (!status.usingFallback && status.settingdbOnline)) {
    return null;
  }

  if (!isVisible) {
    return null;
  }


  const getAlertVariant = () => {
    return status.settingdbOnline ? 'default' : 'destructive';
  };

  const getMessage = () => {
    if (!status.settingdbOnline && status.usingFallback) {
      return `Settingdb nicht erreichbar - System verwendet Fallback-Datenbank (${status.fallbackDatabase})`;
    } else if (status.settingdbOnline && !status.usingFallback) {
      return `Verbunden mit Standard-Datenbank (${status.activeDatabase})`;
    } else {
      return `Datenbankstatus: ${status.activeDatabase}`;
    }
  };

  return (
    <div className="w-full bg-orange-50 border-b border-orange-200 px-4 py-2">
      <Alert variant={getAlertVariant()} className="border-0 bg-transparent p-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.settingdbOnline ? 'online' : 'offline')}
            <Database className="w-4 h-4 text-gray-600" />
            <AlertDescription className="text-sm font-medium">
              {getMessage()}
            </AlertDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            {!status.settingdbOnline && (
              <Button
                onClick={() => checkDatabaseStatus()}
                variant="outline"
                size="sm"
                className="h-6 text-xs"
              >
                Status prüfen
              </Button>
            )}
            
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}