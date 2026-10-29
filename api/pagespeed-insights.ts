import {
  handlePageSpeedInsightsRequest,
  PageSpeedStrategy,
} from '../src/server/pagespeedHandler';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const query = req.query || {};
    const body = typeof req.body === 'object' && req.body ? req.body : {};
    const strategyRaw = String(
      query.strategy || query.form_factor || body.strategy || 'mobile'
    ).toLowerCase();
    const strategy: PageSpeedStrategy =
      strategyRaw === 'desktop' ? 'desktop' : 'mobile';
    const url = String(query.url || body.url || 'https://predictpro.guru');
    const force =
      query.force === 'true' ||
      query.force === '1' ||
      Boolean(body.force);

    const result = await handlePageSpeedInsightsRequest({
      url,
      strategy,
      force,
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to run PageSpeed Insights audit',
    });
  }
}
