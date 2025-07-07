package com.example.demo.controller;

import com.example.demo.service.UploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/upload")
@CrossOrigin(origins = "http://localhost:3000")
public class UploadController {

    @Autowired
    private UploadService service;

    @PostMapping("/chunk")
    public ResponseEntity<?> uploadChunk(
            @RequestParam("file") MultipartFile file,
            @RequestParam("uploadId") String uploadId,
            @RequestParam("chunkIndex") int chunkIndex,
            @RequestParam("totalChunks") long totalChunks,
            @RequestParam("fileName") String fileName
    ) {
        try {
            service.saveChunk(file, uploadId, chunkIndex, totalChunks, fileName);
            return ResponseEntity.ok("Chunk uploaded");
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed");
        }
    }


    @GetMapping("/status/{uploadId}")

    public ResponseEntity<?> getStatus(@PathVariable String uploadId) {
        boolean complete = service.isUploadComplete(uploadId);

        return ResponseEntity.ok(Map.of("completed", complete));
    }

    @GetMapping("/pending-chunks/{uploadId}")
    public ResponseEntity<?> getPendingChunks(@PathVariable String uploadId) {
        List<Integer> pending = service.getPendingChunkIndexes(uploadId);
        return ResponseEntity.ok(Map.of("uploadId", uploadId, "pendingChunks", pending));
    }
}
