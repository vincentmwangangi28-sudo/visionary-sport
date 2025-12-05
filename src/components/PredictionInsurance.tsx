import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Info, CheckCircle } from 'lucide-react';

interface PredictionInsuranceProps {
  predictionId: string;
  coinsCost: number;
  onInsure?: () => void;
  isInsured?: boolean;
}

export const PredictionInsurance = ({ 
  predictionId, 
  coinsCost, 
  onInsure, 
  isInsured = false 
}: PredictionInsuranceProps) => {
  const insuranceCost = Math.round(coinsCost * 0.2); // 20% of prediction cost

  return (
    <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
      <Shield className="h-5 w-5 text-amber-500 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">Prediction Insurance</p>
        <p className="text-xs text-muted-foreground">
          Get 50% refund if prediction fails
        </p>
      </div>
      {isInsured ? (
        <Badge variant="outline" className="border-green-500 text-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Insured
        </Badge>
      ) : (
        <Button variant="outline" size="sm" onClick={onInsure}>
          +{insuranceCost} coins
        </Button>
      )}
    </div>
  );
};

export const InsuranceInfoCard = () => {
  return (
    <Card className="border-amber-500/20">
      <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-amber-500" />
          <CardTitle>Prediction Insurance</CardTitle>
        </div>
        <CardDescription>
          Protect your bets with our insurance feature
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid gap-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-amber-500">1</span>
            </div>
            <div>
              <p className="font-medium">Purchase Insurance</p>
              <p className="text-sm text-muted-foreground">
                Pay 20% of prediction cost for insurance
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-amber-500">2</span>
            </div>
            <div>
              <p className="font-medium">Prediction Fails?</p>
              <p className="text-sm text-muted-foreground">
                If your prediction doesn't win
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-green-500">3</span>
            </div>
            <div>
              <p className="font-medium">Get 50% Refund</p>
              <p className="text-sm text-muted-foreground">
                Automatically receive half your coins back
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Insurance must be purchased before the match starts
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
