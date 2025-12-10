import { Metadata } from 'next';
import BuildTrueFalseSetsClient from './components/build-true-false-sets-client';

export const metadata: Metadata = {
  title: 'Build True/False Sets • Aska CMS',
  description: 'Build true/false trivia sets with custom configuration',
};

export default function BuildTrueFalseSetsPage(): JSX.Element {
  return <BuildTrueFalseSetsClient />;
}

