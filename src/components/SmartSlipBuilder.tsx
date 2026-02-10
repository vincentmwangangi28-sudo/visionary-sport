import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, TrendingUp, Loader2, Copy, Share2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SlipPrediction {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  prediction: string;
  confidence: number;
  league: string;
  matchDate: string;
  sport: string;
}

interface SmartSlip {
  predictions: SlipPrediction[];
  totalOdds: number;
  combinedConfidence: number;
  stakePercentage: number;
  riskLevel: string;
  reasoning: string;
}

export const SmartSlipBuilder = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [slip, setSlip] = useState<SmartSlip | null>(null);
  const [riskLevel, setRiskLevel] = useState("medium");
  const [slipSize, setSlipSize] = useState("3");

  const generateSlip = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-slip-builder', {
        body: {
          riskLevel,
          slipSize: parseInt(slipSize),
          userId: user?.id
        }
      });

      if (error) throw error;
      if (data.success) {
        setSlip(data.slip);
        toast.success("Smart slip generated!");
      } else {
        toast.error(data.error || "Failed to generate slip");
      }
    } catch (error) {
      console.error("Slip builder error:", error);
      toast.error("Failed to generate smart slip");
    } finally {
      setLoading(false);
    }
  };

  const copySlip = () => {
    if (!slip) return;
    const text = slip.predictions.map(p => 
      `${p.homeTeam} vs ${p.awayTeam}: ${p.prediction}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    toast.success("Slip copied to clipboard!");
  };

  const shareSlip = async () => {
    if (!slip) return;
    const text = `🎯 PredictPro Smart Slip\n\n${slip.predictions.map(p => 
      `⚽ ${p.homeTeam} vs ${p.awayTeam}\n   📌 ${p.prediction} (${p.confidence}%)`
    ).join('\n\n')}\n\n💰 Combined Odds: ${slip.totalOdds}x\n🎯 Confidence: ${slip.combinedConfidence}%\n\nGenerate yours at predictpro.guru`;
    
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Share text copied!");
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Smart Accumulator Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Select value={riskLevel} onValueChange={setRiskLevel}>
            <SelectTrigger className="w-32" aria-label="Select risk level">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>

          <Select value={slipSize} onValueChange={setSlipSize}>
            <SelectTrigger className="w-28" aria-label="Select slip size">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Picks</SelectItem>
              <SelectItem value="3">3 Picks</SelectItem>
              <SelectItem value="4">4 Picks</SelectItem>
              <SelectItem value="5">5 Picks</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={generateSlip} disabled={loading} className="flex-1">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Build Slip
              </>
            )}
          </Button>
        </div>

        {slip && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Badge className={getRiskColor(slip.riskLevel)}>
                {slip.riskLevel.toUpperCase()} RISK
              </Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={copySlip}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={shareSlip}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {slip.predictions.map((pred, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                        {pred.homeTeam} vs {pred.awayTeam}
                      </p>
                      <p className="text-xs text-muted-foreground">{pred.league}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{pred.prediction}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{pred.confidence}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="text-center p-2 bg-primary/10 rounded">
                <p className="text-xl font-bold text-primary">{slip.totalOdds}x</p>
                <p className="text-xs text-muted-foreground">Total Odds</p>
              </div>
              <div className="text-center p-2 bg-green-500/10 rounded">
                <p className="text-xl font-bold text-green-400">{slip.combinedConfidence}%</p>
                <p className="text-xs text-muted-foreground">Win Chance</p>
              </div>
              <div className="text-center p-2 bg-yellow-500/10 rounded">
                <p className="text-xl font-bold text-yellow-400">{slip.stakePercentage}%</p>
                <p className="text-xs text-muted-foreground">Stake</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              💡 {slip.reasoning}
            </p>

            <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded text-xs text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              Gamble responsibly. 18+ only.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
