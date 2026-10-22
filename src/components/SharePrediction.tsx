import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Prediction } from '@/types/prediction';
import { encodeSlipToParam } from '@/hooks/useBetSlip';

export const SharePrediction = ({ prediction }: { prediction: Prediction }) => {
  const [shared, setShared] = useState(false);

  if (prediction.is_premium && prediction.predicted_outcome === '🔒 Premium') return null;

  const outcome = prediction.predicted_outcome || prediction.prediction || 'Home Win';
  const confidence = prediction.confidence_score ?? prediction.confidence ?? 78;
  const odds =
    outcome === 'Home Win'
      ? prediction.home_odds || 1.85
      : outcome === 'Away Win'
        ? prediction.away_odds || 2.15
        : prediction.draw_odds || 3.2;

  const encodedLeg = encodeSlipToParam([
    {
      homeTeam: prediction.home_team,
      awayTeam: prediction.away_team,
      league: prediction.league,
      market: outcome,
      odds,
      confidence,
    },
  ]);

  const deepLinkUrl = `https://predictpro.guru/?slip=${encodeURIComponent(encodedLeg)}`;
  const shareText = `⚽ ${prediction.home_team} vs ${prediction.away_team} (${prediction.league})\n👉 AI Pick: ${outcome} @ ${odds.toFixed(2)} (${confidence}% Confidence)\n\n👇 Click to auto-load this pick into your Bet Slip:\n${deepLinkUrl}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${prediction.home_team} vs ${prediction.away_team} Prediction`,
          text: shareText,
          url: deepLinkUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') fallbackCopy(shareText);
      }
    } else {
      fallbackCopy(shareText);
    }
  };

  const fallbackCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied match pick & auto-load slip link!');
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    });
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(deepLinkUrl)}&text=${encodeURIComponent(
    `⚽ ${prediction.home_team} vs ${prediction.away_team} — ${outcome} @ ${odds.toFixed(2)} (${confidence}% AI)`
  )}`;

  return (
    <div className="flex items-center gap-1">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Share ${prediction.home_team} vs ${prediction.away_team} prediction on WhatsApp`}
        title="Share on WhatsApp"
        className="inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-muted h-8 w-8 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.126.556 4.122 1.529 5.854l-1.529 5.586 5.719-1.501c1.693.922 3.633 1.45 5.699 1.45 6.627 0 12-5.373 12-12s-5.373-12-11.418-11.389z" />
        </svg>
      </a>
      <a
        href={telegramHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Share ${prediction.home_team} vs ${prediction.away_team} prediction on Telegram`}
        title="Share on Telegram"
        className="inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-sky-600 dark:hover:text-sky-400 hover:bg-muted h-8 w-8 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      </a>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        aria-label={`Copy or share ${prediction.home_team} vs ${prediction.away_team} prediction`}
        title="Copy match pick & link"
        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
      >
        {shared ? (
          <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
        ) : (
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
};

