import { loadProspectByCode } from '@/lib/prospect';

const CODE_REGEX = /^[A-Z2-9]{6}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const normalized = code.toUpperCase();

  if (!CODE_REGEX.test(normalized)) {
    return Response.json({ error: 'Invalid code format' }, { status: 400 });
  }

  try {
    const data = await loadProspectByCode(normalized);
    if (!data) {
      return Response.json({ error: 'Code not found' }, { status: 404 });
    }
    return Response.json(data);
  } catch (error) {
    console.error('[API Prospect] By-code lookup failed:', error);
    return Response.json({ error: 'Failed to load prospect' }, { status: 500 });
  }
}
