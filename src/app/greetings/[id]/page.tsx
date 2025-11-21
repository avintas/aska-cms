import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/utils/supabase/server';
import type { Greeting, GreetingUpdateInput } from '@aska/shared';
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

async function updateGreetingAction(id: number, formData: FormData): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const greetingData: GreetingUpdateInput = {
    greeting_text: formData.get('greeting_text') as string,
    attribution: (formData.get('attribution') as string) || undefined,
    status: (formData.get('status') as 'unpublished' | 'published') || undefined,
  };

  const { error } = await supabase.from('collection_greetings').update(greetingData).eq('id', id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating greeting:', error);
    throw new Error('Failed to update greeting');
  }

  redirect('/greetings');
}

async function deleteGreetingAction(id: number): Promise<void> {
  'use server';

  const supabase = await createServerClient();

  const { error } = await supabase.from('collection_greetings').delete().eq('id', id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting greeting:', error);
    throw new Error('Failed to delete greeting');
  }

  redirect('/greetings');
}

export default async function EditGreetingPage({ params }: PageProps): Promise<JSX.Element> {
  const { id } = await params;
  const greetingId = Number(id);

  if (!Number.isFinite(greetingId)) {
    notFound();
  }

  const supabase = await createServerClient();

  const { data: greeting, error } = await supabase
    .from('collection_greetings')
    .select('*')
    .eq('id', greetingId)
    .single();

  if (error || !greeting) {
    notFound();
  }

  const greetingData = greeting as Greeting;
  const updateAction = updateGreetingAction.bind(null, greetingId);
  const deleteAction = deleteGreetingAction.bind(null, greetingId);

  return (
    <div className="space-y-8">
      <SectionCard
        eyebrow="H.U.G. Builder"
        title="Edit Greeting"
        description="Adjust copy, attribution, or publishing state. H.U.G.s should feel timely, authentic, and encouraging."
        action={<SoftLinkButton href="/greetings">Back to library</SoftLinkButton>}
      >
        <dl className="grid gap-6 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-3">
          <div>
            <dt className="uppercase tracking-wide">Created</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {new Date(greetingData.created_at).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Updated</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {new Date(greetingData.updated_at).toLocaleString()}
            </dd>
          </div>
          {greetingData.published_at && (
            <div>
              <dt className="uppercase tracking-wide">Published</dt>
              <dd className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                {new Date(greetingData.published_at).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </SectionCard>

      <FormCard>
        <form id="update-form" action={updateAction} className="space-y-6">
          <FormField label="Greeting" htmlFor="greeting_text">
            <TextArea
              id="greeting_text"
              name="greeting_text"
              required
              rows={4}
              defaultValue={greetingData.greeting_text}
            />
          </FormField>

          <FormField label="Attribution" htmlFor="attribution">
            <TextInput id="attribution" name="attribution" defaultValue={greetingData.attribution || ''} />
          </FormField>

          <FormField label="Status" htmlFor="status">
            <SelectInput
              id="status"
              name="status"
              defaultValue={greetingData.status === 'published' ? 'published' : 'unpublished'}
            >
              <option value="unpublished">Unpublished</option>
              <option value="published">Published</option>
            </SelectInput>
          </FormField>
        </form>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <form action={deleteAction}>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-200"
            >
              Delete greeting
            </button>
          </form>
          <FormActions>
            <a
              href="/greetings"
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
