import { NextRequest, NextResponse } from 'next/server';
import { searchManagerIndex } from '@/lib/managerIndex';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = (searchParams.get('text') || '').trim();

  if (text.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchManagerIndex(text, 8);
  return NextResponse.json({ results });
}
