import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AccuracyReport {
  id: string;
  report_date: string;
  period_type: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_percent: number;
  by_league: Record<string, { total: number; correct: number; accuracy: string }>;
  by_sport: Record<string, { total: number; correct: number; accuracy: string }>;
  by_confidence_range: Record<string, { total: number; correct: number; accuracy: string }>;
  top_performing_leagues: string[];
}

export function useAccuracyReports() {
  const [reports, setReports] = useState<AccuracyReport[]>([]);
  const [latestReport, setLatestReport] = useState<AccuracyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('accuracy_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;

      const formattedReports = (data || []).map(report => ({
        ...report,
        by_league: typeof report.by_league === 'string' ? JSON.parse(report.by_league) : report.by_league || {},
        by_sport: typeof report.by_sport === 'string' ? JSON.parse(report.by_sport) : report.by_sport || {},
        by_confidence_range: typeof report.by_confidence_range === 'string' ? JSON.parse(report.by_confidence_range) : report.by_confidence_range || {}
      }));

      setReports(formattedReports);
      if (formattedReports.length > 0) {
        setLatestReport(formattedReports[0]);
      }
    } catch (err) {
      console.error('Error fetching accuracy reports:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    reports,
    latestReport,
    loading,
    error,
    refetch: fetchReports
  };
}
