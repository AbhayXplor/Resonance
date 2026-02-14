export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
}

export class AudioProcessor {
  private readonly MIN_SAMPLE_RATE = 16000;
  
  async validateAudioQuality(file: File): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const metadata: AudioMetadata = {
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels,
            format: file.type,
          };
          
          if (metadata.sampleRate < this.MIN_SAMPLE_RATE) {
            reject(new Error(`Audio sample rate must be at least ${this.MIN_SAMPLE_RATE}Hz. Current: ${metadata.sampleRate}Hz`));
            return;
          }
          
          resolve(metadata);
        } catch (error) {
          reject(new Error('Failed to decode audio file'));
        } finally {
          audioContext.close();
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsArrayBuffer(file);
    });
  }
  
  async convertToWav(file: File): Promise<Blob> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const wavBlob = this.audioBufferToWav(audioBuffer);
          resolve(wavBlob);
        } catch (error) {
          reject(new Error('Failed to convert audio to WAV'));
        } finally {
          audioContext.close();
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsArrayBuffer(file);
    });
  }
  
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;
    
    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };
    
    // RIFF identifier
    setUint32(0x46464952);
    // File length
    setUint32(length - 8);
    // RIFF type
    setUint32(0x45564157);
    // Format chunk identifier
    setUint32(0x20746d66);
    // Format chunk length
    setUint32(16);
    // Sample format (raw)
    setUint16(1);
    // Channel count
    setUint16(buffer.numberOfChannels);
    // Sample rate
    setUint32(buffer.sampleRate);
    // Byte rate
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    // Block align
    setUint16(buffer.numberOfChannels * 2);
    // Bits per sample
    setUint16(16);
    // Data chunk identifier
    setUint32(0x61746164);
    // Data chunk length
    setUint32(length - pos - 4);
    
    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
  
  async splitIntoChunks(file: File, chunkDurationSeconds: number = 30): Promise<Blob[]> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const chunks: Blob[] = [];
          const chunkSize = chunkDurationSeconds * audioBuffer.sampleRate;
          const totalChunks = Math.ceil(audioBuffer.length / chunkSize);
          
          for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min((i + 1) * chunkSize, audioBuffer.length);
            const chunkLength = end - start;
            
            const chunkBuffer = audioContext.createBuffer(
              audioBuffer.numberOfChannels,
              chunkLength,
              audioBuffer.sampleRate
            );
            
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
              const channelData = audioBuffer.getChannelData(channel);
              chunkBuffer.copyToChannel(channelData.slice(start, end), channel);
            }
            
            chunks.push(this.audioBufferToWav(chunkBuffer));
          }
          
          resolve(chunks);
        } catch (error) {
          reject(new Error('Failed to split audio into chunks'));
        } finally {
          audioContext.close();
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsArrayBuffer(file);
    });
  }
}

export const audioProcessor = new AudioProcessor();
