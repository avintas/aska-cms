import { Metadata } from 'next';
import BuildMultipleChoiceSetsClient from './components/build-multiple-choice-sets-client';

export const metadata: Metadata = {
  title: 'Build Multiple Choice Sets • Aska CMS',
  description: 'Build multiple choice trivia sets with custom configuration',
};

export default function BuildMultipleChoiceSetsPage(): JSX.Element {
  return <BuildMultipleChoiceSetsClient />;
}

