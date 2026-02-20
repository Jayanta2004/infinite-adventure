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
      <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-blue-950 to-zinc-950 text-white gap-8 font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] animate-pulse" />
        <div className="z-10 text-center space-y-6">
          <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent drop-shadow-2xl animate-fade-in">
            INFINITE ADVENTURE
          </h1>
          <p className="text-zinc-400 text-sm tracking-widest uppercase">Neural Link Ready</p>
        </div>
        <button 
          onClick={() => handleChoice("START_GAME")} 
          className="z-10 group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-bold text-xl transition-all duration-300 shadow-lg shadow-blue-500/50 hover:shadow-blue-400/70 hover:scale-105 active:scale-95"
        >
          <span className="relative z-10">ENTER SIMULATION</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 blur transition-opacity" />
        </button>
      </div>
    );
  }

  // Game Over Screen
  if (hp <= 0 && !isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-red-950 via-zinc-950 to-red-950 text-white space-y-8 font-mono p-6 text-center z-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.15),transparent_50%)] animate-pulse" />
        <div className="z-10 space-y-6">
          <div className="text-8xl mb-4 animate-bounce">💀</div>
          <h1 className="text-7xl font-black text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse">TERMINATED</h1>
          <p className="text-xl text-red-200 max-w-lg leading-relaxed">{currentContent?.description}</p>
        </div>
        <button 
          onClick={wipeSaveAndRestart} 
          className="z-10 group px-8 py-4 border-2 border-red-500 text-red-500 hover:bg-red-900 hover:text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/50 active:scale-95"
        >
          <span className="flex items-center gap-2">
            <span>🔄</span>
            WIPE MEMORY & REBOOT
          </span>
        </button>
      </div>
    );
  }

  // Main Game UI
  return (
    <div className={`min-h-screen bg-zinc-950 text-zinc-100 font-mono flex flex-col items-center relative overflow-hidden transition-all duration-300 ${damageFlash ? 'bg-red-900 scale-[0.99]' : ''}`}>
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-zinc-950/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.05),transparent_50%)]" />
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
        <div className="group min-h-[140px] bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-8 shadow-2xl hover:border-zinc-700/50 transition-all duration-300">
          <p className="text-lg leading-relaxed text-zinc-100 drop-shadow-md">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
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
            <div className="mt-6 text-red-300 italic border-l-4 border-red-500 pl-5 bg-gradient-to-r from-red-950/50 to-transparent py-3 rounded-r-lg backdrop-blur-sm animate-fade-in">
              <span className="text-xl mr-2">⚠️</span>
              {currentContent.hpChangeReason}
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
                className="group relative p-5 text-left border-2 border-zinc-700/50 bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 hover:from-zinc-800/90 hover:to-zinc-700/90 hover:border-blue-500/70 transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-start gap-3">
                  <span className="text-blue-400 text-xl font-bold group-hover:text-blue-300 transition-colors">▶</span>
                  <span className="flex-1 group-hover:text-white transition-colors">{choice.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Status Text */}
        {isLoading && (
           <div className="flex items-center justify-center gap-3 text-sm text-zinc-500 animate-pulse bg-zinc-900/30 backdrop-blur-sm py-3 rounded-lg border border-zinc-800/30">
             <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
             Processing neural input...
           </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full py-3 text-center text-xs text-zinc-500 border-t border-zinc-800/30 backdrop-blur-sm mt-auto">
        Made with ❤️ by <a href="https://github.com/Jayanta2004" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">Jayanta</a>
      </footer>
    </div>
  );
}