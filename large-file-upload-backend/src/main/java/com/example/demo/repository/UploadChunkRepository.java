package com.example.demo.repository;

import com.example.demo.entity.UploadChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UploadChunkRepository extends JpaRepository<UploadChunk, Long> {
    List<UploadChunk> findByUploadId(String uploadId);
    Optional<UploadChunk> findByUploadIdAndChunkIndex(String uploadId, int chunkIndex);
}
