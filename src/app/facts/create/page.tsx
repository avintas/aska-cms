import { redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import type { FactCreateInput } from '@aska/shared';
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

async function createFactAction(formData: FormData): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const yearValue = formData.get('year') as string;
  const payload: FactCreateInput = {
    fact_text: (formData.get('fact_text') as string) || '',
    fact_value: (formData.get('fact_value') as string) || undefined,
    fact_category: (formData.get('fact_category') as string) || undefined,
    year: yearValue ? Number(yearValue) : undefined,
    theme: (formData.get('theme') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    attribution: (formData.get('attribution') as string) || undefined,
    status: ((formData.get('status') as string) || 'unpublished') as FactCreateInput['status'],
  };

  const { error } = await supabase.from('collection_facts').insert(payload);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating fact:', error);
    throw new Error('Failed to create fact');
  }

  redirect('/facts');
}

export default function CreateFactPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Facts Lab"
        title="Create Fact"
        description="Package a milestone, record, or comparison into a shareable fact block. Keep numbers precise and contextual."
        action={<SoftLinkButton href="/facts">View library</SoftLinkButton>}
      />

      <FormCard>
        <form action={createFactAction} className="space-y-6">
          <FormField label="Fact" htmlFor="fact_text" hint="Tell the story in one punchy sentence.">
            <TextArea
              id="fact_text"
              name="fact_text"
              required
              rows={3}
              placeholder="Wayne Gretzky recorded 12 seasons with 100+ assists, more than every other player combined."
            />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Fact Value" htmlFor="fact_value" hint="Optional numeric highlight or ratio.">
              <TextInput id="fact_value" name="fact_value" placeholder="894 goals" />
            </FormField>
            <FormField label="Year" htmlFor="year">
              <TextInput id="year" name="year" type="number" placeholder="2024" />
            </FormField>
          </div>

          <FormField label="Fact Category" htmlFor="fact_category">
            <TextInput id="fact_category" name="fact_category" placeholder="Player / Team / Historical" />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Theme" htmlFor="theme" hint="Optional narrative grouping (Players, Teams, etc.).">
              <TextInput id="theme" name="theme" placeholder="Players" />
            </FormField>
            <FormField label="Category Tag" htmlFor="category">
              <TextInput id="category" name="category" placeholder="NHL Playoffs" />
            </FormField>
          </div>

          <FormField label="Attribution" htmlFor="attribution" hint="Where the fact originated.">
            <TextInput id="attribution" name="attribution" placeholder="Facts compiled by Canucks Insights" />
          </FormField>

          <FormField label="Status" htmlFor="status">
            <SelectInput id="status" name="status" defaultValue="unpublished">
              <option value="unpublished">Unpublished</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </SelectInput>
          </FormField>

          <FormActions>
            <a
              href="/facts"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </a>
            <PrimaryButton type="submit">Create fact</PrimaryButton>
          </FormActions>
        </form>
      </FormCard>
    </div>
  );
}

