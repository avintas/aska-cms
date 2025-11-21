import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import type { Wisdom, WisdomUpdateInput } from '@aska/shared';
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

async function updateWisdomAction(id: number, formData: FormData): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const wisdomData: WisdomUpdateInput = {
    title: formData.get('title') as string,
    musing: formData.get('musing') as string,
    from_the_box: formData.get('from_the_box') as string,
    theme: (formData.get('theme') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    attribution: (formData.get('attribution') as string) || undefined,
    status: (formData.get('status') as 'draft' | 'published' | 'archived') || undefined,
  };

  const { error } = await supabase.from('collection_wisdom').update(wisdomData).eq('id', id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating wisdom:', error);
    throw new Error('Failed to update wisdom');
  }

  redirect('/wisdom');
}

async function deleteWisdomAction(id: number): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const { error } = await supabase.from('collection_wisdom').delete().eq('id', id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting wisdom:', error);
    throw new Error('Failed to delete wisdom');
  }

  redirect('/wisdom');
}

export default async function EditWisdomPage({ params }: PageProps): Promise<JSX.Element> {
  const { id } = await params;
  const wisdomId = Number(id);

  if (!Number.isFinite(wisdomId)) {
    notFound();
  }

  const supabase = await createServerClient();

  const { data: wisdom, error } = await supabase
    .from('collection_wisdom')
    .select('*')
    .eq('id', wisdomId)
    .single();

  if (error || !wisdom) {
    notFound();
  }

  const wisdomData = wisdom as Wisdom;
  const updateAction = updateWisdomAction.bind(null, wisdomId);
  const deleteAction = deleteWisdomAction.bind(null, wisdomId);

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="Builder"
        title="Edit Wisdom"
        description="Adjust tone, attribution, or status to keep the Penalty Box Philosopher feed balanced."
        action={<SoftLinkButton href="/wisdom">Back to library</SoftLinkButton>}
      >
        <dl className="grid gap-6 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-3">
          <div>
            <dt className="uppercase tracking-wide">Created</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {new Date(wisdomData.created_at).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Updated</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {new Date(wisdomData.updated_at).toLocaleString()}
            </dd>
          </div>
          {wisdomData.published_at && (
            <div>
              <dt className="uppercase tracking-wide">Published</dt>
              <dd className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                {new Date(wisdomData.published_at).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </SectionCard>

      <FormCard>
        <form id="update-form" action={updateAction} className="space-y-6">
          <FormField label="Title" htmlFor="title">
            <TextInput id="title" name="title" required defaultValue={wisdomData.title} />
          </FormField>

          <FormField label="Musing" htmlFor="musing">
            <TextArea id="musing" name="musing" rows={6} required defaultValue={wisdomData.musing} />
          </FormField>

          <FormField label="From the Box" htmlFor="from_the_box">
            <TextInput id="from_the_box" name="from_the_box" required defaultValue={wisdomData.from_the_box} />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Theme" htmlFor="theme">
              <TextInput id="theme" name="theme" defaultValue={wisdomData.theme || ''} />
            </FormField>
            <FormField label="Category" htmlFor="category">
              <TextInput id="category" name="category" defaultValue={wisdomData.category || ''} />
            </FormField>
          </div>

          <FormField label="Attribution" htmlFor="attribution">
            <TextInput id="attribution" name="attribution" defaultValue={wisdomData.attribution || ''} />
          </FormField>

          <FormField label="Status" htmlFor="status">
            <SelectInput id="status" name="status" defaultValue={wisdomData.status || 'draft'}>
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
              Delete wisdom
            </button>
          </form>

          <FormActions>
            <a
              href="/wisdom"
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
