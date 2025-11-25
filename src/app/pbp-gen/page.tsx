import type { Metadata } from 'next';
import PBPGenWorkspace from '@/components/pbp-gen/PBPGenWorkspace';
import { getPBPPrompt } from './actions';
import { searchIdeationSources } from '@/lib/ideation/data';

export const metadata: Metadata = {
  title: 'PBP-Gen • Aska CMS',
  description: 'Generate hockey wisdom content using Penalty Box Philosopher prompts.',
};

export default async function PBPGenPage(): Promise<JSX.Element> {
  const [promptResult, sourcesResult] = await Promise.all([
    getPBPPrompt(),
    searchIdeationSources({ page: 1, pageSize: 6 }),
  ]);

  const prompt = promptResult.success && promptResult.prompt ? promptResult.prompt : null;
  const error = !promptResult.success && promptResult.error ? promptResult.error : null;

  return (
    <PBPGenWorkspace
      prompt={prompt}
      initialSources={sourcesResult.items}
      initialTotal={sourcesResult.total}
      initialError={error}
    />
  );
}




