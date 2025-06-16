// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GenerateAudioRequest {
  text: string;
  voice_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }

    // Parse request body
    const { text, voice_id }: GenerateAudioRequest = await req.json()

    // Validate required fields
    if (!text || !voice_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: text and voice_id are required' 
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }

    // Validate text length (Eleven Labs has limits)
    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ 
          error: 'Text too long. Maximum 5000 characters allowed.' 
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }

    // Get Eleven Labs API key from environment - try both possible names
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY') || Deno.env.get('ELEVEN_LABS_API_KEY')
    
    if (!elevenLabsApiKey) {
      console.error('ELEVENLABS_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error. Please contact administrator.' 
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }

    // Default voice ID mapping
    const voiceIdMap: { [key: string]: string } = {
      'adam': '21m00Tzpb8JJc4PZgOLQ',
      'antoni': 'ErXwobaYiN019PkySvjV',
      'bella': 'EXAVITQu4vr4xnSDxMaL',
      'elli': 'MF3mGyEYCl7XYWbV9V6O',
      'josh': 'TxGEqnHWrfWFTfGW9XjX',
      'rachel': '21m00Tzpb8JJc4PZgOLQ',
      'sam': 'yoZ06aMxZJJ28mfd3POQ'
    }

    // Use mapped voice ID or the provided one if it's already a valid ID
    const actualVoiceId = voiceIdMap[voice_id] || voice_id

    // Call Eleven Labs API
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${actualVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    // Handle Eleven Labs API errors
    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text()
      console.error('Eleven Labs API error:', elevenLabsResponse.status, errorText)
      
      let errorMessage = 'Failed to generate audio'
      
      if (elevenLabsResponse.status === 401) {
        errorMessage = 'Invalid API key'
      } else if (elevenLabsResponse.status === 422) {
        errorMessage = 'Invalid voice ID or request parameters'
      } else if (elevenLabsResponse.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.'
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: elevenLabsResponse.status, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    }

    // Get the audio data as array buffer
    const audioData = await elevenLabsResponse.arrayBuffer()

    // Return the audio data with proper headers
    return new Response(audioData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString(),
        ...corsHeaders
      },
    })

  } catch (error) {
    console.error('Unexpected error in generate-audio function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error occurred while generating audio' 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )
  }
})