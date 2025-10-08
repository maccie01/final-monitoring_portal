import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

export function SessionWarning() {
  const { sessionWarning, dismissWarning } = useAuth();

  if (!sessionWarning) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="text-orange-800 dark:text-orange-200 pr-8">
          {sessionWarning}
        </AlertDescription>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
          onClick={dismissWarning}
          data-testid="button-dismiss-session-warning"
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  );
}