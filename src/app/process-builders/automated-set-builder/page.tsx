import { Metadata } from 'next';
import { getAutomatedBuilderConfig } from '@/lib/automated-set-builder/config';
import AutomatedSetBuilderClient from './components/automated-set-builder-client';

export const metadata: Metadata = {
  title: 'Automated Set Builder • Aska CMS',
  description: 'Configure and manage automated trivia set building',
};

export default async function AutomatedSetBuilderPage(): Promise<JSX.Element> {
  // Fetch initial configuration server-side
  const initialConfig = await getAutomatedBuilderConfig();

  return <AutomatedSetBuilderClient initialConfig={initialConfig} />;
}

