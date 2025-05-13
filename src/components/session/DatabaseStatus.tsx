
import React, { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { initializeOfflineDB, getCurrentDBVersion } from "@/lib/offlineDB";

interface DatabaseStatusProps {
  dbInitialized: boolean;
  onInitialized?: () => void;
}

const DatabaseStatus: React.FC<DatabaseStatusProps> = ({ 
  dbInitialized, 
  onInitialized 
}) => {
  const [isAttemptingReconnect, setIsAttemptingReconnect] = useState(false);
  const [dbVersion, setDbVersion] = useState<number>(0);
  
  useEffect(() => {
    setDbVersion(getCurrentDBVersion());
  }, []);

  const handleRetryInit = async () => {
    setIsAttemptingReconnect(true);
    try {
      const success = await initializeOfflineDB();
      if (success && onInitialized) {
        onInitialized();
      }
    } finally {
      setIsAttemptingReconnect(false);
    }
  };
  
  if (dbInitialized) {
    return null;
  }
  
  return (
    <Alert variant="destructive">
      <AlertTitle>Database Initialization Failed</AlertTitle>
      <AlertDescription>
        <p>
          The offline database could not be initialized. Some features may not work correctly.
          This can happen if you're using an older browser or if the database schema has been updated.
        </p>
        <div className="flex justify-end mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetryInit} 
            disabled={isAttemptingReconnect}
          >
            {isAttemptingReconnect ? (
              <>Reconnecting...</>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default DatabaseStatus;
