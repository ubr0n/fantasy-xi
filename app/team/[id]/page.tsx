import type { Metadata } from 'next';
import TeamPageClient from '@/components/TeamPage';
import { use } from 'react';

type Props = { params: Promise<{ id: string }> };

const FALLBACK_METADATA: Metadata = {
  title: 'FPL Team',
  description:
    'Live Fantasy Premier League gameweek points, rank, and squad breakdown.',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`https://fantasy.premierleague.com/api/entry/${id}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FPLLiveDashboard/1.0)',
        Accept: 'application/json',
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return FALLBACK_METADATA;

    const entry = await res.json();
    const teamName: string = entry.name;
    const managerName = `${entry.player_first_name} ${entry.player_last_name}`;
    const title = `${teamName} — ${managerName}'s FPL Team`;
    const description = `Live gameweek points, overall rank, and squad breakdown for ${teamName}, managed by ${managerName}, in Fantasy Premier League.`;

    return {
      title,
      description,
      alternates: { canonical: `/team/${id}` },
      openGraph: { title, description, url: `/team/${id}` },
      twitter: { title, description },
    };
  } catch {
    return FALLBACK_METADATA;
  }
}

export default function TeamPage({ params }: Props) {
  const { id } = use(params);
  return <TeamPageClient managerId={parseInt(id)} />;
}
