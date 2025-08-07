export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
};

export const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const isAudioFile = (file: File): boolean => {
  const audioTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/webm',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/aac',
    'audio/ogg',
    'audio/flac',
  ];
  
  const audioExtensions = [
    'mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'wma', 'webm', 'mp4'
  ];
  
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isMimeTypeAudio = audioTypes.includes(file.type) || file.type.startsWith('audio/');
  const isExtensionAudio = extension ? audioExtensions.includes(extension) : false;
  
  return isMimeTypeAudio || isExtensionAudio;
};

export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    const cleanup = () => {
      URL.revokeObjectURL(url);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
    };
    
    const onLoadedMetadata = () => {
      cleanup();
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        resolve(audio.duration);
      } else {
        reject(new Error('Invalid audio duration'));
      }
    };
    
    const onError = () => {
      cleanup();
      reject(new Error('Failed to load audio metadata'));
    };
    
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);
    
    // Set timeout to prevent hanging
    setTimeout(() => {
      cleanup();
      reject(new Error('Timeout loading audio metadata'));
    }, 3000);
    
    audio.src = url;
  });
};

export const downloadText = (text: string, filename: string): void => {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}; 