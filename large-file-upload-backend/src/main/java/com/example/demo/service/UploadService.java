package com.example.demo.service;

import com.example.demo.entity.UploadChunk;
import com.example.demo.repository.UploadChunkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UploadService {

    @Autowired
    private UploadChunkRepository repository;

    public void saveChunk(MultipartFile file, String uploadId, int chunkIndex, long totalChunks, String fileName) throws IOException {
        var existing = repository.findByUploadIdAndChunkIndex(uploadId, chunkIndex);
        if (existing.isPresent() && existing.get().isUploaded()) return;

        // Save to local or AWS S3
        Path uploadDir = Paths.get("/home/james/jimmy-workspace/large-file-upload-backend/src/main/resources/uploads");
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        if(chunkIndex == 4) {
            throw new FileNotFoundException("");
        }

        // Target file path (all chunks go here)
        Path targetFile = uploadDir.resolve(uploadId + "_" + fileName);

        // Append chunk to the target file
        try (OutputStream out = new BufferedOutputStream(
                Files.newOutputStream(targetFile, StandardOpenOption.CREATE, StandardOpenOption.APPEND))) {
            out.write(file.getBytes());
        }

        UploadChunk chunk = new UploadChunk();
        chunk.setUploadId(uploadId);
        chunk.setChunkIndex(chunkIndex);
        chunk.setUploaded(true);
        chunk.setFileName(fileName);
        chunk.setTotalChunks(totalChunks);

        repository.save(chunk);
    }

    public boolean isUploadComplete(String uploadId) {
        List<UploadChunk> chunks = repository.findByUploadId(uploadId);
        if (chunks.isEmpty()) return false;
        long uploadedChunks = chunks.stream().filter(UploadChunk::isUploaded).count();
        return uploadedChunks == chunks.get(0).getTotalChunks();
    }

    public List<Integer> getPendingChunkIndexes(String uploadId) {
        List<UploadChunk> chunks = repository.findByUploadId(uploadId);
        if (chunks.isEmpty()) {
            return Collections.emptyList(); // or throw 404 if uploadId is invalid
        }

        long totalChunks = chunks.get(0).getTotalChunks();

        // Set of uploaded indexes
        Set<Integer> uploadedIndexes = chunks.stream()
                .filter(UploadChunk::isUploaded)
                .map(UploadChunk::getChunkIndex)
                .collect(Collectors.toSet());

        // Collect all missing indexes
        List<Integer> pending = new ArrayList<>();
        for (int i = 0; i < totalChunks; i++) {
            if (!uploadedIndexes.contains(i)) {
                pending.add(i);
            }
        }

        return pending;
    }
}
