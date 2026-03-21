import type { DashboardData } from '@/lib/types';

import kineLiberal from '@/data/demo-responses/kine-liberal.json';
import architecteIndependant from '@/data/demo-responses/architecte-independant.json';
import infirmiereLiberale from '@/data/demo-responses/infirmiere-liberale.json';

export interface DemoResponse {
  userMessage: string;
  assistantMessage: string;
  dashboard: DashboardData;
}

const DEMO_RESPONSES: Record<string, DemoResponse> = {
  'kine-liberal': kineLiberal as DemoResponse,
  'architecte-independant': architecteIndependant as DemoResponse,
  'infirmiere-liberale': infirmiereLiberale as DemoResponse,
};

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true;
  return new URLSearchParams(window.location.search).has('demo');
}

export function matchDemoProfile(userInput: string): string | null {
  const input = userInput.toLowerCase();
  if (input.includes('kine') || input.includes('kiné')) return 'kine-liberal';
  if (input.includes('architecte')) return 'architecte-independant';
  if (input.includes('infirmi')) return 'infirmiere-liberale';
  return null;
}

export function getDemoResponse(profileKey: string): DemoResponse | null {
  return DEMO_RESPONSES[profileKey] ?? null;
}

export function getAllDemoProfileKeys(): string[] {
  return Object.keys(DEMO_RESPONSES);
}
