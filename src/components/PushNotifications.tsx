import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const PushNotifications = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationSupported, setNotificationSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ("Notification" in window && "serviceWorker" in navigator) {
      setNotificationSupported(true);
      checkSubscription();
    }
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const requestPermission = async () => {
    if (!user) {
      toast.error("Please login to enable notifications");
      return;
    }

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        toast.error("Notification permission denied");
        return;
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register("/sw.js");
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // This is a placeholder VAPID public key - in production, generate your own
          "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
        ),
      });

      // Save subscription to database
      const subscriptionJSON = subscription.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscriptionJSON.endpoint!,
        p256dh: subscriptionJSON.keys?.p256dh || "",
        auth: subscriptionJSON.keys?.auth || "",
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Notifications enabled!");
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast.error("Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      setIsSubscribed(false);
      toast.success("Notifications disabled");
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error("Failed to disable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      requestPermission();
    }
  };

  if (!notificationSupported) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-4">
          <p className="text-muted-foreground text-sm text-center">
            Push notifications are not supported in your browser
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications" className="text-sm font-medium">
              New Predictions
            </Label>
            <p className="text-xs text-muted-foreground">
              Get notified when new predictions are available
            </p>
          </div>
          <Switch
            id="notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading || !user}
          />
        </div>

        {isSubscribed && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Notifications enabled
          </div>
        )}

        {!user && (
          <p className="text-xs text-muted-foreground text-center">
            Login to enable push notifications
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}
