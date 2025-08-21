import React from 'react';
import { Progress } from "@/components/ui/progress";
import { useJobProgress, getStatusDescription } from '@/hooks/useJobProgress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface ProcessingProgressProps {
  documentId: string;
  showDetails?: boolean;
  className?: string;
}

export function ProcessingProgress({
  documentId,
  showDetails = false,
  className
}: ProcessingProgressProps) {
  const progress = useJobProgress(documentId);
  
  const statusIcon = () => {
    switch(progress.overallStatus) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress': return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default: return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const progressColor = progress.overallStatus === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Progress 
            value={progress.progressPercentage} 
            className="h-2"
          />
        </div>
        <div className="flex items-center space-x-2">
          <span>{progress.progressPercentage}%</span>
          {statusIcon()}
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        {getStatusDescription(progress)}
      </div>
      
      {progress.overallStatus === 'error' && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Processing Document</AlertTitle>
          <AlertDescription>{progress.error || 'An unknown error occurred'}</AlertDescription>
        </Alert>
      )}
      
      {showDetails && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Processing Stages</h4>
          <div className="grid grid-cols-3 gap-2">
            <StageStatus 
              name="Upload" 
              status={progress.ingest.status} 
              startTime={progress.ingest.startedAt}
              endTime={progress.ingest.completedAt}
            />
            <StageStatus 
              name="OCR Analysis" 
              status={progress.ocr.status} 
              startTime={progress.ocr.startedAt}
              endTime={progress.ocr.completedAt}
            />
            <StageStatus 
              name="AI Embedding" 
              status={progress.embed.status} 
              startTime={progress.embed.startedAt}
              endTime={progress.embed.completedAt}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface StageStatusProps {
  name: string;
  status: string;
  startTime?: Date;
  endTime?: Date;
}

function StageStatus({ name, status, startTime, endTime }: StageStatusProps) {
  const getStatusBadge = () => {
    switch(status) {
      case 'queued':
        return <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">Queued</span>;
      case 'running':
        return <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Running</span>;
      case 'done':
        return <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Complete</span>;
      case 'error':
        return <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Failed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getDuration = () => {
    if (startTime && endTime) {
      const durationMs = endTime.getTime() - startTime.getTime();
      const seconds = Math.floor(durationMs / 1000);
      return `${seconds}s`;
    }
    return null;
  };

  return (
    <div className="p-2 border rounded-md">
      <div className="font-medium text-sm">{name}</div>
      <div className="flex justify-between items-center mt-1">
        <div>{getStatusBadge()}</div>
        {getDuration() && (
          <div className="text-xs text-muted-foreground">{getDuration()}</div>
        )}
      </div>
    </div>
  );
}