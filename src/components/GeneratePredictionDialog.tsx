import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { usePredictions } from '@/hooks/usePredictions';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';

const matchDataSchema = z.object({
  homeTeam: z.string()
    .trim()
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Team name can only contain letters, numbers, spaces, and hyphens'),
  awayTeam: z.string()
    .trim()
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Team name can only contain letters, numbers, spaces, and hyphens'),
  league: z.string()
    .trim()
    .min(3, 'League name must be at least 3 characters')
    .max(50, 'League name must be less than 50 characters'),
  matchDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
});

export const GeneratePredictionDialog = () => {
  const { user } = useAuth();
  const { generatePrediction } = usePredictions();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    league: 'Premier League',
    matchDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to generate predictions');
      return;
    }

    const validation = matchDataSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const validatedData = {
        homeTeam: validation.data.homeTeam,
        awayTeam: validation.data.awayTeam,
        league: validation.data.league,
        matchDate: validation.data.matchDate
      };
      await generatePrediction(validatedData);
      toast.success('Prediction generated successfully!');
      setOpen(false);
      setFormData({
        homeTeam: '',
        awayTeam: '',
        league: 'Premier League',
        matchDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      toast.error('Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="lg" className="gap-2 animate-pulse-glow">
          <Sparkles className="h-5 w-5 animate-pulse" />
          Generate AI Prediction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Match Prediction</DialogTitle>
          <DialogDescription>
            Enter match details to get AI-powered predictions
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          toolname="generate_custom_match_prediction"
          tooldescription="Generate an AI football prediction for a custom home vs away team fixture"
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="homeTeam">Home Team</Label>
            <Input
              id="homeTeam"
              name="homeTeam"
              toolparamdescription="Name of the home football club"
              placeholder="e.g., Arsenal"
              value={formData.homeTeam}
              onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="awayTeam">Away Team</Label>
            <Input
              id="awayTeam"
              name="awayTeam"
              toolparamdescription="Name of the away football club"
              placeholder="e.g., Chelsea"
              value={formData.awayTeam}
              onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="league">League</Label>
            <Input
              id="league"
              name="league"
              toolparamdescription="Name of the football league or competition"
              placeholder="e.g., Premier League"
              value={formData.league}
              onChange={(e) => setFormData({ ...formData, league: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="matchDate">Match Date</Label>
            <Input
              id="matchDate"
              name="matchDate"
              type="date"
              toolparamdescription="Scheduled match date in YYYY-MM-DD format"
              value={formData.matchDate}
              onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Prediction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
