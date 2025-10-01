import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type JobStatus = 'queued' | 'running' | 'done' | 'error';

export interface ProcessingJob {
  id: string;
  document_id: string;
  stage: string;
  status: string; // Accepting any string status from DB
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  output_data?: unknown;
  input_data?: unknown;
}

export type ProcessingStage = 'ingest' | 'ocr' | 'embed';

export interface ProcessingProgress {
  ingest: {
    status: JobStatus;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    id?: string;
    metadata?: unknown;
  };
  ocr: {
    status: JobStatus;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    id?: string;
    metadata?: unknown;
  };
  embed: {
    status: JobStatus;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    id?: string;
    metadata?: unknown;
  };
  overallStatus: 'not_started' | 'in_progress' | 'completed' | 'error';
  completedStages: number;
  totalStages: number;
  progressPercentage: number;
  error?: string;
  document_id?: string;
}

const initialProgress: ProcessingProgress = {
  ingest: { status: 'queued' },
  ocr: { status: 'queued' },
  embed: { status: 'queued' },
  overallStatus: 'not_started',
  completedStages: 0,
  totalStages: 3,
  progressPercentage: 0
};

/**
 * Hook to track document processing progress in real-time
 * 
 * @param document_id The UUID of the document to track
 * @returns ProcessingProgress object with real-time status updates
 */
export function useJobProgress(document_id?: string): ProcessingProgress {
  const [progress, setProgress] = useState<ProcessingProgress>({...initialProgress, document_id});

  useEffect(() => {
    if (!document_id) {
      return;
    }

    // Initialize with current status from database
    async function fetchCurrentJobs() {
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('document_id', document_id);

      if (error) {
        console.error('Error fetching processing jobs:', error);
        return;
      }

      if (data && data.length > 0) {
        updateProgressFromJobs(data);
      }
    }

    // Update progress state based on job data
    function updateProgressFromJobs(jobs: ProcessingJob[]) {
      setProgress(current => {
        const newProgress = {...current};
        let completedStages = 0;
        let hasError = false;
        let latestError = '';
        
        // Process each job
        jobs.forEach(job => {
          if (!job.stage || !['ingest', 'ocr', 'embed'].includes(job.stage)) {
            return;
          }
          
          const stage = job.stage as ProcessingStage;
          
          // Update stage info
          newProgress[stage] = {
            status: job.status as JobStatus,
            startedAt: job.started_at ? new Date(job.started_at) : undefined,
            completedAt: job.completed_at ? new Date(job.completed_at) : undefined,
            error: job.error_message,
            id: job.id,
            metadata: job.output_data
          };
          
          // Track completion and errors
          if (job.status === 'done') {
            completedStages++;
          }
          
          if (job.status === 'error') {
            hasError = true;
            latestError = job.error_message || 'Unknown error';
          }
        });
        
        // Calculate overall progress
        const progressPercentage = Math.round((completedStages / 3) * 100);
        
        // Determine overall status
        let overallStatus: ProcessingProgress['overallStatus'] = 'not_started';
        if (hasError) {
          overallStatus = 'error';
        } else if (completedStages === 3) {
          overallStatus = 'completed';
        } else if (completedStages > 0 || jobs.some(j => j.status === 'running')) {
          overallStatus = 'in_progress';
        }
        
        return {
          ...newProgress,
          completedStages,
          progressPercentage,
          overallStatus,
          error: latestError,
          document_id
        };
      });
    }

    // Set up real-time subscription
    fetchCurrentJobs();
    
    const channel = supabase
      .channel('job-updates')
      .on(
        'postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'processing_jobs',
          filter: `document_id=eq.${document_id}`
        },
        (payload) => {
          const job = payload.new as ProcessingJob;
          updateProgressFromJobs([job]);
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [document_id]);

  return progress;
}

/**
 * Helper function to get a user-friendly status description
 */
export function getStatusDescription(progress: ProcessingProgress): string {
  switch (progress.overallStatus) {
    case 'not_started':
      return 'Waiting to start processing...';
    case 'in_progress':
      if (progress.embed.status === 'running')
        return 'Creating AI embeddings...';
      if (progress.ocr.status === 'running')
        return 'Performing OCR analysis...';
      if (progress.ingest.status === 'running')
        return 'Uploading document...';
      return 'Processing document...';
    case 'completed':
      return 'Document processing complete';
    case 'error':
      return `Error: ${progress.error || 'Unknown error occurred'}`;
    default:
      return 'Unknown status';
  }
}