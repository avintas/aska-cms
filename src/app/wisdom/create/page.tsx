import { redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import type { WisdomCreateInput } from '@aska/shared';
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

async function createWisdomAction(formData: FormData): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const wisdomData: WisdomCreateInput = {
    title: formData.get('title') as string,
    musing: formData.get('musing') as string,
    from_the_box: formData.get('from_the_box') as string,
    theme: (formData.get('theme') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    attribution: (formData.get('attribution') as string) || undefined,
    status: ((formData.get('status') as string) || 'draft') as 'draft' | 'published' | 'archived',
  };

  const { error } = await supabase.from('collection_wisdom').insert(wisdomData);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating wisdom:', error);
    throw new Error('Failed to create wisdom');
  }

  redirect('/wisdom');
}

export default function CreateWisdomPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Builder"
        title="Create Wisdom"
        description="Seed a new Penalty Box musing manually. The automated builder will reuse these fields, so keep tone and attribution crisp."
        action={<SoftLinkButton href="/wisdom">View library</SoftLinkButton>}
      />

      <FormCard>
        <form action={createWisdomAction} className="space-y-6">
          <FormField label="Title" htmlFor="title">
            <TextInput id="title" name="title" required placeholder="Penalty Box reflections" />
          </FormField>

          <FormField label="Musing" htmlFor="musing">
            <TextArea
              id="musing"
              name="musing"
              required
              rows={6}
              placeholder="The ice remembers everyone who braves the corners."
            />
          </FormField>

          <FormField label="From the Box" htmlFor="from_the_box">
            <TextInput id="from_the_box" name="from_the_box" required placeholder="Two minutes to think it through." />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Theme" htmlFor="theme">
              <TextInput id="theme" name="theme" placeholder="Mindset, Resilience, Legacy" />
            </FormField>
            <FormField label="Category" htmlFor="category">
              <TextInput id="category" name="category" placeholder="Penalty Box Philosopher" />
            </FormField>
          </div>

          <FormField label="Attribution" htmlFor="attribution">
            <TextInput id="attribution" name="attribution" placeholder="Coach's wisdom" />
          </FormField>

          <FormField label="Status" htmlFor="status">
            <SelectInput id="status" name="status" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </SelectInput>
          </FormField>

          <FormActions>
            <a
              href="/wisdom"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </a>
            <PrimaryButton type="submit">Create wisdom</PrimaryButton>
          </FormActions>
        </form>
      </FormCard>
    </div>
  );
}
