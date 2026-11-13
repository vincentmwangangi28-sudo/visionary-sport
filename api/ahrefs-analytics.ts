import {
  handleAhrefsAnalyticsRequest,
  handleAhrefsAIResponsesCountRequest,
  handleAhrefsSiteAuditIssuesRequest,
  DEFAULT_AHREFS_PROJECT_ID,
  DEFAULT_AHREFS_FROM,
  DEFAULT_AHREFS_TO,
  DEFAULT_AI_RESPONSES_SELECT,
  DEFAULT_AI_RESPONSES_TARGET,
  DEFAULT_SITE_AUDIT_DATE,
  DEFAULT_SITE_AUDIT_DATE_COMPARED,
} from '../src/server/ahrefsAnalyticsHandler';

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const url = new URL(request.url);
    const endpointType = url.searchParams.get('endpoint') || '';
    const isSiteAuditIssues =
      endpointType === 'site-audit-issues' ||
      endpointType === 'site-audit/issues' ||
      url.searchParams.has('date_compared');

    if (isSiteAuditIssues) {
      const project_id = url.searchParams.get('project_id') || DEFAULT_AHREFS_PROJECT_ID;
      const date = url.searchParams.get('date') || DEFAULT_SITE_AUDIT_DATE;
      const date_compared =
        url.searchParams.get('date_compared') || DEFAULT_SITE_AUDIT_DATE_COMPARED;
      const auditData = await handleAhrefsSiteAuditIssuesRequest({
        project_id,
        date,
        date_compared,
      });
      return new Response(JSON.stringify(auditData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      });
    }

    const hasAiSelect =
      endpointType === 'ai-responses-count' ||
      url.searchParams.has('select') ||
      url.searchParams.has('target');

    if (hasAiSelect) {
      const target = url.searchParams.get('target') || DEFAULT_AI_RESPONSES_TARGET;
      const select = url.searchParams.get('select') || DEFAULT_AI_RESPONSES_SELECT;
      const aiData = await handleAhrefsAIResponsesCountRequest({ target, select });
      return new Response(JSON.stringify(aiData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      });
    }

    let project_id: string | number =
      url.searchParams.get('project_id') || DEFAULT_AHREFS_PROJECT_ID;
    let from = url.searchParams.get('from') || DEFAULT_AHREFS_FROM;
    let to = url.searchParams.get('to') || DEFAULT_AHREFS_TO;

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (
        body.endpoint === 'site-audit-issues' ||
        body.endpoint === 'site-audit/issues' ||
        body.date_compared
      ) {
        const auditData = await handleAhrefsSiteAuditIssuesRequest({
          project_id: body.project_id || DEFAULT_AHREFS_PROJECT_ID,
          date: body.date || DEFAULT_SITE_AUDIT_DATE,
          date_compared: body.date_compared || DEFAULT_SITE_AUDIT_DATE_COMPARED,
        });
        return new Response(JSON.stringify(auditData), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      if (body.endpoint === 'ai-responses-count' || body.select || body.target) {
        const aiData = await handleAhrefsAIResponsesCountRequest({
          target: body.target || DEFAULT_AI_RESPONSES_TARGET,
          select: body.select || DEFAULT_AI_RESPONSES_SELECT,
        });
        return new Response(JSON.stringify(aiData), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      if (body.project_id) project_id = body.project_id;
      if (body.from) from = body.from;
      if (body.to) to = body.to;
    }

    const data = await handleAhrefsAnalyticsRequest({ project_id, from, to });
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });

  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Failed to fetch Ahrefs v3 telemetry',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

