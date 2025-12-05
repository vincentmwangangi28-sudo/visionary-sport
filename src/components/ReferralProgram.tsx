import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReferral } from '@/hooks/useReferral';
import { useAuth } from '@/hooks/useAuth';
import { Users, Copy, Check, Gift, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export const ReferralProgram = () => {
  const { user } = useAuth();
  const { referralCode, referrals, totalEarned, loading, applyReferralCode } = useReferral();
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [applying, setApplying] = useState(false);

  const copyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode.code);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLink = () => {
    if (referralCode) {
      const link = `${window.location.origin}/auth?ref=${referralCode.code}`;
      navigator.clipboard.writeText(link);
      toast.success('Referral link copied!');
    }
  };

  const handleApplyCode = async () => {
    if (!inputCode.trim()) {
      toast.error('Please enter a referral code');
      return;
    }

    setApplying(true);
    const result = await applyReferralCode(inputCode.trim());
    if (result.success) {
      toast.success(result.message);
      setInputCode('');
    } else {
      toast.error(result.message);
    }
    setApplying(false);
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <CardTitle>Referral Program</CardTitle>
          </div>
          <CardDescription>Invite friends and earn 50 coins each!</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link to="/auth">
              <Lock className="mr-2 h-4 w-4" />
              Login to Get Your Code
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
        <div className="flex items-center justify-center gap-2">
          <Users className="h-6 w-6 text-green-500" />
          <CardTitle>Referral Program</CardTitle>
        </div>
        <CardDescription className="text-center">
          Invite friends and earn 50 coins for each signup!
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Your Referral Code */}
        {referralCode && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Your Referral Code</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg font-bold text-center">
                {referralCode.code}
              </div>
              <Button variant="outline" size="icon" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={copyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Invite Link
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">{referrals.length}</p>
            <p className="text-sm text-muted-foreground">Friends Invited</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{totalEarned}</p>
            <p className="text-sm text-muted-foreground">Coins Earned</p>
          </div>
        </div>

        {/* Apply Code */}
        <div className="space-y-3 pt-4 border-t">
          <label className="text-sm font-medium">Have a referral code?</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="font-mono"
            />
            <Button onClick={handleApplyCode} disabled={applying}>
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Rewards Info */}
        <div className="bg-primary/5 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            How it works
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Share your unique code with friends</li>
            <li>• When they sign up, you both get 50 coins</li>
            <li>• No limit on referrals!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
