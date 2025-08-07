# 🎙️ Quick Transcriber AI

A powerful, AI-driven audio transcription application that converts speech to text and generates intelligent summaries with strategic insights. Built with React, TypeScript, and OpenAI's Whisper API.

![Quick Transcriber AI](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=flat-square&logo=typescript)
![OpenAI](https://img.shields.io/badge/OpenAI-Whisper%20%26%20GPT--4.1-green?style=flat-square&logo=openai)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-blue?style=flat-square&logo=tailwindcss)

## ✨ Key Features

### 🎵 **Advanced Audio Processing**
- **Multi-format Support**: MP3, MP4, M4A, WAV, WebM
- **Large File Handling**: Automatic compression using FFmpeg for files >25MB
- **Batch Processing**: Intelligent chunking for very large files
- **Real-time Progress**: Detailed progress tracking with phase indicators

### 🤖 **AI-Powered Intelligence**
- **High-Quality Transcription**: OpenAI Whisper integration
- **Strategic Summaries**: GPT-4.1 powered analysis with business insights
- **Content Type Detection**: Automatic categorization (meetings, interviews, lectures, etc.)
- **Multi-language Support**: English and Hebrew summaries
- **Context-Aware Analysis**: User-provided context enhances AI understanding

### 🎯 **Executive-Ready Outputs**
- **Visual Organization**: Emoji headers, separators, structured formatting
- **Strategic Insights**: Goes beyond surface-level content to provide business intelligence
- **Action Items**: Both explicit requests and inferred strategic steps
- **Risk Analysis**: Identifies potential concerns and opportunities
- **Participant Tracking**: Key stakeholders and influence levels

### 💾 **Persistent Storage**
- **Local Storage**: All transcriptions and settings saved locally
- **Session Persistence**: Resume work across browser sessions
- **Export Ready**: Easy access to all transcription data

### 🎨 **Modern UI/UX**
- **Professional Design**: Clean, executive-friendly interface
- **Responsive Layout**: Works on desktop and mobile devices
- **Dark/Light Theme**: Adaptive theming support
- **Sidebar Navigation**: Easy access to all transcriptions
- **Real-time Updates**: Live progress indicators and status updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- OpenAI API key with access to Whisper and GPT-4.1

### Installation

```bash
# Clone the repository
git clone https://github.com/aviv943/quick-transcriber-ai.git
cd quick-transcriber-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

1. **Get OpenAI API Key**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key with access to Whisper and GPT-4.1

2. **Configure the Application**
   - Open the app in your browser
   - Click the settings icon in the sidebar
   - Enter your OpenAI API key
   - Save settings

## 🏗️ Architecture Overview

### **Frontend Stack**
- **React 19.1.0** - Modern React with latest features
- **TypeScript 5.8.3** - Type safety and developer experience
- **Vite 7.0.4** - Fast build tool and development server
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI primitives

### **Core Services**
- **OpenAI Integration** - Whisper (transcription) + GPT-4.1 (summaries)
- **FFmpeg.wasm** - Client-side audio processing and compression
- **Local Storage** - Persistent data storage

### **Key Components**

```
src/
├── components/
│   ├── AudioUploader/          # Drag & drop file upload
│   ├── Layout/                 # Application shell and navigation
│   ├── Settings/               # API key configuration
│   ├── Summary/                # AI-generated summary display
│   ├── TranscriptionResult/    # Transcription viewer and editor
│   └── ui/                     # Reusable UI components (Radix-based)
├── hooks/
│   ├── useTranscription.ts     # Transcription state management
│   └── useSettings.ts          # Settings and configuration
├── services/
│   └── openai.ts              # OpenAI API integration
├── utils/
│   ├── audioProcessor.ts       # Audio chunking and processing
│   ├── storage.ts             # Local storage management
│   └── file.ts                # File validation and utilities
└── types/
    └── index.ts               # TypeScript type definitions
```

## 🎯 Usage Guide

### **1. Upload Audio File**
- Drag and drop or click to browse
- Supports files up to any size (automatic compression for large files)
- Real-time file validation and preview

### **2. Add Context (Optional)**
- Provide background information about the recording
- Helps AI generate more accurate and relevant summaries
- Examples: "Client meeting about mobile app requirements"

### **3. Transcription Process**
- **Phase 1**: File analysis and preparation
- **Phase 2**: Audio processing (compression if needed)
- **Phase 3**: Whisper API transcription
- **Phase 4**: GPT-4.1 summary generation

### **4. Review Results**
- **Transcription**: Full text with confidence indicators
- **Summary**: Executive-ready analysis with strategic insights
- **Action Items**: Both explicit and inferred next steps
- **Key Points**: Important topics and implicit themes

### **5. Manage Transcriptions**
- Browse all transcriptions in the sidebar
- Delete individual results or clear all
- Export data for external use

## 🔧 Advanced Features

### **Large File Processing**
The application handles files of any size through intelligent processing:

1. **Compression First** (files >25MB)
   - Uses FFmpeg to compress audio while maintaining quality
   - Opus codec optimized for voice
   - Reduces file size by ~90% typically

2. **Fallback Chunking** (if compression fails)
   - Splits large files into processable chunks
   - Processes chunks in parallel
   - Intelligently combines results

### **AI Summary Intelligence**
The GPT-4.1 integration provides sophisticated analysis:

- **Content Type Detection**: Automatically categorizes content
- **Strategic Analysis**: Identifies business implications and risks
- **Multi-language Output**: English and Hebrew summaries
- **Visual Organization**: Executive-friendly formatting with emojis and structure
- **Context Integration**: Uses provided context for enhanced accuracy

### **Error Handling**
Robust error handling throughout the application:
- Network connectivity issues
- API rate limiting and quota management
- File format validation
- Graceful degradation for partial failures

## 📊 Technical Specifications

### **Audio Processing**
- **Supported Formats**: MP3, MP4, M4A, WAV, WebM
- **Maximum File Size**: Unlimited (with automatic processing)
- **Compression**: FFmpeg with Opus codec for optimal voice quality
- **Chunking**: Intelligent time-based splitting for batch processing

### **API Integration**
- **Transcription**: OpenAI Whisper (whisper-1 model)
- **Summarization**: OpenAI GPT-4.1 with custom prompts
- **Response Format**: Verbose JSON for detailed metadata
- **Rate Limiting**: Built-in retry logic and error handling

### **Performance**
- **Client-side Processing**: FFmpeg runs entirely in browser
- **Parallel Processing**: Multiple chunks processed simultaneously
- **Progress Tracking**: Real-time updates with time estimates
- **Memory Optimization**: Efficient handling of large audio files

## 🛠️ Development

### **Available Scripts**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### **Environment Setup**
The application requires specific headers for FFmpeg to work:
```javascript
// vite.config.ts
server: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
  },
}
```

### **Key Dependencies**
- **@ffmpeg/ffmpeg**: Client-side audio processing
- **@radix-ui/***: Accessible UI components
- **lucide-react**: Modern icon system
- **tailwind-merge**: Utility for combining Tailwind classes
- **class-variance-authority**: Component variant management

## 🔐 Security & Privacy

- **Local Processing**: All audio processing happens in your browser
- **No Data Upload**: Audio files are never uploaded to our servers
- **API Key Security**: Your OpenAI API key is stored locally only
- **Privacy First**: No tracking or analytics

## 📝 Configuration Options

### **Settings Available**
- **API Key**: Your OpenAI API key (required)
- **Model**: Whisper model selection (whisper-1)
- **Language**: Target language for transcription
- **Temperature**: Creativity level for summaries (0-1)

### **Storage Management**
- All data stored in browser's localStorage
- Settings and transcriptions persist across sessions
- Easy export and import capabilities
- Clear data options available

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/aviv943/quick-transcriber-ai/issues)
- **Documentation**: This README and inline code comments
- **Community**: Discussions tab for questions and feature requests

## 🚧 Roadmap

- [ ] **Multi-speaker Detection**: Identify different speakers in recordings
- [ ] **Export Options**: PDF, Word, and other format exports
- [ ] **Team Collaboration**: Share transcriptions with team members
- [ ] **Integration APIs**: Connect with popular productivity tools
- [ ] **Mobile App**: Native mobile applications
- [ ] **Real-time Transcription**: Live transcription during meetings

---

**Built with ❤️ by [Aviv](https://github.com/aviv943)**

*Transform your audio content into actionable business intelligence with AI-powered transcription and analysis.*