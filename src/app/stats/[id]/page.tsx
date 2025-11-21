import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import type { Stat, StatUpdateInput } from '@aska/shared';
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

interface PageProps {
  params: Promise<{ id: string }>;
}

async function updateStatAction(id: number, formData: FormData): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const yearValue = formData.get('year') as string;
  const payload: StatUpdateInput = {
    stat_text: formData.get('stat_text') as string,
    stat_value: (formData.get('stat_value') as string) || undefined,
    stat_category: (formData.get('stat_category') as string) || undefined,
    year: yearValue ? Number(yearValue) : undefined,
    theme: (formData.get('theme') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    attribution: (formData.get('attribution') as string) || undefined,
    status: ((formData.get('status') as string) || undefined) as StatUpdateInput['status'],
  };

  const { error } = await supabase.from('collection_stats').update(payload).eq('id', id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating stat:', error);
    throw new Error('Failed to update stat');
  }

  redirect('/stats');
}

async function deleteStatAction(id: number): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const { error } = await supabase.from('collection_stats').delete().eq('id', id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting stat:', error);
    throw new Error('Failed to delete stat');
  }

  redirect('/stats');
}

export default async function EditStatPage({ params }: PageProps): Promise<JSX.Element> {
  const { id } = await params;
  const statId = Number(id);
  if (!Number.isFinite(statId)) {
    notFound();
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.from('collection_stats').select('*').eq('id', statId).single();

  if (error || !data) {
    notFound();
  }

  const stat = data as Stat;
  const updateAction = updateStatAction.bind(null, statId);
  const deleteAction = deleteStatAction.bind(null, statId);

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Stats Lab"
        title="Edit Stat"
        description="Fine tune the number, context, or publishing status. Make sure the story reads clean for social posts."
        action={<SoftLinkButton href="/stats">Back to library</SoftLinkButton>}
      >
        <dl className="grid gap-6 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-3">
          <div>
            <dt className="uppercase tracking-wide">Created</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {new Date(stat.created_at).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Updated</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {new Date(stat.updated_at).toLocaleString()}
            </dd>
          </div>
          {stat.published_at && (
            <div>
              <dt className="uppercase tracking-wide">Published</dt>
              <dd className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                {new Date(stat.published_at).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </SectionCard>

      <FormCard>
        <form id="update-form" action={updateAction} className="space-y-6">
          <FormField label="Stat" htmlFor="stat_text">
            <TextArea id="stat_text" name="stat_text" rows={3} defaultValue={stat.stat_text} required />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Stat Value" htmlFor="stat_value">
              <TextInput id="stat_value" name="stat_value" defaultValue={stat.stat_value ?? ''} />
            </FormField>
            <FormField label="Year" htmlFor="year">
              <TextInput id="year" name="year" type="number" defaultValue={stat.year ?? ''} />
            </FormField>
          </div>

          <FormField label="Stat Category" htmlFor="stat_category">
            <TextInput id="stat_category" name="stat_category" defaultValue={stat.stat_category ?? ''} />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Theme" htmlFor="theme">
              <TextInput id="theme" name="theme" defaultValue={stat.theme ?? ''} />
            </FormField>
            <FormField label="Category Tag" htmlFor="category">
              <TextInput id="category" name="category" defaultValue={stat.category ?? ''} />
            </FormField>
          </div>

          <FormField label="Attribution" htmlFor="attribution">
            <TextInput id="attribution" name="attribution" defaultValue={stat.attribution ?? ''} />
          </FormField>

          <FormField label="Status" htmlFor="status">
            <SelectInput id="status" name="status" defaultValue={stat.status ?? 'draft'}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </SelectInput>
          </FormField>
        </form>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <form action={deleteAction}>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-200"
            >
              Delete stat
            </button>
          </form>

          <FormActions>
            <a
              href="/stats"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </a>
            <PrimaryButton type="submit" form="update-form">
              Save changes
            </PrimaryButton>
          </FormActions>
        </div>
      </FormCard>
    </div>
  );
}
