import { redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import type { GreetingCreateInput } from '@aska/shared';
import {
  FormActions,
  FormCard,
  FormField,
  PrimaryButton,
  SectionCard,
  SelectInput,
  SoftLinkButton,
  TextArea,
  TextInput,
} from '@/components/ui/FormKit';

async function createGreetingAction(formData: FormData): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const greetingData: GreetingCreateInput = {
    greeting_text: formData.get('greeting_text') as string,
    attribution: (formData.get('attribution') as string) || undefined,
    status: ((formData.get('status') as string) || 'unpublished') as 'unpublished' | 'published',
  };

  const { error } = await supabase.from('collection_greetings').insert(greetingData);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating greeting:', error);
    throw new Error('Failed to create greeting');
  }

  redirect('/greetings');
}

export default function CreateGreetingPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="H.U.G. Builder"
        title="Create Greeting"
        description="Craft a Hockey Universal Greeting that brings the community together. Keep it heartfelt, inclusive, and ready for quick share-outs."
        action={<SoftLinkButton href="/greetings">View library</SoftLinkButton>}
      />

      <FormCard>
        <form action={createGreetingAction} className="space-y-6">
          <FormField label="Greeting" htmlFor="greeting_text" hint="Keep it short—1 to 2 sentences works best.">
            <TextArea
              id="greeting_text"
              name="greeting_text"
              required
              rows={4}
              placeholder="Every drop of sweat freezes into legacy. Thanks for lacing up with heart."
            />
          </FormField>

          <FormField label="Attribution" htmlFor="attribution" hint="Optional source, e.g., community member or coach.">
            <TextInput id="attribution" name="attribution" placeholder="Inspired by the 2011 Canucks playoff run" />
          </FormField>

          <FormField label="Status" htmlFor="status">
            <SelectInput id="status" name="status" defaultValue="unpublished">
              <option value="unpublished">Unpublished</option>
              <option value="published">Published</option>
            </SelectInput>
          </FormField>

          <FormActions>
            <a
              href="/greetings"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </a>
            <PrimaryButton type="submit">Create greeting</PrimaryButton>
          </FormActions>
        </form>
      </FormCard>
    </div>
  );
}
