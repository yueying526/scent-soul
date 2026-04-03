import React, { useState } from 'react';
import { AppState, AnalysisResult } from './types';
import { analyzeFace } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { AnalysisView } from './components/AnalysisView';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageSelected = async (base64: string, preview: string) => {
    setPreviewUrl(preview);
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);

    try {
      const data = await analyzeFace(base64);
      setResult(data);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg("Unable to analyze the image. Please try a clearer portrait or check your connection.");
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#f7f0e9] to-[#eceae5] px-4 py-8 md:py-16 selection:bg-rose-200">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-16 space-y-4">
          <h1 className="font-serif text-5xl md:text-6xl text-stone-900 tracking-tight">
            Scent <span className="text-rose-900 italic">&</span> Soul
          </h1>
          <p className="text-stone-500 font-light tracking-wide text-sm uppercase">
            Physiognomy & Perfumery Consultant
          </p>
        </header>

        <main>
          {appState === AppState.IDLE && (
            <div className="max-w-xl mx-auto space-y-8 animate-fade-in-up">
              <div className="text-center space-y-4 mb-10">
                <p className="text-stone-700 text-lg font-serif leading-relaxed">
                  "Your face reveals the map of your soul. Upload a portrait to discover the scents that harmonize with your true nature."
                </p>
              </div>
              
              <FileUpload onImageSelected={handleImageSelected} disabled={false} />
              
              <div className="grid grid-cols-3 gap-4 pt-8 opacity-50">
                 <div className="text-center">
                   <div className="w-8 h-8 rounded-full bg-stone-200 mx-auto mb-2 flex items-center justify-center font-serif">1</div>
                   <p className="text-xs text-stone-500">Upload Portrait</p>
                 </div>
                 <div className="text-center">
                   <div className="w-8 h-8 rounded-full bg-stone-200 mx-auto mb-2 flex items-center justify-center font-serif">2</div>
                   <p className="text-xs text-stone-500">Face Reading</p>
                 </div>
                 <div className="text-center">
                   <div className="w-8 h-8 rounded-full bg-stone-200 mx-auto mb-2 flex items-center justify-center font-serif">3</div>
                   <p className="text-xs text-stone-500">Scent Match</p>
                 </div>
              </div>
            </div>
          )}

          {appState === AppState.ANALYZING && (
            <div className="max-w-xl mx-auto text-center py-20 animate-pulse">
              <div className="w-24 h-24 mx-auto mb-8 relative">
                 <div className="absolute inset-0 border-4 border-stone-200 rounded-full"></div>
                 <div className="absolute inset-0 border-t-4 border-rose-800 rounded-full animate-spin"></div>
              </div>
              <h3 className="font-serif text-2xl text-stone-800 mb-2">Reading Features...</h3>
              <p className="text-stone-500 italic">Interpreting the unspoken language of your face</p>
              
              {previewUrl && (
                <div className="mt-8 w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg opacity-50 grayscale">
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Analyzing" />
                </div>
              )}
            </div>
          )}

          {appState === AppState.ERROR && (
             <div className="max-w-md mx-auto text-center py-12">
               <div className="text-4xl mb-4">🍂</div>
               <h3 className="font-serif text-2xl text-stone-800 mb-4">Something went wrong</h3>
               <p className="text-stone-600 mb-8">{errorMsg}</p>
               <button 
                 onClick={handleReset}
                 className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-serif"
               >
                 Try Again
               </button>
             </div>
          )}

          {appState === AppState.SUCCESS && result && previewUrl && (
            <AnalysisView 
              result={result} 
              previewUrl={previewUrl} 
              onReset={handleReset} 
            />
          )}
        </main>

        <footer className="mt-20 text-center text-stone-400 text-xs py-8 border-t border-stone-200/50">
           <p>© {new Date().getFullYear()} Scent & Soul AI. Powered by Gemini AI.</p>
        </footer>
      </div>
    </div>
  );
}
