import { NextRequest, NextResponse, after } from 'next/server';
import { upsertFromLeagueEntries, upsertFromManagerInfo } from '@/lib/managerIndex';

const FPL_BASE = 'https://fantasy.premierleague.com/api';

const ALLOWED_PATHS = [
  /^bootstrap-static\/?$/,
  /^fixtures\/?(\?.*)?$/,
  /^event\/\d+\/live\/?$/,
  /^event-status\/?$/,
  /^dream-team\/\d+\/?$/,
  /^entry\/\d+\/?$/,
  /^entry\/\d+\/history\/?$/,
  /^entry\/\d+\/event\/\d+\/picks\/?$/,
  /^leagues-classic\/\d+\/standings\/?(\?.*)?$/,
  /^element-summary\/\d+\/?$/,
];

const ENTRY_INFO_PATH = /^entry\/\d+\/?$/;
const LEAGUE_STANDINGS_PATH = /^leagues-classic\/\d+\/standings\/?(\?.*)?$/;

async function feedManagerIndex(path: string, data: unknown) {
  try {
    if (ENTRY_INFO_PATH.test(path)) {
      await upsertFromManagerInfo(data as Parameters<typeof upsertFromManagerInfo>[0]);
    } else if (LEAGUE_STANDINGS_PATH.test(path)) {
      const results =
        (data as { standings?: { results?: unknown } })?.standings?.results ?? [];
      await upsertFromLeagueEntries(
        results as Parameters<typeof upsertFromLeagueEntries>[0],
      );
    }
  } catch (err) {
    console.error('manager index: failed to index response', err);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  const isAllowed = ALLOWED_PATHS.some((pattern) => pattern.test(path));
  if (!isAllowed) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  try {
    const url = `${FPL_BASE}/${path}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FPLLiveDashboard/1.0)',
        Accept: 'application/json',
      },
      next: { revalidate: path.includes('live') ? 60 : path.includes('bootstrap') ? 300 : 120 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `FPL API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    after(() => feedManagerIndex(path, data));
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': path.includes('live') ? 'no-cache' : 's-maxage=60',
      },
    });
  } catch (err) {
    console.error('FPL proxy error:', err);
    return NextResponse.json({ error: 'Failed to fetch from FPL API' }, { status: 500 });
  }
}
