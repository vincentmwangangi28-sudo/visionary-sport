import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

// The `supabase.auth.oauth` namespace is beta and not in the generated types yet.
type OAuthClient = { name?: string; client_name?: string; redirect_uri?: string };
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthResult = { data: AuthorizationDetails | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

const SCOPE_LABELS: Record<string, string> = {
  openid: "Confirm your identity",
  email: "Share your email address",
  profile: "Share your basic profile",
};

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("This link is missing an authorization request id.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/auth?next=${encodeURIComponent(next)}`;
        return;
      }
      setEmail(sess.session.user.email ?? null);
      const { data, error: err } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) {
        setError(err.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect was returned by the authorization server.");
      return;
    }
    window.location.href = target;
  };

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "this app";
  const scopes = details?.scopes ?? (details?.scope ? details.scope.split(/\s+/).filter(Boolean) : []);

  return (
    <>
      <Helmet>
        <title>Authorize access - PredictPro</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          {error ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Authorization request failed
                </CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                  Try again
                </Button>
              </CardContent>
            </>
          ) : !details ? (
            <CardContent className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading authorization request…</span>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Connect {clientName} to PredictPro
                </CardTitle>
                <CardDescription>
                  {clientName} will be able to use PredictPro's tools as you while you are signed in.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="text-sm space-y-1">
                  {email && (
                    <p className="text-muted-foreground">
                      Signed in as <span className="text-foreground font-medium">{email}</span>
                    </p>
                  )}
                  {details.client?.redirect_uri && (
                    <p className="text-muted-foreground break-all">
                      Redirects to <span className="text-foreground">{details.client.redirect_uri}</span>
                    </p>
                  )}
                </div>

                {scopes.length > 0 && (
                  <ul className="space-y-1.5 text-sm">
                    {scopes.map((scope) => (
                      <li key={scope} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span>{SCOPE_LABELS[scope] ?? `Additional permission requested: ${scope}`}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-xs text-muted-foreground">
                  This does not bypass PredictPro's permissions — you only see the data your own account can access.
                </p>

                <div className="flex gap-2">
                  <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                    {busy ? "Working…" : "Approve"}
                  </Button>
                  <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
                    Cancel connection
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </main>
    </>
  );
}
