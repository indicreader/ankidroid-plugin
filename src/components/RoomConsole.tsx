/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Card, Deck, Plugin, BridgeLog } from '../types';
import { 
  Database, 
  Terminal, 
  Table, 
  Layers, 
  Search, 
  Edit3, 
  Plus, 
  Play, 
  CheckCircle, 
  ArrowRight,
  Sliders,
  Sparkles
} from 'lucide-react';

interface RoomConsoleProps {
  decks: Deck[];
  cards: Card[];
  plugins: Plugin[];
  bridgeLogs: BridgeLog[];
  onAddCard: (deckId: string, front: string, back: string, customFields?: Record<string, string>) => void;
  onModifyCard: (card: Card) => void;
}

export default function RoomConsole({ 
  decks, 
  cards, 
  plugins, 
  bridgeLogs,
  onAddCard,
  onModifyCard 
}: RoomConsoleProps) {
  
  const [activeTab, setActiveTab] = useState<'cards' | 'decks' | 'schema' | 'logs' | 'sql'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Card Add states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCardDeck, setNewCardDeck] = useState(decks[0]?.id || 'deck-1');
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [newCardHelper, setNewCardHelper] = useState('');

  // Mock SQL queries
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM cards WHERE intervalDays <= 3;');
  const [sqlResult, setSqlResult] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);

  // Trigger custom SQL query execution
  const executeSQL = () => {
    setSqlError(null);
    setSqlResult(null);
    
    const query = sqlQuery.toLowerCase().trim();
    
    try {
      if (query.startsWith('select * from cards')) {
        let result = [...cards];
        if (query.includes('where intervaldays <=')) {
          const match = query.match(/intervaldays\s*<=\s*(\d+)/);
          if (match) {
            const limit = parseInt(match[1]);
            result = result.filter(c => c.intervalDays <= limit);
          }
        } else if (query.includes('where deckid =')) {
          const match = query.match(/deckid\s*=\s*'([^']+)'/);
          if (match) {
            const dId = match[1];
            result = result.filter(c => c.deckId === dId);
          }
        }
        setSqlResult(result);
      } else if (query.startsWith('select * from decks')) {
        setSqlResult([...decks]);
      } else if (query.startsWith('select * from plugins')) {
        setSqlResult([...plugins]);
      } else {
        throw new Error("Syntax Error: Mock Room query analyzer only supports basic 'SELECT * FROM cards|decks|plugins' queries (with WHERE filters).");
      }
    } catch (err: any) {
      setSqlError(err.message || "Unknown SQLite parser compile exception");
    }
  };

  const handleCreateCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardFront.trim() || !newCardBack.trim()) return;
    
    // Add custom helper field if filled
    const cFields: Record<string, string> = {};
    if (newCardHelper.trim()) {
      cFields.notes = newCardHelper;
    }

    onAddCard(newCardDeck, newCardFront, newCardBack, cFields);
    setNewCardFront('');
    setNewCardBack('');
    setNewCardHelper('');
    setShowAddForm(false);
  };

  const filteredCards = cards.filter(c => 
    c.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.back.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full" id="room-console-wrapper">
      
      {/* DB Console Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-sans font-semibold tracking-tight text-slate-100 flex items-center gap-1.5">
              Room Relational Diagnostic DB
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-400/20">SQLite v3.45</span>
            </h2>
            <p className="text-xs text-slate-400">
              Inspect active database storage tables and entities updated in real-time by QuickJS plugin triggers.
            </p>
          </div>
        </div>

        {/* Console Nav Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto shrink-0">
          {[
            { id: 'cards', label: 'cards' },
            { id: 'decks', label: 'decks' },
            { id: 'schema', label: 'Schema' },
            { id: 'logs', label: 'Sandbox Bridge' },
            { id: 'sql', label: 'Query' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-slate-800 text-indigo-300 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id={`tab-button-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Console Work area */}
      <div className="p-6 flex-1 overflow-y-auto flex flex-col min-h-[300px]">
        
        {/* CARDS TABLE view */}
        {activeTab === 'cards' && (
          <div className="space-y-4 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter cards in memory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950/60 border border-slate-800 text-slate-300 text-xs rounded-xl pl-9 pr-4 py-2.5 w-full focus:outline-none focus:border-indigo-500/60 placeholder-slate-500 font-mono"
                />
              </div>

              {/* Add Card trigger */}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition active:scale-[0.98] shrink-0"
                id="btn-show-add-form"
              >
                <Plus className="h-4 w-4" />
                Insert Card (SQL Row)
              </button>
            </div>

            {/* Add card Form */}
            {showAddForm && (
              <form onSubmit={handleCreateCardSubmit} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5">Target Deck Relations</label>
                    <select
                      value={newCardDeck}
                      onChange={(e) => setNewCardDeck(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 w-full focus:outline-none"
                    >
                      {decks.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5">Card Front Field</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 犬 (いぬ)"
                      value={newCardFront}
                      onChange={(e) => setNewCardFront(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5">Card Back (Explanation/Def)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dog (Canine helper)"
                      value={newCardBack}
                      onChange={(e) => setNewCardBack(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 w-full focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5">Custom Context Fields (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Helper note or hint"
                      value={newCardHelper}
                      onChange={(e) => setNewCardHelper(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                  >
                    Execute INSERT
                  </button>
                </div>
              </form>
            )}

            {/* List Table Grid representing columns */}
            <div className="border border-slate-800/80 rounded-2xl overflow-hidden flex-1 flex flex-col bg-slate-950/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 select-none text-[10px]">
                      <th className="py-3 px-4">id</th>
                      <th className="py-3 px-4">front (varchar)</th>
                      <th className="py-3 px-4">back (text)</th>
                      <th className="py-3 px-4 text-center">interval</th>
                      <th className="py-3 px-4 text-center">ease</th>
                      <th className="py-3 px-4">custom_metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {filteredCards.map((card) => (
                      <tr key={card.id} className="hover:bg-slate-800/10 transition-colors text-slate-300">
                        <td className="py-2.5 px-4 text-indigo-400 text-[10px]" title={card.id}>{card.id}</td>
                        <td className="py-2.5 px-4 font-sans font-medium text-slate-100 max-w-[150px] truncate">{card.front}</td>
                        <td className="py-2.5 px-4 max-w-[200px] truncate">{card.back}</td>
                        <td className="py-2.5 px-4 text-center text-amber-300">{card.intervalDays}d</td>
                        <td className="py-2.5 px-4 text-center text-indigo-300">{card.easeFactor}%</td>
                        <td className="py-2.5 px-4 max-w-[220px]">
                          <div className="flex flex-wrap gap-1">
                            {card.customFields && Object.keys(card.customFields).length > 0 ? (
                              Object.entries(card.customFields).map(([key, val]) => (
                                <span key={key} className="bg-slate-800/80 text-slate-450 px-1.5 py-0.5 rounded text-[9px] border border-slate-700/30 truncate max-w-[180px]" title={`${key}: ${val}`}>
                                  {key}: {val}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-600 italic">empty state</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DECKS TABLE view */}
        {activeTab === 'decks' && (
          <div className="space-y-4">
            <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/20">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 uppercase tracking-widest border-b border-slate-800 text-[10px]">
                    <th className="py-3 px-4">id (pk)</th>
                    <th className="py-3 px-4">name (varchar)</th>
                    <th className="py-3 px-4">card_count (int)</th>
                    <th className="py-3 px-4">description</th>
                    <th className="py-3 px-4">created_at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30 text-slate-300">
                  {decks.map((deck) => (
                    <tr key={deck.id} className="hover:bg-slate-800/10 transition">
                      <td className="py-3 px-4 text-indigo-400">{deck.id}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-100">{deck.name}</td>
                      <td className="py-3 px-4 text-emerald-405">{deck.cardCount} rows</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{deck.description}</td>
                      <td className="py-3 px-4 text-[10px] text-slate-500">{deck.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MOCK ENTITY DIAGRAM view */}
        {activeTab === 'schema' && (
          <div className="flex-1 flex flex-col bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4">
              Database Unified Modeling Diagram (ERD)
            </h3>
            
            {/* SVG Schematics */}
            <div className="flex-1 min-h-[250px] flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/80 p-4 overflow-x-auto">
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-14 leading-none">
                
                {/* Decks Entity */}
                <div className="border border-slate-700 bg-slate-900 rounded-xl p-3 w-48 shadow-lg font-mono">
                  <div className="bg-indigo-950 px-2 py-1.5 rounded-lg border border-indigo-500/30 mb-2">
                    <span className="text-[11px] font-bold text-indigo-300">TableName: decks</span>
                  </div>
                  <div className="space-y-1.5 text-[10px] text-slate-350">
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-indigo-400">🔑 id</span>
                      <span className="text-slate-500">VARCHAR [PK]</span>
                    </div>
                    <div>name: VARCHAR</div>
                    <div>cardCount: INTEGER</div>
                    <div>description: TEXT</div>
                  </div>
                </div>

                {/* Left/Right connector with label */}
                <div className="flex md:flex-col items-center gap-1.5 text-indigo-400">
                  <span className="text-[9px] font-mono uppercase bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-400/20">1 : N relation</span>
                  <div className="h-0.5 w-10 md:w-0.5 md:h-12 bg-indigo-500/50"></div>
                  <ArrowRight className="h-4 w-4 transform md:rotate-90 text-indigo-500" />
                </div>

                {/* Cards Entity */}
                <div className="border border-slate-700 bg-slate-900 rounded-xl p-3 w-56 shadow-lg font-mono">
                  <div className="bg-emerald-950 px-2 py-1.5 rounded-lg border border-emerald-500/30 mb-2">
                    <span className="text-[11px] font-bold text-emerald-300">TableName: cards</span>
                  </div>
                  <div className="space-y-1.5 text-[10px] text-slate-350 font-mono">
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-emerald-400">🔑 id</span>
                      <span className="text-slate-500">VARCHAR [PK]</span>
                    </div>
                    <div className="flex justify-between text-indigo-455">
                      <span>🔗 deckId</span>
                      <span className="text-slate-500">VARCHAR [FK]</span>
                    </div>
                    <div>front: TEXT</div>
                    <div>back: TEXT</div>
                    <div>intervalDays: INT</div>
                    <div>easeFactor: FLOAT</div>
                    <div>customFields: JSON</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* SANDBOX API BRIDGE LOGS */}
        {activeTab === 'logs' && (
          <div className="flex-1 flex flex-col space-y-3 h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-450 uppercase">Telemetry: Applets Sandboxed Hooks Events</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> API Bridge Online
              </span>
            </div>

            {/* List logs */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex-1 overflow-y-auto font-mono text-[11px] space-y-2 min-h-[220px]">
              {bridgeLogs.length === 0 ? (
                <div className="text-slate-600 italic text-center py-10">
                  No bridge calls registered yet. Play with cards or run locking threads in the console.
                </div>
              ) : (
                bridgeLogs.map((log) => {
                  let badge = "text-slate-400";
                  if (log.action === 'READ') badge = "text-indigo-400 bg-indigo-950/50 px-1 rounded";
                  else if (log.action === 'WRITE') badge = "text-emerald-400 bg-emerald-950/50 px-1 rounded";
                  else if (log.action === 'BLOCK') badge = "text-rose-400 bg-rose-950/50 px-1 rounded font-bold animate-pulse";
                  else if (log.action === 'LOG') badge = "text-amber-400 bg-amber-950/50 px-1 rounded";

                  return (
                    <div key={log.id} className="border-b border-slate-800/30 pb-2 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">[{log.timestamp}]</span>
                          <span className="font-semibold text-slate-100">{log.pluginName}</span>
                          <span className={`text-[9px] font-mono uppercase ${badge}`}>{log.action}</span>
                        </div>
                        <p className="text-slate-350 text-[10px] font-sans leading-tight pl-2">
                          {log.details}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* SQL ORM CODE TESTER */}
        {activeTab === 'sql' && (
          <div className="flex-1 flex flex-col space-y-4 h-full">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-450 uppercase">Execute Direct Room DB Schema Queries</span>
              <p className="text-xs text-slate-450 font-sans">
                Type directly inside the SQL terminal to execute direct query reads against the simulated cards schema dataset.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Terminal code side */}
              <div className="lg:col-span-5 space-y-3">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1"><Terminal className="h-3.5 w-3.5" /> Room SQLite Terminal</span>
                  </div>
                  <textarea
                    rows={4}
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="w-full bg-transparent font-mono text-xs text-indigo-200 outline-none resize-none"
                    placeholder="SELECT * FROM cards WHERE ..."
                  />
                </div>

                {/* Templates selectors */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Query Templates:</span>
                  <div className="flex flex-col gap-1.5 text-[10px] font-mono">
                    <button 
                      onClick={() => setSqlQuery("SELECT * FROM cards WHERE intervalDays <= 3;")}
                      className="text-left text-indigo-400 hover:underline truncate"
                    >
                      ✦ Select high-efficiency cards (interval &le; 3 days)
                    </button>
                    <button 
                      onClick={() => setSqlQuery("SELECT * FROM cards WHERE deckId = 'deck-1';")}
                      className="text-left text-indigo-400 hover:underline truncate"
                    >
                      ✦ Select Japanese vocabulary cards
                    </button>
                    <button 
                      onClick={() => setSqlQuery("SELECT * FROM decks;")}
                      className="text-left text-indigo-400 hover:underline truncate"
                    >
                      ✦ Inspect decks folders records
                    </button>
                  </div>
                </div>

                <button
                  onClick={executeSQL}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition"
                  id="btn-execute-custom-sql"
                >
                  <Play className="h-4 w-4" /> Run Query
                </button>
              </div>

              {/* Outputs side */}
              <div className="lg:col-span-7 bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-[11px] overflow-y-auto max-h-[280px]">
                {sqlError ? (
                  <div className="text-rose-400 font-mono text-xs">
                    ❌ {sqlError}
                  </div>
                ) : sqlResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] border-b border-slate-800 pb-1.5">
                      <span>Query OK: returned {sqlResult.length} rows</span>
                      <span>Execution Speed: 0.2ms</span>
                    </div>
                    {sqlResult.length === 0 ? (
                      <span className="text-slate-650 italic">Empty rows returned</span>
                    ) : (
                      <pre className="text-indigo-200 text-[10px] leading-relaxed whitespace-pre-wrap select-all">
                        {JSON.stringify(sqlResult, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-600 italic text-center py-12">
                    Output window. Execute a query on the left.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
