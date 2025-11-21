'use client';

import { useEffect, useRef } from 'react';
import type { ProcessBuilderResult } from '../../core/types';

interface ProcessMessagePanelProps {
  result: ProcessBuilderResult | null;
  loading: boolean;
}

interface Message {
  type: 'info' | 'warning' | 'error' | 'success';
  text: string;
  timestamp: Date;
  taskId?: string;
}

export default function ProcessMessagePanel({
  result,
  loading,
}: ProcessMessagePanelProps): JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [result, loading]);

  const messages: Message[] = [];

  // Add loading message
  if (loading) {
    messages.push({
      type: 'info',
      text: 'Building trivia set...',
      timestamp: new Date(),
    });
  }

  // Add task results
  if (result) {
    result.results.forEach((taskResult, index) => {
      const taskId = `task-${index + 1}`;

      if (taskResult.success) {
        messages.push({
          type: 'success',
          text: `Task ${index + 1} completed successfully`,
          timestamp: new Date(),
          taskId,
        });

        if (taskResult.warnings && taskResult.warnings.length > 0) {
          taskResult.warnings.forEach((warning) => {
            messages.push({
              type: 'warning',
              text: warning,
              timestamp: new Date(),
              taskId,
            });
          });
        }
      } else {
        messages.push({
          type: 'error',
          text: `Task ${index + 1} failed`,
          timestamp: new Date(),
          taskId,
        });

        if (taskResult.errors && taskResult.errors.length > 0) {
          taskResult.errors.forEach((error) => {
            messages.push({
              type: 'error',
              text: error.message,
              timestamp: new Date(),
              taskId: error.taskId,
            });
          });
        }
      }
    });

    // Add final status
    if (result.status === 'success') {
      messages.push({
        type: 'success',
        text: `Trivia set created successfully! (${result.executionTime}ms)`,
        timestamp: new Date(),
      });
    } else if (result.status === 'error') {
      messages.push({
        type: 'error',
        text: 'Failed to create trivia set',
        timestamp: new Date(),
      });
    } else if (result.status === 'partial') {
      messages.push({
        type: 'warning',
        text: 'Trivia set created with partial results',
        timestamp: new Date(),
      });
    }

    // Add warnings
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach((warning) => {
        messages.push({
          type: 'warning',
          text: warning,
          timestamp: new Date(),
        });
      });
    }
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">No messages yet. Submit the form to start building.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Process Messages</h3>
      </div>
      <div className="max-h-96 overflow-y-auto p-4 space-y-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 p-2 rounded-lg ${
              message.type === 'error'
                ? 'bg-red-50 border border-red-200'
                : message.type === 'warning'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : message.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <div
              className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                message.type === 'error'
                  ? 'bg-red-500'
                  : message.type === 'warning'
                    ? 'bg-yellow-500'
                    : message.type === 'success'
                      ? 'bg-green-500'
                      : 'bg-blue-500'
              }`}
            />
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm ${
                  message.type === 'error'
                    ? 'text-red-800'
                    : message.type === 'warning'
                      ? 'text-yellow-800'
                      : message.type === 'success'
                        ? 'text-green-800'
                        : 'text-blue-800'
                }`}
              >
                {message.text}
              </p>
              {message.taskId && (
                <p className="text-xs text-slate-500 mt-1">{message.taskId}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

