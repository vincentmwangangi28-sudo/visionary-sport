export const config = {
  runtime: 'edge',
};

export default async function handler() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'PredictPro.guru Quantitative Football Analytics',
      version: '2.4.0',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    }
  );
}
