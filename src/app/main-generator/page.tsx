import type { Metadata } from 'next';
import MainGeneratorWorkspace from '@/components/generator/MainGeneratorWorkspace';
import { resolveGeneratorContext } from '@/lib/generator/context';
import { generatorTracks } from '@/lib/generator/tracks';
import {
  getIdeationThemeStats,
  getIdeationTags,
  searchIdeationSources,
  getIdeationSourceById,
} from '@/lib/ideation';

export const metadata: Metadata = {
  title: 'Main Generator • Aska CMS',
  description:
    'Select a source, pick a track, and orchestrate Gemini outputs for shareable content and trivia.',
};

interface MainGeneratorPageProps {
  searchParams: Promise<{ sourceId?: string }>;
}

export default async function MainGeneratorPage({
  searchParams,
}: MainGeneratorPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const sourceIdParam = params.sourceId ? Number.parseInt(params.sourceId, 10) : null;
  const sourceId = Number.isNaN(sourceIdParam) ? null : sourceIdParam;

  const [, themeStats, tagStats, initialPage, sourceById] = await Promise.all([
    resolveGeneratorContext({ sourceId: sourceId ?? undefined }),
    getIdeationThemeStats(),
    getIdeationTags(40),
    searchIdeationSources({ pageSize: 6, page: 1 }),
    sourceId ? getIdeationSourceById(sourceId) : Promise.resolve(null),
  ]);

  const initialSource = sourceById ?? initialPage.items[0] ?? null;
  const trackSummary = Object.values(generatorTracks).map((track) => ({
    key: track.key,
    label: track.label,
    description: track.description,
    status: 'Ready',
    promptSummary: track.promptSummary,
  }));

  return (
    <MainGeneratorWorkspace
      initialSource={initialSource}
      themeStats={themeStats}
      tagStats={tagStats}
      initialSourceList={initialPage.items}
      initialSourceTotal={initialPage.total}
      trackSummary={trackSummary}
    />
  );
}


