import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Shield,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Database,
  BarChart3,
  Calendar,
  AlertTriangle,
  Globe,
  FileText,
  Image as ImageIcon,
  Video,
  Search,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface FunctionStat {
  id: number;
  function_name: string;
  status: string;
  invocations: number;
  success_rate: number;
  last_updated: string;
}

interface SitemapMeta {
  page_path: string;
  title: string;
  structured_data: {
    generated_at?: string;
    url_count?: number;
    sitemap_count?: number;
    total_urls?: number;
    total_images?: number;
    total_schemas?: number;
    total_faqs?: number;
    indexnow_status?: { success: boolean; status?: number };
    sitemaps?: Record<string, { url_count?: number; sitemap_count?: number; status?: string }>;
  } | null;
}

interface CronJob {
  jobname: string;
  schedule: string;
  command: string;
  active: boolean;
}

const AUTOMATION_FUNCTIONS = [
  { name: "master-automation", label: "Master Automation", icon: Zap, phase: "Core" },
  { name: "cron-daily-predictions", label: "Daily Predictions", icon: BarChart3, phase: "Core" },
  { name: "cron-hourly-fixtures", label: "Hourly Fixtures", icon: Clock, phase: "Data" },
  { name: "fetch-live-matches", label: "Live Matches", icon: Activity, phase: "Data" },
  { name: "fetch-upcoming-matches", label: "Upcoming Matches", icon: Calendar, phase: "Data" },
  { name: "generate-ai-news", label: "AI News", icon: Zap, phase: "Content" },
  { name: "generate-multi-sport-predictions", label: "Multi-Sport Predictions", icon: BarChart3, phase: "Content" },
  { name: "verify-match-results", label: "Match Verification", icon: CheckCircle2, phase: "Verification" },
  { name: "update-accuracy-stats", label: "Accuracy Stats", icon: BarChart3, phase: "Reports" },
  { name: "generate-accuracy-reports", label: "Accuracy Reports", icon: Database, phase: "Reports" },
  { name: "auto-cleanup", label: "Auto Cleanup", icon: Database, phase: "Maintenance" },
  { name: "award-badges", label: "Badge Awards", icon: Shield, phase: "Rewards" },
  { name: "send-email-digest", label: "Email Digest", icon: Zap, phase: "Communications" },
  { name: "send-sms-alerts", label: "SMS Alerts", icon: Zap, phase: "Communications" },
  { name: "send-whatsapp-broadcast", label: "WhatsApp Broadcast", icon: Zap, phase: "Communications" },
  { name: "fetch-transfer-rumors", label: "Transfer Rumors", icon: Activity, phase: "Content" },
  { name: "detect-upset-alerts", label: "Upset Alerts", icon: AlertTriangle, phase: "Analysis" },
  { name: "auto-sitemap", label: "Auto Sitemap", icon: Globe, phase: "SEO" },
];

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [stats, setStats] = useState<FunctionStat[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [sitemapData, setSitemapData] = useState<SitemapMeta[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check admin role
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error || !data) {
        toast.error("Access denied: Admin role required");
        navigate("/");
        return;
      }
      setIsAdmin(true);
      setCheckingRole(false);
    };

    checkAdmin();
  }, [user, authLoading, navigate]);

  // Fetch stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const { data, error } = await supabase
        .from("edge_function_stats")
        .select("*")
        .order("last_updated", { ascending: false });

      if (!error && data) {
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch sitemap SEO data
  const fetchSitemapData = async () => {
    try {
      const { data } = await supabase
        .from("seo_metadata")
        .select("page_path, title, structured_data")
        .in("page_path", ["/sitemap.xml", "/sitemap-index.xml", "/image-sitemap.xml", "/video-sitemap.xml", "/seo-health"]);
      if (data) setSitemapData(data as SitemapMeta[]);
    } catch (err) {
      console.error("Failed to fetch sitemap data:", err);
    }
  };

  // Fetch cron jobs
  const fetchCronJobs = async () => {
    try {
      // We already verified admin, just load what we can from edge_function_stats
    } catch (err) {
      console.error("Failed to fetch cron jobs:", err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchSitemapData();
    }
  }, [isAdmin]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchSitemapData()]);
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const handleTriggerFunction = async (functionName: string) => {
    try {
      toast.info(`Triggering ${functionName}...`);
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {},
      });
      if (error) throw error;
      toast.success(`${functionName} triggered successfully`);
      // Refresh stats after a delay
      setTimeout(fetchStats, 3000);
    } catch (err: any) {
      toast.error(`Failed to trigger ${functionName}: ${err.message}`);
    }
  };

  const getStatForFunction = (name: string): FunctionStat | undefined => {
    return stats.find((s) => s.function_name === name);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "success":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "error":
      case "failed":
        return "bg-destructive/15 text-destructive border-destructive/30";
      case "running":
        return "bg-primary/15 text-primary border-primary/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return "text-emerald-400";
    if (rate >= 70) return "text-yellow-400";
    return "text-destructive";
  };

  // Group functions by phase
  const phases = AUTOMATION_FUNCTIONS.reduce(
    (acc, fn) => {
      if (!acc[fn.phase]) acc[fn.phase] = [];
      acc[fn.phase].push(fn);
      return acc;
    },
    {} as Record<string, typeof AUTOMATION_FUNCTIONS>
  );

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  // Summary stats
  const totalInvocations = stats.reduce((s, f) => s + (f.invocations || 0), 0);
  const avgSuccessRate =
    stats.length > 0
      ? Math.round(stats.reduce((s, f) => s + (f.success_rate || 0), 0) / stats.length)
      : 0;
  const activeFunctions = stats.filter((s) => s.status === "active" || s.status === "success").length;
  const errorFunctions = stats.filter((s) => s.status === "error" || s.status === "failed").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Automation & Edge Function Monitor</p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Invocations</p>
              <p className="text-2xl font-bold">{totalInvocations.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg Success Rate</p>
              <p className={`text-2xl font-bold ${getSuccessRateColor(avgSuccessRate)}`}>
                {avgSuccessRate}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Active Functions</p>
              <p className="text-2xl font-bold text-emerald-400">{activeFunctions}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Errors</p>
              <p className={`text-2xl font-bold ${errorFunctions > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {errorFunctions}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Functions by Phase */}
        <div className="space-y-6">
          {Object.entries(phases).map(([phase, functions]) => (
            <Card key={phase} className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  {phase}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea>
                  <div className="divide-y divide-border/40">
                    {functions.map((fn) => {
                      const stat = getStatForFunction(fn.name);
                      const Icon = fn.icon;

                      return (
                        <div
                          key={fn.name}
                          className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{fn.label}</p>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {fn.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {loadingStats ? (
                              <Skeleton className="h-5 w-20" />
                            ) : stat ? (
                              <>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${getStatusColor(stat.status)}`}
                                >
                                  {stat.status === "active" || stat.status === "success" ? (
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                  ) : (
                                    <XCircle className="h-3 w-3 mr-1" />
                                  )}
                                  {stat.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                  {stat.invocations} runs
                                </span>
                                <span
                                  className={`text-xs font-semibold hidden md:inline ${getSuccessRateColor(
                                    stat.success_rate
                                  )}`}
                                >
                                  {stat.success_rate}%
                                </span>
                                {stat.last_updated && (
                                  <span className="text-[10px] text-muted-foreground hidden lg:inline">
                                    {formatDistanceToNow(new Date(stat.last_updated), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                )}
                              </>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                No data
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleTriggerFunction(fn.name)}
                            >
                              Run
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Log */}
        {stats.length > 0 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm mt-6">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {stats
                  .filter((s) => s.last_updated)
                  .sort(
                    (a, b) =>
                      new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
                  )
                  .slice(0, 10)
                  .map((stat) => (
                    <div
                      key={stat.id}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {stat.status === "active" || stat.status === "success" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className="font-mono text-xs">{stat.function_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(stat.last_updated), "MMM d, HH:mm:ss")}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEO Health Dashboard */}
        {(() => {
          const healthData = sitemapData.find(s => s.page_path === '/seo-health');
          const sd = healthData?.structured_data;
          return (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm mt-6">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  SEO Health Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {sd ? (
                  <div className="space-y-4">
                    {/* SEO Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Indexed URLs</p>
                        <p className="text-xl font-bold text-primary">{sd.total_urls || 0}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Image URLs</p>
                        <p className="text-xl font-bold">{sd.total_images || 0}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">JSON-LD Schemas</p>
                        <p className="text-xl font-bold">{sd.total_schemas || 0}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">FAQ Entries</p>
                        <p className="text-xl font-bold">{sd.total_faqs || 0}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">IndexNow</p>
                        <Badge variant={sd.indexnow_status?.success ? "default" : "outline"} className="text-[10px]">
                          {sd.indexnow_status?.success ? '✓ Pinged' : '✗ Failed'}
                        </Badge>
                      </div>
                    </div>

                    {/* Last generated */}
                    {sd.generated_at && (
                      <p className="text-xs text-muted-foreground">
                        Last generated: {formatDistanceToNow(new Date(sd.generated_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No SEO health data. Run the auto-sitemap function to generate.</p>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* SEO & Sitemap Status */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm mt-6">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Sitemap Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {[
                { path: "/sitemap-index.xml", label: "Sitemap Index", icon: FileText },
                { path: "/sitemap.xml", label: "Main Sitemap", icon: Search },
                { path: "/image-sitemap.xml", label: "Image Sitemap", icon: ImageIcon },
                { path: "/video-sitemap.xml", label: "Video Sitemap", icon: Video },
              ].map((item) => {
                const meta = sitemapData.find((s) => s.page_path === item.path);
                const Icon = item.icon;
                const urlCount = meta?.structured_data?.url_count ?? meta?.structured_data?.sitemap_count ?? 0;
                const generatedAt = meta?.structured_data?.generated_at;

                return (
                  <div key={item.path} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.path}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {meta ? (
                        <>
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                            {urlCount} URLs
                          </Badge>
                          {generatedAt && (
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">
                              {formatDistanceToNow(new Date(generatedAt), { addSuffix: true })}
                            </span>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Not generated
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleTriggerFunction("auto-sitemap")}
                      >
                        Regenerate
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
