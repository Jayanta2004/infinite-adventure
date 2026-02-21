'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 2. Client Schema (Must match the server exactly)
const gameSchema = z.object({
  locationName: z.string(),
  description: z.string(),
  hp: z.number(),
  hpChangeReason: z.string().nullable(),
  inventory: z.array(z.string()),
  choices: z.array(z.object({ 
    label: z.string(), 
    actionId: z.string(),
    risk: z.enum(['safe', 'minor', 'moderate', 'major'])
  })),
});

export default function Game() {
  const [history, setHistory] = useState<any[]>([]);
  const [hp, setHp] = useState(100);
  const [damageFlash, setDamageFlash] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);

  // 3. MOUNT: Restore Session or Create New
  useEffect(() => {
    const restoreGame = async () => {
      // Always create a new session on page load
      const id = crypto.randomUUID();
      localStorage.setItem('game_session_id', id);
      setSessionId(id);
      setIsLoaded(true);
    };
    restoreGame();
  }, []);

  // 4. AUTO-SAVE Function
  const saveGame = async (newHistory: any[], newHp: number, newInventory: string[], newLocation: string) => {
    if (!sessionId) return;
    
    await supabase.from('game_saves').upsert({
      session_id: sessionId,
      history: newHistory,
      hp: newHp,
      inventory: newInventory,
      location_name: newLocation,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'session_id' });
  };

  // 5. The Brain (AI Hook)
  const { object, submit, isLoading } = useObject({
    api: '/api/game',
    schema: gameSchema,
    onFinish: (result) => {
      if (result.object?.hp !== undefined) {
        if (result.object.hp < hp) triggerDamageFlash();
        setHp(result.object.hp);
        
        // Save to DB when turn finishes
        saveGame(
            [...history, { action: "AI_RESPONSE", result: result.object }], 
            result.object.hp,
            result.object.inventory || [],
            result.object.locationName || ""
        );
      }
    }
  });

  // 6. Real-Time HP Sync
  useEffect(() => {
    if (object?.hp !== undefined) {
        const newHp = object.hp;
        if (newHp < hp) triggerDamageFlash();
        setHp(newHp);
    }
  }, [object?.hp, object]);

  const triggerDamageFlash = () => {
    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 300);
  };

  const handleChoice = (choice: string) => {
    if (hp <= 0) return;
    setTurnCount(prev => prev + 1);
    checkAchievements();
    const currentInventory = object?.inventory || [];
    const newHistory = [...history, { action: choice, result: object }];
    setHistory(newHistory);
    submit({ history: newHistory, currentHp: hp, inventory: currentInventory });
  };

  const checkAchievements = () => {
    const newAchievements = [...achievements];
    if (turnCount === 5 && !achievements.includes('First Steps')) newAchievements.push('First Steps');
    if (turnCount === 20 && !achievements.includes('Survivor')) newAchievements.push('Survivor');
    if (hp === 100 && turnCount > 10 && !achievements.includes('Untouchable')) newAchievements.push('Untouchable');
    if ((object?.inventory?.length || 0) >= 5 && !achievements.includes('Hoarder')) newAchievements.push('Hoarder');
    if (newAchievements.length > achievements.length) setAchievements(newAchievements);
  };

  const handleItemClick = (item: string) => {
    if (isLoading || hp <= 0) return;
    setSelectedItem(item);
    handleChoice(`Use ${item}`);
    setTimeout(() => setSelectedItem(null), 1000);
  };

  const wipeSaveAndRestart = async () => {
    window.location.reload();
  };

  // 7. THE SAFETY NET: Decide what to show on screen
  const lastHistoryItem = history.length > 0 ? history[history.length - 1] : null;
  const currentContent = object || lastHistoryItem?.result || {};

  // --- RENDER LOGIC ---

  if (!isLoaded) return <div className="h-screen bg-zinc-950 text-zinc-500 flex items-center justify-center font-mono">Loading Neural Link...</div>;

  // Start Screen
  if (!currentContent?.description && history.length === 0) {
    return (
      <div className="vignette flex flex-col h-screen items-center justify-center bg-black text-white gap-8 font-mono relative overflow-hidden">
        {/* Fog layers */}
        <div className="fog-layer" style={{top: '10%'}} />
        <div className="fog-layer" style={{top: '40%'}} />
        <div className="fog-layer" style={{top: '70%'}} />
        
        {/* Dark atmospheric background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(75,0,75,0.4),transparent_40%)]" style={{animation: 'creepyFloat 15s ease-in-out infinite'}} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(50,0,80,0.3),transparent_45%)]" style={{animation: 'creepyFloat 18s ease-in-out infinite 5s'}} />
        
        {/* Floating ghost orbs */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" style={{animation: 'creepyFloat 20s ease-in-out infinite'}} />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-purple-900/15 rounded-full blur-3xl" style={{animation: 'creepyFloat 25s ease-in-out infinite 3s'}} />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-indigo-900/10 rounded-full blur-3xl" style={{animation: 'creepyFloat 22s ease-in-out infinite 7s'}} />
        
        {/* Whispers effect */}
        <div className="absolute top-1/4 left-1/3 text-purple-500/20 text-xs" style={{animation: 'whisper 8s ease-in-out infinite'}}>...help...</div>
        <div className="absolute bottom-1/3 right-1/4 text-purple-500/20 text-xs" style={{animation: 'whisper 10s ease-in-out infinite 3s'}}>...escape...</div>
        <div className="absolute top-1/2 left-1/4 text-purple-500/20 text-xs" style={{animation: 'whisper 12s ease-in-out infinite 6s'}}>...trapped...</div>
        
        <div className="z-10 text-center space-y-6 px-4">
          <div className="mb-4 text-7xl" style={{animation: 'creepyFloat 4s ease-in-out infinite', filter: 'drop-shadow(0 0 20px rgba(139, 0, 139, 0.8))'}}>👻</div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-b from-purple-300 via-purple-500 to-black bg-clip-text text-transparent drop-shadow-2xl flicker" style={{textShadow: '0 0 40px rgba(139, 0, 139, 0.8), 0 0 80px rgba(75, 0, 75, 0.5)', filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.9))'}}>
            INFINITE ADVENTURE
          </h1>
          <p className="text-purple-400 text-sm md:text-base tracking-widest uppercase" style={{animation: 'whisper 4s ease-in-out infinite', textShadow: '0 0 15px rgba(139, 0, 139, 1)'}}>⚠️ Neural Link Corrupted ⚠️</p>
          <p className="text-zinc-500 text-xs md:text-sm max-w-md mx-auto leading-relaxed mt-4" style={{textShadow: '0 0 10px rgba(0, 0, 0, 0.9)'}}>Your consciousness has been trapped in a corrupted simulation. Reality glitches. Shadows whisper. Every choice echoes through the void...</p>
        </div>
        
        <button 
          onClick={() => handleChoice("START_GAME")} 
          className="z-10 group relative px-10 py-5 bg-gradient-to-r from-purple-900 to-purple-950 hover:from-purple-800 hover:to-purple-900 rounded-xl font-bold text-xl transition-all duration-300 border-2 border-purple-500/30 hover:border-purple-400/50"
          style={{animation: 'shadowPulse 3s ease-in-out infinite', boxShadow: '0 0 30px rgba(139, 0, 139, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.8)'}}
        >
          <span className="relative z-10 flex items-center gap-2" style={{textShadow: '0 0 10px rgba(139, 0, 139, 0.8)'}}>
            <span className="text-2xl">▶</span>
            ENTER SIMULATION
          </span>
          <div className="absolute inset-0 rounded-xl bg-purple-500/10 opacity-0 group-hover:opacity-100 blur transition-opacity" />
        </button>
        
        <div className="z-10 text-xs text-zinc-700 mt-8 flex items-center gap-2 flicker">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" style={{boxShadow: '0 0 10px rgba(220, 38, 38, 0.8)'}}></span>
          SYSTEM STATUS: CRITICAL FAILURE
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (hp <= 0 && !isLoading) {
    return (
      <div className="vignette flex flex-col h-screen items-center justify-center bg-black text-white font-mono p-4 text-center z-50 relative overflow-hidden">
        {/* Blood drip effect */}
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-red-900 to-transparent opacity-30" style={{animation: 'bloodDrip 8s ease-in infinite'}} />
        <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-red-900 to-transparent opacity-30" style={{animation: 'bloodDrip 10s ease-in infinite 2s'}} />
        
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/50 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,0,0,0.3),transparent_40%)]" style={{animation: 'creepyFloat 8s ease-in-out infinite'}} />
        
        <div className="z-10 space-y-4 max-w-2xl">
          <div className="text-7xl md:text-8xl" style={{animation: 'glitch 0.5s infinite', filter: 'drop-shadow(0 0 30px rgba(220, 38, 38, 0.9))'}}>💀</div>
          <h1 className="text-6xl md:text-7xl font-black text-red-600 glitch-text" style={{textShadow: '0 0 30px rgba(220, 38, 38, 1), 0 0 60px rgba(139, 0, 0, 0.8)'}}>
            TERMINATED
          </h1>
          <div className="h-1 w-48 md:w-64 bg-black mx-auto rounded-full overflow-hidden border border-red-900">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-red-600 to-transparent" style={{animation: 'whisper 2s ease-in-out infinite'}} />
          </div>
          <p className="text-base md:text-lg text-red-300 max-w-lg leading-relaxed px-4" style={{textShadow: '0 0 10px rgba(0, 0, 0, 0.9)'}}>{currentContent?.description}</p>
          <p className="text-sm text-red-500/70 italic flicker">Your neural link has been severed...</p>
          <p className="text-xs text-zinc-700" style={{animation: 'whisper 6s ease-in-out infinite'}}>...the void consumes all...</p>
        </div>
        <button 
          onClick={wipeSaveAndRestart} 
          className="z-10 group px-6 md:px-8 py-3 md:py-4 mt-6 border-2 border-red-900 bg-black text-red-500 hover:bg-red-950 hover:text-red-400 font-bold rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm text-sm md:text-base"
          style={{boxShadow: '0 0 20px rgba(139, 0, 0, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.9)'}}
        >
          <span className="flex items-center gap-2">
            <span className="text-lg md:text-xl">🔄</span>
            WIPE MEMORY & REBOOT
          </span>
        </button>
      </div>
    );
  }

  // Main Game UI
  return (
    <div className={`vignette min-h-screen bg-black text-zinc-100 font-mono flex flex-col items-center relative overflow-hidden transition-all duration-300 ${damageFlash ? 'bg-red-950 scale-[0.99]' : ''}`}>
      
      {/* Fog layers */}
      <div className="fog-layer" style={{top: '20%', zIndex: 5}} />
      <div className="fog-layer" style={{top: '60%', zIndex: 5}} />
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-black" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/10 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(75,0,75,0.25),transparent_40%)]" style={{animation: 'creepyFloat 15s ease-in-out infinite'}} />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-900/10 rounded-full blur-3xl" style={{animation: 'creepyFloat 18s ease-in-out infinite'}} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-950/15 rounded-full blur-3xl" style={{animation: 'creepyFloat 22s ease-in-out infinite 5s'}} />
      </div>

      {/* Content Layer */}
      <div className="max-w-3xl w-full space-y-8 z-10 pt-12 px-6 pb-12 animate-fade-in flex-grow">
        
        {/* HUD */}
        <div className="flex justify-between items-end border-b border-zinc-800/50 pb-6 backdrop-blur-sm">
            <div className="space-y-2">
                <h1 className="text-xs text-blue-400 uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  Location
                </h1>
                <h2 className="text-4xl font-black drop-shadow-2xl bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  {currentContent?.locationName || "..."}
                </h2>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <span>🕒</span>
                    Turn {turnCount}
                  </span>
                  <button 
                    onClick={() => setShowStats(!showStats)}
                    className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                  >
                    <span>🏆</span>
                    {achievements.length} Achievements
                  </button>
                </div>
            </div>
            <div className="w-56 text-right space-y-2">
                <div className="text-xs text-red-400 uppercase tracking-[0.2em] font-semibold flex items-center justify-end gap-2">
                  <span className="text-lg">❤️</span>
                  Vital Signs
                  <span className="text-white font-bold">{Math.max(0, hp)}%</span>
                </div>
                <div className="h-5 bg-zinc-900/80 rounded-full overflow-hidden border-2 border-zinc-700/50 shadow-inner backdrop-blur-sm">
                    <div 
                      className={`h-full transition-all duration-500 ease-out shadow-lg ${
                        hp > 60 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                        hp > 30 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                        'bg-gradient-to-r from-red-600 to-red-500 animate-pulse'
                      }`}
                      style={{ width: `${Math.max(0, hp)}%` }} 
                    />
                </div>
            </div>
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-xl p-6 shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                <span>🏆</span>
                Achievements
              </h3>
              <button onClick={() => setShowStats(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['First Steps', 'Survivor', 'Untouchable', 'Hoarder'].map(ach => (
                <div key={ach} className={`p-3 rounded-lg border-2 transition-all ${
                  achievements.includes(ach) 
                    ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-200' 
                    : 'bg-zinc-800/20 border-zinc-700/30 text-zinc-600'
                }`}>
                  <div className="text-xs font-semibold">{ach}</div>
                  <div className="text-[10px] mt-1">
                    {ach === 'First Steps' && '5 turns'}
                    {ach === 'Survivor' && '20 turns'}
                    {ach === 'Untouchable' && 'No damage'}
                    {ach === 'Hoarder' && '5+ items'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Narrative */}
        <div className="group min-h-[140px] bg-black/60 backdrop-blur-md border border-purple-900/30 rounded-2xl p-8 shadow-2xl hover:border-purple-800/40 transition-all duration-300 relative overflow-hidden"
          style={{boxShadow: '0 0 30px rgba(0, 0, 0, 0.9), inset 0 0 30px rgba(75, 0, 75, 0.1)'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/10 via-transparent to-purple-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <p className="text-lg leading-relaxed text-zinc-300 drop-shadow-md relative z-10" style={{textShadow: '0 2px 4px rgba(0,0,0,0.9)'}}>
            {isLoading ? (
              <span className="inline-flex items-center gap-2 text-purple-400">
                <span className="animate-pulse">Generating response</span>
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{animationDelay: '0.2s'}}>.</span>
                <span className="animate-bounce" style={{animationDelay: '0.4s'}}>.</span>
              </span>
            ) : (
              currentContent?.description
            )}
          </p>
          
          {currentContent?.hpChangeReason && (
            <div className="mt-6 text-red-300 italic border-l-4 border-red-500 pl-5 bg-gradient-to-r from-red-950/50 to-transparent py-3 rounded-r-lg backdrop-blur-sm animate-fade-in relative z-10 flicker">
              <span className="text-xl mr-2 inline-block" style={{animation: 'glitch 0.3s infinite'}}>⚠️</span>
              <span style={{textShadow: '0 0 10px rgba(239, 68, 68, 0.5)'}}>{currentContent.hpChangeReason}</span>
            </div>
          )}
        </div>

        {/* Inventory */}
        {currentContent?.inventory && currentContent.inventory.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs text-cyan-400 uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
              <span>🎒</span>
              Inventory <span className="text-zinc-500 text-[10px] ml-2">(Click to use)</span>
            </h3>
            <div className="flex gap-3 flex-wrap">
              {currentContent.inventory.map((item: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleItemClick(item)}
                  disabled={isLoading || hp <= 0}
                  className={`group relative px-4 py-2 bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 backdrop-blur-sm border-2 text-sm rounded-lg shadow-lg text-cyan-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedItem === item 
                      ? 'border-cyan-300 scale-110 shadow-cyan-400/50' 
                      : 'border-cyan-500/30 hover:border-cyan-400/60 hover:scale-105 hover:shadow-cyan-500/30'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-xs">📦</span>
                    {item}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Choices */}
        <div className="space-y-4">
          <h3 className="text-xs text-purple-400 uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
            <span>⚡</span>
            Available Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentContent?.choices?.map((choice: any, i: number) => (
              <button
                key={i}
                onClick={() => handleChoice(choice.label)}
                disabled={isLoading}
                className="group relative p-5 text-left border-2 border-purple-900/40 bg-black/80 hover:bg-purple-950/40 hover:border-purple-700/60 transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md shadow-lg hover:shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                style={{boxShadow: '0 0 20px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(75, 0, 75, 0.1)'}}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/0 via-purple-800/20 to-purple-900/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-start gap-3">
                  <span className="text-purple-500 text-xl font-bold group-hover:text-purple-400 transition-colors flicker">▶</span>
                  <span className="flex-1 text-zinc-300 group-hover:text-zinc-100 transition-colors">{choice.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Status Text */}
        {isLoading && (
           <div className="flex items-center justify-center gap-3 text-sm text-purple-300 animate-pulse bg-zinc-900/30 backdrop-blur-sm py-3 rounded-lg border border-purple-800/30 shadow-lg shadow-purple-900/20">
             <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
             <span className="flicker">Processing neural input...</span>
           </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full py-3 text-center text-xs text-zinc-500 border-t border-zinc-800/30 backdrop-blur-sm mt-auto">
        Made with <span className="text-red-500 animate-pulse">❤️</span> by <a href="https://github.com/Jayanta2004" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors hover:underline">Jayanta</a>
      </footer>
    </div>
  );
}