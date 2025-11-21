import { Metadata } from 'next';
import { getUnpublishedStats } from './actions';
import TriviaSelectorWorkspace from './components/TriviaSelectorWorkspace';

export const metadata: Metadata = {
  title: 'Trivia Selector • Aska CMS',
  description:
    'Review and classify multiple-choice trivia questions for temporal relevance. Prepare questions for use in trivia sets.',
};

export default async function TriviaSelectorPage(): Promise<JSX.Element> {
  const statsResult = await getUnpublishedStats();
  const stats = statsResult.success && statsResult.data ? statsResult.data : { total: 0 };

  return (
    <div className="space-y-8">
      <TriviaSelectorWorkspace initialStats={stats} />
    </div>
  );
}

