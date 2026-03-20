import { loadProspect } from '@/lib/prospect';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  const { prospectId } = await params;

  if (!UUID_REGEX.test(prospectId)) {
    return Response.json({ error: 'Invalid prospect ID' }, { status: 400 });
  }

  try {
    const data = await loadProspect(prospectId);
    if (!data) {
      return Response.json({ error: 'Prospect not found' }, { status: 404 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('[API Prospect] Load failed:', error);
    return Response.json(
      { error: 'Failed to load prospect data' },
      { status: 500 }
    );
  }
}
