import { Metadata } from 'next';
import CollectionTriviaSetsClient from './components/collection-trivia-sets-client';

export const metadata: Metadata = {
  title: 'Collection Trivia Sets • Aska CMS',
  description: 'Review created trivia set collections',
};

export default function CollectionTriviaSetsPage(): JSX.Element {
  return <CollectionTriviaSetsClient />;
}

