"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const CHUNK_SIZE = 1 * 1024 * 1024; // 5MB

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const uploadChunk = async (chunk, index, totalChunks, fileId, filename) => {
    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("chunkIndex", index);
    formData.append("uploadId", fileId);
    formData.append("fileName", filename);
    formData.append("totalChunks", totalChunks);
    formData.append("description", description);

    await fetch("http://localhost:8080/upload/chunk", {
      method: "POST",
      body: formData,
    });

    setProgress(Math.round(((index + 1) / totalChunks) * 100));
  };

  const generateFileId = (file) => {
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
    setUploading(true);

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
  };

  return (
    <div className="flex flex-col items-center p-4">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="mb-4"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter file description"
        className="mb-4 p-2 border border-gray-300 rounded w-full max-w-md"
        rows={3}
      />
      <Button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "Uploading..." : "Start Upload"}
      </Button>
      {uploading && <Progress value={progress} className="w-full mt-4" />}
    </div>
  );
}
