import { Metadata } from 'next';
import PublishingClient from './components/publishing-client';

export const metadata: Metadata = {
  title: 'Publishing • Aska CMS',
  description: 'Generate and manage daily shareable schedules',
};

export default function PublishingPage(): JSX.Element {
  return <PublishingClient />;
}

