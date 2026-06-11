'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, Cloud } from 'lucide-react';
import PrintFlowHeader from '@/components/PrintFlowHeader';

export default function KioskUpload({ params }: { params: { kioskId: string } }) {
  const router = useRouter();
  const kioskId = params.kioskId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedJob, setUploadedJob] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);

    // Validate file size limit
    const maxSize = 25 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size exceeds the maximum limit of 25MB.');
      setFile(null);
      return;
    }

    // Validate file extension type
    const allowedExtensions = ['pdf', 'docx', 'doc', 'jpg', 'png', 'jpeg'];
    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(fileExt)) {
      setError('Unsupported file type. Please upload a PDF, DOC, DOCX, or Image.');
      setFile(null);
      return;
    }

    setUploading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('kioskId', kioskId);

    // Visual animation steps
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 85) {
          clearInterval(interval);
          return p;
        }
        return p + 15;
      });
    }, 250);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to upload document.');
      }

      const jobData = await res.json();
      setUploadedJob(jobData);
      
      // Keep state in sessionStorage for options/payment steps
      sessionStorage.setItem('printdrop_jobId', jobData.jobId);
      sessionStorage.setItem('printdrop_fileName', jobData.fileName);
      sessionStorage.setItem('printdrop_pageCount', String(jobData.pageCount));
    } catch (err: any) {
      setError(err.message || 'Error occurred during upload.');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const loadDemoFile = async () => {
    // Generate a valid minimal PDF structure for testing
    const minimalPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
190
%%EOF`;
    const blob = new Blob([minimalPdf], { type: 'application/pdf' });
    const demoFile = new File([blob], 'demo_sample_document.pdf', { type: 'application/pdf' });
    processFile(demoFile);
  };

  return (
    <div className="min-h-dvh bg-ink flex flex-col max-w-md mx-auto animate-fade-in">
      <PrintFlowHeader currentStep="upload" />

      <div className="flex-1 p-6 flex flex-col justify-between pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-display font-semibold text-primaryTxt">Upload Document</h2>
            <p className="text-xs text-customSecondary mt-1">Select the document you wish to print</p>
          </div>

          {/* Error alerts */}
          {error && (
            <div className="bg-brandRed/10 border border-brandRed/30 rounded-md p-4 flex gap-3 text-brandRed animate-fade-in">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          {/* Upload box */}
          {!file && !uploading && (
            <div
              onClick={triggerFileInput}
              className="border-2 border-dashed border-customBorder hover:border-brandBlue/55 bg-surface rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors shadow-card min-h-[200px]"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-brandBlue/10 flex items-center justify-center text-brandBlue mb-4">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-sm text-primaryTxt">Tap to upload file</h3>
              <p className="text-xs text-customSecondary mt-1.5 max-w-[200px]">
                Accepts PDF, Word docs, JPG, PNG, and JPEG (Max 25MB)
              </p>
            </div>
          )}

          {/* Progress indicators */}
          {uploading && (
            <div className="border border-customBorder bg-surface rounded-lg p-6 text-center space-y-4 shadow-card">
              <div className="w-12 h-12 rounded-full bg-brandBlue/10 flex items-center justify-center text-brandBlue mx-auto animate-pulse">
                <Upload className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-primaryTxt">Uploading file...</h3>
                <p className="text-xs text-customSecondary mt-1">Extracting page parameters</p>
              </div>
              
              <div className="w-full bg-ink rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brandBlue h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* File item preview */}
          {uploadedJob && !uploading && (
            <div className="border border-customBorder bg-surface rounded-lg p-5 shadow-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brandCyan/10 flex items-center justify-center text-brandCyan">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-primaryTxt truncate">{file?.name || 'demo_sample_document.pdf'}</h4>
                  <p className="text-xs text-customSecondary mt-0.5">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '12.4 KB'}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-brandCyan" />
              </div>

              <div className="bg-ink border border-customBorder/50 rounded-md p-3.5 flex justify-between items-center">
                <span className="text-xs text-customSecondary font-medium">Page Count</span>
                <span className="text-sm font-bold font-display text-brandCyan">
                  {uploadedJob.pageCount} {uploadedJob.pageCount === 1 ? 'page' : 'pages'}
                </span>
              </div>
            </div>
          )}

          {/* Quick test selector */}
          {!file && !uploading && (
            <button
              onClick={loadDemoFile}
              className="w-full py-3 bg-surface hover:bg-elevated border border-customBorder text-customSecondary text-xs rounded-md font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Cloud className="w-4 h-4 text-brandBlue" />
              Use a Demo Document (for quick test)
            </button>
          )}
        </div>

        {/* Action button */}
        <div className="mt-8">
          <button
            onClick={() => router.push(`/print/${kioskId}/options`)}
            disabled={!uploadedJob}
            className={`w-full rounded-md py-4 font-bold flex items-center justify-center gap-2 transition-all ${
              uploadedJob
                ? 'bg-brandBlue hover:bg-brandBlue/90 text-white shadow-glow'
                : 'bg-customBorder text-customMuted cursor-not-allowed'
            }`}
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
