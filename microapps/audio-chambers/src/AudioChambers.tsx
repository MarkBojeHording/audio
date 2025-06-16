import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Loader2, 
  FileText, 
  Headphones,
  AlertCircle,
  Clock,
  Settings
} from 'lucide-react';

interface Voice {
  id: string;
  name: string;
  description: string;
}

const VOICES: Voice[] = [
  { id: 'adam', name: 'Adam', description: 'Deep, resonant male voice' },
  { id: 'antoni', name: 'Antoni', description: 'Well-rounded male voice' },
  { id: 'bella', name: 'Bella', description: 'Warm, engaging female voice' },
  { id: 'elli', name: 'Elli', description: 'Youthful, energetic female voice' },
  { id: 'josh', name: 'Josh', description: 'Clear, professional male voice' },
  { id: 'rachel', name: 'Rachel', description: 'Calm, soothing female voice' },
  { id: 'sam', name: 'Sam', description: 'Friendly, conversational male voice' }
];

const AudioChambers: React.FC = () => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setError('Audio playback error occurred');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const generateAudio = async () => {
    if (!text.trim()) {
      setError('Please enter some text to convert to audio');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This would be your Supabase Edge Function URL
      // Replace with your actual Supabase project URL and function name
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'}`
        },
        body: JSON.stringify({
          text: text.trim(),
          voice_id: selectedVoice
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      // Clean up previous audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioUrl(url);
      
      // Create new audio element
      if (audioRef.current) {
        audioRef.current.src = url;
      } else {
        audioRef.current = new Audio(url);
      }
      
    } catch (err) {
      console.error('Error generating audio:', err);
      setError('Failed to generate audio. Please check your Supabase configuration and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    if (!audioRef.current) {
      generateAudio();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setError('Unable to play audio'));
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTextareaResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(200, textarea.scrollHeight)}px`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-oxford-navy via-blue-900 to-oxford-navy">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Headphones className="w-8 h-8 text-manuscript-gold" />
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white">
              Audio Chambers
            </h1>
          </div>
          <p className="text-lg text-blue-200 font-lora max-w-2xl mx-auto">
            Transform your manuscripts into captivating audiobooks with premium AI voices
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Text Input Section */}
          <div className="lg:col-span-2">
            <div className="text-area-container p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-oxford-navy" />
                <h2 className="text-xl font-playfair font-semibold text-oxford-navy">
                  Your Manuscript
                </h2>
              </div>
              
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  handleTextareaResize();
                }}
                onInput={handleTextareaResize}
                placeholder="Paste or type your manuscript text here. Watch as your words come to life through the power of AI narration..."
                className="w-full min-h-[300px] p-4 border-none outline-none resize-none font-lora text-gray-800 leading-relaxed bg-transparent"
                style={{ fontSize: '16px', lineHeight: '1.6' }}
              />
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600 font-inter">
                  {text.length} characters • {text.split(/\s+/).filter(word => word).length} words
                </span>
                <span className="text-sm text-gray-500 font-inter">
                  Estimated reading time: ~{Math.ceil(text.split(/\s+/).filter(word => word).length / 200)} minutes
                </span>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="space-y-6">
            {/* Voice Selection */}
            <div className="control-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Volume2 className="w-5 h-5 text-oxford-navy" />
                <h3 className="text-lg font-playfair font-semibold text-oxford-navy">
                  Voice Selection
                </h3>
              </div>
              
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg font-inter focus:ring-2 focus:ring-manuscript-gold focus:border-transparent"
              >
                {VOICES.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Playback Controls */}
            <div className="control-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-oxford-navy" />
                <h3 className="text-lg font-playfair font-semibold text-oxford-navy">
                  Audio Controls
                </h3>
              </div>

              {/* Main Control Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handlePlay}
                  disabled={isLoading}
                  className="audio-button-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  {isLoading ? 'Generating...' : isPlaying ? 'Pause' : 'Play'}
                </button>
                
                <button
                  onClick={handleStop}
                  disabled={!audioRef.current || isLoading}
                  className="audio-button-danger flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              </div>

              {/* Speed Control */}
              <div className="mb-4">
                <label className="block text-sm font-inter font-medium text-gray-700 mb-2">
                  Playback Speed: {playbackRate}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5x</span>
                  <span>1x</span>
                  <span>2x</span>
                </div>
              </div>

              {/* Progress Bar */}
              {duration > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-inter text-gray-600">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Status Messages */}
            {error && (
              <div className="control-panel p-4 border-l-4 border-red-500 bg-red-50">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm font-inter text-red-700">{error}</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="control-panel p-4 border-l-4 border-manuscript-gold bg-yellow-50">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-manuscript-gold animate-spin" />
                  <p className="text-sm font-inter text-yellow-800">
                    Generating your audiobook... This may take a moment.
                  </p>
                </div>
              </div>
            )}

            {/* Info Panel */}
            <div className="control-panel p-4 bg-blue-50 border-l-4 border-oxford-navy">
              <p className="text-sm font-inter text-oxford-navy">
                <strong>Note:</strong> This application requires an active Supabase backend 
                with Eleven Labs integration. Make sure your Edge Function is deployed 
                and configured with valid API keys.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioChambers;