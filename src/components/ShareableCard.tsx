import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Download, 
  Twitter, 
  Facebook, 
  MessageCircle,
  Send,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ShareableCardProps {
  homeTeam: string;
  awayTeam: string;
  league: string;
  prediction: string;
  confidence: number;
  matchDate?: string;
  variant?: 'compact' | 'full';
}

export const ShareableCard = ({
  homeTeam,
  awayTeam,
  league,
  prediction,
  confidence,
  matchDate,
  variant = 'compact'
}: ShareableCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const shareText = `🔮 AI Prediction
━━━━━━━━━━━━━━━━━
🏆 ${league}
⚽ ${homeTeam} vs ${awayTeam}
${matchDate ? `📅 ${new Date(matchDate).toLocaleDateString()}` : ''}

📊 Prediction: ${prediction}
💪 Confidence: ${confidence}%

Get AI predictions at predictpro.guru`;

  const shareUrl = 'https://predictpro.guru';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const getConfidenceColor = () => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-primary';
    return 'text-yellow-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          {variant === 'full' && 'Share'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Prediction
          </DialogTitle>
        </DialogHeader>

        {/* Preview Card */}
        <Card className="bg-gradient-to-br from-primary/20 via-background to-secondary/10 border-primary/30 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="text-xs">
                🏆 {league}
              </Badge>
              <span className="text-2xl">🔮</span>
            </div>

            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-4 mb-2">
                <span className="text-lg font-bold">{homeTeam}</span>
                <span className="text-muted-foreground">vs</span>
                <span className="text-lg font-bold">{awayTeam}</span>
              </div>
              {matchDate && (
                <p className="text-sm text-muted-foreground">
                  {new Date(matchDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="bg-background/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">AI Prediction</p>
              <p className="text-xl font-bold text-primary mb-2">{prediction}</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary-glow"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className={`font-bold ${getConfidenceColor()}`}>
                  {confidence}%
                </span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                predictpro.guru
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share Options */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            className="flex flex-col gap-1 h-auto py-3"
            onClick={() => handleShare('twitter')}
          >
            <Twitter className="w-5 h-5 text-[#1DA1F2]" />
            <span className="text-xs">Twitter</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col gap-1 h-auto py-3"
            onClick={() => handleShare('facebook')}
          >
            <Facebook className="w-5 h-5 text-[#4267B2]" />
            <span className="text-xs">Facebook</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col gap-1 h-auto py-3"
            onClick={() => handleShare('whatsapp')}
          >
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            <span className="text-xs">WhatsApp</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col gap-1 h-auto py-3"
            onClick={() => handleShare('telegram')}
          >
            <Send className="w-5 h-5 text-[#0088cc]" />
            <span className="text-xs">Telegram</span>
          </Button>
        </div>

        {/* Copy Button */}
        <Button onClick={handleCopy} className="w-full gap-2">
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy to Clipboard
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
