import { Metadata } from 'next';
import { getStatsAction, type SourceContentStats } from './actions';
import MetadataRefreshWorkspace from './components/MetadataRefreshWorkspace';

export const metadata: Metadata = {
  title: 'Source Content Updater • Aska CMS',
  description:
    'Manually refresh metadata for ingested source content using updated Gemini prompts.',
};

export default async function SourceContentUpdaterPage(): Promise<JSX.Element> {
  const statsResult = await getStatsAction();
  const stats: SourceContentStats =
    statsResult.success && statsResult.data
      ? statsResult.data
      : { total: 0, remaining: 0, processed: 0 };

  return (
    <div className="space-y-8">
      <MetadataRefreshWorkspace initialStats={stats} />
    </div>
  );
}
