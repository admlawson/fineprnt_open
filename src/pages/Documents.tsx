import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  Search, 
  MoreVertical, 
  Download, 
  Trash2, 
  Edit3,
  Calendar,
  FileType,
  RefreshCw,
  RotateCcw,
  PlayCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useJobProgress } from '@/hooks/useJobProgress';
import { SubscriptionGate } from '@/components/auth/SubscriptionGate';
import { functionUrl } from '@/lib/supabaseEndpoints';

interface Document {
  id: string;
  filename: string;
  type: string;
  size: string;
  uploadDate: Date;
  status: 'uploaded' | 'queued' | 'processing' | 'awaiting_credit' | 'completed' | 'failed';
  pages?: number;
  file_size?: number;
  mime_type?: string;
}

interface ProcessingJob {
  id: string;
  document_id: string;
  stage: 'ingest' | 'ocr' | 'annotation' | 'vectorization' | 'embed' | 'finalize';
  status: 'queued' | 'processing' | 'done' | 'failed';
  started_at?: string;
  completed_at?: string;
  created_at: string;
  error_message?: string;
}

// Progress Pill Component
const ProgressPill: React.FC<{ progress: number; isComplete?: boolean; stage?: string }> = ({ progress, isComplete = false, stage }) => {
  return (
    <div className="relative w-full h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-500 ease-out ${
          isComplete 
            ? 'bg-green-500' 
            : 'bg-blue-500'
        }`}
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center px-2">
        {isComplete ? (
          <div className="flex items-center space-x-1 animate-in fade-in-0 zoom-in-95 duration-300">
            <CheckCircle size={12} className="text-white sm:w-3.5 sm:h-3.5" />
            <span className="text-xs font-medium text-white drop-shadow-sm hidden sm:inline">Complete!</span>
            <span className="text-xs font-medium text-white drop-shadow-sm sm:hidden">Done!</span>
          </div>
        ) : (
          <span className="text-xs font-medium text-white drop-shadow-sm truncate">
            {stage ? (
              <span className="hidden sm:inline">{stage} - {Math.round(progress)}%</span>
            ) : (
              <span>{Math.round(progress)}%</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const [retryingDocuments, setRetryingDocuments] = useState<Set<string>>(new Set());
  const [processingDocuments, setProcessingDocuments] = useState<Set<string>>(new Set());
  const [processingProgress, setProcessingProgress] = useState<Record<string, number>>({});
  const [processingJobs, setProcessingJobs] = useState<Record<string, ProcessingJob[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, session } = useAuth();

  // Calculate progress based on processing job stages and status
  const calculateProgress = (jobs: ProcessingJob[]): { progress: number; currentStage: string } => {
    if (!jobs || jobs.length === 0) return { progress: 0, currentStage: 'Starting...' };

    const stageOrder = ['ingest', 'ocr', 'annotation', 'vectorization', 'embed', 'finalize'];
    const totalStages = stageOrder.length;
    
    let completedStages = 0;
    let currentStage = 'Starting...';
    
    for (const stage of stageOrder) {
      const stageJob = jobs.find(job => job.stage === stage);
      if (stageJob) {
        if (stageJob.status === 'done') {
          completedStages++;
        } else if (stageJob.status === 'processing' || stageJob.status === 'queued') {
          currentStage = stage;
          break;
        } else if (stageJob.status === 'failed') {
          currentStage = `${stage} (failed)`;
          break;
        }
      }
    }
    
    const progress = (completedStages / totalStages) * 100;
    return { progress, currentStage };
  };

  // Fetch processing jobs for a document
  const fetchProcessingJobs = async (documentId: string) => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const jobs = (data || []) as ProcessingJob[];
      setProcessingJobs(prev => ({ ...prev, [documentId]: jobs }));

      // Calculate and update progress
      const { progress, currentStage } = calculateProgress(jobs);
      setProcessingProgress(prev => ({ ...prev, [documentId]: progress }));

      // Check if all stages are complete
      const allComplete = jobs.every(job => job.status === 'done');
      if (allComplete && progress === 100) {
        // All processing complete, reset after showing completion
        setTimeout(() => {
          setProcessingDocuments(prev => { const ns = new Set(prev); ns.delete(documentId); return ns; });
          setProcessingProgress(prev => { const { [documentId]: _, ...rest } = prev; return rest; });
          setProcessingJobs(prev => { const { [documentId]: _, ...rest } = prev; return rest; });
          fetchDocuments();
        }, 2000);
      }

    } catch (error) {
      console.error('Error fetching processing jobs:', error);
    }
  };
  
  const fetchDocuments = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const res = await supabase
        .from('documents' as any)
        .select('id, filename, mime_type, file_size, created_at, status')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (res.error) throw res.error;

      const data = (res.data as any[]) || [];

      const formattedDocs = data.map((doc: any) => ({
        id: String(doc.id),
        filename: String(doc.filename),
        type: determineDocumentType(String(doc.filename), doc.mime_type as string | undefined),
        size: formatFileSize(typeof doc.file_size === 'number' ? doc.file_size : undefined),
        uploadDate: new Date(doc.created_at as string),
        status: mapDatabaseStatus(String(doc.status)),
        file_size: doc.file_size as number | undefined,
        mime_type: doc.mime_type as string | undefined
      }));

      setDocuments(formattedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error loading documents",
        description: "Failed to load your documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const mapDatabaseStatus = (dbStatus: string): Document['status'] => {
    switch (dbStatus) {
      case 'uploaded': return 'uploaded';
      case 'queued': return 'queued';
      case 'processing': return 'processing'; 
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      case 'awaiting_credit': return 'awaiting_credit';
      case 'error': return 'failed';
      default: return 'queued';
    }
  };

  const determineDocumentType = (filename: string, mimeType?: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (filename.toLowerCase().includes('contract') || filename.toLowerCase().includes('agreement')) {
      if (filename.toLowerCase().includes('aetna') || filename.toLowerCase().includes('bcbs') || filename.toLowerCase().includes('humana')) {
        return 'Payer Contract';
      }
      if (filename.toLowerCase().includes('network')) {
        return 'Network Agreement';
      }
      if (filename.toLowerCase().includes('medicare') || filename.toLowerCase().includes('medicaid')) {
        return 'Government Contract';
      }
      return 'Contract';
    }
    
    if (filename.toLowerCase().includes('policy') || filename.toLowerCase().includes('manual')) {
      return 'Policy Document';
    }
    
    switch (extension) {
      case 'pdf': return 'PDF Document';
      case 'doc':
      case 'docx': return 'Word Document';
      default: return 'Document';
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const handleRetryProcessing = async (document: Document) => {
    if (!session?.user?.id) return;

    console.log(`Starting retry for document: ${document.id}`);
    setRetryingDocuments(prev => new Set(prev).add(document.id));
    setProcessingProgress(prev => ({ ...prev, [document.id]: 0 }));

    try {
      // Reset document status to queued
      const { error: statusError } = await supabase
        .from('documents' as any)
        .update({ status: 'queued' })
        .eq('id', document.id)
        .eq('user_id', session.user.id);

      if (statusError) {
        console.error('Error updating document status:', statusError);
        throw statusError;
      }

      // Clean up any existing failed processing jobs
      const { error: cleanupError } = await supabase
        .from('processing_jobs')
        .delete()
        .eq('document_id', document.id);

      if (cleanupError) {
        console.warn('Error cleaning up old processing jobs:', cleanupError);
        // Continue despite cleanup error
      }

      // Create new OCR processing job
      const { data: newJob, error: jobError } = await supabase
        .from('processing_jobs')
        .insert({
          document_id: document.id,
          stage: 'ocr',
          status: 'queued',
          input_data: { 
            document_id: document.id,
            retry: true,
            retried_at: new Date().toISOString()
          }
        })
        .select('id')
        .single();

      if (jobError) {
        console.error('Error creating new processing job:', jobError);
        throw jobError;
      }

      console.log(`Created new OCR job: ${newJob.id} for document: ${document.id}`);

      // Trigger the OCR processing function
      const response = await fetch(
        functionUrl('ocr_and_annotation'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            trigger: 'retry',
            document_id: document.id,
            job_id: newJob.id 
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to trigger OCR processing: ${response.status}`);
      }

      const result = await response.json();
      console.log('OCR processing triggered successfully:', result);

      toast({
        title: "Processing restarted",
        description: `Document "${document.filename}" will be processed again.`,
      });

      // Start monitoring processing jobs for retry immediately and then every 2 seconds
      await fetchProcessingJobs(document.id);
      const monitorInterval = setInterval(async () => {
        await fetchProcessingJobs(document.id);
        
        // Check if we should stop monitoring
        const jobs = processingJobs[document.id] || [];
        const allComplete = jobs.every(job => job.status === 'done');
        const hasFailed = jobs.some(job => job.status === 'failed');
        
        if (allComplete || hasFailed) {
          clearInterval(monitorInterval);
          // Reset retry state
          setRetryingDocuments(prev => {
            const newSet = new Set(prev);
            newSet.delete(document.id);
            return newSet;
          });
          setProcessingProgress(prev => { const { [document.id]: _, ...rest } = prev; return rest; });
        }
      }, 2000); // Check every 2 seconds

    } catch (error) {
      console.error('Error retrying document processing:', error);
      toast({
        title: "Retry failed",
        description: "Failed to restart document processing. Please try again.",
        variant: "destructive",
      });
      
      // Reset processing state on error
      setRetryingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });
      setProcessingProgress(prev => { const { [document.id]: _, ...rest } = prev; return rest; });
    }
  };

  const handleProcess = async (document: Document) => {
    if (!session) return;
    
    // Start processing state
    setProcessingDocuments(prev => new Set(prev).add(document.id));
    setProcessingProgress(prev => ({ ...prev, [document.id]: 0 }));
    
    try {
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('start_processing', { p_document_id: document.id });
      if (rpcError) throw rpcError;
      const ok = (rpcData as any)?.ok;
      if (!ok) {
        const reason = (rpcData as any)?.reason || 'unknown';
        toast({ title: 'Cannot process', description: reason === 'insufficient_credits' ? 'Insufficient credits. Upgrade or buy a document credit.' : 'No active period. Please subscribe.', variant: 'destructive' });
        return;
      }

      await fetch(functionUrl('ocr_and_annotation'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'start', document_id: document.id })
      });

      toast({ title: 'Processing started', description: `Document "${document.filename}" is queued.` });
      
      // Start monitoring processing jobs immediately and then every 2 seconds
      await fetchProcessingJobs(document.id);
      const monitorInterval = setInterval(async () => {
        await fetchProcessingJobs(document.id);
        
        // Check if we should stop monitoring
        const jobs = processingJobs[document.id] || [];
        const allComplete = jobs.every(job => job.status === 'done');
        const hasFailed = jobs.some(job => job.status === 'failed');
        
        if (allComplete || hasFailed) {
          clearInterval(monitorInterval);
        }
      }, 2000); // Check every 2 seconds
      
    } catch (error) {
      console.error('Error starting processing:', error);
      toast({ title: 'Start failed', description: 'Failed to start processing.', variant: 'destructive' });
      
      // Reset processing state on error
      setProcessingDocuments(prev => { const ns = new Set(prev); ns.delete(document.id); return ns; });
      setProcessingProgress(prev => { const { [document.id]: _, ...rest } = prev; return rest; });
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    fetchDocuments();

    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('Document change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newDoc = {
              id: payload.new.id,
              filename: payload.new.filename,
              type: determineDocumentType(payload.new.filename, payload.new.mime_type),
              size: formatFileSize(payload.new.file_size),
              uploadDate: new Date(payload.new.created_at),
              status: mapDatabaseStatus(payload.new.status),
              file_size: payload.new.file_size,
              mime_type: payload.new.mime_type
            };
            setDocuments(prev => [newDoc, ...prev.filter(doc => doc.id !== newDoc.id)]);
          } else if (payload.eventType === 'UPDATE') {
            setDocuments(prev => prev.map(doc => 
              doc.id === payload.new.id 
                ? {
                    ...doc,
                    status: mapDatabaseStatus(payload.new.status),
                    filename: payload.new.filename
                  }
                : doc
            ));
          } else if (payload.eventType === 'DELETE') {
            setDocuments(prev => prev.filter(doc => doc.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_jobs',
          filter: `document_id=in.(${documents.map(d => d.id).join(',')})`
        },
        async (payload) => {
          console.log('Processing job change:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const documentId = payload.new.document_id;
            // Fetch updated processing jobs for this document
            await fetchProcessingJobs(documentId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Clean up any processing state
      setProcessingDocuments(new Set());
      setProcessingProgress({});
      setProcessingJobs({});
    };
  }, [session?.user?.id]);

  if (!user || !session) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to access documents.</p>
      </div>
    );
  }

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        functionUrl('ingest_upload_metadata'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          // Handle duplicate file
          const data = await response.json();
          toast({
            title: "Duplicate document",
            description: data.metadata?.message || "This document already exists in your library.",
          });
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      toast({
        title: data.status === 'duplicate' ? "Duplicate document" : "Document uploaded",
        description: data.status === 'duplicate' 
          ? "This document already exists in your library."
          : 'Your document was uploaded. Click Process to start analysis.',
      });

      setTimeout(() => fetchDocuments(), 1000);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    console.log('Starting delete process for document:', id);
    console.log('User ID:', session?.user?.id);

    if (!session?.user?.id) {
      toast({
        title: "Delete failed",
        description: "Not authenticated. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setDocuments(prev => prev.filter(doc => doc.id !== id));

    try {
      const fetchRes = await supabase
        .from('documents' as any)
        .select('storage_path')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      const document = (fetchRes.data as any) as { storage_path?: string } | null;
      const fetchError = fetchRes.error;

      if (fetchError) {
        console.error('Error fetching document for deletion:', fetchError);
        throw fetchError;
      }

      console.log('Document storage path:', document?.storage_path);

      if (document?.storage_path) {
        // The storage_path should just be the path within the bucket (org_id/filename)
        // No need to strip bucket name since it's already the relative path
        const storagePath = document.storage_path;
        console.log('Deleting from storage with path:', storagePath);
        console.log('User ID:', session.user.id);
        
        const pathInBucket = storagePath.replace('documents/', '');
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([pathInBucket]);
        
        if (storageError) {
          console.error('Failed to delete file from storage:', storageError);
          console.error('Storage error details:', JSON.stringify(storageError, null, 2));
        } else {
          console.log('Successfully deleted from storage');
        }
      }

      console.log('Deleting document_text...');
      const { error: textError } = await supabase
        .from('document_text')
        .delete()
        .eq('document_id', id);
      
      if (textError) {
        console.warn('Failed to delete document_text:', textError);
      } else {
        console.log('Successfully deleted document_text');
      }

      console.log('Deleting document_vectors...');
      const { error: vectorsError } = await supabase
        .from('document_vectors')
        .delete()
        .eq('document_id', id);
      
      if (vectorsError) {
        console.warn('Failed to delete document_vectors:', vectorsError);
      } else {
        console.log('Successfully deleted document_vectors');
      }

      console.log('Deleting processing_jobs...');
      const { error: jobsError } = await supabase
        .from('processing_jobs')
        .delete()
        .eq('document_id', id);
      
      if (jobsError) {
        console.warn('Failed to delete processing_jobs:', jobsError);
      } else {
        console.log('Successfully deleted processing_jobs');
      }

      console.log('Deleting documents record...');
      const { error } = await supabase
        .from('documents' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Failed to delete document record:', error);
        throw error;
      }

      console.log('Successfully deleted document record');

      toast({
        title: "Document deleted",
        description: "The document and all related data have been removed.",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      
      fetchDocuments();
      
      toast({
        title: "Delete failed",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRename = async () => {
    if (!selectedDocument || !newFilename.trim()) return;

    try {
      const { error } = await supabase
        .from('documents' as any)
        .update({ filename: newFilename.trim() })
        .eq('id', selectedDocument.id)
        .eq('user_id', session?.user?.id as string);

      if (error) throw error;

      toast({
        title: "Document renamed",
        description: "The document has been successfully renamed.",
      });

      setRenameDialogOpen(false);
      setSelectedDocument(null);
      setNewFilename('');
    } catch (error) {
      console.error('Error renaming document:', error);
      toast({
        title: "Rename failed",
        description: "Failed to rename the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openRenameDialog = (document: Document) => {
    setSelectedDocument(document);
    setNewFilename(document.filename);
    setRenameDialogOpen(true);
  };

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-accent text-accent-foreground">Ready</Badge>;
      case 'uploaded':
        return <Badge variant="outline">Uploaded</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'queued':
        return <Badge variant="outline">Queued</Badge>;
      case 'awaiting_credit':
        return <Badge variant="secondary">Awaiting Credit</Badge>;
      case 'failed':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeColor = (type: Document['type']) => {
    switch (type) {
      case 'Payer Contract':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Network Agreement':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Government Contract':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Policy Document':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <SubscriptionGate feature="document management">
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border">
          {/* Title and Description Section */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2">Document Library</h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Upload and manage your healthcare contracts and agreements
            </p>
          </div>

          {/* Action Buttons Section */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Button 
              variant="outline" 
              onClick={fetchDocuments} 
              disabled={loading}
              className="w-full sm:w-auto justify-center sm:justify-start"
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading}
              className="w-full sm:w-auto justify-center sm:justify-start"
            >
              <Upload size={16} className="mr-2" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
          
          {/* Search Section */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

      {/* Document Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <RefreshCw size={48} className="mx-auto text-muted-foreground animate-spin" />
              <p className="text-muted-foreground">Loading documents...</p>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <FileText size={64} className="text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-medium">
                {searchQuery ? 'No documents found' : 'No documents uploaded'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Upload your first contract to get started'
                }
              </p>
            </div>
            {!searchQuery && (
              <Button onClick={handleUpload} disabled={uploading}>
                <Upload size={16} className="mr-2" />
                {uploading ? 'Uploading...' : 'Upload Your First Document'}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredDocuments.map((document) => (
              <Card key={document.id} className="hover:shadow-medium transition-shadow">
                <CardHeader className="pb-3 px-4 sm:px-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-muted-foreground" />
                      {getStatusBadge(document.status)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem>
                           <Download size={16} className="mr-2" />
                           Download
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => openRenameDialog(document)}>
                           <Edit3 size={16} className="mr-2" />
                           Rename
                         </DropdownMenuItem>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <DropdownMenuItem 
                               className="text-destructive"
                               onSelect={(e) => e.preventDefault()}
                             >
                               <Trash2 size={16} className="mr-2" />
                               Delete
                             </DropdownMenuItem>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Delete Document</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Are you sure you want to delete "{document.filename}"? This will permanently remove the document and all related data including OCR text, embeddings, and processing history. This action cannot be undone.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction 
                                 onClick={() => handleDelete(document.id)}
                                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                               >
                                 Delete
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-sm sm:text-base line-clamp-2 leading-tight">
                    {document.filename}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
                  <Badge 
                    variant="secondary" 
                    className={`${getTypeColor(document.type)} text-xs sm:text-sm`}
                  >
                    {document.type}
                  </Badge>
                  
                  <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <FileType size={14} />
                      <span>{document.size}</span>
                      {document.pages && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{document.pages} pages</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} />
                      <span>{document.uploadDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {document.status === 'failed' ? (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      {retryingDocuments.has(document.id) ? (
                        <div className="flex-1 space-y-2">
                          <ProgressPill 
                            progress={processingProgress[document.id] || 0} 
                            isComplete={processingProgress[document.id] === 100}
                            stage={processingJobs[document.id]?.[0]?.stage}
                          />
                          <div className="text-xs text-center text-muted-foreground">
                            {processingProgress[document.id] === 100 ? 'Retry complete!' : `Retrying: ${processingJobs[document.id]?.[0]?.stage || 'Starting...'}`}
                          </div>
                        </div>
                      ) : (
                        <Button 
                          className="w-full sm:flex-1" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRetryProcessing(document)}
                        >
                          <RotateCcw size={14} className="mr-2" />
                          Retry
                        </Button>
                      )}
                    </div>
                  ) : document.status === 'uploaded' ? (
                    processingDocuments.has(document.id) ? (
                      <div className="space-y-2">
                        <ProgressPill 
                          progress={processingProgress[document.id] || 0} 
                          isComplete={processingProgress[document.id] === 100}
                          stage={processingJobs[document.id]?.[0]?.stage}
                        />
                        <div className="text-xs text-center text-muted-foreground">
                          {processingProgress[document.id] === 100 ? 'Processing complete!' : `Processing: ${processingJobs[document.id]?.[0]?.stage || 'Starting...'}`}
                        </div>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleProcess(document)}
                        disabled={retryingDocuments.has(document.id)}
                      >
                        <PlayCircle size={14} className="mr-2" />
                        Process
                      </Button>
                    )
                  ) : document.status === 'completed' ? null : (
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      size="sm"
                      disabled
                    >
                      Processing...
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
       {/* Hidden file input */}
       <input
         ref={fileInputRef}
         type="file"
         accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.tiff"
         onChange={handleFileSelect}
         style={{ display: 'none' }}
       />

       {/* Rename Dialog */}
       <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Rename Document</DialogTitle>
             <DialogDescription>
               Enter a new name for "{selectedDocument?.filename}"
             </DialogDescription>
           </DialogHeader>
           <div className="py-4">
             <Input
               value={newFilename}
               onChange={(e) => setNewFilename(e.target.value)}
               placeholder="Enter new filename"
               onKeyPress={(e) => e.key === 'Enter' && handleRename()}
             />
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
               Cancel
             </Button>
             <Button 
               onClick={handleRename}
               disabled={!newFilename.trim() || newFilename.trim() === selectedDocument?.filename}
             >
               Rename
             </Button>
           </DialogFooter>
         </DialogContent>
          </Dialog>
       </div>
    </SubscriptionGate>
  );
};
