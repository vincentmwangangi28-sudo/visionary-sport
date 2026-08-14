import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
  Shield,
  ListChecks,
} from "lucide-react";

interface JobRun {
  id: string;
  job_name: string;
  status: string;
  eat_date: string;
  started_at: string;
  finished_at: string | null;
  processed: number | null;
  total_markets: number | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
}

const JOB_NAME = "generate-model-predictions";

const statusMeta = (status: string) => {
  switch (status) {
    case "success":
      return { icon: CheckCircle2, variant: "default" as const, label: "Success" };
    case "failed":
      return { icon: XCircle, variant: "destructive" as const, label: "Failed" };
    case "running":
      return { icon: Clock, variant: "secondary" as const, label: "Running" };
    default:
      return { icon: MinusCircle, variant: "outline" as const, label: status };
  }
};

const durationLabel = (run: JobRun) => {
  if (!run.finished_at) return "—";
  const ms = new Date(run.finished_at).getTime() - new Date(run.started_at).getTime();
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
};

const PredictionRuns = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [runs, setRuns] = useState<JobRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth?next=/admin/prediction-runs");
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user, authLoading, navigate]);

  const loadRuns = useCallback(async () => {
    const { data, error } = await supabase
      .from("job_runs")
      .select("*")
      .eq("job_name", JOB_NAME)
      .order("started_at", { ascending: false })
      .limit(100);

    if (error) {
      toast.error("Could not load run history");
    } else {
      setRuns((data ?? []) as JobRun[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadRuns();
  }, [isAdmin, loadRuns]);

  const triggerRun = async () => {
    setRefreshing(true);
    const { error } = await supabase.functions.invoke("generate-model-predictions");
    if (error) toast.error("Run failed to start");
    else toast.success("Prediction run triggered");
    await loadRuns();
    setRefreshing(false);
  };

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 container mx-auto px-4 max-w-2xl text-center">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-2">Admins only</h1>
          <p className="text-muted-foreground">
            Prediction run history is restricted to administrator accounts.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const totalInserted = runs.reduce((sum, r) => sum + (r.processed ?? 0), 0);
  const failures = runs.filter((r) => r.status === "failed").length;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Prediction Run History | PredictPro Admin"
        description="Audit log of daily prediction generation runs: timestamps, predictions inserted, and errors."
        canonical="/admin/prediction-runs"
        noindex
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
                Prediction Run History
              </h1>
              <p className="text-muted-foreground">
                Every <code className="text-xs">generate-model-predictions</code> run with timestamps,
                counts inserted and errors.
              </p>
            </div>
            <Button onClick={triggerRun} disabled={refreshing} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Run now
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Runs logged</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold">{runs.length}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Predictions inserted</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold">{totalInserted}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Failed runs</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold">{failures}</CardContent>
            </Card>
          </div>

          {loading || isAdmin === null ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ListChecks className="h-8 w-8 mx-auto mb-3" />
                No runs recorded yet. Trigger one with “Run now”.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => {
                const meta = statusMeta(run.status);
                const Icon = meta.icon;
                return (
                  <Card key={run.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={meta.variant} className="gap-1">
                              <Icon className="h-3 w-3" />
                              {meta.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              EAT day {run.eat_date}
                            </span>
                          </div>
                          <p className="text-sm font-medium">
                            {format(new Date(run.started_at), "d MMM yyyy, HH:mm:ss")} UTC
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              ({formatDistanceToNow(new Date(run.started_at), { addSuffix: true })})
                            </span>
                          </p>
                          {run.error && (
                            <p className="mt-2 text-sm text-destructive break-words">{run.error}</p>
                          )}
                          {!run.error && typeof run.metadata?.message === "string" && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {run.metadata.message as string}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm shrink-0">
                          <p className="font-semibold">
                            {run.processed ?? 0} inserted
                          </p>
                          <p className="text-muted-foreground">
                            {run.total_markets ?? 0} scanned
                          </p>
                          <p className="text-muted-foreground text-xs">
                            took {durationLabel(run)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PredictionRuns;
