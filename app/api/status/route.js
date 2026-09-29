import { getSettings } from '@/lib/server/settings';

// Lê a configuração a cada chamada (não gerar uma resposta fixa no build).
export const dynamic = 'force-dynamic';

// GET /api/status -> { status: 'ok', demo: true } quando as respostas são simuladas
export function GET() {
  return Response.json({ status: 'ok', demo: getSettings().resposta === 'mock' });
}
