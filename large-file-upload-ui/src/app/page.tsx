"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const CHUNK_SIZE = 1 * 1024 * 1024; // 5MB

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const uploadChunk = async (chunk: Blob, index: number, totalChunks: number, fileId: string, filename: string) => {
    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("chunkIndex", index.toString());
    formData.append("uploadId", fileId);
    formData.append("fileName", filename);
    formData.append("totalChunks", totalChunks.toString());
    formData.append("description", description);

    const response = await fetch("http://localhost:8080/upload/chunk", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    setProgress(Math.round(((index + 1) / totalChunks) * 100));
  };

  const generateFileId = (file: File) => {
    return `${file.name}-${file.size}-${file.lastModified}`;
  };

  const getPendingChunks = async (uploadId: string): Promise<number[]> => {
    try {
      const res = await fetch(`http://localhost:8080/upload/pending-chunks/${uploadId}`);
      const data = await res.json();
      console.log(data);
      return data?.pendingChunks || [];
    } catch (err) {
      console.error("Error fetching pending chunks", err);
      return [];
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    if (!description.trim()) {
      setDescriptionError("Description can not be null");
      return;
    }
    setDescriptionError('');
    
    setUploading(true);

    try {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
       
      const fileId = generateFileId(file);
      let pendingChunks = await getPendingChunks(fileId);
      console.log(pendingChunks);

      if(pendingChunks === undefined || pendingChunks.length === 0) {
        pendingChunks = Array.from({length: totalChunks}, (_, i) => i);
      }

      for (const chunkIndex of pendingChunks) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const filename = file.name;

        await uploadChunk(chunk, chunkIndex, totalChunks, fileId, filename);
      }

      setUploading(false);
      alert("Upload complete!");
    } catch (error) {
      setUploading(false);
      if (error instanceof Error) {
        setDescriptionError(error.message);
      } else {
        setDescriptionError("Upload failed");
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="mb-4"
      />
      <div className="w-full max-w-md">
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (descriptionError) setDescriptionError('');
          }}
          placeholder="Enter file description"
          className="mb-2 p-2 border border-gray-300 rounded w-full"
          rows={3}
        />
        {descriptionError && (
          <p className="text-red-500 text-sm mb-4">{descriptionError}</p>
        )}
      </div>
      <Button onClick={handleUpload} disabled={!file || uploading || !description.trim()}>
        {uploading ? "Uploading..." : "Start Upload"}
      </Button>
      {uploading && <Progress value={progress} className="w-full mt-4" />}
    </div>
  );
}
