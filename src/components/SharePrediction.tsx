import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Prediction } from '@/hooks/usePredictions';

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

  return (
    <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 text-muted-foreground hover:text-foreground">
      {shared ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
      <span className="sr-only">Share prediction</span>
    </Button>
  );
};
