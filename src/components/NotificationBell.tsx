import { Button } from "@/components/ui/button";
import { Bell, BellOff, BellRing } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export const NotificationBell = () => {
  const { isSupported, permission, requestPermission } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (permission !== 'granted') {
      requestPermission();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            className={permission === 'granted' ? 'text-primary' : 'text-muted-foreground'}
          >
            {permission === 'granted' ? (
              <BellRing className="h-4 w-4" />
            ) : permission === 'denied' ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {permission === 'granted' 
            ? 'Notifications enabled' 
            : permission === 'denied'
            ? 'Notifications blocked - enable in browser settings'
            : 'Enable notifications'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
