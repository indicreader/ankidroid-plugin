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
    const notifyId = `notify-${Date.now()}`;
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
          `Toggled plugin state: ${nextEnabled ? 'ENABLED' : 'DISABLED'}`
        );
        handleRaiseNotification(`Plugin "${p.name}" is now ${nextEnabled ? 'enabled' : 'disabled'}.`);
        return { ...p, isEnabled: nextEnabled };
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
        return { ...p, code };
      }
      return p;
    }));
  };

  // Adding a card directly in Room SQLite console
  const handleAddCard = (
    deckId: string, 
    front: string, 
    back: string, 
    customFields?: Record<string, string>
  ) => {
    const newId = `card-${deckId.split('-')[1]}-${Date.now()}`;
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
  const handleAnswerSelected = (rating: number) => {
    // Collect active deck files
    const activeDeckCards = cards.filter(c => c.deckId === activeDeckId);
    const activeCard = activeDeckCards[currentCardIndex];
    if (!activeCard) return;

    let modifiedCard = { ...activeCard };
    
    // Check if Leitner Scheduler plugin is active
    const schedulerPlugin = plugins.find(p => p.id === 'plugin-leitner-scheduler' && p.isEnabled);

    if (schedulerPlugin) {
      handleLogBridgeAction(
        schedulerPlugin.name,
        'READ',
        `Acquired Mutex cards, user. Running Custom scheduler logic.`
      );

      // Apply Leitner logic
      let ease = modifiedCard.easeFactor;
      let interval = modifiedCard.intervalDays;
      let reps = modifiedCard.repetitions;

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

      const fields = modifiedCard.customFields || {};
      fields.scheduler_type = "Custom Leitner Exp";
      fields.last_ratingStr = ["", "Again", "Hard", "Good", "Easy"][rating];
      fields.calculated_ease = ease.toString();

      modifiedCard.easeFactor = ease;
      modifiedCard.intervalDays = interval;
      modifiedCard.repetitions = reps;
      modifiedCard.customFields = fields;

      handleLogBridgeAction(
        schedulerPlugin.name,
        'WRITE',
        `Room sqlite UPDATE: Set easeFactor=${ease}, intervalDays=${interval} for card: '${modifiedCard.front}'`
      );

      handleRaiseNotification(`Leitner Opt: next review in ${interval} days!`);
    } else {
      // Default standard SM-2 intervals logic if no scheduler is active
      const ratingStrs = ["", "Again", "Hard", "Good", "Easy"];
      handleLogBridgeAction(
        "Standard SM-2 Engine",
        'WRITE',
        `Standard Rating updated [${ratingStrs[rating]}] for card ${modifiedCard.id}.`
      );
      handleRaiseNotification(`SM-2 scheduling queued. Next review updated.`);
    }

    // Persist card updating state
    handleModifyCard(modifiedCard);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none selection:bg-indigo-650" id="main-applet-canvas">
      
      {/* Visual background atmospheric elements */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-indigo-900/10 brightness-75 filter blur-3xl pointer-events-none z-0"></div>

      {/* Primary Top Header Area */}
      <header className="p-6 md:p-8 border-b border-slate-900 relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
                Simulation Sandbox Hub
              </span>
            </div>
            <h1 className="text-3xl font-sans font-bold tracking-tight text-white mt-1.5" id="applet-title">
              AnkiDroid No-Code Plugin Ecosystem
            </h1>
            <p className="text-sm text-slate-400 font-sans max-w-2xl leading-relaxed">
              Analyze a concurrent multi-threaded JavaScript simulation in QuickJS. Double-test race conditions, write back custom plugins code, and observe real-time database schema visualizers safely without native Android namespaces risk.
            </p>
          </div>

          {/* Quick Metrics display */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Lock Guard Pill indicator */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="font-mono text-xs">
                <span className="text-slate-455 block leading-none uppercase text-[9px] font-bold tracking-wider">System State</span>
                <span className="text-emerald-400 font-semibold">Protected Locks</span>
              </div>
            </div>

            {/* Total Database Tables */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                <Database className="h-4 w-4" />
              </div>
              <div className="font-mono text-xs">
                <span className="text-slate-455 block leading-none uppercase text-[9px] font-bold tracking-wider">Dataset rows</span>
                <span className="text-slate-200 font-semibold">{cards.length} Cards • {decks.length} Decks</span>
              </div>
            </div>
          </div>
        </div>
      </header>

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
            />
          </div>
        </div>

        {/* Right Column (lg:8): Tabs with different Developer studio terminals */}
        <div className="lg:col-span-8 flex flex-col h-full gap-5">
          
          {/* Main Dashboard tabs selector */}
          <div className="flex bg-slate-900 border border-slate-800/80 p-1.5 rounded-2xl self-start">
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
                      ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/40 border border-slate-700/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
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
      <footer className="py-6 px-8 border-t border-slate-900 select-text max-w-7xl mx-auto w-full text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
        <div>
          AnkiDroid QuickJS Sandbox Platform Simulation • Built 2026.
        </div>
        <div className="flex gap-4">
          <span>Determinism Order Algorithm Guard</span>
          <span>SQLite Room Relations Map</span>
        </div>
      </footer>

    </div>
  );
}
