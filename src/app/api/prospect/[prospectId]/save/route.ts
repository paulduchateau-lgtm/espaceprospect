import { saveProspectData } from '@/lib/prospect';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  const { prospectId } = await params;

  try {
    const { messages, dashboard } = await request.json();
    await saveProspectData(prospectId, messages, dashboard);
    return Response.json({ saved: true });
  } catch (error) {
    console.error('[API Prospect Save] Failed:', error);
    return Response.json(
      { error: 'Failed to save prospect data' },
      { status: 500 }
    );
  }
}
