import { Metadata } from 'next';
import {
  getCollectionInventoryCounts,
  getIdeationTags,
  getIdeationThemeOverview,
  getIdeationThemeStats,
  searchIdeationSources,
} from '@/lib/ideation';
import IdeationWorkspace from '@/components/ideation/Workspace';

export const metadata: Metadata = {
  title: 'Ideation • Aska CMS',
  description: 'Explore source content, discover themes, and assemble plans for downstream builders.',
};

export default async function IdeationPage(): Promise<JSX.Element> {
  const [themeStats, tagStats, overview, initialSourceData, collectionCounts] = await Promise.all([
    getIdeationThemeStats(),
    getIdeationTags(40),
    getIdeationThemeOverview(),
    searchIdeationSources({ pageSize: 12, page: 1 }),
    getCollectionInventoryCounts(),
  ]);

  return (
    <div className="space-y-8">
      <IdeationWorkspace
        themeStats={themeStats}
        tags={tagStats}
        overview={overview}
        initialSources={initialSourceData.items}
        collectionCounts={collectionCounts}
      />
    </div>
  );
}
