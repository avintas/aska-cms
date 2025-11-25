import type { Metadata } from 'next';
import FGenWorkspace from '@/components/f-gen/FGenWorkspace';
import { getFactsPrompt, getSources } from './actions';

export const metadata: Metadata = {
  title: 'F-Gen • Aska CMS',
  description: 'Generate hockey facts content using fact generation prompts.',
};

export default async function FGenPage(): Promise<JSX.Element> {
  const [promptResult, sourcesResult] = await Promise.all([
    getFactsPrompt(),
    getSources(),
  ]);

  const prompt = promptResult.success && promptResult.prompt ? promptResult.prompt : null;
  const sources = sourcesResult.success && sourcesResult.sources ? sourcesResult.sources : [];
  const error = !promptResult.success && promptResult.error ? promptResult.error : null;

  return (
    <FGenWorkspace
      initialPrompt={prompt}
      initialSources={sources}
      initialError={error}
    />
  );
}

