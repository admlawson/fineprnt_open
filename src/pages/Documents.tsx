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
  PlayCircle
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

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const [retryingDocuments, setRetryingDocuments] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, session } = useAuth();
  
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

      // Refresh documents to show updated status
      setTimeout(() => fetchDocuments(), 1000);

    } catch (error) {
      console.error('Error retrying document processing:', error);
      toast({
        title: "Retry failed",
        description: "Failed to restart document processing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRetryingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });
    }
  };

  const handleProcess = async (document: Document) => {
    if (!session) return;
    setRetryingDocuments(prev => new Set(prev).add(document.id));
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
      setTimeout(() => fetchDocuments(), 800);
    } catch (error) {
      console.error('Error starting processing:', error);
      toast({ title: 'Start failed', description: 'Failed to start processing.', variant: 'destructive' });
    } finally {
      setRetryingDocuments(prev => { const ns = new Set(prev); ns.delete(document.id); return ns; });
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold">Document Library</h1>
              <p className="text-muted-foreground">
                Upload and manage your healthcare contracts and agreements
              </p>
            </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={fetchDocuments} disabled={loading}>
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              <Upload size={16} className="mr-2" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Document Grid */}
      <div className="flex-1 overflow-y-auto p-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocuments.map((document) => (
              <Card key={document.id} className="hover:shadow-medium transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-muted-foreground" />
                      {getStatusBadge(document.status)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
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
                  <CardTitle className="text-base line-clamp-2">
                    {document.filename}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge 
                    variant="secondary" 
                    className={getTypeColor(document.type)}
                  >
                    {document.type}
                  </Badge>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <FileType size={14} />
                      <span>{document.size}</span>
                      {document.pages && (
                        <>
                          <span>•</span>
                          <span>{document.pages} pages</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} />
                      <span>{document.uploadDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {document.status === 'failed' ? (
                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRetryProcessing(document)}
                        disabled={retryingDocuments.has(document.id)}
                      >
                        {retryingDocuments.has(document.id) ? (
                          <>
                            <RefreshCw size={14} className="mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RotateCcw size={14} className="mr-2" />
                            Retry
                          </>
                        )}
                      </Button>
                    </div>
                  ) : document.status === 'uploaded' ? (
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleProcess(document)}
                      disabled={retryingDocuments.has(document.id)}
                    >
                      {retryingDocuments.has(document.id) ? (
                        <>
                          <RefreshCw size={14} className="mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <PlayCircle size={14} className="mr-2" />
                          Process
                        </>
                      )}
                    </Button>
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
