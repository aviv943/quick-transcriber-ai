export interface AudioChunk {
  file: File;
  index: number;
  startTime: number;
  duration: number;
}

export interface ChunkingProgress {
  phase: 'analyzing' | 'chunking' | 'processing' | 'combining';
  currentChunk: number;
  totalChunks: number;
  progress: number; // 0-100
}

/**
 * Gets the duration of an audio file using the Web Audio API
 */
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio metadata'));
    };
    
    audio.src = url;
  });
}

/**
 * Splits an audio file into chunks using FFmpeg-wasm or Web Audio API
 * For now, we'll use a simpler approach by splitting the file into time-based chunks
 */
export async function chunkAudioFile(
  file: File, 
  maxChunkSize: number = 25 * 1024 * 1024, // 25MB
  onProgress?: (progress: ChunkingProgress) => void
): Promise<AudioChunk[]> {
  try {
    console.log(`🔍 [CHUNKING] Started analyzing large file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    onProgress?.({ phase: 'analyzing', currentChunk: 0, totalChunks: 0, progress: 0 });
    
    // Get audio duration
    console.log(`⏱️ [CHUNKING] Extracting audio duration...`);
    const duration = await getAudioDuration(file);
    console.log(`✅ [CHUNKING] Audio duration extracted: ${duration.toFixed(2)} seconds`);
    
    // Estimate chunks needed based on file size and target chunk size
    const estimatedChunks = Math.ceil(file.size / maxChunkSize);
    const chunkDuration = duration / estimatedChunks;
    
    console.log(`📊 [CHUNKING] File analysis complete:`, {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      duration: `${duration.toFixed(2)}s`,
      estimatedChunks,
      chunkDuration: `${chunkDuration.toFixed(2)}s per chunk`,
      maxChunkSize: `${(maxChunkSize / 1024 / 1024).toFixed(2)} MB`
    });
    
    onProgress?.({ phase: 'chunking', currentChunk: 0, totalChunks: estimatedChunks, progress: 0 });
    
    const chunks: AudioChunk[] = [];
    
    console.log(`✂️ [CHUNKING] Starting file splitting into ${estimatedChunks} chunks...`);
    // For web-based chunking, we'll split the file data directly
    // This is a simplified approach - in production, you'd want proper audio processing
    const chunkSize = Math.floor(file.size / estimatedChunks);
    const buffer = await file.arrayBuffer();
    console.log(`📦 [CHUNKING] File buffer loaded (${buffer.byteLength} bytes)`);
    
    for (let i = 0; i < estimatedChunks; i++) {
      console.log(`📝 [CHUNKING] Creating chunk ${i + 1}/${estimatedChunks}...`);
      
      const start = i * chunkSize;
      const end = i === estimatedChunks - 1 ? buffer.byteLength : (i + 1) * chunkSize;
      
      // Create a new file blob for this chunk
      const chunkBuffer = buffer.slice(start, end);
      const chunkBlob = new Blob([chunkBuffer], { type: file.type });
      
      // Get file extension
      const extension = file.name.split('.').pop() || 'mp3';
      const chunkFileName = `${file.name.replace(/\.[^/.]+$/, '')}_chunk_${i + 1}.${extension}`;
      const chunkFile = new File(
        [chunkBlob], 
        chunkFileName,
        { type: file.type }
      );
      
      const chunk = {
        file: chunkFile,
        index: i,
        startTime: i * chunkDuration,
        duration: chunkDuration
      };
      
      console.log(`✅ [CHUNKING] Chunk ${i + 1} created:`, {
        fileName: chunkFileName,
        size: `${(chunkFile.size / 1024 / 1024).toFixed(2)} MB`,
        startTime: `${chunk.startTime.toFixed(2)}s`,
        duration: `${chunk.duration.toFixed(2)}s`,
        index: chunk.index
      });
      
      chunks.push(chunk);
      
      onProgress?.({ 
        phase: 'chunking', 
        currentChunk: i + 1, 
        totalChunks: estimatedChunks, 
        progress: ((i + 1) / estimatedChunks) * 100 
      });
    }
    
    console.log(`🎉 [CHUNKING] File splitting completed! Created ${chunks.length} chunks`);
    console.log(`📋 [CHUNKING] Chunk summary:`, chunks.map(c => ({
      index: c.index + 1,
      size: `${(c.file.size / 1024 / 1024).toFixed(2)} MB`,
      timeRange: `${c.startTime.toFixed(1)}s - ${(c.startTime + c.duration).toFixed(1)}s`
    })));
    
    return chunks;
    
  } catch (error) {
    console.error('Error chunking audio file:', error);
    throw new Error('Failed to chunk audio file');
  }
}

/**
 * Combines transcription results from multiple chunks
 */
export function combineChunkResults(
  chunks: AudioChunk[], 
  transcriptions: string[]
): string {
  console.log(`🔗 [COMBINE] Starting to combine ${chunks.length} transcription chunks...`);
  
  if (chunks.length !== transcriptions.length) {
    console.error(`❌ [COMBINE] Array length mismatch: ${chunks.length} chunks vs ${transcriptions.length} transcriptions`);
    throw new Error('Chunk and transcription arrays must have the same length');
  }
  
  console.log(`📋 [COMBINE] Input validation passed. Processing chunks:`, transcriptions.map((t, i) => ({
    chunkIndex: chunks[i].index,
    chunkName: chunks[i].file.name,
    textLength: t.length,
    textPreview: t.substring(0, 50) + (t.length > 50 ? '...' : '')
  })));
  
  // Sort by chunk index to ensure proper order
  const sortedResults = chunks
    .map((chunk, index) => ({ chunk, transcription: transcriptions[index] }))
    .sort((a, b) => a.chunk.index - b.chunk.index);
  
  console.log(`🔢 [COMBINE] Chunks sorted by index:`, sortedResults.map(r => ({
    originalIndex: r.chunk.index,
    timeRange: `${r.chunk.startTime.toFixed(1)}s - ${(r.chunk.startTime + r.chunk.duration).toFixed(1)}s`,
    textLength: r.transcription.length
  })));
  
  // Join transcriptions with a space, removing extra whitespace
  const combinedText = sortedResults
    .map(result => result.transcription.trim())
    .filter(text => text.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  console.log(`✅ [COMBINE] Transcription combination completed:`, {
    totalChunks: chunks.length,
    inputTotalLength: transcriptions.reduce((sum, t) => sum + t.length, 0),
    outputTotalLength: combinedText.length,
    emptyChunks: transcriptions.filter(t => t.trim().length === 0).length,
    compressionRatio: `${((combinedText.length / transcriptions.reduce((sum, t) => sum + t.length, 0)) * 100).toFixed(2)}%`
  });
    
  return combinedText;
}

/**
 * Estimates processing time for batch transcription
 */
export function estimateProcessingTime(chunks: AudioChunk[]): number {
  // Rough estimate: 1 minute of audio = 30 seconds processing time
  const totalDuration = chunks.reduce((sum, chunk) => sum + chunk.duration, 0);
  return Math.ceil(totalDuration * 0.5); // 30 seconds per minute of audio
} 