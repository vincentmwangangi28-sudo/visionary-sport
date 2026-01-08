import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTransferRumors } from '@/hooks/useTransferRumors';
import { ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function TransferRumorsFeed() {
  const { rumors, loading } = useTransferRumors();

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'bg-green-500/20 text-green-500';
    if (probability >= 50) return 'bg-yellow-500/20 text-yellow-500';
    return 'bg-red-500/20 text-red-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Transfer Rumors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rumors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Transfer Rumors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No transfer rumors available yet. Check back soon!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Transfer Rumors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rumors.slice(0, 5).map(rumor => (
          <div
            key={rumor.id}
            className="border rounded-lg p-4 hover:bg-muted/30 transition-colors space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm">{rumor.headline}</h4>
              <Badge className={getProbabilityColor(rumor.probability)}>
                {rumor.probability}%
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{rumor.player_name}</span>
              <span className="text-muted-foreground">{rumor.current_club}</span>
              <ArrowRight className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">{rumor.target_club}</span>
            </div>

            {rumor.transfer_fee && (
              <p className="text-xs text-muted-foreground">
                Estimated fee: <span className="font-semibold">{rumor.transfer_fee}</span>
              </p>
            )}

            {rumor.details && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {rumor.details}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Source: {rumor.source || 'Various'}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(rumor.created_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
