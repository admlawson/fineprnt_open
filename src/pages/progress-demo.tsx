import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProcessingProgress } from "@/components/ui/processing-progress";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, RefreshCw, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { functionUrl } from "@/lib/supabaseEndpoints";
export default function ProgressDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const demoOrgId = '550e8400-e29b-41d4-a716-446655440000'; // Demo organization from our seed
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    try {
      setUploading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('org_id', demoOrgId);
      
      // Call the ingest function
      const response = await fetch(
        functionUrl('ingest_upload_metadata'),
        {
          method: 'POST',
          body: formData
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      setDocumentId(data.document_id);
      
      if (data.status === 'duplicate') {
        toast({
          title: "Duplicate Document",
          description: data.metadata?.message || "This document was already uploaded",
          variant: "destructive", // Changed from "warning" to "destructive"
        });
      } else {
        toast({
          title: "Upload Successful",
          description: "Document uploaded and queued for processing",
        });
      }

      // Trigger OCR job after upload
      setProcessing(true);
      await triggerOCRJob();
      
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const triggerOCRJob = async () => {
    try {
      // Require an authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sign-in required",
          description: "Please sign in to trigger OCR processing",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }
      // Call the OCR function
      const response = await fetch(
        functionUrl('ocr_and_annotation'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to trigger OCR job');
      }
      
      // After a delay, trigger the embedding job
      setTimeout(triggerEmbeddingJob, 3000);
      
    } catch (error: any) {
      console.error("OCR job error:", error);
    }
  };

  const triggerEmbeddingJob = async () => {
    try {
      // Require an authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sign-in required",
          description: "Please sign in to trigger embedding",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }
      // Call the embedding function
      const response = await fetch(
        functionUrl('chunk_and_embed'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to trigger embedding job');
      }
      
    } catch (error: any) {
      console.error("Embedding job error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setDocumentId(null);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Document Processing Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Upload a healthcare contract or document to process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                {file ? (
                  <div className="space-y-2">
                    <FileText className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="text-sm font-medium">Drag and drop or click to upload</p>
                    <p className="text-xs text-gray-500">
                      PDF, DOCX, JPEG, PNG (Max 50MB)
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  disabled={uploading || !!documentId}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={uploadFile} 
                  disabled={!file || uploading || !!documentId}
                  className="flex-1"
                >
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {uploading ? "Uploading..." : "Upload Document"}
                </Button>
                
                {documentId && (
                  <Button variant="outline" onClick={reset}>
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
            <CardDescription>
              Real-time updates on document processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documentId ? (
              <div className="space-y-6">
                <ProcessingProgress documentId={documentId} showDetails />
                
                {processing && (
                  <div className="flex justify-center">
                    <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Upload a document to track processing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}