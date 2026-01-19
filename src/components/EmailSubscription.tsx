import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Bell, Loader2, Check, X } from 'lucide-react';
import { useEmailSubscription } from '@/hooks/useEmailSubscription';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const EmailSubscription = () => {
  const { user } = useAuth();
  const { subscription, loading, subscribe, updatePreferences, unsubscribe } = useEmailSubscription();
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    const result = await subscribe(email, frequency);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Successfully subscribed to email digest!');
      setEmail('');
    } else {
      toast.error(result.error || 'Failed to subscribe');
    }
  };

  const handleUnsubscribe = async () => {
    setIsSubmitting(true);
    const result = await unsubscribe();
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Successfully unsubscribed');
    } else {
      toast.error(result.error || 'Failed to unsubscribe');
    }
  };

  const handleTogglePreference = async (key: 'predictions' | 'news' | 'alerts') => {
    if (!subscription) return;
    
    const result = await updatePreferences({ 
      [key]: !subscription.preferences[key] 
    });

    if (result.success) {
      toast.success('Preferences updated');
    } else {
      toast.error('Failed to update preferences');
    }
  };

  if (!user) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            Email Digest
          </CardTitle>
          <CardDescription>Sign in to subscribe to daily predictions</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5 text-primary" />
          Email Digest
        </CardTitle>
        <CardDescription>
          Get predictions and insights delivered to your inbox
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription?.is_active ? (
          <>
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <Check className="h-5 w-5 text-primary" />
              <span className="text-sm">Subscribed: {subscription.email}</span>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Notification Preferences</Label>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Predictions</span>
                <Switch
                  checked={subscription.preferences.predictions}
                  onCheckedChange={() => handleTogglePreference('predictions')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">News Updates</span>
                <Switch
                  checked={subscription.preferences.news}
                  onCheckedChange={() => handleTogglePreference('news')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Alerts</span>
                <Switch
                  checked={subscription.preferences.alerts}
                  onCheckedChange={() => handleTogglePreference('alerts')}
                />
              </div>
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
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as 'daily' | 'weekly')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSubscribe} 
              disabled={isSubmitting || !email}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Subscribe
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
