import TeamPageClient from '@/components/TeamPage';
import { use } from 'react';

export default function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TeamPageClient managerId={parseInt(id)} />;
}
