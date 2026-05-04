import { NextRequest, NextResponse } from 'next/server';

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
  /^search\/entries\/(\?.*)?$/,
];

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
