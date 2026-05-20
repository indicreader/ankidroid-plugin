/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, Deck, Plugin } from '../types';
import { executePluginSandbox } from '../lib/SandboxExecutor';
import { 
  Smartphone, 
  Wifi, 
  Battery, 
  SlidersHorizontal,
  ChevronLeft, 
  Inbox, 
  Layers, 
  Cpu, 
  HelpCircle, 
  BookOpen, 
  Settings, 
  BellRing,
  Award,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertTriangle,
  Play,
  Activity,
  Code,
  X,
  Search,
  Check
} from 'lucide-react';

interface AndroidEmulatorProps {
  decks: Deck[];
  cards: Card[];
  plugins: Plugin[];
  activeDeckId: string | null;
  currentCardIndex: number;
  showAnswer: boolean;
  onSelectDeck: (deckId: string | null) => void;
  onSetCurrentCardIndex: (index: number) => void;
  onSetShowAnswer: (show: boolean) => void;
  onTogglePlugin: (pluginId: string) => void;
  onAnswerSelected: (rating: number) => void;
  onNotificationRaised: (msg: string) => void;
  // Secure dynamic extensions
  onModifyCard: (card: Card) => void;
  onPluginStatusChange?: (pluginId: string, error: string | null, errorLog?: string[]) => void;
  onLogBridgeAction: (pluginName: string, action: 'READ' | 'WRITE' | 'BLOCK' | 'LOG', details: string) => void;
  onSelectStudioTab?: (tab: 'locks' | 'room' | 'workspace') => void;
  onSetActivePluginId?: (pluginId: string) => void;
}

export default function AndroidEmulator({
  decks,
  cards,
  plugins,
  activeDeckId,
  currentCardIndex,
  showAnswer,
  onSelectDeck,
  onSetCurrentCardIndex,
  onSetShowAnswer,
  onTogglePlugin,
  onAnswerSelected,
  onNotificationRaised,
  onModifyCard,
  onPluginStatusChange,
  onLogBridgeAction,
  onSelectStudioTab,
  onSetActivePluginId
}: AndroidEmulatorProps) {

  // Navigation tab within simulated Android device
  const [emulatorTab, setEmulatorTab] = useState<'app' | 'plugins'>('app');
  
  // Plugins List Filter & Search states
  const [pluginFilter, setPluginFilter] = useState<'all' | 'active' | 'faulted'>('all');
  const [pluginSearchQuery, setPluginSearchQuery] = useState('');
  
  // Bottom drawer inspector state for reviewing crashes and diagnostic tracing
  const [diagnosticInspectorPlugin, setDiagnosticInspectorPlugin] = useState<Plugin | null>(null);

  // Core asynchronous card loader pipeline states
  const [processedCard, setProcessedCard] = useState<Card | null>(null);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const [isSandboxProcessing, setIsSandboxProcessing] = useState<boolean>(false);

  // Get active deck context files
  const deckCards = activeDeckId ? cards.filter(c => c.deckId === activeDeckId) : [];
  const currentCard = deckCards[currentCardIndex] || null;
  const currentDeck = decks.find(d => d.id === activeDeckId);

  // Asynchronous Sandboxed hook pipeline
  // Whenever active card or plugin configurations change, execute the loaders pipeline sequentially.
  useEffect(() => {
    let isCurrent = true;

    async function runOnCardLoadPipeline() {
      if (!currentCard) {
        if (isCurrent) {
          setProcessedCard(null);
          setActiveLogs([]);
        }
        return;
      }

      setIsSandboxProcessing(true);
      let cardAccumulator = JSON.parse(JSON.stringify(currentCard));
      const accumulatedLogs: string[] = [];

      // Sequentially pipe all enabled, non-error LOAD hooks
      const activeLoadPlugins = plugins.filter(p => p.isEnabled && p.hookType === 'onCardLoad');

      for (const p of activeLoadPlugins) {
        if (!isCurrent) break;
        accumulatedLogs.push(`[Host Engine] Dispatch async hook 'onCardLoad' ➔ '${p.name}'`);

        try {
          const result = await executePluginSandbox(
            'onCardLoad',
            { card: cardAccumulator },
            {
              plugin: p,
              cards,
              decks,
              onLogBridgeAction,
              onNotificationRaised,
              onUpdateCardRecord: (card) => {
                cardAccumulator = card;
                onModifyCard(card);
              }
            }
          );

          if (result.error) {
            accumulatedLogs.push(`🔴 [Plugin Interrupted] ${result.error}`);
            // Report crash to global plugin repository
            onPluginStatusChange?.(p.id, result.error, result.logs);
          } else {
            cardAccumulator = result.card;
            accumulatedLogs.push(...result.logs);
            accumulatedLogs.push(`✓ [Sandbox OK] Executed '${p.name}' cleanly.`);
          }
        } catch (err: any) {
          const errMsg = err.message || String(err);
          accumulatedLogs.push(`🔴 [Secure Sandbox Fault] ${errMsg}`);
          onPluginStatusChange?.(p.id, errMsg, [errMsg]);
        }
      }

      if (isCurrent) {
        setProcessedCard(cardAccumulator);
        setActiveLogs(accumulatedLogs);
        setIsSandboxProcessing(false);
      }
    }

    runOnCardLoadPipeline();

    return () => {
      isCurrent = false;
    };
  }, [currentCard, plugins, cards, decks, onLogBridgeAction, onNotificationRaised]);

  // Jump developer focus to QuickJS editor for targeted scripts repair
  const handleLaunchTargetRepair = (p: Plugin) => {
    setDiagnosticInspectorPlugin(null);
    onSelectStudioTab?.('workspace');
    onSetActivePluginId?.(p.id);
    onNotificationRaised(`Opened editor for "${p.name}".`);
  };

  // Filter plugins matching active manager selection
  const filteredPlugins = plugins.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(pluginSearchQuery.toLowerCase()) || 
                          p.author.toLowerCase().includes(pluginSearchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (pluginFilter === 'active') return p.isEnabled && !p.error;
    if (pluginFilter === 'faulted') return !!p.error;
    return true;
  });

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-sm mx-auto" id="android-device-emulator">
      
      {/* Visual phone casing */}
      <div className="relative w-full aspect-[9/19] max-h-[760px] bg-immersive-bg rounded-[48px] border-8 border-immersive-sidebar shadow-2xl p-3 flex flex-col overflow-hidden">
        
        {/* Dynamic Notch speaker sensor lock */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-5 w-36 bg-immersive-sidebar rounded-b-2xl z-50 flex items-center justify-center">
          <div className="h-1.5 w-12 bg-[#050608] rounded-full"></div>
        </div>

        {/* Outer UI Android OS Status Line */}
        <div className="flex justify-between items-center px-6 pt-1 pb-2 text-[10px] font-semibold text-slate-400 font-sans tracking-wide select-none z-10 bg-immersive-bg mt-1">
          <span>12:42 PM</span>
          <div className="flex items-center gap-1.5 align-middle">
            <Wifi className="h-3 w-3 text-emerald-400" />
            <span className="text-[9px] font-medium bg-blue-500/10 text-blue-400 px-1 py-0.2 rounded font-mono">QJS v2.4</span>
            <Battery className="h-3 w-3 text-slate-400" />
          </div>
        </div>

        {/* Nested App Screen Shell container */}
        <div className="flex-1 bg-immersive-sidebar rounded-[35px] overflow-hidden flex flex-col relative border border-white/5">
          
          {/* Internal App Navigation header */}
          <div className="py-3 px-4 bg-immersive-nav border-b border-white/5 flex items-center justify-between select-none shrink-0 z-10">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-blue-400 animate-pulse" />
              <h3 className="text-xs font-mono font-bold tracking-tight text-white">
                AnkiDroid Core API
              </h3>
            </div>

            {/* Toggle internal app vs plugins manager screen */}
            <div className="flex bg-immersive-bg border border-white/5 p-0.5 rounded-lg text-[9px] font-mono">
              <button 
                onClick={() => setEmulatorTab('app')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${emulatorTab === 'app' ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/10' : 'text-slate-400 hover:text-slate-200'}`}
              >
                App
              </button>
              <button 
                onClick={() => setEmulatorTab('plugins')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${emulatorTab === 'plugins' ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/10' : 'text-slate-400 hover:text-slate-200'}`}
                id="btn-phone-plugin-manager"
              >
                Plugins
              </button>
            </div>
          </div>

          {/* APP MODE: Active Android Deck view / Review view */}
          {emulatorTab === 'app' && (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-immersive-sidebar selection:bg-blue-500/20">
              
              {/* Context Deck selector view */}
              {!activeDeckId ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-center py-2.5">
                      <h4 className="text-sm font-sans font-bold text-slate-100">Select Review Deck</h4>
                      <p className="text-[10px] text-slate-400">Jetpack Compose dynamic M3 cards</p>
                    </div>

                    {/* Card grid list */}
                    <div className="space-y-3">
                      {decks.map(deck => {
                        const deckCardCount = cards.filter(c => c.deckId === deck.id).length;
                        return (
                          <div
                            key={deck.id}
                            onClick={() => onSelectDeck(deck.id)}
                            className="p-3.5 rounded-2xl bg-immersive-panel/90 border border-white/5 hover:border-blue-500/50 hover:shadow-[0_0_12px_rgba(59,130,246,0.1)] cursor-pointer transition flex items-center justify-between group"
                            id={`em-deck-row-${deck.id}`}
                          >
                            <div className="space-y-1 max-w-[80%]">
                              <span className="text-xs font-semibold text-white group-hover:text-blue-400 transition truncate block">
                                {deck.name}
                              </span>
                              <span className="text-[9px] text-slate-500 block truncate">
                                {deck.description}
                              </span>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="text-xs font-mono font-bold text-emerald-405 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                                {deckCardCount} cards
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-immersive-nav/50 border border-white/5 text-[10px] text-slate-500 leading-normal space-y-1.5 font-mono text-center">
                    <BookOpen className="h-4 w-4 text-blue-400 mx-auto" />
                    <p>Changes in Room DB updates decks instantly inside the simulator.</p>
                  </div>
                </div>
              ) : (
                /* DECK FLIP REVIEW VIEW MODE */
                <div className="flex-1 flex flex-col justify-between h-full">
                  <div>
                    {/* Header bar back to list */}
                    <button
                      onClick={() => {
                        onSelectDeck(null);
                        onSetShowAnswer(false);
                        onSetCurrentCardIndex(0);
                      }}
                      className="text-[10px] font-semibold text-blue-400 flex items-center gap-1 hover:underline cursor-pointer py-1"
                      id="btn-phone-back-to-decks"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Decks list
                    </button>

                    <div className="text-center mt-3 mb-4">
                      <span className="text-[10px] font-mono text-slate-450 font-bold uppercase tracking-widest bg-[#050608] px-2.5 py-1 rounded-full border border-white/5">
                        {currentDeck?.name}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        Card {currentCardIndex + 1} of {deckCards.length}
                      </div>
                    </div>

                    {/* FLASH CARD RENDER BOX */}
                    {processedCard ? (
                      <div className="bg-immersive-panel border border-white/5 rounded-2xl p-4.5 shadow-xl relative min-h-[190px] flex flex-col justify-between">
                        
                        {/* Front Field content */}
                        <div className="text-center space-y-2">
                          <span className="text-[9px] font-mono uppercase text-slate-500 block font-bold text-center">CARD FRONT</span>
                          <h3 className="text-lg font-sans font-semibold text-white select-all">
                            {processedCard.front}
                          </h3>
                          
                          {/* Transliterated helper injection (Romaji assistant) */}
                          {processedCard.customFields?.romaji && (
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-[10px] font-mono text-blue-300 mx-auto">
                              <span>romaji:</span>
                              <span className="font-bold">{processedCard.customFields.romaji}</span>
                            </div>
                          )}
                        </div>

                        {/* Back block rendered optionally upon showAnswer tag */}
                        {!showAnswer ? (
                          <button
                            onClick={() => onSetShowAnswer(true)}
                            className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition duration-150 active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] border border-blue-500/40"
                            id="btn-phone-show-answer"
                          >
                            Tap to Show Answer
                          </button>
                        ) : (
                          <div className="border-t border-white/5 pt-4 mt-4 space-y-3.5">
                            <div className="text-center">
                              <span className="text-[9px] font-mono uppercase text-slate-500 block font-bold text-center">CARD BACK</span>
                              
                              {/* Clinical formatted table renderer or general default paragraph standard backing */}
                              {processedCard.customFields?.formatted_html_badge ? (
                                <div 
                                  className="text-xs text-slate-300 mt-1" 
                                  dangerouslySetInnerHTML={{ __html: processedCard.customFields.formatted_html_badge }} 
                                />
                              ) : (
                                <p className="text-xs text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed font-sans font-medium">
                                  {processedCard.back}
                                </p>
                              )}
                            </div>

                            {/* Medical emergencies guideline injected fields if present */}
                            {processedCard.customFields?.emergency_protocol && (
                              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] text-rose-300 leading-tight space-y-1 font-sans">
                                <span className="font-bold uppercase block text-rose-400">🚨 CLINICAL PROTOCOL (Plugin Injected):</span>
                                <p>{processedCard.customFields.emergency_protocol}</p>
                              </div>
                            )}

                            {/* Custom metadata logs stamp */}
                            <div className="flex flex-wrap gap-1 justify-center pt-2">
                              {processedCard.customFields?.scheduler_type && (
                                <span className="text-[8px] bg-blue-505 bg-blue-500/10 text-blue-400 border border-blue-400/20 px-2 py-0.5 rounded-full font-mono">
                                  ⚡ Scheduler: {processedCard.customFields.scheduler_type}
                                </span>
                              )}
                              {processedCard.customFields?.last_ratingStr && (
                                <span className="text-[8px] bg-teal-500/10 text-teal-450 border border-teal-450/20 px-2 py-0.5 rounded-full font-mono">
                                  Rating: {processedCard.customFields.last_ratingStr}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Sandbox active loading indicators */}
                        {isSandboxProcessing && (
                          <div className="absolute top-2 right-2 text-[8px] text-blue-400 flex items-center gap-1 font-mono uppercase bg-blue-900/10 px-1.5 py-0.5 rounded">
                            <SlidersHorizontal className="h-2 w-2 animate-spin" /> Sandboxing...
                          </div>
                        )}

                        {!isSandboxProcessing && plugins.some(p => p.isEnabled && p.hookType === 'onCardLoad') && (
                          <div className="absolute top-2 right-2 text-[8px] text-emerald-450 flex items-center gap-1 font-mono uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            <Cpu className="h-2.5 w-2.5 animate-pulse" /> Sandbox active
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-500 text-xs">
                        No cards ready for study in this deck review loop.
                      </div>
                    )}
                  </div>

                  {/* Rating response buttons if card is shown */}
                  {processedCard && showAnswer && (
                    <div className="mt-4 bg-immersive-nav p-2.5 rounded-2xl border border-white/5 grid grid-cols-4 gap-1.5 select-none select-text">
                      {[
                        { rate: 1, label: 'Again', color: 'hover:bg-rose-500/15 text-rose-300 border-rose-500/20' },
                        { rate: 2, label: 'Hard', color: 'hover:bg-amber-500/15 text-amber-300 border-amber-500/20' },
                        { rate: 3, label: 'Good', color: 'hover:bg-blue-500/15 text-blue-300 border-blue-500/20' },
                        { rate: 4, label: 'Easy', color: 'hover:bg-emerald-500/15 text-emerald-300 border-emerald-500/20' }
                      ].map(btn => (
                        <button
                          key={btn.rate}
                          onClick={() => onAnswerSelected(btn.rate)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl bg-immersive-panel border border-white/5 text-[10px] font-mono leading-none transition-all active:scale-[0.9] cursor-pointer ${btn.color}`}
                          id={`em-rating-button-${btn.rate}`}
                        >
                          <span className="font-bold">{btn.rate}</span>
                          <span className="text-[9px] mt-1 opacity-80">{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-[9px] text-slate-500 text-center mt-3 font-mono leading-tight">
                    Selecting Again/Easy triggers Kotlin concurrent Mutex maps to write updates safely.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* PLUGINS MODE: Secure Plugin Manager UI list Screen with Filters & Crash Logs */}
          {emulatorTab === 'plugins' && (
            <div className="flex-1 flex flex-col bg-immersive-sidebar overflow-hidden">
              
              {/* Screen Top Header search bar and filter pills */}
              <div className="p-3 bg-immersive-nav border-b border-white/5 space-y-2.5 shrink-0 select-none">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">Secure Plugin Registry</h4>
                  <p className="text-[9px] text-slate-450 leading-relaxed">System-isolated sandbox execution with strict access checks</p>
                </div>

                {/* Filter and Search controls */}
                <div className="space-y-1.5 focus:outline-none">
                  {/* Search input tab */}
                  <div className="relative">
                    <Search className="h-3 w-3 absolute top-2.5 left-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search plugins..."
                      spellCheck={false}
                      value={pluginSearchQuery}
                      onChange={(e) => setPluginSearchQuery(e.target.value)}
                      className="w-full bg-[#050608]/70 border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-[10px] placeholder-slate-500 text-slate-350 focus:outline-none focus:border-blue-500/80 transition"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex gap-1.5 pt-0.5">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'active', label: 'Active' },
                      { id: 'faulted', label: 'Faulted 🔴' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setPluginFilter(tab.id as any)}
                        className={`text-[9px] font-mono px-2.5 py-1 rounded-full border transition cursor-pointer ${
                          pluginFilter === tab.id 
                            ? 'bg-blue-600/10 border-blue-500/40 text-blue-300' 
                            : 'bg-transparent border-white/5 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic scrollable plugin cards lists */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-8">
                {filteredPlugins.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 space-y-1 select-none">
                    <Inbox className="h-6 w-6 stroke-[1.5] text-slate-600" />
                    <p className="text-[10px] font-mono">No matching plugins found.</p>
                  </div>
                ) : (
                  filteredPlugins.map((plugin) => {
                    const isFaulted = !!plugin.error;
                    const isFullyAcquired = plugin.isEnabled && !isFaulted;
                    
                    return (
                      <div 
                        key={plugin.id}
                        className={`p-3 bg-immersive-panel rounded-2xl border transition flex flex-col gap-2 relative overflow-hidden ${
                          isFaulted 
                            ? 'border-rose-500/25 shadow-[0_0_10px_rgba(244,63,94,0.05)] bg-rose-950/10' 
                            : isFullyAcquired 
                            ? 'border-emerald-500/20 hover:border-emerald-500/35 bg-[#0a0f12]/40' 
                            : 'border-white/5 hover:border-blue-500/30'
                        }`}
                        id={`phone-plugin-card-${plugin.id}`}
                      >
                        
                        {/* Title & ios switcher */}
                        <div className="flex items-start justify-between gap-3 select-none">
                          <div className="max-w-[70%]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-white block truncate leading-tight">
                                {plugin.name}
                              </span>
                              
                              {/* Mini hook tag */}
                              <span className="text-[8px] bg-slate-900 border border-white/10 px-1 py-0.2 rounded text-slate-400 shrink-0 font-mono">
                                {plugin.hookType === 'onCardLoad' ? 'LOAD' : 'SCHED'}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono">
                              v{plugin.version} • {plugin.author}
                            </span>
                          </div>

                          {/* Switch toggle with active/disabled state resets */}
                          <button
                            onClick={() => onTogglePlugin(plugin.id)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                              plugin.isEnabled ? 'bg-emerald-600' : 'bg-[#050608] border border-white/5'
                            }`}
                            id={`phone-plugin-switch-${plugin.id}`}
                          >
                            <div className={`h-4 w-4 rounded-full bg-white transition-transform transform ${
                              plugin.isEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>

                        {/* Status indicators */}
                        <div className="flex items-center gap-1.5 text-[8.5px] font-mono uppercase select-none">
                          {isFaulted ? (
                            <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 font-bold flex items-center gap-1">
                              <AlertTriangle className="h-2.5 w-2.5 animate-pulse text-rose-400" />
                              Platform Error
                            </span>
                          ) : plugin.isEnabled ? (
                            <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                              Active Sandbox
                            </span>
                          ) : (
                            <span className="text-slate-500 bg-[#050608] px-1.5 py-0.5 rounded border border-white/5 font-medium">
                              Inactive
                            </span>
                          )}
                        </div>

                        <p className="text-[9.5px] text-slate-350 font-sans leading-relaxed">
                          {plugin.description}
                        </p>

                        {/* Crash logs click link panel */}
                        {isFaulted && (
                          <div className="bg-rose-500/5 border border-rose-500/15 p-2 rounded-xl text-[9px] font-mono text-rose-350 space-y-1.5 mt-1">
                            <span className="font-bold text-rose-400 uppercase tracking-wide block">Fatal System Trap:</span>
                            <p className="truncate text-slate-300 leading-tight select-all">{plugin.error}</p>
                            
                            <div className="flex gap-2 pt-1 border-t border-rose-950/20">
                              <button 
                                onClick={() => setDiagnosticInspectorPlugin(plugin)}
                                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                Try Diagnostic Inspector ⇗
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Lock requirement tags */}
                        {!isFaulted && (
                          <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-white/5 mt-1 select-none">
                            <span className="text-[8px] font-mono text-blue-400 font-bold uppercase bg-blue-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                              <Lock className="h-2 w-2" />
                              Required Locks: [{plugin.requiredLocks.join(', ')}]
                            </span>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>

              <div className="shrink-0 p-3 bg-immersive-panel/50 border-t border-white/5 text-[9px] font-mono text-slate-500 text-center leading-normal select-none">
                No direct Android native APIs are provided. Plugins use secure sandbox bridge wrappers to access Room tables asynchronously.
              </div>
            </div>
          )}

        </div>

        {/* Dynamic bottom absolute overlay sheet drawer: Sandbox Diagnostic Crash Logs Inspector */}
        {diagnosticInspectorPlugin && (
          <div className="absolute inset-x-3 bottom-3 top-16 bg-slate-900 border border-slate-800 rounded-b-[38px] rounded-t-3xl z-40 flex flex-col overflow-hidden animate-slide-up shadow-2xl">
            
            {/* Analyzer Title */}
            <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-sans text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Compiler & Sandbox Inspector</span>
              </div>
              <button 
                onClick={() => setDiagnosticInspectorPlugin(null)}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>

            {/* Diagnostics Report body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <span className="text-[9px] font-mono uppercase text-slate-450 block font-semibold mb-1">Affiliated Plugin</span>
                <h5 className="text-xs font-bold text-slate-100">{diagnosticInspectorPlugin.name}</h5>
                <span className="text-[9px] font-mono bg-rose-500/10 border border-rose-500/20 font-bold text-rose-400 px-1.5 py-0.5 rounded block mt-1.5 w-fit">
                  Type check fail • QJS Sandbox Safe Halt
                </span>
              </div>

              {/* User friendly troubleshooting hint based on error text content */}
              <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 text-[10.5px] leading-relaxed text-slate-300">
                <span className="font-bold text-rose-400 block uppercase mb-1">Human-Friendly Diagnostic:</span>
                {diagnosticInspectorPlugin.error?.includes('LockConflictException') ? (
                  <p>
                    This plug-in failed because it tried to access card records without acquiring the synchronization mutex lock <b>&quot;cards&quot;</b>. To fix this, open the script editor and add <b>&quot;cards&quot;</b> to the locks declaration.
                  </p>
                ) : diagnosticInspectorPlugin.error?.includes('SecurityException') ? (
                  <p>
                    The plugin invoked a privileged API method that was blocked due to missing permissions in its configuration (e.g., trying to write to cards but missing the <b>WRITE_CARDS</b> permission). Update the permissions manifest in the script workspace.
                  </p>
                ) : (
                  <p>
                    We found a syntax compilation or runtime exception inside the plugin body. Review the code syntax, brackets layout, and ensure you are returning processed models in your callback function correctly.
                  </p>
                )}
              </div>

              {/* Full trace log */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono uppercase text-slate-450 block font-semibold">Sandbox Execution Logs Trace:</span>
                <div className="bg-[#050608] border border-slate-850 rounded-xl p-3 text-[9.5px] font-mono text-indigo-250 leading-relaxed space-y-1 select-text">
                  {diagnosticInspectorPlugin.errorLog && diagnosticInspectorPlugin.errorLog.length > 0 ? (
                    diagnosticInspectorPlugin.errorLog.map((log, lIdx) => (
                      <div key={lIdx} className="border-b border-white/5 py-0.5 last:border-0 truncate">
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic py-3 text-center">No trace events captured.</div>
                  )}
                  <div className="text-rose-401 font-semibold border-t border-rose-950/40 pt-1 mt-1 text-slate-200">
                    Error trace: {diagnosticInspectorPlugin.error}
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions drawer footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-850 flex gap-2">
              <button
                onClick={() => handleLaunchTargetRepair(diagnosticInspectorPlugin)}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10.5px] py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Code className="h-3.5 w-3.5" /> Fix in Secure Workspace
              </button>
              <button
                onClick={() => setDiagnosticInspectorPlugin(null)}
                className="bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 text-[10.5px] font-semibold px-4.5 py-2 rounded-xl transition border border-slate-800 cursor-pointer"
              >
                Dismiss
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
