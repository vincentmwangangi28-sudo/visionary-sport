import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type ErrorType =
  | 'react_boundary'
  | 'network_error'
  | 'chunk_load_error'
  | 'unhandled_rejection'
  | 'uncaught_exception'
  | 'api_error'
  | 'custom';

export type ErrorSeverity = 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  componentStack?: string;
  errorType?: ErrorType;
  severity?: ErrorSeverity;
  route?: string;
  userId?: string;
  metadata?: Record<string, any>;
  networkDetails?: {
    url?: string;
    status?: number;
    statusText?: string;
    method?: string;
    durationMs?: number;
    [key: string]: any;
  };
}

export interface ErrorLogEntry {
  id?: string;
  created_at?: string;
  error_message: string;
  error_stack?: string | null;
  component_stack?: string | null;
  error_type: string | null;
  url: string | null;
  user_id: string | null;
  user_agent: string | null;
  severity: string | null;
  metadata: Json | null;
}

// In-memory deduplication cache: signature -> timestamp
const dedupCache = new Map<string, number>();
const DEDUP_WINDOW_MS = 10_000; // 10 seconds

// Rate limiter: count logs within a 60-second sliding window
const rateLimiterWindow: number[] = [];
const MAX_LOGS_PER_MINUTE = 30;

// Offline buffer for error logs
const offlineQueue: ErrorLogEntry[] = [];
const MAX_OFFLINE_QUEUE_SIZE = 25;

// In-memory circular buffer of the most recent errors for debugging/diagnostics
const recentErrorBuffer: ErrorLogEntry[] = [];
const MAX_RECENT_ERRORS = 15;

let isGlobalLoggingInitialized = false;

/**
 * Extracts a normalized Error instance or message string safely.
 */
function normalizeError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return {
      message: err.message || 'Error with no message',
      stack: err.stack,
    };
  }

  if (typeof err === 'string') {
    return { message: err };
  }

  if (err && typeof err === 'object') {
    try {
      const obj = err as Record<string, any>;
      const message = obj.message || obj.error || obj.error_description || JSON.stringify(err);
      return {
        message: String(message),
        stack: typeof obj.stack === 'string' ? obj.stack : undefined,
      };
    } catch {
      return { message: String(err) };
    }
  }

  return { message: String(err) };
}

/**
 * Attempt to synchronously read the current authenticated user's ID
 * without making a blocking async call.
 */
function getCachedUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // Check known Supabase auth storage key patterns
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed?.user?.id) {
            return String(parsed.user.id);
          }
        }
      }
    }
  } catch {
    // Ignore storage parsing issues
  }
  return null;
}

/**
 * Sends a single log entry to the Supabase `error_logs` table.
 * Fully resilient: never throws, avoids recursion on failures.
 */
async function transmitLogEntry(entry: ErrorLogEntry): Promise<boolean> {
  try {
    // If client is offline, buffer it
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (offlineQueue.length < MAX_OFFLINE_QUEUE_SIZE) {
        offlineQueue.push(entry);
      }
      return false;
    }

    // Attempt insert into Supabase error_logs
    const { error } = await supabase.from('error_logs').insert([
      {
        error_message: entry.error_message.slice(0, 2000),
        error_stack: entry.error_stack ? entry.error_stack.slice(0, 5000) : null,
        component_stack: entry.component_stack ? entry.component_stack.slice(0, 5000) : null,
        error_type: entry.error_type || 'custom',
        url: entry.url ? entry.url.slice(0, 1000) : null,
        user_id: entry.user_id,
        user_agent: entry.user_agent ? entry.user_agent.slice(0, 500) : null,
        severity: entry.severity || 'error',
        metadata: entry.metadata,
      },
    ]);

    if (error) {
      // Don't throw or log via logger to avoid recursive loops
      console.warn('[PredictPro Logger] Supabase error_logs insert notice:', error.message || error);
      return false;
    }

    return true;
  } catch (transportErr) {
    // Silent catch so logging never crashes the app
    console.warn('[PredictPro Logger] Failed to send error log to Supabase:', transportErr);
    return false;
  }
}

/**
 * Flushes any pending offline error logs when network connectivity is restored.
 */
function flushOfflineQueue(): void {
  if (offlineQueue.length === 0) return;
  const itemsToSend = offlineQueue.splice(0, offlineQueue.length);
  for (const item of itemsToSend) {
    void transmitLogEntry(item);
  }
}

// Attach online listener to flush offline queue
if (typeof window !== 'undefined') {
  window.addEventListener('online', flushOfflineQueue);
}

/**
 * Centralized error logging utility.
 */
export const logger = {
  /**
   * Log an error from a React ErrorBoundary
   */
  logErrorBoundary(
    error: Error | unknown,
    errorInfo?: { componentStack?: string | null } | null,
    context?: Record<string, any>
  ): void {
    const norm = normalizeError(error);
    const componentStack = errorInfo?.componentStack || undefined;

    this.log({
      error: norm,
      type: 'react_boundary',
      severity: 'error',
      componentStack,
      metadata: {
        ...context,
        boundary: 'React.ErrorBoundary',
      },
    });
  },

  /**
   * Log a failed network request or fetch failure
   */
  logNetworkError(
    url: string,
    error: unknown,
    options?: {
      status?: number;
      statusText?: string;
      method?: string;
      durationMs?: number;
      [key: string]: any;
    }
  ): void {
    const norm = normalizeError(error);
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    this.log({
      error: norm,
      type: 'network_error',
      severity: options?.status && options.status >= 500 ? 'error' : 'warn',
      metadata: {
        requestUrl: url,
        status: options?.status,
        statusText: options?.statusText,
        method: options?.method || 'GET',
        durationMs: options?.durationMs,
        isOffline,
        ...options,
      },
    });
  },

  /**
   * General-purpose error logger
   */
  error(messageOrError: string | Error | unknown, context?: LogContext): void {
    const norm = normalizeError(messageOrError);
    this.log({
      error: norm,
      type: context?.errorType || 'custom',
      severity: context?.severity || 'error',
      componentStack: context?.componentStack,
      userId: context?.userId,
      metadata: {
        ...context?.metadata,
        networkDetails: context?.networkDetails,
      },
    });
  },

  /**
   * General-purpose warning logger
   */
  warn(message: string, context?: LogContext): void {
    this.log({
      error: { message },
      type: context?.errorType || 'custom',
      severity: 'warn',
      userId: context?.userId,
      metadata: context?.metadata,
    });
  },

  /**
   * General-purpose informational logger
   */
  info(message: string, context?: LogContext): void {
    this.log({
      error: { message },
      type: context?.errorType || 'custom',
      severity: 'info',
      userId: context?.userId,
      metadata: context?.metadata,
    });
  },

  /**
   * Internal dispatcher with deduplication and throttling
   */
  log(params: {
    error: { message: string; stack?: string };
    type: ErrorType;
    severity?: ErrorSeverity;
    componentStack?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }): void {
    const now = Date.now();
    const type = params.type;
    const message = params.error.message;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    // 1. Deduplication check (prevent log storms)
    const dedupSignature = `${type}:${message.slice(0, 120)}:${currentPath}`;
    const lastLoggedAt = dedupCache.get(dedupSignature);
    if (lastLoggedAt && now - lastLoggedAt < DEDUP_WINDOW_MS) {
      // Already logged within window, skip to avoid spamming
      return;
    }
    dedupCache.set(dedupSignature, now);

    // Prune dedup cache periodically
    if (dedupCache.size > 200) {
      for (const [key, time] of dedupCache.entries()) {
        if (now - time > DEDUP_WINDOW_MS) {
          dedupCache.delete(key);
        }
      }
    }

    // 2. Sliding window rate limit check
    while (rateLimiterWindow.length > 0 && now - rateLimiterWindow[0] > 60_000) {
      rateLimiterWindow.shift();
    }
    if (rateLimiterWindow.length >= MAX_LOGS_PER_MINUTE) {
      console.warn('[PredictPro Logger] Rate limit reached; throttling error logs');
      return;
    }
    rateLimiterWindow.push(now);

    // 3. Assemble payload
    const currentUrl = typeof window !== 'undefined' ? window.location.href : null;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
    const resolvedUserId = params.userId || getCachedUserId();

    const fullMetadata: Json = {
      timestamp: new Date().toISOString(),
      path: currentPath,
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      viewport:
        typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
      screenResolution:
        typeof window !== 'undefined' && window.screen
          ? `${window.screen.width}x${window.screen.height}`
          : undefined,
      ...params.metadata,
    };

    const entry: ErrorLogEntry = {
      error_message: message,
      error_stack: params.error.stack || null,
      component_stack: params.componentStack || null,
      error_type: type,
      url: currentUrl,
      user_id: resolvedUserId,
      user_agent: userAgent,
      severity: params.severity || 'error',
      metadata: fullMetadata,
      created_at: new Date().toISOString(),
    };

    // Store in recent memory buffer for quick debugging
    recentErrorBuffer.unshift(entry);
    if (recentErrorBuffer.length > MAX_RECENT_ERRORS) {
      recentErrorBuffer.pop();
    }

    // Output to developer console
    const consoleMethod =
      params.severity === 'warn'
        ? console.warn
        : params.severity === 'info'
          ? console.info
          : console.error;

    consoleMethod(
      `%c[PredictPro Logger][${type.toUpperCase()}]`,
      'color: #f43f5e; font-weight: bold;',
      message,
      {
        stack: params.error.stack,
        componentStack: params.componentStack,
        metadata: fullMetadata,
      }
    );

    // Transmit to Supabase asynchronously
    void transmitLogEntry(entry);
  },

  /**
   * Initializes global window error & unhandled promise rejection listeners.
   * Idempotent: safe to call multiple times.
   */
  initGlobalErrorLogging(): void {
    if (typeof window === 'undefined' || isGlobalLoggingInitialized) {
      return;
    }
    isGlobalLoggingInitialized = true;

    // Listen for uncaught runtime exceptions
    window.addEventListener('error', (event: ErrorEvent) => {
      // Check if it's a script/chunk loading issue
      const isChunkFailure =
        event.message?.includes('dynamically imported module') ||
        event.message?.includes('Loading chunk') ||
        event.message?.includes('Failed to fetch');

      logger.log({
        error: {
          message: event.message || 'Uncaught error event',
          stack: event.error?.stack,
        },
        type: isChunkFailure ? 'chunk_load_error' : 'uncaught_exception',
        severity: 'error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Listen for unhandled promise rejections (e.g. failed fetch or async operations)
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const norm = normalizeError(reason);

      const isNetworkIssue =
        norm.message.includes('Failed to fetch') ||
        norm.message.includes('NetworkError') ||
        norm.message.includes('Load failed') ||
        norm.message.includes('AbortError');

      logger.log({
        error: norm,
        type: isNetworkIssue ? 'network_error' : 'unhandled_rejection',
        severity: 'error',
        metadata: {
          reasonType: typeof reason,
        },
      });
    });
  },

  /**
   * Returns recent in-memory errors for inspection or diagnostics
   */
  getRecentErrors(): ReadonlyArray<ErrorLogEntry> {
    return [...recentErrorBuffer];
  },
};

export default logger;
