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
  { id: '21m00Tzpb8JJc4PZgOLQ', name: 'Adam', description: 'Deep, resonant male voice' }, // Updated to ElevenLabs ID
  { id: 'AZzNKC7fD5iC5L4S7iCg', name: 'Antoni', description: 'Well-rounded male voice' }, // Updated to ElevenLabs ID
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Warm, engaging female voice' }, // Updated to ElevenLabs ID
  { id: 'pFZv13yG1gH8G76M54gE', name: 'Elli', description: 'Youthful, energetic female voice' }, // Updated to ElevenLabs ID
  { id: 'TxGEqnHWrfWFTCxW0aRb', name: 'Josh', description: 'Clear, professional male voice' }, // Updated to ElevenLabs ID
  { id: 'VR6WFUSzE2oVLwHrxWcW', name: 'Rachel', description: 'Calm, soothing female voice' }, // Updated to ElevenLabs ID
  { id: 'ZQeCzl5NtEvK8I84V5H9', name: 'Sam', description: 'Friendly, conversational male voice' } // Updated to ElevenLabs ID
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

  // Initialize Audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.ontimeupdate = () => setCurrentTime(audioRef.current ? audioRef.current.currentTime : 0);
      audioRef.current.onloadedmetadata = () => setDuration(audioRef.current ? audioRef.current.duration : 0);
      audioRef.current.onerror = () => {
        setError('Audio playback error occurred. Please try again or check your network.');
        setIsPlaying(false);
      };
    }

    // Cleanup object URL when component unmounts or audio URL changes
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]); // Rerun effect if audioUrl changes

  // Apply playback rate whenever it changes
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
    setIsPlaying(false); // Stop any current playback

    // Pause and clear existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setAudioUrl(null); // Clear previous URL state
      setCurrentTime(0);
      setDuration(0);
    }

    try {
      // Correct way to access environment variables in Vite frontend
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

      // Validate that environment variables are set
      if (supabaseUrl.includes('YOUR_SUPABASE_URL') || supabaseAnonKey.includes('YOUR_ANON_KEY')) {
        setError('Supabase URL or Anon Key not configured in .env file. Please check your setup.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          text: text.trim(),
          voice_id: selectedVoice
        })
      });

      if (!response.ok) {
        // Attempt to parse a more detailed error message from the Supabase function
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Failed to generate audio: ${errorData.message || response.statusText}`);
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);

      setAudioUrl(url); // Store the new audio URL

      // Assign and play new audio
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.playbackRate = playbackRate; // Apply current playback rate
        await audioRef.current.play();
        setIsPlaying(true);
      } else {
        // Fallback if audioRef.current was null (shouldn't happen with useEffect setup)
        audioRef.current = new Audio(url);
        audioRef.current.playbackRate = playbackRate;
        await audioRef.current.play();
        setIsPlaying(true);
      }

    } catch (err: any) {
      console.error('Error generating audio:', err);
      setError(`Failed to generate audio: ${err.message || 'An unknown error occurred.'}`);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    // If audio is already loaded and paused, just resume
    if (audioRef.current && audioRef.current.src && !isLoading) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((e) => {
            console.error("Error playing audio:", e);
            setError('Could not play audio. Make sure your browser allows autoplay or try again.');
          });
      }
    } else {
      // If no audio is loaded or it's currently generating, initiate generation
      generateAudio();
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
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTextareaResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
      textarea.style.height = `${Math.max(200, textarea.scrollHeight)}px`; // Set to scroll height or min 200px
    }
  };

  // Initial resize on component mount
  useEffect(() => {
    handleTextareaResize();
  }, [text]); // Re-evaluate if text changes

  return (
    <div className="min-h-screen bg-gradient-to-br from-oxford-navy via-blue-900 to-oxford-navy font-inter">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Headphones className="w-8 h-8 text-manuscript-gold" />
            <h1 className="text-4xl md:text-5xl font-playfair-display font-bold text-white">
              Audio Chambers
            </h1>
          </div>
          <p className="text-lg text-blue-200 font-lora max-w-2xl mx-auto">
            Transform your manuscripts into captivating audiobooks with premium AI voices
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Text Input Section */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-xl p-6 border-2 border-burgundy-leather">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-oxford-navy" />
              <h2 className="text-xl font-playfair-display font-semibold text-oxford-navy">
                Your Manuscript
              </h2>
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
              }}
              onInput={handleTextareaResize} // Re-evaluate on input (for typing)
              placeholder="Paste or type your manuscript text here. Watch as your words come to life through the power of AI narration..."
              className="w-full p-4 border-none outline-none resize-none font-lora text-gray-800 leading-relaxed bg-transparent focus:ring-0 focus:outline-none"
              style={{ fontSize: '16px', lineHeight: '1.6', minHeight: '200px' }}
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

          {/* Controls Section */}
          <div className="space-y-6">
            {/* Voice Selection */}
            <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-burgundy-leather">
              <div className="flex items-center gap-2 mb-4">
                <Volume2 className="w-5 h-5 text-oxford-navy" />
                <h3 className="text-lg font-playfair-display font-semibold text-oxford-navy">
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
            <div className="bg-white rounded-lg shadow-xl p-6 border-2 border-burgundy-leather">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-oxford-navy" />
                <h3 className="text-lg font-playfair-display font-semibold text-oxford-navy">
                  Audio Controls
                </h3>
              </div>

              {/* Main Control Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handlePlay}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md"
                  style={{
                    background: 'linear-gradient(145deg, #FFD700, #DAA520)', // Manuscript Gold gradient
                    color: '#001F3F' // Oxford Navy icon/text
                  }}
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
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md"
                  style={{
                    background: 'linear-gradient(145deg, #800020, #5C0015)', // Burgundy Leather gradient
                    color: '#FFF8DC' // Creamy icon/text
                  }}
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              </div>

              {/* Speed Control */}
              <div className="mb-4">
                <label className="block text-sm font-inter font-medium text-gray-700 mb-2">
                  Playback Speed: {playbackRate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    '--tw-range-thumb-color': '#FFD700', // Manuscript Gold thumb
                    '--tw-range-track-color': '#001F3F', // Oxford Navy track
                  } as React.CSSProperties}
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
                    style={{
                      '--tw-range-thumb-color': '#FFD700', // Manuscript Gold thumb
                      '--tw-range-track-color': '#001F3F', // Oxford Navy track
                    } as React.CSSProperties}
                  />
                </div>
              )}
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm font-inter">{error}</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="bg-yellow-50 border-l-4 border-manuscript-gold text-yellow-800 p-4 rounded-md shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-manuscript-gold animate-spin" />
                  <p className="text-sm font-inter">
                    Generating your audiobook... This may take a moment.
                  </p>
                </div>
              </div>
            )}

            {/* Info Panel */}
            <div className="bg-blue-50 border-l-4 border-oxford-navy text-oxford-navy p-4 rounded-md shadow-sm">
              <p className="text-sm font-inter">
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
