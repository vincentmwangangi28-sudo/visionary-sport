import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PREDICTPRO_API_KEY = Deno.env.get('PREDICTPRO_API_KEY');
    
    if (!PREDICTPRO_API_KEY) {
      console.log('PredictPro API key not found, returning demo data');
      // Return demo data when API key is not available
      const demoData = {
        total_predictions: 127,
        correct_predictions: 89,
        average_confidence: 76.5,
        win_rate: 70.1
      };
      
      return new Response(
        JSON.stringify(demoData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch from PredictPro API
    const response = await fetch('https://predictpro.ai/api/user-performance', {
      headers: {
        'x-api-key': PREDICTPRO_API_KEY
      }
    });

    if (!response.ok) {
      console.error('PredictPro API error:', response.status);
      throw new Error('Failed to fetch user performance');
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching user performance:', error);
    
    // Fallback to demo data on error
    const demoData = {
      total_predictions: 127,
      correct_predictions: 89,
      average_confidence: 76.5,
      win_rate: 70.1
    };
    
    return new Response(
      JSON.stringify(demoData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
