export async function POST(req) {
    const body = await req.json();
    const response = await fetch('https://g3.pupa-ai.com/webhook/meeting-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return Response.json(data);
  }