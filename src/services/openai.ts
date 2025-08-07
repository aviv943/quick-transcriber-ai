import type { TranscriptionRequest, TranscriptionResult, TranscriptionError, SummaryRequest, SummaryData, BatchProgress } from '../types';
import { chunkAudioFile, combineChunkResults, estimateProcessingTime } from '../utils/audioProcessor';
import type { AudioChunk, ChunkingProgress } from '../utils/audioProcessor';

class OpenAIService {
  private readonly baseUrl = 'https://api.openai.com/v1';
  private readonly maxFileSize = 25 * 1024 * 1024; // 25MB
  private readonly supportedFormats = ['mp3', 'mp4', 'm4a', 'wav', 'webm'];

  async transcribeAudio(
    apiKey: string, 
    request: TranscriptionRequest, 
    onBatchProgress?: (progress: BatchProgress) => void
  ): Promise<TranscriptionResult> {
    try {
      if (!apiKey.trim()) {
        throw {
          message: 'API key is required',
          type: 'validation_error',
        } as TranscriptionError;
      }

      if (!request.file) {
        throw {
          message: 'Audio file is required',
          type: 'validation_error',
        } as TranscriptionError;
      }

      // Check if file needs compression
      if (request.file.size > this.maxFileSize) {
        console.log(`🗜️ Using compression for large file: ${request.file.name} (${(request.file.size / 1024 / 1024).toFixed(2)} MB)`);
        return await this.transcribeWithCompression(apiKey, request, onBatchProgress);
      }

      // Single file processing for files under 25MB
      const transcription = await this.transcribeSingleFile(apiKey, request);
      
      return {
        id: crypto.randomUUID(),
        text: transcription,
        audioFileName: request.file.name,
        duration: undefined, // We'll add duration extraction later
        language: request.language,
        createdAt: new Date(),
      };
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw {
          message: 'Network error. Please check your connection.',
          type: 'network_error',
        } as TranscriptionError;
      }

      // Handle validation errors
      if (error instanceof Error && !('type' in error)) {
        throw {
          message: error.message,
          type: 'validation_error',
        } as TranscriptionError;
      }

      // Re-throw TranscriptionError
      throw error;
    }
  }

  getSupportedFormats(): string[] {
    return [...this.supportedFormats];
  }

  getMaxFileSize(): number {
    return this.maxFileSize;
  }

  /**
   * Transcribes a single audio file (under 25MB)
   */
  private async transcribeSingleFile(apiKey: string, request: TranscriptionRequest, chunkInfo?: { index: number, total: number }): Promise<string> {
    // Create form data
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('model', request.model);
    
    if (request.language) {
      formData.append('language', request.language);
    }
    
    if (request.temperature !== undefined) {
      formData.append('temperature', request.temperature.toString());
    }
    
    if (request.response_format) {
      formData.append('response_format', request.response_format);
    }
    
    // Make API request
    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error(`❌ Transcription API request failed:`, response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: `Transcription failed: ${errorData.error?.message || 'Unknown error'}`,
        type: 'api_error',
        code: errorData.error?.code,
      } as TranscriptionError;
    }

    const data = await response.json();
    const transcriptionText = data.text || '';
    
    return transcriptionText;
  }

  /**
   * Transcribes large audio files by compressing them with FFmpeg
   */
  private async transcribeWithCompression(
    apiKey: string, 
    request: TranscriptionRequest, 
    onBatchProgress?: (progress: BatchProgress) => void
  ): Promise<TranscriptionResult> {
    try {
      console.log(`🗜️ Compressing audio: ${request.file.name} (${(request.file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // Update progress - compression phase
      onBatchProgress?.({
        phase: 'analyzing',
        currentChunk: 0,
        totalChunks: 1,
        progress: 0,
      });

      // Import FFmpeg dynamically
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      
      const ffmpeg = new FFmpeg();
      
      // Simple load without verbose logging
      await ffmpeg.load();
      
      onBatchProgress?.({
        phase: 'processing',
        currentChunk: 0,
        totalChunks: 1,
        progress: 25,
      });

      // Write input file to FFmpeg virtual filesystem
      const inputFileName = `input.${request.file.name.split('.').pop()}`;
      const outputFileName = 'compressed_audio.ogg';
      await ffmpeg.writeFile(inputFileName, await fetchFile(request.file));
      
      onBatchProgress?.({
        phase: 'processing',
        currentChunk: 0,
        totalChunks: 1,
        progress: 50,
      });

      // Run FFmpeg compression command
      console.log(`🔧 [COMPRESS] Running compression: ${inputFileName} -> ${outputFileName}`);
      await ffmpeg.exec([
        '-i', inputFileName,
        '-vn',                    // No video
        '-map_metadata', '-1',    // Remove metadata
        '-ac', '1',               // Mono audio
        '-c:a', 'libopus',        // Opus codec
        '-b:a', '12k',            // 12kbps bitrate
        '-application', 'voip',   // Optimized for voice
        outputFileName
      ]);
      
      console.log(`✅ [COMPRESS] Compression completed successfully`);
      
      onBatchProgress?.({
        phase: 'processing',
        currentChunk: 0,
        totalChunks: 1,
        progress: 75,
      });

      // Read compressed file
      const compressedData = await ffmpeg.readFile(outputFileName);
      const compressedBlob = new Blob([compressedData], { type: 'audio/ogg' });
      const compressedFile = new File([compressedBlob], 'compressed_audio.ogg', { type: 'audio/ogg' });
      
      console.log(`📊 [COMPRESS] Compression results:`, {
        originalSize: `${(request.file.size / 1024 / 1024).toFixed(2)} MB`,
        compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
        compressionRatio: `${((compressedFile.size / request.file.size) * 100).toFixed(1)}%`,
        sizeReduction: `${(((request.file.size - compressedFile.size) / request.file.size) * 100).toFixed(1)}%`
      });
      
      onBatchProgress?.({
        phase: 'combining',
        currentChunk: 1,
        totalChunks: 1,
        progress: 90,
      });

      // Transcribe compressed file
      console.log(`🎵 [COMPRESS] Transcribing compressed file...`);
      const compressedRequest: TranscriptionRequest = {
        ...request,
        file: compressedFile,
      };
      
      const transcription = await this.transcribeSingleFile(apiKey, compressedRequest);
      
      onBatchProgress?.({
        phase: 'combining',
        currentChunk: 1,
        totalChunks: 1,
        progress: 100,
      });
      
      console.log(`🎉 [COMPRESS] Compression and transcription completed successfully!`, {
        originalFile: request.file.name,
        originalSize: `${(request.file.size / 1024 / 1024).toFixed(2)} MB`,
        finalSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
        transcriptionLength: `${transcription.length} characters`
      });
      
      return {
        id: crypto.randomUUID(),
        text: transcription,
        audioFileName: request.file.name, // Keep original name
        duration: undefined,
        language: request.language,
        createdAt: new Date(),
      };
      
    } catch (error) {
      console.error(`❌ [COMPRESS] Compression failed:`, error);
      
      // Fallback to batch processing if compression fails
      console.log(`🔄 [COMPRESS] Falling back to batch processing...`);
      return await this.transcribeAudioInBatches(apiKey, request, onBatchProgress);
    }
  }

  /**
   * Transcribes large audio files by splitting them into chunks
   */
  private async transcribeAudioInBatches(
    apiKey: string, 
    request: TranscriptionRequest, 
    onBatchProgress?: (progress: BatchProgress) => void
  ): Promise<TranscriptionResult> {
    try {
      console.log(`🚀 [BATCH] Starting batch transcription for: ${request.file.name} (${(request.file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // Convert chunking progress to batch progress
      const onChunkingProgress = (chunkProgress: ChunkingProgress) => {
        onBatchProgress?.({
          phase: chunkProgress.phase,
          currentChunk: chunkProgress.currentChunk,
          totalChunks: chunkProgress.totalChunks,
          progress: chunkProgress.progress,
        });
      };

      // Split the audio file into chunks
      console.log(`📂 [BATCH] Phase 1: Chunking file...`);
      const chunks = await chunkAudioFile(request.file, this.maxFileSize, onChunkingProgress);
      
      // Estimate processing time
      const estimatedTime = estimateProcessingTime(chunks);
      console.log(`⏱️ [BATCH] Estimated processing time: ${estimatedTime} seconds for ${chunks.length} chunks`);
      
      // Process each chunk
      console.log(`🎵 [BATCH] Phase 2: Processing ${chunks.length} chunks...`);
      const transcriptions: string[] = [];
      const startTime = Date.now();
      
      onBatchProgress?.({
        phase: 'processing',
        currentChunk: 0,
        totalChunks: chunks.length,
        progress: 0,
        estimatedTimeRemaining: estimatedTime,
      });

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        console.log(`🔄 [BATCH] Processing chunk ${i + 1}/${chunks.length}: ${chunk.file.name}`);
        
        // Create request for this chunk
        const chunkRequest: TranscriptionRequest = {
          ...request,
          file: chunk.file,
        };
        
        // Validate chunk before transcription
        if (chunk.file.size < 1000) { // Skip tiny chunks that are likely invalid
          console.log(`⚠️ [BATCH] Skipping chunk ${i + 1}/${chunks.length}: too small (${chunk.file.size} bytes)`);
          transcriptions.push(''); // Add empty transcription to maintain array alignment
          continue;
        }

        // Transcribe this chunk with error handling
        let transcription = '';
        let chunkSkipped = false;
        
        try {
          transcription = await this.transcribeSingleFile(apiKey, chunkRequest, { index: i, total: chunks.length });
          transcriptions.push(transcription);
        } catch (chunkError: any) {
          console.error(`❌ [BATCH] Chunk ${i + 1}/${chunks.length} failed:`, chunkError);
          
          // If it's a file format error, try to handle gracefully
          if (chunkError.message?.includes('Invalid file format') || chunkError.message?.includes('file format')) {
            console.log(`🔄 [BATCH] Chunk ${i + 1} has invalid format - this is common with binary splitting. Skipping chunk.`);
            transcriptions.push(''); // Add empty transcription
            chunkSkipped = true;
          } else {
            // For other errors, rethrow
            throw chunkError;
          }
        }
        
        // Calculate remaining time
        const elapsed = (Date.now() - startTime) / 1000;
        const avgTimePerChunk = elapsed / (i + 1);
        const remainingChunks = chunks.length - (i + 1);
        const estimatedTimeRemaining = Math.ceil(avgTimePerChunk * remainingChunks);
        
        const statusText = chunkSkipped ? 'skipped (invalid format)' : 'completed';
        console.log(`📊 [BATCH] Chunk ${i + 1}/${chunks.length} ${statusText}. Progress: ${(((i + 1) / chunks.length) * 100).toFixed(1)}%`, {
          elapsed: `${elapsed.toFixed(1)}s`,
          avgTimePerChunk: `${avgTimePerChunk.toFixed(1)}s`,
          remainingTime: `${estimatedTimeRemaining}s`,
          transcriptionLength: chunkSkipped ? '0 chars (skipped)' : `${transcription.length} chars`
        });
        
        // Update progress
        onBatchProgress?.({
          phase: 'processing',
          currentChunk: i + 1,
          totalChunks: chunks.length,
          progress: ((i + 1) / chunks.length) * 100,
          estimatedTimeRemaining,
        });
      }

      // Combine results
      console.log(`🔗 [BATCH] Phase 3: Combining ${transcriptions.length} transcription results...`);
      onBatchProgress?.({
        phase: 'combining',
        currentChunk: chunks.length,
        totalChunks: chunks.length,
        progress: 100,
      });
      
      const combinedText = combineChunkResults(chunks, transcriptions);
      
      const totalProcessingTime = (Date.now() - startTime) / 1000;
      
      console.log(`🎉 [BATCH] Batch transcription completed successfully!`, {
        totalChunks: chunks.length,
        totalProcessingTime: `${totalProcessingTime.toFixed(2)}s`,
        combinedTextLength: `${combinedText.length} characters`,
        avgTimePerChunk: `${(totalProcessingTime / chunks.length).toFixed(2)}s`,
        originalFileSize: `${(request.file.size / 1024 / 1024).toFixed(2)} MB`
      });
      
      return {
        id: crypto.randomUUID(),
        text: combinedText,
        audioFileName: request.file.name,
        duration: undefined, // Total duration from all chunks
        language: request.language,
        createdAt: new Date(),
      };
      
    } catch (error) {
      console.error(`❌ [BATCH] Batch transcription failed:`, error);
      throw {
        message: `Batch transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'api_error',
      } as TranscriptionError;
    }
  }

  private detectContentType(text: string): SummaryData['contentType'] {
    const textLower = text.toLowerCase();
    
    // Check for meeting indicators
    if (textLower.includes('meeting') || textLower.includes('agenda') || textLower.includes('action items') || 
        textLower.includes('minutes') || textLower.includes('discuss') || textLower.includes('decision')) {
      return 'meeting';
    }
    
    // Check for interview indicators
    if (textLower.includes('interview') || textLower.includes('question') || textLower.includes('answer') ||
        textLower.includes('tell me about') || textLower.includes('experience')) {
      return 'interview';
    }
    
    // Check for lecture indicators
    if (textLower.includes('lecture') || textLower.includes('lesson') || textLower.includes('course') ||
        textLower.includes('chapter') || textLower.includes('today we will learn')) {
      return 'lecture';
    }
    
    // Check for song indicators
    if (textLower.includes('verse') || textLower.includes('chorus') || textLower.includes('bridge') ||
        textLower.includes('lyrics') || textLower.match(/\b(la|na|oh|yeah|baby)\b/g)) {
      return 'song';
    }
    
    // Check for script indicators
    if (textLower.includes('scene') || textLower.includes('act') || textLower.includes('dialogue') ||
        textLower.includes('character') || textLower.includes('stage direction')) {
      return 'script';
    }
    
    // Default to conversation
    return 'conversation';
  }

  private createSummaryPrompt(text: string, contentType: SummaryData['contentType'], fileName: string, context?: string): string {
    const basePrompt = `You are a senior content strategist and executive summary specialist with expertise in transcription analysis and strategic interpretation. Your task is to create a comprehensive, professional-grade summary that goes beyond surface-level content to provide deep insights, contextual understanding, and strategic implications.

**AUDIO FILE:** ${fileName}
**DETECTED CONTENT TYPE:** ${contentType}
**ANALYSIS SCOPE:** Deep contextual analysis with strategic insights and implicit understanding
${context ? `\n**ADDITIONAL CONTEXT PROVIDED BY USER:**\n"${context}"\n\n**IMPORTANT:** Use this context to enhance your understanding and provide more accurate, relevant insights. The user has provided this background information to help you better interpret the recording.` : ''}

**TRANSCRIBED CONTENT:**
"${text}"

**ANALYTICAL APPROACH:**
You are not just summarizing what was explicitly said - you are providing intelligent analysis as an experienced business strategist who understands context, subtext, and strategic implications. Your insights should include:

🧠 **READ BETWEEN THE LINES:** Identify unspoken concerns, motivations, and context
🔍 **INFER IMPLICATIONS:** What strategic consequences follow from these discussions?
💡 **CONNECT DOTS:** Link seemingly separate topics to reveal broader patterns
🎯 **STRATEGIC THINKING:** What should stakeholders be thinking about that wasn't explicitly discussed?
⚠️ **RISK AWARENESS:** Identify potential risks or opportunities hinted at but not stated
🔮 **FUTURE CONSIDERATIONS:** What logical next steps or considerations emerge from this context?

**RESPONSE FORMAT (JSON):**
{
  "contentType": "${contentType}",
  "englishTitle": "Concise, descriptive title summarizing the main topic/purpose in English",
  "hebrewTitle": "כותרת תמציתית ומתארת הסוכמת את הנושא/מטרה העיקריים בעברית",
  "englishSummary": "Comprehensive 3-4 paragraph summary in English with contextual insights",
  "hebrewSummary": "תקציר מקיף בן 3-4 פסקאות בעברית עם תובנות הקשריות",
  "englishKeyPoints": ["5-8 detailed key points in English - mix explicit topics AND important implicit insights"],
  "hebrewKeyPoints": ["5-8 נקודות מפתח מפורטות בעברית - שילוב של נושאים מפורשים ותובנות מרומזות חשובות"],
  "englishInsights": ["4-6 strategic insights combining explicit content + contextual analysis + implications"],
  "hebrewInsights": ["4-6 תובנות אסטרטגיות המשלבות תוכן מפורש + ניתוח הקשרי + השלכות"],
  "englishActionItems": ["Actionable items including both explicit requests AND logical strategic steps"],
  "hebrewActionItems": ["פעולות הכוללות בקשות מפורשות וגם צעדים אסטרטגיים הגיוניים"],
  "englishParticipants": ["Key participants with contextual roles and influence level"],
  "hebrewParticipants": ["משתתפים מרכזיים עם תפקידים הקשריים ורמת השפעה"],
  "englishTimeline": "Duration/timeline with strategic timing implications",
  "hebrewTimeline": "משך זמן/ציר זמן עם השלכות אסטרטגיות של תזמון",
  "priority": "high|medium|low based on explicit urgency + contextual strategic importance"
}

**FORMATTING REQUIREMENTS:**

**VISUAL ORGANIZATION:**
Create summaries that are visually organized, scannable, and executive-friendly using:
- Emoji section headers (⚙️, 🧮, 📅, 🎯, ✍️, etc.)
- Visual separators between sections: ⸻
- Bullet points with proper indentation
- Clear hierarchical structure (main topics → subtopics → details)
- Clean spacing and professional layout

**STRUCTURE TEMPLATE:**
Use this exact format structure for all summaries:

⚙️ Technical Topics

1. System Integration Requirements
	• Need for bidirectional communication between internal and external systems
	• Each side must maintain state awareness of trading activities
	• Critical for PDT compliance and user account management

2. Architecture Considerations  
	• Event-driven approach preferred over polling for efficiency
	• Technologies under consideration: Event Hub, RabbitMQ, Kafka
	• Focus on scalability and reduced system overhead

⸻

🧮 Business Logic & Compliance

1. Trading Restrictions Management
	• 30-day account lockout after PDT breach
	• Coordination between blocking mechanisms (open vs close positions)
	• Automated and manual release protocols

⸻

✍️ Recommendations
• Implement event-driven synchronization architecture
• Establish clear data contracts for message formats
• Coordinate business logic alignment with external partners

**SECTION GUIDELINES BY CONTENT TYPE:**

**MEETING:**
- ⚙️ Technical/Operational Topics
- 🧮 Business Logic/Decisions  
- 📅 Timeline & Actions
- 🧩 Open Issues
- ✍️ Recommendations

**INTERVIEW:**
- 👤 Candidate Profile
- 💼 Technical Assessment
- 🎯 Cultural Fit
- ⚠️ Concerns/Red Flags
- ✍️ Hiring Recommendation

**CONVERSATION/CALL:**
- 🎯 Core Discussion Topics
- 💡 Key Insights
- 📋 Agreements/Decisions
- ⚠️ Challenges/Concerns
- ✍️ Next Steps

**OTHER CONTENT:**
Adapt sections appropriately while maintaining visual organization and executive focus.

**ENHANCED INSIGHT GUIDELINES:**

**KEY POINTS should include:**
• Explicit topics discussed (what was clearly stated)
• Implicit themes (what was suggested or implied)
• Contextual patterns (recurring themes, concerns, priorities)
• Strategic connections (how topics relate to broader business goals)

**STRATEGIC INSIGHTS should provide:**
• Analysis of underlying motivations and concerns
• Business implications that weren't explicitly discussed
• Risk factors or opportunities implied by the conversation
• Strategic recommendations based on contextual understanding
• Market/competitive considerations suggested by the discussion
• Resource or timeline implications that emerge from context

**ACTION ITEMS should encompass:**
• Explicitly requested actions from the conversation
• Logical next steps that follow from the discussion
• Strategic actions that should be considered given the context
• Risk mitigation steps implied by concerns raised
• Follow-up items that weren't stated but are strategically important

**QUALITY STANDARDS:**
1. **Executive Scannable:** Busy executives can find key info in seconds
2. **Visual Hierarchy:** Clear organization with emojis and separators
3. **Action-Oriented:** Focus on decisions, next steps, and outcomes
4. **Professional Layout:** Clean, structured, business-appropriate formatting
5. **Comprehensive Detail:** Include technical specifics within organized structure
6. **Strategic Focus:** Emphasize business implications and strategic decisions
7. **Analytical Depth:** Go beyond surface content to provide meaningful business intelligence
8. **Contextual Awareness:** Understand the broader business context and implications

**TITLE REQUIREMENTS:**
- Create concise, specific titles that capture the main purpose/topic of the content
- For meetings: Focus on the core business objective or decision topic
- For interviews: Include role/position and key assessment outcome  
- For conversations: Highlight the primary subject matter discussed
- Examples: "PDT Synchronization Architecture Planning", "Senior Developer Interview Assessment", "Q3 Budget Review Session"

**ANALYTICAL EXAMPLES:**

**Example - Reading Between the Lines:**
If someone says "We'll need to think about this more" → Insight: "Indicates hesitation or concerns not explicitly stated - likely budget, timeline, or stakeholder alignment issues"

**Example - Strategic Implications:**
If discussing a technical change → Add insight: "This technical shift may require additional training resources and could impact Q4 delivery timelines"

**Example - Contextual Action Items:**
Explicit: "Send the report to John"
Analytical addition: "Establish follow-up timeline for John's feedback and decision timeline to avoid project delays"

**CRITICAL FORMATTING RULES:**
1. Each summary MUST be visually organized with emojis, separators (⸻), proper indentation, and clear section breaks
2. Avoid dense paragraph blocks - use structured, scannable formatting that executives can quickly navigate
3. Hebrew summaries must maintain the SAME visual organization as English (emojis, separators, bullet points)
4. Use tabs for indentation under numbered items, bullets (•) for sub-points
5. Include 3-5 main sections with clear emoji headers
6. Always end with ✍️ Recommendations/המלצות section

EXAMPLE OUTPUT STRUCTURE:
- Main summary paragraph with contextual insights
- Multiple emoji sections with numbered topics and bullet sub-points (mixing explicit + analytical insights)
- Visual separators (⸻) between sections
- Final recommendations section with strategic implications`;

    return basePrompt;
  }

  async generateSummary(apiKey: string, request: SummaryRequest): Promise<SummaryData> {
    try {
      console.log(`🤖 [SUMMARY] Starting AI summary generation for: ${request.audioFileName}`);
      console.log(`📝 [SUMMARY] Input validation:`, {
        hasApiKey: !!apiKey?.trim(),
        textLength: `${request.text.length} characters`,
        language: request.language || 'auto-detect'
      });
      
      if (!apiKey.trim()) {
        console.error(`❌ [SUMMARY] API key validation failed`);
        throw {
          message: 'API key is required',
          type: 'validation_error',
        } as TranscriptionError;
      }

      if (!request.text.trim()) {
        console.error(`❌ [SUMMARY] Text validation failed - empty text provided`);
        throw {
          message: 'Text is required for summary generation',
          type: 'validation_error',
        } as TranscriptionError;
      }

      // Detect content type
      console.log(`🔍 [SUMMARY] Analyzing content type...`);
      const contentType = this.detectContentType(request.text);
      console.log(`✅ [SUMMARY] Content type detected: ${contentType}`);
      
      // Create prompt
      console.log(`📋 [SUMMARY] Creating structured prompt for GPT-4.1...`);
      const prompt = this.createSummaryPrompt(request.text, contentType, request.audioFileName, request.context);

      // Make API request to GPT
      console.log(`📡 [SUMMARY] Sending request to OpenAI GPT-4.1...`, {
        model: 'gpt-4.1',
        maxTokens: 4500,
        temperature: 0.8,
        promptLength: `${prompt.length} characters`
      });
      
      const startTime = Date.now();
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: 'You are a senior content strategist and executive summary specialist with deep analytical capabilities. Your role is to provide intelligent business analysis that goes beyond surface-level summarization. Read between the lines, infer strategic implications, identify unspoken concerns, and provide contextual insights that busy executives need but might not have explicitly discussed. Create visually organized, scannable summaries using emojis, separators (⸻), and structured formatting. Always respond in valid JSON format with strategic, actionable insights that include both explicit content and your analytical interpretation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4500,
          temperature: 0.8,
        }),
      });

      const apiDuration = Date.now() - startTime;
      
      if (!response.ok) {
        console.error(`❌ [SUMMARY] OpenAI API request failed:`, response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: `Summary generation failed: ${errorData.error?.message || 'Unknown error'}`,
          type: 'api_error',
        } as TranscriptionError;
      }

      console.log(`✅ [SUMMARY] OpenAI API response received`, {
        duration: `${(apiDuration / 1000).toFixed(2)}s`,
        status: response.status
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        console.error(`❌ [SUMMARY] No content in API response`);
        throw {
          message: 'No summary content received from API',
          type: 'api_error',
        } as TranscriptionError;
      }

      console.log(`📄 [SUMMARY] API response content received`, {
        contentLength: `${content.length} characters`,
        contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
      });

      // Parse JSON response
      console.log(`🔧 [SUMMARY] Parsing JSON response...`);
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
        console.log(`✅ [SUMMARY] JSON parsing successful`, {
          hasEnglishTitle: !!parsedContent.englishTitle,
          hasHebrewTitle: !!parsedContent.hebrewTitle,
          contentType: parsedContent.contentType,
          priority: parsedContent.priority,
          keyPointsCount: Array.isArray(parsedContent.englishKeyPoints) ? parsedContent.englishKeyPoints.length : 0
        });
      } catch (parseError) {
        console.error(`❌ [SUMMARY] JSON parsing failed:`, parseError);
        console.log(`🔍 [SUMMARY] Raw content that failed to parse:`, content);
        throw {
          message: 'Invalid JSON response from summary API',
          type: 'api_error',
        } as TranscriptionError;
      }

      // Create summary data with language-specific fields
      console.log(`🏗️ [SUMMARY] Building SummaryData object...`);
      const summaryData: SummaryData = {
        englishTitle: parsedContent.englishTitle || undefined,
        hebrewTitle: parsedContent.hebrewTitle || undefined,
        english: parsedContent.englishSummary || 'Summary not available',
        hebrew: parsedContent.hebrewSummary || 'תקציר לא זמין',
        contentType: parsedContent.contentType || contentType,
        keyPoints: Array.isArray(parsedContent.englishKeyPoints) ? parsedContent.englishKeyPoints : [],
        hebrewKeyPoints: Array.isArray(parsedContent.hebrewKeyPoints) ? parsedContent.hebrewKeyPoints : [],
        insights: Array.isArray(parsedContent.englishInsights) ? parsedContent.englishInsights : undefined,
        hebrewInsights: Array.isArray(parsedContent.hebrewInsights) ? parsedContent.hebrewInsights : undefined,
        actionItems: Array.isArray(parsedContent.englishActionItems) ? parsedContent.englishActionItems : undefined,
        hebrewActionItems: Array.isArray(parsedContent.hebrewActionItems) ? parsedContent.hebrewActionItems : undefined,
        participants: Array.isArray(parsedContent.englishParticipants) ? parsedContent.englishParticipants : undefined,
        hebrewParticipants: Array.isArray(parsedContent.hebrewParticipants) ? parsedContent.hebrewParticipants : undefined,
        timeline: parsedContent.englishTimeline || undefined,
        hebrewTimeline: parsedContent.hebrewTimeline || undefined,
        priority: parsedContent.priority || undefined,
        createdAt: new Date(),
      };
      
      const totalTime = Date.now() - startTime;
      console.log(`🎉 [SUMMARY] Summary generation completed successfully!`, {
        totalDuration: `${(totalTime / 1000).toFixed(2)}s`,
        fileName: request.audioFileName,
        contentType: summaryData.contentType,
        priority: summaryData.priority,
        hasEnglishTitle: !!summaryData.englishTitle,
        hasHebrewTitle: !!summaryData.hebrewTitle,
        keyPointsCount: summaryData.keyPoints.length,
        hebrewKeyPointsCount: summaryData.hebrewKeyPoints?.length || 0,
        insightsCount: summaryData.insights?.length || 0,
        actionItemsCount: summaryData.actionItems?.length || 0,
        participantsCount: summaryData.participants?.length || 0,
        hasTimeline: !!summaryData.timeline
      });

      return summaryData;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw {
          message: 'Network error during summary generation. Please check your connection.',
          type: 'network_error',
        } as TranscriptionError;
      }

      // Handle validation errors
      if (error instanceof Error && !('type' in error)) {
        throw {
          message: error.message,
          type: 'validation_error',
        } as TranscriptionError;
      }

      // Re-throw TranscriptionError
      throw error;
    }
  }
}

export const openAIService = new OpenAIService(); 