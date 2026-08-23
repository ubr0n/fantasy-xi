import type { Metadata } from 'next';
import LeaguePageClient from '@/components/LeaguePage';
import { use } from 'react';

type Props = { params: Promise<{ id: string }> };

const FALLBACK_METADATA: Metadata = {
  title: 'League Standings',
  description: 'Live Fantasy Premier League mini-league standings.',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(
      `https://fantasy.premierleague.com/api/leagues-classic/${id}/standings/`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FPLLiveDashboard/1.0)',
          Accept: 'application/json',
        },
        next: { revalidate: 120 },
      }
    );
    if (!res.ok) return FALLBACK_METADATA;

    const data = await res.json();
    const leagueName: string = data.league?.name;
    if (!leagueName) return FALLBACK_METADATA;

    const title = `${leagueName} — League Standings`;
    const description = `Live Fantasy Premier League standings for ${leagueName}. Follow gameweek points and rank changes as they happen.`;

    return {
      title,
      description,
      alternates: { canonical: `/league/${id}` },
      openGraph: { title, description, url: `/league/${id}` },
      twitter: { title, description },
    };
  } catch {
    return FALLBACK_METADATA;
  }
}

export default function LeaguePage({ params }: Props) {
  const { id } = use(params);
  return <LeaguePageClient leagueId={parseInt(id)} />;
}
