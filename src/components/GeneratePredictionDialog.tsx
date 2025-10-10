import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { usePredictions } from '@/hooks/usePredictions';
import { useAuth } from '@/hooks/useAuth';

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

    setLoading(true);
    try {
      await generatePrediction(formData);
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
        <Button variant="hero" size="lg" className="gap-2">
          <Sparkles className="h-5 w-5" />
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="homeTeam">Home Team</Label>
            <Input
              id="homeTeam"
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
              type="date"
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
