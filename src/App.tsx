/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  defaultDecks, 
  defaultCards 
} from './data/mockDatabase';
import { defaultPlugins } from './data/defaultPlugins';
import { Card, Deck, Plugin, BridgeLog } from './types';
import { executePluginSandbox } from './lib/SandboxExecutor';

// Importing Custom Sub-components
import AndroidEmulator from './components/AndroidEmulator';
import LockVisualizer from './components/LockVisualizer';
import RoomConsole from './components/RoomConsole';
import CodeWorkspace from './components/CodeWorkspace';

// Icons
import { 
  ShieldCheck, 
  Database, 
  Terminal, 
  Layers, 
  Cpu, 
  BellRing, 
  SlidersHorizontal,
  Info,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export default function App() {
  // App Core State Engine
  const [decks, setDecks] = useState<Deck[]>(defaultDecks);
  const [cards, setCards] = useState<Card[]>(defaultCards);
  const [plugins, setPlugins] = useState<Plugin[]>(defaultPlugins);
  const [activePluginId, setActivePluginId] = useState<string>('plugin-romaji-auto');
  
  // Terminal Logs and Communication Bridge states
  const [bridgeLogs, setBridgeLogs] = useState<BridgeLog[]>([]);
  
  // App emulator study flow state
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  
  // Android overlay notifications array
  const [phoneNotifications, setPhoneNotifications] = useState<{ id: string; message: string }[]>([]);

  // Studio developer display Tab control
  const [studioTab, setStudioTab] = useState<'locks' | 'room' | 'workspace'>('locks');

  // Unified logging helper
  const handleLogBridgeAction = (
    pluginName: string, 
    action: 'READ' | 'WRITE' | 'BLOCK' | 'LOG', 
    details: string
  ) => {
    const freshLog: BridgeLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      pluginName,
      action,
      details
    };
    setBridgeLogs(prev => [freshLog, ...prev]);
  };

  // Triggers visual android alerts at top of dashboard
  const handleRaiseNotification = (message: string) => {
    const notifyId = `notify-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setPhoneNotifications(prev => [...prev, { id: notifyId, message }]);
    
    // Auto purge notification after 4000ms
    setTimeout(() => {
      setPhoneNotifications(prev => prev.filter(n => n.id !== notifyId));
    }, 4000);
  };

  // Toggle specific plugins inside sandbox
  const handleTogglePlugin = (pluginId: string) => {
    setPlugins(prev => prev.map(p => {
      if (p.id === pluginId) {
        const nextEnabled = !p.isEnabled;
        handleLogBridgeAction(
          p.name, 
          'WRITE', 
          `Toggled plugin state: ${nextEnabled ? 'ENABLED' : 'DISABLED'}. Resetting logs and errors.`
        );
        handleRaiseNotification(`Plugin "${p.name}" is now ${nextEnabled ? 'enabled' : 'disabled'}.`);
        return { 
          ...p, 
          isEnabled: nextEnabled, 
          error: undefined, 
          errorLog: undefined 
        };
      }
      return p;
    }));
  };

  // Direct editing of plugin code hook inside editor
  const handleUpdatePluginCode = (pluginId: string, code: string) => {
    setPlugins(prev => prev.map(p => {
      if (p.id === pluginId) {
        handleLogBridgeAction(
          p.name, 
          'WRITE', 
          `Committed script edits directly. QuickJS sandbox bindings refreshed.`
        );
        return { 
          ...p, 
          code, 
          error: undefined, 
          errorLog: undefined 
        };
      }
      return p;
    }));
  };

  const handlePluginStatusChange = (pluginId: string, error: string | null, errorLog?: string[]) => {
    setPlugins(prev => prev.map(p => {
      if (p.id === pluginId) {
        return {
          ...p,
          error: error || undefined,
          errorLog: errorLog || undefined
        };
      }
      return p;
    }));
  };

  const handleAddPlugin = (newPlugin: Plugin) => {
    setPlugins(prev => [...prev, newPlugin]);
    setActivePluginId(newPlugin.id);
    handleLogBridgeAction(
      newPlugin.name,
      'WRITE',
      `Registered new custom plugin.`
    );
    handleRaiseNotification(`Added new plugin: "${newPlugin.name}".`);
  };

  // Adding a card directly in Room SQLite console
  const handleAddCard = (
    deckId: string, 
    front: string, 
    back: string, 
    customFields?: Record<string, string>
  ) => {
    const newId = `card-${deckId.split('-')[1]}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newCard: Card = {
      id: newId,
      deckId,
      front,
      back,
      intervalDays: 1,
      easeFactor: 250,
      repetitions: 0,
      nextReviewDate: new Date().toISOString(),
      customFields: customFields || {}
    };

    setCards(prev => [...prev, newCard]);
    
    // Increment deck count relation
    setDecks(prev => prev.map(d => {
      if (d.id === deckId) {
        return { ...d, cardCount: d.cardCount + 1 };
      }
      return d;
    }));

    handleLogBridgeAction(
      "System SQLite Engine", 
      'WRITE', 
      `Room INSERT: Card [${newId}] bound successfully under Deck [${deckId}].`
    );
    handleRaiseNotification("Database Record inserted successfully!");
  };

  const handleModifyCard = (updatedCard: Card) => {
    setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
  };

  // Triggers Scheduler execution upon flashcard score rating (Again, Hard, Good, Easy)
  const handleAnswerSelected = async (rating: number) => {
    // Collect active deck files
    const activeDeckCards = cards.filter(c => c.deckId === activeDeckId);
    const activeCard = activeDeckCards[currentCardIndex];
    if (!activeCard) return;

    // Check if any onAnswerSelected scheduling plugins are active
    const schedulerPlugin = plugins.find(p => p.isEnabled && p.hookType === 'onAnswerSelected');

    if (schedulerPlugin) {
      handleLogBridgeAction(
        schedulerPlugin.name,
        'READ',
        `Acquired Mutex cards, user. Running custom scheduler in Sandbox.`
      );

      try {
        const result = await executePluginSandbox(
          'onAnswerSelected',
          { card: activeCard, rating },
          {
            plugin: schedulerPlugin,
            cards,
            decks,
            onLogBridgeAction: handleLogBridgeAction,
            onNotificationRaised: handleRaiseNotification,
            onUpdateCardRecord: (card) => {
              handleModifyCard(card);
            }
          }
        );

        if (result.error) {
          handleRaiseNotification(`🔴 Scheduler Sandbox failed: ${result.error}`);
          handlePluginStatusChange(schedulerPlugin.id, result.error, result.logs);
        } else {
          handleModifyCard(result.card);
        }
      } catch (err: any) {
        const errMsg = err.message || String(err);
        handleRaiseNotification(`🔴 Scheduler executing error: ${errMsg}`);
        handlePluginStatusChange(schedulerPlugin.id, errMsg, [errMsg]);
      }
    } else {
      // Default standard SM-2 intervals logic if no scheduler is active
      const ratingStrs = ["", "Again", "Hard", "Good", "Easy"];
      let ease = activeCard.easeFactor;
      let interval = activeCard.intervalDays;
      let reps = activeCard.repetitions;

      if (rating === 1) { // AGAIN
        ease = Math.max(130, ease - 20);
        interval = 1;
        reps = 0;
      } else if (rating === 2) { // HARD
        ease = Math.max(130, ease - 15);
        interval = Math.ceil(interval * 1.2);
        reps += 1;
      } else if (rating === 3) { // GOOD
        interval = Math.ceil(interval * (ease / 100));
        reps += 1;
      } else if (rating === 4) { // EASY
        ease = ease + 15;
        interval = Math.ceil(interval * (ease / 100) * 1.3);
        reps += 1;
      }

      const defaultModified: Card = {
        ...activeCard,
        easeFactor: ease,
        intervalDays: interval,
        repetitions: reps,
        customFields: {
          ...(activeCard.customFields || {}),
          scheduler_type: "Standard SM-2 Engine",
          last_ratingStr: ratingStrs[rating]
        }
      };

      handleLogBridgeAction(
        "Standard SM-2 Engine",
        'WRITE',
        `Standard Rating updated [${ratingStrs[rating]}] for card '${activeCard.front}'.`
      );
      handleModifyCard(defaultModified);
      handleRaiseNotification(`SM-2 scheduling queued. Next review updated.`);
    }

    // Advanced study loop indexer
    if (currentCardIndex + 1 < activeDeckCards.length) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // End deck loop safely
      handleRaiseNotification("🎉 Deck completed successfully!");
      setActiveDeckId(null);
      setCurrentCardIndex(0);
      setShowAnswer(false);
    }
  };

  return (
    <div className="min-h-screen bg-immersive-bg text-slate-300 flex flex-col font-sans select-none selection:bg-blue-600/30" id="main-applet-canvas">
      
      {/* Visual background atmospheric elements */}
      <div className="absolute top-0 left-0 right-0 h-[250px] bg-blue-950/10 brightness-50 filter blur-3xl pointer-events-none z-0"></div>

      {/* Primary Top Header Area - Styled as the Immersive UI Nav Header */}
      <header className="bg-immersive-nav border-b border-blue-900/30 w-full relative z-10 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch justify-between divide-y md:divide-y-0 md:divide-x divide-blue-900/20">
          
          {/* Left part: Title, Launcher Logo, Version info */}
          <div className="flex flex-1 items-center gap-4 p-5 md:p-6">
            <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.45)]">
              <span className="text-white font-bold font-display text-sm tracking-widest">AD</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase text-blue-400 font-mono tracking-wider font-bold">Simulation Sandbox Hub</span>
              <h1 className="text-lg md:text-xl font-display font-bold text-white tracking-wide uppercase leading-tight" id="applet-title">
                AnkiDroid Plugin Engine
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">v2.1.0-alpha • QuickJS Secure Runtime</p>
            </div>
          </div>

          {/* Middle part: Real paragraph description */}
          <div className="flex-[1.5] flex items-center p-5 md:p-6 text-xs text-slate-400 leading-normal font-sans">
            <p>
              Analyze a concurrent multi-threaded QuickJS simulation. Test race conditions with mutex lock guards, write and compile custom plugins, and monitor localized Room SQLite tables dynamically in real-time.
            </p>
          </div>

          {/* Right part: System Load Indicator and Pill Badges */}
          <div className="flex items-center gap-6 p-5 md:p-6 shrink-0 bg-black/10 justify-between md:justify-start">
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[9px] uppercase text-slate-500 font-semibold tracking-wider font-mono">System Load</span>
              <div className="flex gap-1 mt-1.5">
                <div className="w-1 h-3.5 bg-blue-500"></div>
                <div className="w-1 h-3.5 bg-blue-500"></div>
                <div className="w-1 h-3.5 bg-blue-500"></div>
                <div className="w-1 h-3.5 bg-slate-700"></div>
                <div className="w-1 h-3.5 bg-slate-700"></div>
              </div>
            </div>
            
            <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 text-[11px] font-medium font-mono uppercase tracking-wider">Engine Online</span>
            </div>
          </div>

        </div>
      </header>

      {/* Quick Metrics stats runner bar inside main */}
      <div className="max-w-7xl mx-auto w-full px-6 md:px-8 pt-5 md:pt-6 flex flex-wrap gap-4 items-center justify-between z-10">
        <div className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">
          Diagnostic Real-Time Feeds:
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Lock Guard Pill indicator */}
          <div className="px-3.5 py-1.5 bg-immersive-panel border border-white/5 rounded-full flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <div className="text-[10px] font-mono text-slate-400">
              State: <span className="text-emerald-400 font-bold uppercase">Protected Locks</span>
            </div>
          </div>

          {/* Total Database Tables */}
          <div className="px-3.5 py-1.5 bg-immersive-panel border border-white/5 rounded-full flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-blue-400" />
            <div className="text-[10px] font-mono text-slate-400">
              Database rows: <span className="text-white font-semibold">{cards.length} Cards • {decks.length} Decks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Body section */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 overflow-hidden">
        
        {/* Left Column (lg:4): Android Compose Device Emulator with beautiful interface casing */}
        <div className="lg:col-span-4 flex flex-col items-center select-text">
          <div className="w-full">
            <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-slate-450 mb-3.5 flex items-center gap-1">
              <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
              Android Compose UI Shell
            </h3>
            <AndroidEmulator
              decks={decks}
              cards={cards}
              plugins={plugins}
              activeDeckId={activeDeckId}
              currentCardIndex={currentCardIndex}
              showAnswer={showAnswer}
              onSelectDeck={setActiveDeckId}
              onSetCurrentCardIndex={setCurrentCardIndex}
              onSetShowAnswer={setShowAnswer}
              onTogglePlugin={handleTogglePlugin}
              onAnswerSelected={handleAnswerSelected}
              onNotificationRaised={handleRaiseNotification}
              onModifyCard={handleModifyCard}
              onPluginStatusChange={handlePluginStatusChange}
              onLogBridgeAction={handleLogBridgeAction}
              onSelectStudioTab={setStudioTab}
              onSetActivePluginId={setActivePluginId}
            />
          </div>
        </div>

        {/* Right Column (lg:8): Tabs with different Developer studio terminals */}
        <div className="lg:col-span-8 flex flex-col h-full gap-5">
          
          {/* Main Dashboard tabs selector */}
          <div className="flex bg-immersive-panel border border-white/5 p-1 rounded-2xl self-start">
            {[
              { id: 'locks', icon: Layers, label: 'Thread Lock Manager Engine' },
              { id: 'room', icon: Database, label: 'Room SQLite Diagnostic Tables' },
              { id: 'workspace', icon: Terminal, label: 'Secure QuickJS Script Editor' }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStudioTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-sans font-medium transition cursor-pointer flex items-center gap-2 ${
                    studioTab === tab.id 
                      ? 'bg-blue-600/10 text-blue-400 shadow-md border border-blue-500/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  id={`studio-tab-selector-${tab.id}`}
                >
                  <Icon className="h-4 w-4 stroke-[1.8]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic tabs render wrapper */}
          <div className="flex-1 min-h-[500px]">
            {studioTab === 'locks' && (
              <LockVisualizer
                activePlugins={plugins}
                onLogBridgeAction={handleLogBridgeAction}
              />
            )}

            {studioTab === 'room' && (
              <RoomConsole
                decks={decks}
                cards={cards}
                plugins={plugins}
                bridgeLogs={bridgeLogs}
                onAddCard={handleAddCard}
                onModifyCard={handleModifyCard}
              />
            )}

            {studioTab === 'workspace' && (
              <CodeWorkspace
                plugins={plugins}
                activePluginId={activePluginId}
                onSelectPlugin={setActivePluginId}
                onUpdatePluginCode={handleUpdatePluginCode}
                onAddPlugin={handleAddPlugin}
              />
            )}
          </div>

        </div>

      </main>

      {/* Dynamic Overlaid Floating Android notifications alerts block */}
      <div className="fixed top-6 right-6 z-[1000] flex flex-col gap-3 max-w-sm pointer-events-none select-text">
        <AnimatePresence>
          {phoneNotifications.map(snack => (
            <motion.div
              key={snack.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              className="bg-slate-905 border border-indigo-500/20 shadow-2xl p-4 rounded-2xl flex items-start gap-3 bg-slate-900/95 backdrop-blur-md"
            >
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5 animate-pulse">
                <BellRing className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Android Event Bus Notification</span>
                <p className="text-xs text-slate-250 font-sans tracking-tight">
                  {snack.message}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Humble craft metadata footer */}
      <footer className="bg-immersive-nav border-t border-white/5 py-4 px-8 mt-auto z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-mono">
          <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
            <span className="text-slate-600 font-bold uppercase tracking-wider text-[9px] border border-blue-900/30 px-1.5 py-0.5 rounded">JETPACK COMPOSE COMPATIBLE</span>
            <span className="text-slate-700">|</span>
            <span>QUICKJS_VER: 2021-03-27</span>
            <span className="text-slate-700">|</span>
            <span>AnkiDroid QuickJS Platform Simulation • 2026</span>
          </div>
          <div className="flex items-center gap-4 text-blue-500/85 font-mono font-bold uppercase tracking-widest italic text-[9px]">
            Secure Sandbox Runtime
          </div>
        </div>
      </footer>

    </div>
  );
}
