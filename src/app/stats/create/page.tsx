import { redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import type { StatCreateInput } from '@aska/shared';
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

async function createStatAction(formData: FormData): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const yearValue = formData.get('year') as string;
  const payload: StatCreateInput = {
    stat_text: (formData.get('stat_text') as string) || '',
    stat_value: (formData.get('stat_value') as string) || undefined,
    stat_category: (formData.get('stat_category') as string) || undefined,
    year: yearValue ? Number(yearValue) : undefined,
    theme: (formData.get('theme') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    attribution: (formData.get('attribution') as string) || undefined,
    status: ((formData.get('status') as string) || 'draft') as StatCreateInput['status'],
  };

  const { error } = await supabase.from('collection_stats').insert(payload);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating stat:', error);
    throw new Error('Failed to create stat');
  }

  redirect('/stats');
}

export default function CreateStatPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Stats Lab"
        title="Create Stat"
        description="Package a milestone, record, or comparison into a shareable stat block. Keep numbers precise and contextual."
        action={<SoftLinkButton href="/stats">View library</SoftLinkButton>}
      />

      <FormCard>
        <form action={createStatAction} className="space-y-6">
          <FormField label="Stat" htmlFor="stat_text" hint="Tell the story in one punchy sentence.">
            <TextArea
              id="stat_text"
              name="stat_text"
              required
              rows={3}
              placeholder="Wayne Gretzky recorded 12 seasons with 100+ assists, more than every other player combined."
            />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Stat Value" htmlFor="stat_value" hint="Optional numeric highlight or ratio.">
              <TextInput id="stat_value" name="stat_value" placeholder="894 goals" />
            </FormField>
            <FormField label="Year" htmlFor="year">
              <TextInput id="year" name="year" type="number" placeholder="2024" />
            </FormField>
          </div>

          <FormField label="Stat Category" htmlFor="stat_category">
            <TextInput id="stat_category" name="stat_category" placeholder="Player / Team / Historical" />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Theme" htmlFor="theme" hint="Optional narrative grouping (Players, Teams, etc.).">
              <TextInput id="theme" name="theme" placeholder="Players" />
            </FormField>
            <FormField label="Category Tag" htmlFor="category">
              <TextInput id="category" name="category" placeholder="NHL Playoffs" />
            </FormField>
          </div>

          <FormField label="Attribution" htmlFor="attribution" hint="Where the stat originated.">
            <TextInput id="attribution" name="attribution" placeholder="Stats compiled by Canucks Insights" />
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
              href="/stats"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </a>
            <PrimaryButton type="submit">Create stat</PrimaryButton>
          </FormActions>
        </form>
      </FormCard>
    </div>
  );
}
