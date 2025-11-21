import { Metadata } from 'next';
import TriviaSetForm from '@/lib/process-builders/build-trivia-set-multiple-choice/components/trivia-set-form';
import { SectionCard } from '@/components/ui/FormKit';

export const metadata: Metadata = {
  title: 'Build Multiple Choice Trivia Set • Aska CMS',
  description: 'Create a curated multiple choice trivia set from existing questions',
};

export default function BuildTriviaSetMultipleChoicePage(): JSX.Element {
  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Process Builder"
        title="Build MC Trivia Set"
        description="Automatically create a trivia set by selecting questions that match your theme and criteria"
      >
        <TriviaSetForm
          theme=""
          questionCount={10}
          category=""
          allowPartial={false}
        />
      </SectionCard>
    </div>
  );
}

