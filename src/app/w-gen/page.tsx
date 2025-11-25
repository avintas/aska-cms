import type { Metadata } from 'next';
import WGenWorkspace from '@/components/w-gen/WGenWorkspace';
import { getWisdomPrompt } from './actions';
import { searchIdeationSources } from '@/lib/ideation/data';

export const metadata: Metadata = {
  title: 'W-Gen • Aska CMS',
  description: 'Generate hockey wisdom content using Penalty Box Philosopher prompts.',
};

export default async function WGenPage(): Promise<JSX.Element> {
  const [promptResult, sourcesResult] = await Promise.all([
    getWisdomPrompt(),
    searchIdeationSources({ page: 1, pageSize: 6 }),
  ]);

  const prompt = promptResult.success && promptResult.prompt ? promptResult.prompt : null;
  const error = !promptResult.success && promptResult.error ? promptResult.error : null;

  return (
    <WGenWorkspace
      prompt={prompt}
      initialSources={sourcesResult.items}
      initialTotal={sourcesResult.total}
      initialError={error}
    />
  );
}

