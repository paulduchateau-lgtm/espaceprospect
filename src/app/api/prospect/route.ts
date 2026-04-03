import { createProspect } from '@/lib/prospect';

export async function POST() {
  try {
    const { id, code } = await createProspect();
    return Response.json({ id, code });
  } catch (error) {
    console.error('[API Prospect] Creation failed:', error);
    return Response.json(
      { error: 'Failed to create prospect' },
      { status: 500 }
    );
  }
}
