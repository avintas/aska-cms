import type { Metadata } from 'next';
import CaptainHeartGenWorkspace from '@/components/captain-heart-gen/CaptainHeartGenWorkspace';
import { getCaptainHeartPrompt } from './actions';
import { searchIdeationSources } from '@/lib/ideation/data';

export const metadata: Metadata = {
  title: 'Captain Heart Generator • Aska CMS',
  description: 'Generate warm, supportive, emotional messages using the Captain Heart character.',
};

export default async function CaptainHeartGenPage(): Promise<JSX.Element> {
  const [promptResult, sourcesResult] = await Promise.all([
    getCaptainHeartPrompt(),
    searchIdeationSources({ page: 1, pageSize: 6 }),
  ]);

  const prompt = promptResult.success && promptResult.prompt ? promptResult.prompt : null;
  const error = !promptResult.success && promptResult.error ? promptResult.error : null;

  return (
    <CaptainHeartGenWorkspace
      prompt={prompt}
      initialSources={sourcesResult.items}
      initialTotal={sourcesResult.total}
      initialError={error}
    />
  );
}

