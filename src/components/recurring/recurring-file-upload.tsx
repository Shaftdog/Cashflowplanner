'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RecurringFileUploadProps {
    onProcessFile: (content: string, imageDataUrl?: string) => Promise<void>;
}

export default function RecurringFileUpload({ onProcessFile }: RecurringFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(30);

    if (file.type.startsWith('image/')) {
      // Read image as data URL for Gemini vision API
      console.log('[DEBUG RecurringFileUpload] Processing image file:', file.name, file.type);
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if(event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(30 + (percent * 0.6)); // Scale progress to 30-90% range
        }
      };
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        console.log('[DEBUG RecurringFileUpload] Image loaded as data URL, length:', dataUrl.length);
        // Send both filename as text and image data
        await onProcessFile(`Image: ${file.name}`, dataUrl);
        setProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setProgress(0);
        }, 500);
      };
      reader.onerror = () => {
        console.error("[DEBUG RecurringFileUpload] Failed to read image file");
        setIsUploading(false);
        setProgress(0);
      };
      reader.readAsDataURL(file);
    } else {
      // Read text-based files
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if(event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(30 + (percent * 0.6)); // Scale progress to 30-90% range
        }
      };
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        await onProcessFile(text);
        setProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setProgress(0);
        }, 500);
      };
      reader.onerror = () => {
        console.error("Failed to read file");
        setIsUploading(false);
        setProgress(0);
      };
      reader.readAsText(file);
    }
  }, [onProcessFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    }
   });

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      <Upload className="h-10 w-10 text-muted-foreground" />
      <p className="mt-4 text-center text-muted-foreground">
        {isDragActive ? 'Drop the files here...' : 'Drop files here or click to upload'}
      </p>
      <p className="text-xs text-muted-foreground/80">PDF, TXT, DOC, JPG, PNG supported</p>
       {isUploading && <Progress value={progress} className="w-full mt-4 h-2" />}
    </div>
  );
}

