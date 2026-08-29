import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';

const DISMISS_KEY = 'pp_telegram_banner_dismissed';
const TELEGRAM_URL = 'https://t.me/predictproAi';

export const TelegramPromoBanner = () => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="relative w-full overflow-hidden"
          style={{ background: 'linear-gradient(90deg, #0f1729 0%, #17212b 50%, #0f1729 100%)' }}
        >
          <div className="container mx-auto px-4 py-2.5 flex items-center gap-3">
            <Send className="h-4 w-4 flex-shrink-0" style={{ color: '#229ED9' }} aria-hidden="true" />
            <p className="text-xs sm:text-sm text-white/90 flex-1 truncate">
              Get the daily <b className="text-white">Banker Bet</b> free on our Telegram channel — before it hits the site.
            </p>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join PredictPro Telegram channel for free daily Banker Bets"
              className="relative flex-shrink-0 text-xs sm:text-sm font-semibold text-white px-3 py-1.5 rounded-full"
              style={{ background: '#229ED9' }}
            >
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ background: '#229ED9' }}
                animate={{ boxShadow: ['0 0 0 0 rgba(34,158,217,0.6)', '0 0 0 8px rgba(34,158,217,0)'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
              <span className="relative">Join Free</span>
            </a>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss Telegram announcement"
              className="flex-shrink-0 text-white/50 hover:text-white/90 transition-colors p-1"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
