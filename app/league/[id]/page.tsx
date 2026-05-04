import LeaguePageClient from '@/components/LeaguePage';
import { use } from 'react';

export default function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <LeaguePageClient leagueId={parseInt(id)} />;
}
