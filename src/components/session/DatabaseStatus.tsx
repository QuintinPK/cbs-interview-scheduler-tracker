
import React, { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Info, HardDrive } from "lucide-react";
import { 
  initializeOfflineDB, 
  getCurrentDBVersion, 
  checkBrowserCompatibility 
} from "@/lib/offlineDB";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [isCompatible, setIsCompatible] = useState(true);
  
  useEffect(() => {
    setDbVersion(getCurrentDBVersion());
    setIsCompatible(checkBrowserCompatibility());
  }, []);

  const handleRetryInit = async () => {
    setIsAttemptingReconnect(true);
    setAttemptCount(prev => prev + 1);
    
    try {
      const success = await initializeOfflineDB();
      if (success && onInitialized) {
        onInitialized();
      } else if (!success) {
        console.error("Database initialization retry failed");
      }
    } catch (error) {
      console.error("Error during database initialization retry:", error);
    } finally {
      setIsAttemptingReconnect(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("This will delete all offline data. You will lose any unsynchronized sessions and interviews. Are you sure?")) {
      return;
    }
    
    try {
      // Delete the entire database
      const deleteRequest = window.indexedDB.deleteDatabase('cbs_offline_db');
      
      deleteRequest.onerror = () => {
        console.error("Could not delete database");
      };
      
      deleteRequest.onsuccess = () => {
        console.log("Database deleted successfully");
        // Attempt to initialize a fresh database
        handleRetryInit();
      };
    } catch (error) {
      console.error("Error resetting database:", error);
    }
  };
  
  if (dbInitialized) {
    return null;
  }
  
  return (
    <>
      <Alert variant="destructive" className="mb-4">
        <AlertTitle className="flex items-center">
          <HardDrive className="h-4 w-4 mr-2" />
          Database Initialization Failed
        </AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            The offline database could not be initialized. Some features may not work correctly.
            {!isCompatible && (
              <strong> Your browser does not support IndexedDB, which is required for offline functionality.</strong>
            )}
          </p>
          
          <div className="flex justify-between mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowTroubleshooting(true)}
            >
              <Info className="h-4 w-4 mr-2" />
              Troubleshooting
            </Button>
            
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetryInit} 
                disabled={isAttemptingReconnect || !isCompatible}
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
              
              {attemptCount >= 2 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleResetDatabase}
                  disabled={!isCompatible}
                >
                  Reset Database
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
      
      <Dialog open={showTroubleshooting} onOpenChange={setShowTroubleshooting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Database Troubleshooting</DialogTitle>
            <DialogDescription>
              Information to help resolve database initialization issues
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <h3 className="font-medium">Current Database Version</h3>
              <p className="text-sm text-muted-foreground">Version {dbVersion}</p>
            </div>
            
            <div>
              <h3 className="font-medium">Browser Compatibility</h3>
              <p className="text-sm text-muted-foreground">
                {isCompatible 
                  ? "Your browser supports IndexedDB" 
                  : "Your browser does NOT support IndexedDB"}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Common Solutions</h3>
              <ul className="text-sm text-muted-foreground list-disc ml-5 space-y-1">
                <li>Try using a modern browser like Chrome, Firefox, Edge or Safari</li>
                <li>Clear your browser cache and cookies</li>
                <li>Disable browser extensions that might interfere</li>
                <li>If using private/incognito browsing, try regular mode</li>
                <li>After multiple retry attempts, use the "Reset Database" option</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowTroubleshooting(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DatabaseStatus;
