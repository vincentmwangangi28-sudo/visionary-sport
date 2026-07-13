import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Prediction } from '@/types/prediction';

export const SharePrediction = ({ prediction }: { prediction: Prediction }) => {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const text = `🔮 AI Prediction: ${prediction.home_team} vs ${prediction.away_team}\n📊 Outcome: ${prediction.predicted_outcome}\n💯 Confidence: ${prediction.confidence_score}%\n\nGet AI football predictions at predictpro.guru`;
    const url = `https://predictpro.guru`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'PredictPro AI Prediction', text, url });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') fallbackCopy(text);
      }
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    });
  };

  if (prediction.is_premium && prediction.predicted_outcome === '🔒 Premium') return null;

  const telegramShare = () => {
    const t = encodeURIComponent(`🔮 ${prediction.home_team} vs ${prediction.away_team} — ${outcome} ${(prediction.confidence_score??prediction.confidence??0)}% confidence | predictpro.guru`);
    window.open(`https://t.me/share/url?url=https://predictpro.guru&text=${t}`, '_blank', 'noopener');
  };
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 text-muted-foreground hover:text-foreground h-7 px-2">
        {shared ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Share2 className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="sm" onClick={telegramShare} className="text-muted-foreground hover:text-blue-500 h-7 px-2">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      </Button>
    </div>
  );
};
