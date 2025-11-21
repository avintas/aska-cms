import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import type { Fact, FactUpdateInput } from '@aska/shared';
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

async function updateFactAction(id: number, formData: FormData): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const yearValue = formData.get('year') as string;
  const payload: FactUpdateInput = {
    fact_text: formData.get('fact_text') as string,
    fact_value: (formData.get('fact_value') as string) || undefined,
    fact_category: (formData.get('fact_category') as string) || undefined,
    year: yearValue ? Number(yearValue) : undefined,
    theme: (formData.get('theme') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    attribution: (formData.get('attribution') as string) || undefined,
    status: ((formData.get('status') as string) || undefined) as FactUpdateInput['status'],
  };

  const { error } = await supabase.from('collection_facts').update(payload).eq('id', id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating fact:', error);
    throw new Error('Failed to update fact');
  }

  redirect('/facts');
}

async function deleteFactAction(id: number): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const { error } = await supabase.from('collection_facts').delete().eq('id', id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting fact:', error);
    throw new Error('Failed to delete fact');
  }

  redirect('/facts');
}

export default async function EditFactPage({ params }: PageProps): Promise<JSX.Element> {
  const { id } = await params;
  const factId = Number(id);
  if (!Number.isFinite(factId)) {
    notFound();
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.from('collection_facts').select('*').eq('id', factId).single();

  if (error || !data) {
    notFound();
  }

  const fact = data as Fact;
  const updateAction = updateFactAction.bind(null, factId);
  const deleteAction = deleteFactAction.bind(null, factId);

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Facts Lab"
        title="Edit Fact"
        description="Fine tune the number, context, or publishing status. Make sure the story reads clean for social posts."
        action={<SoftLinkButton href="/facts">Back to library</SoftLinkButton>}
      >
        <dl className="grid gap-6 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-3">
          <div>
            <dt className="uppercase tracking-wide">Created</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {new Date(fact.created_at).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Updated</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {new Date(fact.updated_at).toLocaleString()}
            </dd>
          </div>
          {fact.published_at && (
            <div>
              <dt className="uppercase tracking-wide">Published</dt>
              <dd className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                {new Date(fact.published_at).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </SectionCard>

      <FormCard>
        <form id="update-form" action={updateAction} className="space-y-6">
          <FormField label="Fact" htmlFor="fact_text">
            <TextArea id="fact_text" name="fact_text" rows={3} defaultValue={fact.fact_text} required />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Fact Value" htmlFor="fact_value">
              <TextInput id="fact_value" name="fact_value" defaultValue={fact.fact_value ?? ''} />
            </FormField>
            <FormField label="Year" htmlFor="year">
              <TextInput id="year" name="year" type="number" defaultValue={fact.year ?? ''} />
            </FormField>
          </div>

          <FormField label="Fact Category" htmlFor="fact_category">
            <TextInput id="fact_category" name="fact_category" defaultValue={fact.fact_category ?? ''} />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Theme" htmlFor="theme">
              <TextInput id="theme" name="theme" defaultValue={fact.theme ?? ''} />
            </FormField>
            <FormField label="Category Tag" htmlFor="category">
              <TextInput id="category" name="category" defaultValue={fact.category ?? ''} />
            </FormField>
          </div>

          <FormField label="Attribution" htmlFor="attribution">
            <TextInput id="attribution" name="attribution" defaultValue={fact.attribution ?? ''} />
          </FormField>

          <FormField label="Status" htmlFor="status">
            <SelectInput id="status" name="status" defaultValue={fact.status ?? 'unpublished'}>
              <option value="unpublished">Unpublished</option>
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
              Delete fact
            </button>
          </form>

          <FormActions>
            <a
              href="/facts"
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

