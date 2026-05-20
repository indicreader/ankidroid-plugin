/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Plugin } from '../types';
import { 
  FileCode, 
  Terminal, 
  HelpCircle, 
  BookOpen, 
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  Save,
  Check,
  Play,
  Cpu,
  Plus,
  Upload
} from 'lucide-react';

interface CodeWorkspaceProps {
  plugins: Plugin[];
  activePluginId: string;
  onSelectPlugin: (id: string) => void;
  onUpdatePluginCode: (id: string, code: string) => void;
  onAddPlugin: (plugin: Plugin) => void;
}

export default function CodeWorkspace({
  plugins,
  activePluginId,
  onSelectPlugin,
  onUpdatePluginCode,
  onAddPlugin
}: CodeWorkspaceProps) {
  
  const activePlugin = plugins.find(p => p.id === activePluginId) || plugins[0];
  const [editorVal, setEditorVal] = useState('');
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');
  const [syntaxStatus, setSyntaxStatus] = useState<'OK' | 'ERROR' | null>(null);
  const [syntaxMessage, setSyntaxMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const code = event.target?.result as string;
      const newPluginId = `plugin-custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      onAddPlugin({
        id: newPluginId,
        name: file.name.replace(/\.[^/.]+$/, ""), // remove extension
        description: 'Imported custom plugin script',
        version: '1.0.0',
        author: 'User',
        isEnabled: false,
        requiredPermissions: ['READ_CARDS', 'WRITE_CARDS'],
        requiredLocks: ['cards'],
        hookType: 'onCardLoad',
        code: code
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleCreateNewPlugin = () => {
    const newPluginId = `plugin-custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const code = `// New QuickJS Custom Plugin\n\nfunction process() {\n  bridge.log("New plugin execution started...");\n  \n}\n\nprocess();`;
    
    onAddPlugin({
      id: newPluginId,
      name: `Custom Plugin ${plugins.length + 1}`,
      description: 'A new user-created plugin',
      version: '1.0.0',
      author: 'User',
      isEnabled: false,
      requiredPermissions: ['READ_CARDS', 'WRITE_CARDS'],
      requiredLocks: ['cards'],
      hookType: 'onCardLoad',
      code: code
    });
  };

  // Sync editor with active plugin selection
  useEffect(() => {
    if (activePlugin) {
      setEditorVal(activePlugin.code);
      setSyntaxStatus(null);
      setSyntaxMessage('');
    }
  }, [activePluginId, activePlugin]);

  const handleSave = () => {
    if (!activePlugin) return;
    setSaveStatus('SAVING');
    
    // Simulate minor delay
    setTimeout(() => {
      onUpdatePluginCode(activePlugin.id, editorVal);
      setSaveStatus('SAVED');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
    }, 400);
  };

  const handleValidateSyntax = () => {
    try {
      // Basic JavaScript compilation test using standard Function constructor (safe static analysis compile check)
      new Function(editorVal);
      setSyntaxStatus('OK');
      setSyntaxMessage('QuickJS compile validation succeeded! Syntax conforms with ECMA specifications.');
    } catch (err: any) {
      setSyntaxStatus('ERROR');
      setSyntaxMessage(err.message || "Syntactic compilation exception in script payload");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full" id="code-workspace-wrapper">
      
      {/* Workspace Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileCode className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-sans font-semibold tracking-tight text-slate-100 flex items-center gap-1.5">
              Secure QuickJS Plugin Workspace
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-450 px-2 py-0.5 rounded-full border border-emerald-450/20">Write-Back Enabled</span>
            </h2>
            <p className="text-xs text-slate-400">
              Modify plugin scripts and validate API schemas. Save changes to update live applet hook bindings.
            </p>
          </div>
        </div>

        {/* Plugin selector dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".js,.ts,.txt"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
            title="Upload Plugin File"
          >
            <Upload className="h-3.5 w-3.5" /> Upload
          </button>
          <button
            onClick={handleCreateNewPlugin}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
            title="Write New Plugin"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
          
          <span className="text-[10px] font-mono text-slate-450 ml-2">Active Script:</span>
          <select
            value={activePluginId}
            onChange={(e) => onSelectPlugin(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-indigo-300 rounded-xl px-3 py-2 focus:outline-none cursor-pointer max-w-[200px]"
            id="plugin-workspace-selector"
          >
            {plugins.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.isEnabled ? '🟢' : '⚪'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 p-6 overflow-y-auto">
        
        {/* Left column (8): The Script Code Editor */}
        <div className="xl:col-span-8 flex flex-col space-y-4">
          <div className="bg-slate-950 border border-slate-850 rounded-2xl flex-1 flex flex-col relative min-h-[350px]">
            {/* Editor Top utilities */}
            <div className="flex items-center justify-between px-4.5 py-3/4 border-b border-slate-850 bg-slate-950 select-none">
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                {activePlugin?.hookType || 'onCardLoad'} Javascript Payload
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleValidateSyntax}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-slate-200 border border-slate-800/80 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                  id="btn-validate-syntax"
                >
                  <Cpu className="h-3.5 w-3.5" /> Compiler Check
                </button>
                <button
                  onClick={handleSave}
                  className="bg-indigo-650 hover:bg-indigo-600 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow shadow-indigo-650/40"
                  id="btn-save-plugin-script"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saveStatus === 'SAVING' ? "Saving..." : saveStatus === 'SAVED' ? "Saved ✓" : "Commit Changes"}
                </button>
              </div>
            </div>

            {/* Simulated interactive textarea */}
            <div className="flex-1 overflow-hidden relative">
              <textarea
                value={editorVal}
                onChange={(e) => setEditorVal(e.target.value)}
                className="w-full h-full p-4 bg-transparent outline-none font-mono text-xs text-indigo-150 leading-relaxed resize-none overflow-y-auto"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Code validator compile status message */}
          {syntaxStatus && (
            <div className={`p-4 rounded-xl border text-xs leading-normal flex items-start gap-2.5 font-sans animate-fade-in ${
              syntaxStatus === 'OK' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className={`p-1.5 rounded ${syntaxStatus === 'OK' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                {syntaxStatus === 'OK' ? <Check className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
              </div>
              <div>
                <span className="font-bold underline">{syntaxStatus === 'OK' ? "Static Compiler OK" : "Compilation Error Exception"}</span>
                <p className="mt-1 font-mono text-[11px] opacity-90">{syntaxMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right column (4): Secure API Documentation */}
        <div className="xl:col-span-4 flex flex-col bg-slate-950/60 rounded-2xl border border-slate-800 p-5 justify-between">
          <div>
            <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> Secure Sandbox SDK Reference
            </h3>

            <div className="space-y-4 text-[11px] font-sans leading-normal">
              <p className="text-slate-450 leading-relaxed font-sans">
                QuickJS does not support any direct Android UI thread operations. Pre-compiled code interacts with Room Relational DB purely through dynamic bridge bindings.
              </p>

              {/* API 1. bridge.log */}
              <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                <div className="font-mono text-emerald-400 font-bold flex items-center justify-between">
                  <span>bridge.log(message)</span>
                  <span className="text-[8px] bg-slate-950 text-slate-500 px-1 py-0.2 rounded font-mono">UTILITY</span>
                </div>
                <p className="text-slate-400 text-[10.5px]">Appends string messages into the Android debug log terminal.</p>
              </div>

              {/* API 2. bridge.saveCard */}
              <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                <div className="font-mono text-emerald-400 font-bold flex items-center justify-between">
                  <span>bridge.saveCard(cardObj)</span>
                  <span className="text-[8px] bg-slate-950 text-slate-500 px-1 py-0.2 rounded font-mono">UPDATE</span>
                </div>
                <p className="text-slate-400 text-[10.5px]">Updates the target Card record in full inside Room DB SQLite table.</p>
              </div>

              {/* API 3. bridge.notify */}
              <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                <div className="font-mono text-emerald-400 font-bold flex items-center justify-between">
                  <span>bridge.notify(message)</span>
                  <span className="text-[8px] bg-slate-950 text-slate-500 px-1 py-0.2 rounded font-mono">NOTIFY</span>
                </div>
                <p className="text-slate-400 text-[10.5px]">Pushes a visual system-wide Android notification alert in AnkiDroid interface.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Gated Permissions:</span>
            <div className="flex gap-1">
              <span className="text-[8px] bg-indigo-500/10 text-indigo-300 font-mono font-bold px-1.5 py-0.5 rounded border border-indigo-400/20">READ_CARDS</span>
              <span className="text-[8px] bg-rose-500/10 text-rose-300 font-mono font-bold px-1.5 py-0.5 rounded border border-rose-500/20">WRITE_CARDS</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
