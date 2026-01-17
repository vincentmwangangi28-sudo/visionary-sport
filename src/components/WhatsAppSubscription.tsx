import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useWhatsAppSubscription } from '@/hooks/useWhatsAppSubscription';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { MessageCircle, Phone, Check, X, Bell, Loader2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const COUNTRY_CODES = [
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
];

export const WhatsAppSubscription = () => {
  const { user } = useAuth();
  const { subscription, loading, subscribe, unsubscribe, resubscribe } = useWhatsAppSubscription();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+254');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    setIsSubmitting(true);
    const result = await subscribe(phoneNumber, countryCode);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      setPhoneNumber('');
      trackEvent('whatsapp_subscribe', { country_code: countryCode });
    } else {
      toast.error(result.message);
    }
  };

  const handleUnsubscribe = async () => {
    setIsSubmitting(true);
    const result = await unsubscribe();
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      trackEvent('whatsapp_unsubscribe');
    } else {
      toast.error(result.message);
    }
  };

  const handleResubscribe = async () => {
    setIsSubmitting(true);
    const result = await resubscribe();
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      trackEvent('whatsapp_resubscribe');
    } else {
      toast.error(result.message);
    }
  };

  if (!user) {
    return (
      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-green-500" />
            WhatsApp Daily Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Get daily AI predictions delivered straight to your WhatsApp every morning.
          </p>
          <Button variant="outline" className="w-full" disabled>
            Login to Subscribe
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-green-500" />
        </CardContent>
      </Card>
    );
  }

  // User has an active subscription
  if (subscription?.isActive) {
    return (
      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-green-500" />
              WhatsApp Updates
            </CardTitle>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Check className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{subscription.countryCode} {subscription.phoneNumber}</span>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>📅 Daily predictions at 8:00 AM EAT</p>
            <p>📊 Top 10 high-confidence picks</p>
            {subscription.messageCount > 0 && (
              <p>✉️ {subscription.messageCount} messages received</p>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleUnsubscribe}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Unsubscribe
          </Button>
        </CardContent>
      </Card>
    );
  }

  // User has an inactive subscription
  if (subscription && !subscription.isActive) {
    return (
      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-green-500" />
              WhatsApp Updates
            </CardTitle>
            <Badge variant="outline" className="text-muted-foreground">
              Inactive
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You previously unsubscribed. Click below to reactivate your WhatsApp updates.
          </p>
          
          <Button 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleResubscribe}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Reactivate Subscription
          </Button>
        </CardContent>
      </Card>
    );
  }

  // New subscription form
  return (
    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-green-500" />
          WhatsApp Daily Predictions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Get AI predictions delivered to your WhatsApp every morning at 8:00 AM EAT.
        </p>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} {c.country} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-muted rounded-md text-sm">
                {countryCode}
              </div>
              <Input
                id="phone"
                placeholder="712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>✅ Top 10 high-confidence predictions daily</p>
          <p>✅ League-by-league breakdown</p>
          <p>✅ Unsubscribe anytime by replying STOP</p>
        </div>

        <Button 
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={handleSubscribe}
          disabled={isSubmitting || !phoneNumber}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4 mr-2" />
          )}
          Subscribe to WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
};
