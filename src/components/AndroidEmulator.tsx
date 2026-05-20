/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Card, Deck, Plugin } from '../types';
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
  ArrowRight
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
  onNotificationRaised
}: AndroidEmulatorProps) {

  const [emulatorTab, setEmulatorTab] = useState<'app' | 'plugins'>('app');
  
  // Find current deck active cards
  const deckCards = activeDeckId ? cards.filter(c => c.deckId === activeDeckId) : [];
  const currentCard = deckCards[currentCardIndex] || null;
  const currentDeck = decks.find(d => d.id === activeDeckId);

  // Quick helper to run simulated plugin onCardLoad hook on the current card
  const getProcessedCardData = (baseCard: Card | null): { card: Card | null; logs: string[] } => {
    if (!baseCard) return { card: null, logs: [] };
    
    // Copy base card
    let finalCard = JSON.parse(JSON.stringify(baseCard));
    const localLogs: string[] = [];

    // Apply active 'onCardLoad' plugins
    plugins.filter(p => p.isEnabled && p.hookType === 'onCardLoad').forEach(p => {
      localLogs.push(`Running plugin: ${p.name}`);
      
      // Simulation of Romaji Assistant logic
      if (p.id === 'plugin-romaji-auto' && finalCard.deckId === 'deck-1') {
        const fields = finalCard.customFields || {};
        if (!fields.romaji) {
          let romanized = "taberu";
          if (finalCard.front.includes("食べる")) romanized = "taberu";
          else if (finalCard.front.includes("水")) romanized = "mizu";
          else if (finalCard.front.includes("猫")) romanized = "neko";
          else if (finalCard.front.includes("赤い")) romanized = "akai";
          else if (finalCard.front.includes("先生")) romanized = "sensei";
          
          fields.romaji = romanized;
          fields.plugin_generated_phonetic_scaffold = "yes";
          finalCard.customFields = fields;
          localLogs.push(`Transliterated text into romaji: "${romanized}" in isolated sandbox.`);
        }
      }

      // Simulation of Cardiac Hyperlinker
      if (p.id === 'plugin-med-hyperlinker' && finalCard.deckId === 'deck-2') {
        const backText = finalCard.back || "";
        if (backText.toLowerCase().includes("infarction") || backText.toLowerCase().includes("bradycardia")) {
          const fields = finalCard.customFields || {};
          fields.clinical_guidelines = "https://www.acc.org/guidelines";
          fields.emergency_protocol = "Administer oxygen, ECG monitoring, Aspirin 325mg stat, contact STEMI team.";
          fields.auto_rendered_diagnostic_hint = "⚠️ Clinical emergency protocols available.";
          finalCard.customFields = fields;
          localLogs.push("Injected critical cardiologist diagnosis anchors into memory.");
        }
      }

      // Simulation of Layout beautification
      if (p.id === 'plugin-md-markdown' && finalCard.back && finalCard.back.includes("Systole vs Diastole")) {
        const fields = finalCard.customFields || {};
        fields.formatted_html_badge = "<span style='color: #4f46e5; font-weight: bold;'>⚡ Systole Contraction</span> vs <span style='color: #0891b2; font-weight: bold;'>💧 Diastole Relaxation</span>";
        finalCard.customFields = fields;
        localLogs.push("Transpiled Markdown elements into visual HTML representations.");
      }
    });

    return { card: finalCard, logs: localLogs };
  };

  const { card: processedCard } = getProcessedCardData(currentCard);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-sm mx-auto" id="android-device-emulator">
      
      {/* Visual phone casing */}
      <div className="relative w-full aspect-[9/19] max-h-[760px] bg-slate-950 rounded-[48px] border-8 border-slate-800 shadow-2xl p-3 flex flex-col overflow-hidden">
        
        {/* Dynamic Notch speaker sensor lock */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-5 w-36 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
          <div className="h-1.5 w-12 bg-slate-900 rounded-full"></div>
        </div>

        {/* Outer UI Android OS Status Line */}
        <div className="flex justify-between items-center px-6 pt-1 pb-2 text-[10px] font-semibold text-slate-400 font-sans tracking-wide select-none z-10 bg-slate-950 mt-1">
          <span>12:42 PM</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="h-3 w-3 text-emerald-400" />
            <span className="text-[9px] font-medium bg-indigo-500/10 text-indigo-400 px-1 py-0.2 rounded font-mono">QJS v2.4</span>
            <Battery className="h-3 w-3 text-slate-400" />
          </div>
        </div>

        {/* Nested App Screen Shell container */}
        <div className="flex-1 bg-slate-900 rounded-[35px] overflow-hidden flex flex-col relative border border-slate-800">
          
          {/* Internal App Navigation header */}
          <div className="py-3 px-4 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between select-none">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              <h3 className="text-xs font-mono font-bold tracking-tight text-slate-200">
                AnkiDroid Core Mini
              </h3>
            </div>

            {/* Toggle internal app vs plugins manager screen */}
            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[9px] font-mono">
              <button 
                onClick={() => setEmulatorTab('app')}
                className={`px-2 py-1 rounded-md transition ${emulatorTab === 'app' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'}`}
              >
                App
              </button>
              <button 
                onClick={() => setEmulatorTab('plugins')}
                className={`px-2 py-1 rounded-md transition ${emulatorTab === 'plugins' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'}`}
                id="btn-phone-plugin-manager"
              >
                Plugins
              </button>
            </div>
          </div>

          {/* APP MODE: Active Android Deck view / Review view */}
          {emulatorTab === 'app' && (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-slate-900 selection:bg-indigo-900/30">
              
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
                            className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 hover:border-indigo-500/50 cursor-pointer transition flex items-center justify-between group"
                            id={`em-deck-row-${deck.id}`}
                          >
                            <div className="space-y-1 max-w-[80%]">
                              <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition truncate block">
                                {deck.name}
                              </span>
                              <span className="text-[9px] text-slate-455 block truncate">
                                {deck.description}
                              </span>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="text-xs font-mono font-bold text-emerald-450 bg-emerald-500/10 border border-emerald-450/20 px-2 py-0.5 rounded-lg">
                                {deckCardCount} cards
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800 text-[10px] text-slate-455 leading-normal space-y-1.5 font-mono text-center">
                    <BookOpen className="h-4 w-4 text-indigo-400 mx-auto" />
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
                      className="text-[10px] font-semibold text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer py-1"
                      id="btn-phone-back-to-decks"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Decks list
                    </button>

                    <div className="text-center mt-3 mb-4">
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                        {currentDeck?.name}
                      </span>
                      <div className="text-[10px] text-slate-450 mt-1 font-mono">
                        Card {currentCardIndex + 1} of {deckCards.length}
                      </div>
                    </div>

                    {/* FLASH CARD RENDER BOX */}
                    {processedCard ? (
                      <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 shadow-xl relative min-h-[180px] flex flex-col justify-between">
                        
                        {/* Front Field content */}
                        <div className="text-center space-y-2">
                          <span className="text-[9px] font-mono uppercase text-slate-500 block">CARD FRONT</span>
                          <h3 className="text-lg font-sans font-semibold text-slate-100 select-all">
                            {processedCard.front}
                          </h3>
                          
                          {/* Transliterated helper injection (Romaji assistant) */}
                          {processedCard.customFields?.romaji && (
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-[10px] font-mono text-indigo-300">
                              <span>romaji:</span>
                              <span className="font-bold">{processedCard.customFields.romaji}</span>
                            </div>
                          )}
                        </div>

                        {/* Back block rendered optionally upon showAnswer tag */}
                        {!showAnswer ? (
                          <button
                            onClick={() => onSetShowAnswer(true)}
                            className="mt-6 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition duration-150 active:scale-95"
                            id="btn-phone-show-answer"
                          >
                            Tap to Show Answer
                          </button>
                        ) : (
                          <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-3.5">
                            <div className="text-center">
                              <span className="text-[9px] font-mono uppercase text-slate-500 block">CARD BACK</span>
                              
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
                                <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-400/20 px-2 py-0.5 rounded-full font-mono">
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

                        {/* Extra indicators */}
                        {plugins.some(p => p.isEnabled && p.hookType === 'onCardLoad') && (
                          <div className="absolute top-2 right-2 text-[8px] text-emerald-400 flex items-center gap-1 font-mono uppercase">
                            <Cpu className="h-2.5 w-2.5" /> Hook sandbox active
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
                    <div className="mt-4 bg-slate-950 p-2.5 rounded-2xl border border-slate-850 grid grid-cols-4 gap-1.5 select-none select-text">
                      {[
                        { rate: 1, label: 'Again', color: 'hover:bg-rose-500/15 text-rose-300 border-rose-500/30' },
                        { rate: 2, label: 'Hard', color: 'hover:bg-amber-500/15 text-amber-300 border-amber-500/30' },
                        { rate: 3, label: 'Good', color: 'hover:bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
                        { rate: 4, label: 'Easy', color: 'hover:bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
                      ].map(btn => (
                        <button
                          key={btn.rate}
                          onClick={() => onAnswerSelected(btn.rate)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border text-[10px] font-mono leading-none transition-all active:scale-[0.9] cursor-pointer ${btn.color}`}
                          id={`em-rating-button-${btn.rate}`}
                        >
                          <span className="font-bold">{btn.rate}</span>
                          <span className="text-[9px] mt-1 opacity-80">{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-[9px] text-slate-455 text-center mt-3 font-mono leading-tight">
                    Selecting Again/Easy triggers Kotlin concurrent Mutex maps to write updates safely.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* PLUGINS MODE: Phone list of available plugins */}
          {emulatorTab === 'plugins' && (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-slate-900">
              <div className="mb-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-450">Installed Plugins</h4>
                <p className="text-[9px] text-slate-455">Strict permission-gated QuickJS runtime</p>
              </div>

              {/* Plugins lists */}
              <div className="space-y-3 flex-1">
                {plugins.map((plugin) => (
                  <div 
                    key={plugin.id}
                    className="p-3 bg-slate-950 rounded-2xl border border-slate-850 hover:border-slate-800 transition flex flex-col gap-2 relative overflow-hidden"
                    id={`phone-plugin-card-${plugin.id}`}
                  >
                    
                    {/* Plugin title & Toggle switch */}
                    <div className="flex items-start justify-between">
                      <div className="max-w-[70%]">
                        <span className="text-xs font-semibold text-slate-200 block truncate leading-tight">
                          {plugin.name}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          v{plugin.version} • {plugin.author}
                        </span>
                      </div>

                      {/* IOS Styled toggler Switch */}
                      <button
                        onClick={() => onTogglePlugin(plugin.id)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                          plugin.isEnabled ? 'bg-emerald-600' : 'bg-slate-800'
                        }`}
                        id={`phone-plugin-switch-${plugin.id}`}
                      >
                        <div className={`h-4 w-4 rounded-full bg-white transition-transform transform ${
                          plugin.isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <p className="text-[9px] text-slate-400 font-sans leading-relaxed">
                      {plugin.description}
                    </p>

                    {/* Locks requirements banner mapping to debugger */}
                    <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-900/80 mt-1">
                      <span className="text-[8px] font-mono text-indigo-400 font-bold uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                        <Lock className="h-2 w-2" />
                        Locks req: [{plugin.requiredLocks.join(', ')}]
                      </span>
                    </div>

                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-slate-950/40 border border-slate-800 text-[9px] font-mono text-slate-455 text-center leading-normal">
                No direct Android API permissions are ever provided to sandbox JS payloads. Custom secure channels are locked as mutex endpoints.
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
