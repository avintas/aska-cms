'use client';

import { useState, useTransition, useEffect } from 'react';
import { FormCard, PrimaryButton, SectionCard } from '@/components/ui/FormKit';
import {
  generateFactsAction,
  analyzeSourceContent,
  getGeneratedFactItems,
  generateSourcesReport,
  getAvailableSourcesForFacts,
  type SourceItem,
  type FactsPrompt,
  type ContentAnalysis,
  type GeneratedFactItem,
  type SourcesReport,
} from '@/app/f-gen/actions';

interface FGenWorkspaceProps {
  initialPrompt: FactsPrompt | null;
  initialSources: SourceItem[];
  initialError: string | null;
}

export default function FGenWorkspace({
  initialPrompt,
  initialSources,
  initialError,
}: FGenWorkspaceProps): JSX.Element {
  const [availableSources, setAvailableSources] = useState<SourceItem[]>(initialSources);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(
    initialSources[0]?.id ?? null,
  );
  const [isPending, startTransition] = useTransition();
  const [systemMessages, setSystemMessages] = useState<string[]>(() => {
    if (initialError) {
      return [`❌ ${initialError}`];
    }
    if (!initialPrompt) {
      return ['⚠️ No prompt found. Please ensure a facts prompt exists in collection_prompts.'];
    }
    return ['✨ Ready to generate facts content!'];
  });
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(
    null,
  );
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<GeneratedFactItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [sourcesReport, setSourcesReport] = useState<SourcesReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const selectedSource = availableSources.find((s) => s.id === selectedSourceId);

  const handleGenerateReport = (): void => {
    setIsGeneratingReport(true);
    setSystemMessages((prev) => [...prev, '📊 Analyzing all sources...']);
    generateSourcesReport().then((result) => {
      setIsGeneratingReport(false);
      if (result.success && result.report) {
        const report = result.report;
        setSourcesReport(report);
        setShowReport(true);
        setSystemMessages((prev) => [
          ...prev,
          `✅ Report generated! Analyzed ${report.total} sources`,
          `📈 Excellent: ${report.summary.excellent} | Good: ${report.summary.good} | Fair: ${report.summary.fair} | Poor: ${report.summary.poor}`,
        ]);
      } else {
        setSystemMessages((prev) => [...prev, `❌ ${result.error || 'Failed to generate report'}`]);
      }
    });
  };

  // Analyze content when source changes
  useEffect(() => {
    if (selectedSourceId) {
      setIsAnalyzing(true);
      analyzeSourceContent(selectedSourceId).then((result) => {
        setIsAnalyzing(false);
        if (result.success && result.analysis) {
          setContentAnalysis(result.analysis);
        } else {
          setContentAnalysis(null);
        }
      });

      // Load existing generated items
      setIsLoadingItems(true);
      getGeneratedFactItems(selectedSourceId).then((result) => {
        setIsLoadingItems(false);
        if (result.success && result.items) {
          setGeneratedItems(result.items);
        } else {
          setGeneratedItems([]);
        }
      });
    } else {
      setContentAnalysis(null);
      setGeneratedItems([]);
    }
  }, [selectedSourceId]);

  const handleGenerate = (): void => {
    if (!selectedSourceId) {
      setSystemMessages((prev) => [...prev, '⚠️ Please select a source first.']);
      return;
    }

    if (!initialPrompt) {
      setSystemMessages((prev) => [...prev, '❌ No prompt available. Cannot generate.']);
      return;
    }

    setSystemMessages((prev) => [
      ...prev,
      `🚀 Starting generation with source: "${selectedSource?.title || `ID ${selectedSourceId}`}"...`,
    ]);

    startTransition(() => {
      generateFactsAction(selectedSourceId).then((result) => {
        setLastResult(result);
        if (result.success) {
          setSystemMessages((prev) => [
            ...prev,
            `✅ ${result.message}`,
            `📊 Generated ${result.itemCount || 0} fact(s)`,
          ]);
          
          // IMMEDIATELY remove the used source from the dropdown (optimistic update)
          setAvailableSources((prev) => prev.filter((s) => s.id !== selectedSourceId));
          
          // Then refresh from server to get updated list (with a small delay to ensure DB is updated)
          setTimeout(() => {
            getAvailableSourcesForFacts().then((sourcesResult) => {
              if (sourcesResult.success && sourcesResult.sources) {
                setAvailableSources(sourcesResult.sources);
                // If current source is no longer available, select first available
                if (!sourcesResult.sources.find((s) => s.id === selectedSourceId)) {
                  setSelectedSourceId(sourcesResult.sources[0]?.id ?? null);
                }
              }
            });
          }, 500);
          
          // Update generated items list
          if (result.generatedItems) {
            setGeneratedItems((prev) => [...result.generatedItems!, ...prev]);
          } else {
            // Reload items if not included in result
            getGeneratedFactItems(selectedSourceId).then((itemsResult) => {
              if (itemsResult.success && itemsResult.items) {
                setGeneratedItems(itemsResult.items);
              }
            });
          }
        } else {
          setSystemMessages((prev) => [...prev, `❌ ${result.message}`]);
        }
      });
    });
  };

  const getPromptPreview = (prompt: FactsPrompt | null): string => {
    if (!prompt) return 'No prompt available';
    const lines = prompt.prompt_content.split('\n').filter((line) => line.trim());
    return lines.slice(0, 3).join('\n');
  };

  return (
    <div className="space-y-8">
      {/* Sources Report Section */}
      <SectionCard
        eyebrow="Source Analysis"
        title="Sources Report"
        description="Analyze all sources to see which ones have the best potential for fact extraction."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Get a comprehensive report of all sources grouped by extraction potential.
            </p>
            <PrimaryButton
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="min-w-[180px]"
            >
              {isGeneratingReport ? (
                <>
                  <span className="mr-2">⏳</span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span className="mr-2">📊</span>
                  Generate Report
                </>
              )}
            </PrimaryButton>
          </div>

          {showReport && sourcesReport && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {sourcesReport.summary.excellent}
                  </div>
                  <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Excellent
                  </div>
                  <div className="mt-1 text-xs text-emerald-500 dark:text-emerald-500">
                    {sourcesReport.total > 0
                      ? Math.round((sourcesReport.summary.excellent / sourcesReport.total) * 100)
                      : 0}
                    %
                  </div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {sourcesReport.summary.good}
                  </div>
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Good</div>
                  <div className="mt-1 text-xs text-blue-500 dark:text-blue-500">
                    {sourcesReport.total > 0
                      ? Math.round((sourcesReport.summary.good / sourcesReport.total) * 100)
                      : 0}
                    %
                  </div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {sourcesReport.summary.fair}
                  </div>
                  <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Fair</div>
                  <div className="mt-1 text-xs text-amber-500 dark:text-amber-500">
                    {sourcesReport.total > 0
                      ? Math.round((sourcesReport.summary.fair / sourcesReport.total) * 100)
                      : 0}
                    %
                  </div>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-900/20">
                  <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                    {sourcesReport.summary.poor}
                  </div>
                  <div className="text-xs font-medium text-rose-600 dark:text-rose-400">Poor</div>
                  <div className="mt-1 text-xs text-rose-500 dark:text-rose-500">
                    {sourcesReport.total > 0
                      ? Math.round((sourcesReport.summary.poor / sourcesReport.total) * 100)
                      : 0}
                    %
                  </div>
                </div>
              </div>

              {/* Detailed Buckets */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Excellent Bucket */}
                {sourcesReport.excellent.length > 0 && (
                  <FormCard>
                    <div className="space-y-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        ⭐ Excellent Candidates ({sourcesReport.excellent.length})
                      </h4>
                    </div>
                    <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                      {sourcesReport.excellent.map((item) => (
                        <div
                          key={item.sourceId}
                          className="cursor-pointer rounded border border-emerald-200 bg-emerald-50 p-2 text-xs hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30"
                          onClick={() => setSelectedSourceId(item.sourceId)}
                        >
                          <div className="font-medium text-emerald-900 dark:text-emerald-100">
                            {item.sourceTitle || `Source #${item.sourceId}`}
                          </div>
                          <div className="mt-1 text-emerald-700 dark:text-emerald-300">
                            Score: {item.analysis.extractionScore}/100
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormCard>
                )}

                {/* Good Bucket */}
                {sourcesReport.good.length > 0 && (
                  <FormCard>
                    <div className="mt-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        ✅ Good Candidates ({sourcesReport.good.length})
                      </h4>
                    </div>
                    <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                      {sourcesReport.good.map((item) => (
                        <div
                          key={item.sourceId}
                          className="cursor-pointer rounded border border-blue-200 bg-blue-50 p-2 text-xs hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                          onClick={() => setSelectedSourceId(item.sourceId)}
                        >
                          <div className="font-medium text-blue-900 dark:text-blue-100">
                            {item.sourceTitle || `Source #${item.sourceId}`}
                          </div>
                          <div className="mt-1 text-blue-700 dark:text-blue-300">
                            Score: {item.analysis.extractionScore}/100
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormCard>
                )}

                {/* Fair Bucket */}
                {sourcesReport.fair.length > 0 && (
                  <FormCard>
                    <div className="mt-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        ⚠️ Fair Candidates ({sourcesReport.fair.length})
                      </h4>
                    </div>
                    <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                      {sourcesReport.fair.map((item) => (
                        <div
                          key={item.sourceId}
                          className="cursor-pointer rounded border border-amber-200 bg-amber-50 p-2 text-xs hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
                          onClick={() => setSelectedSourceId(item.sourceId)}
                        >
                          <div className="font-medium text-amber-900 dark:text-amber-100">
                            {item.sourceTitle || `Source #${item.sourceId}`}
                          </div>
                          <div className="mt-1 text-amber-700 dark:text-amber-300">
                            Score: {item.analysis.extractionScore}/100
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormCard>
                )}

                {/* Poor Bucket */}
                {sourcesReport.poor.length > 0 && (
                  <FormCard>
                    <div className="mt-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                        ❌ Poor Candidates ({sourcesReport.poor.length})
                      </h4>
                    </div>
                    <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                      {sourcesReport.poor.map((item) => (
                        <div
                          key={item.sourceId}
                          className="cursor-pointer rounded border border-rose-200 bg-rose-50 p-2 text-xs hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:hover:bg-rose-900/30"
                          onClick={() => setSelectedSourceId(item.sourceId)}
                        >
                          <div className="font-medium text-rose-900 dark:text-rose-100">
                            {item.sourceTitle || `Source #${item.sourceId}`}
                          </div>
                          <div className="mt-1 text-rose-700 dark:text-rose-300">
                            Score: {item.analysis.extractionScore}/100
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormCard>
                )}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Facts Generator"
        title="F-Gen"
        description="Generate hockey facts content using fact generation prompts. Select a source and let AI extract factual information."
      >
        <div className="space-y-3">
          {/* Source Selection */}
          <FormCard>
            <div className="space-y-2">
              <label htmlFor="source-select" className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                📚 Select Source
              </label>
              <select
                id="source-select"
                value={selectedSourceId ?? ''}
                onChange={(e) => setSelectedSourceId(Number.parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs focus:border-primary-brand focus:outline-none focus:ring-2 focus:ring-primary-brand/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                disabled={isPending}
              >
                <option value="">-- Select a source --</option>
                    {availableSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.title || `Source #${source.id}`}
                    {source.theme ? ` • ${source.theme}` : ''}
                  </option>
                ))}
              </select>
              {selectedSource && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <p className="font-medium leading-tight">{selectedSource.title || `Source #${selectedSource.id}`}</p>
                  {selectedSource.summary && (
                    <p className="mt-0.5 line-clamp-2 leading-tight">{selectedSource.summary}</p>
                  )}
                  {selectedSource.theme && (
                    <p className="mt-0.5 text-slate-500 dark:text-slate-400">Theme: {selectedSource.theme}</p>
                  )}
                </div>
              )}
            </div>
          </FormCard>

          {/* Content Analysis */}
          {selectedSourceId && (
            <FormCard>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  🔍 Content Analysis
                </h3>
                {isAnalyzing ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Analyzing content...</p>
                  </div>
                ) : contentAnalysis ? (
                  <div className="space-y-1.5">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Extraction Potential:
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            contentAnalysis.assessment === 'excellent'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : contentAnalysis.assessment === 'good'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : contentAnalysis.assessment === 'fair'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                          }`}
                        >
                          {contentAnalysis.assessment.toUpperCase()} ({contentAnalysis.extractionScore}/100)
                        </span>
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Words:</span>{' '}
                          <span className="font-medium">{contentAnalysis.wordCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Sentences:</span>{' '}
                          <span className="font-medium">{contentAnalysis.sentenceCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Fact Indicators:</span>{' '}
                          <span className="font-medium">{contentAnalysis.wisdomIndicators}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Avg Sentence:</span>{' '}
                          <span className="font-medium">{contentAnalysis.averageSentenceLength.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-900/20">
                      <p className="mb-1 text-[10px] font-semibold text-blue-900 dark:text-blue-200">
                        💡 Insights:
                      </p>
                      <ul className="space-y-0.5 text-[10px] text-blue-800 dark:text-blue-300 leading-tight">
                        {contentAnalysis.insights.map((insight, idx) => (
                          <li key={idx}>• {insight}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Unable to analyze content.
                    </p>
                  </div>
                )}
              </div>
            </FormCard>
          )}

          {/* Prompt Display */}
          <FormCard>
            <div className="space-y-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  🎯 Active Prompt
                </h3>
                {initialPrompt ? (
                  <>
                    <p className="mt-0.5 text-sm font-bold text-primary-brand">
                      {initialPrompt.prompt_name}
                    </p>
                    <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                      <pre className="whitespace-pre-wrap text-[10px] text-slate-700 dark:text-slate-300 leading-tight">
                        {getPromptPreview(initialPrompt)}
                        {initialPrompt.prompt_content.split('\n').filter((l) => l.trim()).length > 3 && (
                          <span className="text-slate-400">...</span>
                        )}
                      </pre>
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    ⚠️ No prompt found. Please add a facts prompt to collection_prompts table.
                  </p>
                )}
              </div>
            </div>
          </FormCard>

          {/* Generate Button */}
          <div className="flex justify-center">
            <PrimaryButton
              onClick={handleGenerate}
              disabled={isPending || !selectedSourceId || !initialPrompt}
              className="min-w-[200px] px-6 py-2 text-sm font-semibold"
            >
              {isPending ? (
                <>
                  <span className="mr-1.5">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="mr-1.5">✨</span>
                  Generate It
                </>
              )}
            </PrimaryButton>
          </div>

          {/* System Messages */}
          <FormCard>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                📋 System Messages
              </h3>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                {systemMessages.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No messages yet.</p>
                ) : (
                  systemMessages.map((message, index) => (
                    <div
                      key={index}
                      className="rounded-md bg-white p-1 text-[10px] shadow-sm dark:bg-slate-900"
                    >
                      <p className="font-mono leading-tight">{message}</p>
                    </div>
                  ))
                )}
              </div>
              {lastResult && (
                <div
                  className={`rounded-lg border p-1.5 ${
                    lastResult.success
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                      : 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20'
                  }`}
                >
                  <p
                    className={`text-xs font-medium ${
                      lastResult.success
                        ? 'text-emerald-800 dark:text-emerald-200'
                        : 'text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {lastResult.success ? '✅ Success!' : '❌ Error'}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] leading-tight ${
                      lastResult.success
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {lastResult.message}
                  </p>
                </div>
              )}
            </div>
          </FormCard>

          {/* Generated Items List */}
          {selectedSourceId && (
            <FormCard>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    📝 Generated Facts
                  </h3>
                  {generatedItems.length > 0 && (
                    <span className="rounded-full bg-primary-brand/10 px-2 py-0.5 text-[10px] font-semibold text-primary-brand">
                      {generatedItems.length} item{generatedItems.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {isLoadingItems ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Loading items...</p>
                  </div>
                ) : generatedItems.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No facts generated yet. Click "Generate It" to create some!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {generatedItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-tight">
                              {item.text}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              {item.category && (
                                <span className="rounded-full bg-primary-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-primary-brand">
                                  {item.category}
                                </span>
                              )}
                              {item.theme && (
                                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  {item.theme}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormCard>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

