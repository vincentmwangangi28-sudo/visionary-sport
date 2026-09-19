import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  compact?: boolean;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, copied: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PredictPro ErrorBoundary caught an unhandled exception]:', error, info);
    try {
      logger.logErrorBoundary(error, info, {
        compact: this.props.compact,
      });
    } catch {
      // Never let logging failure impede ErrorBoundary
    }
  }

  resetError = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: undefined, copied: false });
  };

  handleClearCacheAndReload = () => {
    try {
      // Clear app caches and localStorage
      localStorage.removeItem('predictpro_betslip_v2');
      localStorage.removeItem('predictpro_league_team_logos_v2');
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            if (name.startsWith('predictpro-')) {
              caches.delete(name);
            }
          });
        });
      }
    } catch {
      // Ignore cleanup error
    }
    window.location.reload();
  };

  copyDiagnostics = () => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      errorMessage: this.state.error?.message || 'Unknown error',
      errorStack: this.state.error?.stack || 'No stack trace available',
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2)).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      });
    }
  };

  render() {
    if (this.state.hasError) {
      const error = this.state.error || new Error('An unexpected error occurred');

      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(error, this.resetError);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.props.compact) {
        return (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-center space-y-2.5 my-2">
            <div className="flex items-center justify-center gap-2 text-destructive font-semibold text-xs">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Failed to load this module</span>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2">
              {error.message || 'Component failed to render.'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={this.resetError}
              className="h-7 text-xs gap-1.5 border-destructive/40 hover:bg-destructive/10"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </Button>
          </div>
        );
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full bg-card border rounded-2xl p-6 shadow-lg text-center space-y-4 animate-in fade-in-50 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-foreground">Something went wrong</h2>
              <p className="text-xs text-muted-foreground">
                We encountered an unexpected issue while rendering this section.
              </p>
            </div>

            <div className="p-3 bg-muted/60 rounded-xl border text-left font-mono text-xs text-destructive break-words max-h-32 overflow-y-auto">
              {error.message}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={this.resetError}
                  className="flex-1 gap-1.5 font-bold"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>

                <Button
                  variant="outline"
                  onClick={this.copyDiagnostics}
                  className="gap-1.5 text-xs"
                  title="Copy technical diagnostics for support"
                >
                  {this.state.copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Error
                    </>
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleClearCacheAndReload}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Reset App Cache & Reload
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
