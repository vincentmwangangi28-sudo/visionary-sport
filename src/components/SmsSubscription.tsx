import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Bell, Loader2, Check, X } from 'lucide-react';
import { useSmsSubscription } from '@/hooks/useSmsSubscription';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const countryCodes = [
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
];

export const SmsSubscription = () => {
  const { user } = useAuth();
  const { subscription, loading, subscribe, toggleAlerts, unsubscribe } = useSmsSubscription();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+254');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    const result = await subscribe(phoneNumber, countryCode);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Successfully subscribed to SMS alerts!');
      setPhoneNumber('');
    } else {
      toast.error(result.error || 'Failed to subscribe');
    }
  };

  const handleToggleAlerts = async () => {
    setIsSubmitting(true);
    const result = await toggleAlerts();
    setIsSubmitting(false);

    if (result.success) {
      toast.success(subscription?.alerts_enabled ? 'Alerts disabled' : 'Alerts enabled');
    } else {
      toast.error('Failed to toggle alerts');
    }
  };

  const handleUnsubscribe = async () => {
    setIsSubmitting(true);
    const result = await unsubscribe();
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Successfully unsubscribed from SMS alerts');
    } else {
      toast.error(result.error || 'Failed to unsubscribe');
    }
  };

  if (!user) {
    return (
      <Card className="bg-card/50 backdrop-blur border-amber-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-amber-500" />
            SMS Alerts
          </CardTitle>
          <CardDescription>Sign in to receive SMS predictions</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-amber-500/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-amber-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-amber-500" />
          SMS Alerts
        </CardTitle>
        <CardDescription>
          Get high-confidence predictions via SMS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription?.is_active ? (
          <>
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg">
              <Check className="h-5 w-5 text-amber-500" />
              <span className="text-sm">
                Subscribed: {subscription.country_code}{subscription.phone_number}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">High-Confidence Alerts</span>
              </div>
              <Switch
                checked={subscription.alerts_enabled}
                onCheckedChange={handleToggleAlerts}
                disabled={isSubmitting}
              />
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUnsubscribe}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Unsubscribe
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Country Code</Label>
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((cc) => (
                    <SelectItem key={cc.code} value={cc.code}>
                      {cc.flag} {cc.country} ({cc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <div className="bg-muted px-3 py-2 rounded-md text-sm font-medium">
                  {countryCode}
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="flex-1"
                />
              </div>
            </div>

            <Button 
              onClick={handleSubscribe} 
              disabled={isSubmitting || !phoneNumber}
              className="w-full bg-amber-500 hover:bg-amber-600"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Subscribe to SMS Alerts
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You'll receive SMS for predictions with 75%+ confidence
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
