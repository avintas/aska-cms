import { Metadata } from 'next';
import BuildMixedSetsClient from './components/build-mixed-sets-client';

export const metadata: Metadata = {
  title: 'Build Mixed Sets • Aska CMS',
  description: 'Build mixed trivia sets (MC and TF) with custom configuration',
};

export default function BuildMixedSetsPage(): JSX.Element {
  return <BuildMixedSetsClient />;
}

