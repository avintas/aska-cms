import type { Metadata } from 'next';
import BenchGenWorkspace from '@/components/bench-gen/BenchGenWorkspace';
import { getBenchBossPrompt } from './actions';
import { searchIdeationSources } from '@/lib/ideation/data';

export const metadata: Metadata = {
  title: 'Bench Boss Generator • Aska CMS',
  description: 'Generate tough, fair, disciplinarian motivational directives using the Bench Boss character.',
};

export default async function BenchGenPage(): Promise<JSX.Element> {
  const [promptResult, sourcesResult] = await Promise.all([
    getBenchBossPrompt(),
    searchIdeationSources({ page: 1, pageSize: 6 }),
  ]);

  const prompt = promptResult.success && promptResult.prompt ? promptResult.prompt : null;
  const error = !promptResult.success && promptResult.error ? promptResult.error : null;

  return (
    <BenchGenWorkspace
      prompt={prompt}
      initialSources={sourcesResult.items}
      initialTotal={sourcesResult.total}
      initialError={error}
    />
  );
}

