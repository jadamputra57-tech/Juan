
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeminiVideoService } from './services/geminiService';
import { ImagePreview, GenerationStep } from './types';

// @google/genai guidelines: Extend window for AI Studio helpers.
// Using AIStudio interface and readonly modifier to align with environment definitions.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    readonly aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [image, setImage] = useState<ImagePreview | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStep>(GenerationStep.IDLE);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } catch (e) {
      console.error("Error checking API key:", e);
    }
  };

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // @google/genai guidelines: Assume key selection was successful to mitigate race conditions.
      setHasKey(true);
    } catch (e) {
      console.error("Error opening key selector:", e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix for the API
        const base64Clean = base64.split(',')[1];
        setImage({
          file,
          base64: base64Clean,
          url: URL.createObjectURL(file)
        });
        setVideoUrl(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerGeneration = async () => {
    if (!image) return;
    
    setStatus(GenerationStep.INITIALIZING);
    setError(null);
    
    try {
      const videoService = GeminiVideoService.getInstance();
      const resultUrl = await videoService.generateCinematicAnimation(
        image.base64,
        (msg) => setStatusMessage(msg)
      );
      
      setVideoUrl(resultUrl);
      setStatus(GenerationStep.COMPLETED);
    } catch (err: any) {
      // @google/genai guidelines: Handle specific error to prompt for key re-selection.
      if (err.message === "API_KEY_RESET") {
        setHasKey(false);
        setError("Your API key session expired or is invalid. Please select a valid key.");
      } else {
        setError(err.message || "An unexpected error occurred during animation generation.");
      }
      setStatus(GenerationStep.ERROR);
    }
  };

  const reset = () => {
    setImage(null);
    setVideoUrl(null);
    setStatus(GenerationStep.IDLE);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 md:p-8 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"></div>
      </div>

      <header className="z-10 w-full max-w-5xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <i className="fas fa-sparkles text-white text-xl"></i>
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Ethereal Animator
          </h1>
        </div>
        
        {!hasKey ? (
          <button 
            onClick={handleSelectKey}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg shadow-blue-900/20"
          >
            <i className="fas fa-key"></i>
            Activate Engine
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            System Ready
          </div>
        )}
      </header>

      <main className="z-10 w-full max-w-5xl flex flex-col gap-8">
        {!hasKey && (
          <div className="glass-effect p-8 rounded-3xl text-center space-y-4 max-w-2xl mx-auto border-blue-500/20">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-wand-magic-sparkles text-4xl text-blue-400"></i>
            </div>
            <h2 className="text-2xl font-semibold">Start Animating</h2>
            <p className="text-slate-400 leading-relaxed">
              To use the cinematic Veo animation engine, you must first connect a valid Gemini API key. 
              Click the button below to select your key and begin your creative journey.
            </p>
            <button 
              onClick={handleSelectKey}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 transition-all rounded-xl font-bold text-lg inline-flex items-center gap-3 transform hover:scale-105"
            >
              <i className="fas fa-plug"></i>
              Connect API Key
            </button>
            <div className="pt-4">
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline"
              >
                Learn about API Key & Billing
              </a>
            </div>
          </div>
        )}

        {hasKey && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div className="glass-effect p-6 rounded-3xl relative overflow-hidden group">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-image text-blue-400"></i>
                  Reference Image
                </h3>
                
                <div 
                  className={`aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 relative overflow-hidden
                    ${image ? 'border-slate-700 bg-slate-900/30' : 'border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5'}
                  `}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {image ? (
                    <img src={image.url} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <>
                      <i className="fas fa-cloud-arrow-up text-4xl text-slate-700 mb-3 group-hover:text-blue-500 transition-colors"></i>
                      <p className="text-sm font-medium text-slate-400">Click to upload your fantasy image</p>
                      <p className="text-xs text-slate-600 mt-1">Supports PNG, JPG (Max 5MB)</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>

                {image && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="absolute top-8 right-8 w-8 h-8 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors text-white z-20"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>

              <div className="glass-effect p-6 rounded-3xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-cog text-indigo-400"></i>
                  Animation Parameters
                </h3>
                <div className="space-y-4">
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Style Preset</p>
                    <p className="text-sm text-slate-300">Epic Fantasy & Cinematic Motion</p>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Dynamics</p>
                    <p className="text-sm text-slate-300">Fluid Hair, Atmospheric Particles, Slow Push-in</p>
                  </div>
                  
                  <button 
                    disabled={!image || status !== GenerationStep.IDLE && status !== GenerationStep.ERROR && status !== GenerationStep.COMPLETED}
                    onClick={triggerGeneration}
                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl
                      ${image && status === GenerationStep.IDLE 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transform hover:scale-[1.02] shadow-blue-900/30' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                    `}
                  >
                    {status === GenerationStep.IDLE || status === GenerationStep.COMPLETED || status === GenerationStep.ERROR ? (
                      <>
                        <i className="fas fa-play"></i>
                        Generate Animation
                      </>
                    ) : (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Animating...
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              <div className="glass-effect p-6 rounded-3xl min-h-[400px] flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-film text-purple-400"></i>
                  Resulting Cinema
                </h3>
                
                <div className="flex-grow flex items-center justify-center relative rounded-2xl overflow-hidden bg-slate-900/30 border border-slate-800/50">
                  {videoUrl ? (
                    <video 
                      src={videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-full object-contain shadow-2xl"
                    />
                  ) : (
                    <div className="text-center p-8">
                      {status === GenerationStep.IDLE || status === GenerationStep.ERROR ? (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-clapperboard text-slate-600 text-2xl"></i>
                          </div>
                          <p className="text-slate-500 max-w-[200px] mx-auto text-sm">
                            {error ? 'An error occurred during generation' : 'Upload an image and click generate to see the magic'}
                          </p>
                          {error && (
                            <div className="p-3 bg-red-900/20 border border-red-900/30 rounded-lg text-red-400 text-xs text-left">
                              {error}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-6">
                          <div className="relative">
                            <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <i className="fas fa-atom text-blue-400 animate-pulse text-2xl"></i>
                            </div>
                          </div>
                          <div className="space-y-2 text-center">
                            <h4 className="font-semibold text-blue-400">Generating Cinema</h4>
                            <p className="text-sm text-slate-400 italic max-w-xs shimmer bg-clip-text text-transparent">
                              "{statusMessage || 'Initializing...'}"
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-4">Typically takes 1-3 minutes</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {videoUrl && (
                  <div className="mt-4 flex gap-3">
                    <a 
                      href={videoUrl} 
                      download="ethereal-animation.mp4"
                      className="flex-grow py-3 bg-slate-800 hover:bg-slate-700 transition-colors rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-download"></i>
                      Download MP4
                    </a>
                    <button 
                      onClick={() => setVideoUrl(null)}
                      className="p-3 bg-slate-800 hover:bg-slate-700 transition-colors rounded-xl text-slate-400"
                      title="Clear Result"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                )}
              </div>

              <div className="glass-effect p-6 rounded-3xl border-slate-800/50">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <i className="fas fa-circle-info text-blue-400"></i>
                  Technical Insights
                </h4>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    Powered by Gemini Veo 3.1 for high-fidelity video synthesis.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    Physics-aware strand simulation for realistic hair motion.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    Dynamic depth-mapping for atmospheric particle consistency.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 text-slate-600 text-xs flex flex-col items-center gap-2 z-10">
        <p>&copy; 2024 Ethereal Animator. Powered by Google Gemini.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
          <a href="#" className="hover:text-blue-500 transition-colors">Terms</a>
          <a href="#" className="hover:text-blue-500 transition-colors">Documentation</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
