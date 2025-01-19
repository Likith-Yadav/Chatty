export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Handle CORS preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    // Get the route from the URL
    const url = new URL(context.request.url);
    const path = url.pathname.replace('/api/', '');

    // Handle different routes
    switch (path) {
      case 'auth/login':
      case 'auth/register':
        // Auth routes
        return handleAuth(context.request);
      
      case 'messages':
        // Message routes
        return handleMessages(context.request);
      
      case 'rooms':
        // Room routes
        return handleRooms(context.request);
      
      default:
        return new Response('Not Found', { 
          status: 404,
          headers: corsHeaders
        });
    }
  } catch (err) {
    return new Response('Internal Error: ' + err.message, {
      status: 500,
      headers: corsHeaders
    });
  }
}

async function handleAuth(request) {
  // Auth handler implementation
  return new Response(JSON.stringify({ message: 'Auth endpoint' }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function handleMessages(request) {
  // Messages handler implementation
  return new Response(JSON.stringify({ message: 'Messages endpoint' }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function handleRooms(request) {
  // Rooms handler implementation
  return new Response(JSON.stringify({ message: 'Rooms endpoint' }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
