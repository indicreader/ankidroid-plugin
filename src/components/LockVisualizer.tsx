/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LockState, SimulationThread, Plugin } from '../types';
import { 
  Lock, 
  Unlock, 
  Play, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  HelpCircle, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';

interface LockVisualizerProps {
  activePlugins: Plugin[];
  onLogBridgeAction: (pluginName: string, action: 'READ' | 'WRITE' | 'BLOCK' | 'LOG', details: string) => void;
}

export default function LockVisualizer({ activePlugins, onLogBridgeAction }: LockVisualizerProps) {
  // Config States
  const [useAlphabeticalSorting, setUseAlphabeticalSorting] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1000); // ms per step
  
  // Resources locked in Mutex map
  const [resources, setResources] = useState<Record<string, LockState>>({
    cards: { resource: 'cards', status: 'FREE', lockedBy: null, waitingList: [] },
    config: { resource: 'config', status: 'FREE', lockedBy: null, waitingList: [] },
    decks: { resource: 'decks', status: 'FREE', lockedBy: null, waitingList: [] },
    user: { resource: 'user', status: 'FREE', lockedBy: null, waitingList: [] },
  });

  const [threads, setThreads] = useState<SimulationThread[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop simulation on unmount
  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  const addSimLog = (msg: string) => {
    setSimLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  // Reset the sandbox locks and active threads
  const resetLocksAndThreads = () => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setIsSimulating(false);
    setCurrentStep(0);
    setResources({
      cards: { resource: 'cards', status: 'FREE', lockedBy: null, waitingList: [] },
      config: { resource: 'config', status: 'FREE', lockedBy: null, waitingList: [] },
      decks: { resource: 'decks', status: 'FREE', lockedBy: null, waitingList: [] },
      user: { resource: 'user', status: 'FREE', lockedBy: null, waitingList: [] },
    });
    setThreads([]);
    addSimLog("Locks reset to FREE. QuickJS Sandbox synchronized.");
  };

  // Setup standard concurrent run based on selected plugins
  const runNormalConcurrency = () => {
    resetLocksAndThreads();
    const enabled = activePlugins.filter(p => p.isEnabled);
    if (enabled.length === 0) {
      addSimLog("⚠️ No active plugins enabled. Enable some plugins in the emulator or sidebar first!");
      return;
    }

    const initialThreads: SimulationThread[] = enabled.map((p, idx) => {
      // Sort locks if guard is enabled
      const requested = [...p.requiredLocks];
      const sorted = useAlphabeticalSorting ? [...requested].sort() : requested;
      
      return {
        id: `thread-${idx + 1}`,
        pluginId: p.id,
        pluginName: p.name,
        stage: 'ACQUIRING_LOCKS',
        requestedLocks: requested,
        acquiredLocks: [],
        indexInLockSequence: 0,
        logMsgs: [`Enqueued thread. Requested resources: ${requested.join(' ➔ ')}`],
        executionSpeedMs: simulationSpeed,
      };
    });

    setThreads(initialThreads);
    setIsSimulating(true);
    addSimLog(`🚀 Concurrent Sandbox execution started with ${initialThreads.length} active threads.`);
    if (useAlphabeticalSorting) {
      addSimLog("🛡️ Lock sorting guard is ENABLED. Deadlocks are mathematically impossible.");
    } else {
      addSimLog("⚠️ WARNING: Lock sorting guard is DISABLED. Concurrency is vulnerable to circular wait!");
    }
  };

  // Setup explicitly deadlocking race condition
  const triggerDeadlockShowcase = () => {
    resetLocksAndThreads();
    
    // Create 2 threads designed to deadlock when lock sorting is disabled.
    // Thread A: Wants 'user' then 'cards'
    // Thread B: Wants 'cards' then 'user'
    const threadAOriginal = ['user', 'cards'];
    const threadBOriginal = ['cards', 'user'];

    const threadASorted = useAlphabeticalSorting ? [...threadAOriginal].sort() : threadAOriginal;
    const threadBSorted = useAlphabeticalSorting ? [...threadBOriginal].sort() : threadBOriginal;

    const thread1: SimulationThread = {
      id: 'thread-alpha',
      pluginId: 'demo-alpha',
      pluginName: '🔴 Leitner Scheduler Integration',
      stage: 'ACQUIRING_LOCKS',
      requestedLocks: threadASorted,
      acquiredLocks: [],
      indexInLockSequence: 0,
      logMsgs: [`Spinning up Thread Alpha. Requested order: ${threadASorted.join(' ➔ ')}`],
      executionSpeedMs: simulationSpeed,
    };

    const thread2: SimulationThread = {
      id: 'thread-beta',
      pluginId: 'demo-beta',
      pluginName: '🔵 Japanese Romaji Transliteration',
      stage: 'ACQUIRING_LOCKS',
      requestedLocks: threadBSorted,
      acquiredLocks: [],
      indexInLockSequence: 0,
      logMsgs: [`Spinning up Thread Beta. Requested order: ${threadBSorted.join(' ➔ ')}`],
      executionSpeedMs: simulationSpeed,
    };

    setThreads([thread1, thread2]);
    setIsSimulating(true);
    addSimLog("💥 Artificial race condition triggered. Forcing simultaneous lock requests.");
    if (useAlphabeticalSorting) {
      addSimLog("🛡️ Lock sorting guard is ON: [cards, user] vs [cards, user]. Threads will queue sequentially.");
    } else {
      addSimLog("💀 Lock sorting guard is OFF: [user, cards] vs [cards, user]. Deadlock expected at Step 2.");
    }
  };

  // Perform one tick of the lock manager state machine
  useEffect(() => {
    if (!isSimulating || threads.length === 0) return;

    simTimerRef.current = setTimeout(() => {
      let stateChanged = false;
      const nextThreads = threads.map(t => { return { ...t, logMsgs: [...t.logMsgs], acquiredLocks: [...t.acquiredLocks] }; });
      const nextResources = { ...resources };
      Object.keys(nextResources).forEach(res => {
        nextResources[res] = {
          ...nextResources[res],
          waitingList: [...nextResources[res].waitingList]
        };
      });

      // Clear lock releases before running acquisitions
      let finishedThreadsCount = 0;

      // Scan and check state of all threads
      for (const t of nextThreads) {
        if (t.stage === 'COMPLETED' || t.stage === 'DEADLOCKED' || t.stage === 'FAILED') {
          finishedThreadsCount++;
          continue;
        }

        // Core script execution stage (takes 1 tick to execute then release locks)
        if (t.stage === 'EXECUTING_CORE') {
          t.stage = 'RELEASING_LOCKS';
          t.logMsgs.push("⚡ Executing QuickJS payload: successfully query/write database securely.");
          onLogBridgeAction(t.pluginName, 'LOG', "QuickJS Sandbox: Executing plugin callback securely");
          stateChanged = true;
          continue;
        }

        // Releasing stage
        if (t.stage === 'RELEASING_LOCKS') {
          // Release all resources
          t.acquiredLocks.forEach(res => {
            const r = nextResources[res];
            r.status = 'FREE';
            r.lockedBy = null;
            
            // If waiting list is populated, wake up the next thread
            if (r.waitingList.length > 0) {
              const nextWaiter = r.waitingList.shift()!;
              r.status = 'LOCKED';
              r.lockedBy = nextWaiter;
              
              // update waiter thread
              const waiterThread = nextThreads.find(x => x.id === nextWaiter);
              if (waiterThread) {
                waiterThread.acquiredLocks.push(res);
                waiterThread.logMsgs.push(`🔓 Woken up! Successfully acquired mutex on content resource [${res}].`);
                onLogBridgeAction(waiterThread.pluginName, 'READ', `Mutex woken up: acquired lock on '${res}'`);
              }
            }
          });
          t.acquiredLocks = [];
          t.stage = 'COMPLETED';
          t.logMsgs.push("✓ Completed thread lifecycle. All resource locks released.");
          onLogBridgeAction(t.pluginName, 'WRITE', "Released all locks cleanly.");
          stateChanged = true;
          continue;
        }

        // Acquiring locks stage
        if (t.stage === 'ACQUIRING_LOCKS') {
          const currentTargetIndex = t.indexInLockSequence;
          
          if (currentTargetIndex >= t.requestedLocks.length) {
            // All locks acquired! Transition to code execution
            t.stage = 'EXECUTING_CORE';
            t.logMsgs.push(`✓ All requested locks (${t.requestedLocks.join(', ')}) securely acquired. Starting sandbox runtime.`);
            stateChanged = true;
            continue;
          }

          const targetResource = t.requestedLocks[currentTargetIndex];
          const resObj = nextResources[targetResource];

          // Check if this thread already holds it
          if (t.acquiredLocks.includes(targetResource)) {
            t.indexInLockSequence += 1;
            stateChanged = true;
            continue;
          }

          // At this point, the thread needs to acquire `targetResource`
          if (resObj.status === 'FREE') {
            // Resource is free, lock it
            resObj.status = 'LOCKED';
            resObj.lockedBy = t.id;
            t.acquiredLocks.push(targetResource);
            t.indexInLockSequence += 1;
            t.logMsgs.push(`🔒 Mutex acquired successfully for lock resource: [${targetResource}]`);
            onLogBridgeAction(t.pluginName, 'READ', `Thread acquired lock on resource: '${targetResource}'`);
            stateChanged = true;
          } else if (resObj.lockedBy === t.id) {
            // Already locked by me (reentrant guard)
            t.indexInLockSequence += 1;
            stateChanged = true;
          } else {
            // Blocked by someone else!
            if (!resObj.waitingList.includes(t.id)) {
              resObj.waitingList.push(t.id);
              t.logMsgs.push(`⏳ Blocked resource [${targetResource}] is currently locked by ${resObj.lockedBy}. Waiting in queue...`);
              onLogBridgeAction(t.pluginName, 'BLOCK', `Waiting for resource: '${targetResource}' currently locked by ${resObj.lockedBy}`);
              stateChanged = true;
            }
          }
        }
      }

      // Check for deadlocks in remaining active threads!
      // Deadlock condition: All threads that are not COMPLETED are WAITING on resources,
      // and those resources are held by other waiting threads (circular wait graph).
      const activeRunningThreads = nextThreads.filter(t => t.stage === 'ACQUIRING_LOCKS' || t.stage === 'EXECUTING_CORE');
      const blockedThreads = activeRunningThreads.filter(t => {
        const currentTargetIndex = t.indexInLockSequence;
        if (currentTargetIndex >= t.requestedLocks.length) return false;
        const targetResource = t.requestedLocks[currentTargetIndex];
        return nextResources[targetResource].status === 'LOCKED' && nextResources[targetResource].lockedBy !== t.id;
      });

      // If everyone who is active is blocked from progressing, we have a circular wait deadlock!
      if (activeRunningThreads.length > 0 && blockedThreads.length === activeRunningThreads.length) {
        addSimLog("🚨 DEADLOCK DETECTED! Circular reference lock-wait confirmed between threads.");
        activeRunningThreads.forEach(t => {
          t.stage = 'DEADLOCKED';
          t.logMsgs.push("💀 DEADLOCKED: Caught in a circular lock dependency. Execution halted indefinitely.");
          onLogBridgeAction(t.pluginName, 'BLOCK', "CRITICAL: Engine deadlocked!");
        });
        setIsSimulating(false);
        stateChanged = true;
      }

      // If all threads completed
      if (finishedThreadsCount === nextThreads.length) {
        setIsSimulating(false);
        addSimLog("✓ Sim completed successfully with no deadlock.");
      }

      if (stateChanged) {
        setThreads(nextThreads);
        setResources(nextResources);
        setCurrentStep(prev => prev + 1);
      }
    }, simulationSpeed);

    return () => {
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
    };
  }, [isSimulating, threads, resources, useAlphabeticalSorting, simulationSpeed]);

  return (
    <div className="bg-[#0f111a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full" id="lock-visualizer-container">
      {/* Header Banner */}
      <div className="p-5 border-b border-white/5 bg-[#0a0c12] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-sans font-semibold tracking-tight text-slate-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-400" id="lock-icon-layers" />
            QuickJS Mutex Sandbox & Concurrency Engine
          </h2>
          <p className="text-xs text-slate-400">
            Simulates thread locking mechanics and demonstrates deadlock prevention through alphabetical resource scheduling.
          </p>
        </div>
        
        {/* Toggle Guard Switch */}
        <button
          onClick={() => {
            setUseAlphabeticalSorting(!useAlphabeticalSorting);
            resetLocksAndThreads();
          }}
          disabled={isSimulating}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition duration-200 cursor-pointer ${
            useAlphabeticalSorting 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/15'
          }`}
          id="toggle-lock-sorting-guard"
        >
          {useAlphabeticalSorting ? (
            <ShieldCheck className="h-4 w-4 animate-pulse text-emerald-400" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          )}
          <span>Lock sorting guard: {useAlphabeticalSorting ? "ACTIVE (Safe)" : "OFF (Vulnerable)"}</span>
        </button>
      </div>

      {/* Main Interactive Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-y-auto w-full">
        
        {/* Left Hand: Mutex States & Resources */}
        <div className="lg:col-span-4 flex flex-col h-full gap-5">
          <div className="bg-immersive-panel p-5 rounded-2xl border border-white/5 flex flex-col flex-1 justify-between">
            <div>
              <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                <span>Resource Mutex Map</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-400/20 font-mono">
                  Room DB locks
                </span>
              </h3>

              {/* Resource node list */}
              <div className="space-y-3.5 border-white/5">
                {Object.keys(resources).map((key) => {
                  const res = resources[key];
                  const isLocked = res.status === 'LOCKED';
                  const deadlocked = threads.some(t => t.stage === 'DEADLOCKED');
                  
                  return (
                    <div 
                      key={res.resource}
                      className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                        deadlocked && isLocked
                          ? 'bg-rose-950/20 border-rose-500/30 text-rose-300 shadow-lg shadow-rose-950/20'
                          : isLocked
                          ? 'bg-blue-950/20 border-blue-500/30 text-blue-300 shadow-sm'
                          : 'bg-immersive-nav/50 border-white/5 text-slate-300'
                      }`}
                      id={`resource-node-${res.resource}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          deadlocked && isLocked
                            ? 'bg-rose-500/25 text-rose-400'
                            : isLocked 
                            ? 'bg-blue-500/25 text-blue-400' 
                            : 'bg-[#050608] border border-white/5 text-slate-400'
                        }`}>
                          {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-mono font-medium">
                            {res.resource}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                            {isLocked ? `Locked by ${res.lockedBy}` : 'Free'}
                          </div>
                        </div>
                      </div>

                      {/* Queue state indicator */}
                      {res.waitingList.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md border border-amber-500/20 text-[10px] font-mono">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Wait Queue ({res.waitingList.length})</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation card */}
            <div className="mt-5 p-4 rounded-xl bg-immersive-nav/75 border border-white/5 text-xs text-slate-450 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-medium">
                <HelpCircle className="h-4 w-4 text-blue-450" />
                <span>Deterministic Lock Sorted Guard</span>
              </div>
              <p className="leading-relaxed leading-normal">
                When plugins request resource locks, ordering matters. Unordered locking breeds <b>deadlocks</b>. Sorting lock keys alphabetically ensures threads request resource keys in the exact same sequence globally, eliminating circular waiting and ensuring safe async resolution in Kotlin.
              </p>
            </div>
          </div>
        </div>

        {/* Right Hand: Active Threads & Logger */}
        <div className="lg:col-span-8 flex flex-col gap-5 h-full">
          
          {/* Simulation Controls */}
          <div className="bg-immersive-panel p-4 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={runNormalConcurrency}
                disabled={isSimulating}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(37,99,235,0.35)]"
                id="btn-run-concurrency"
              >
                <Play className="h-4 w-4" />
                Run Normal Run
              </button>

              <button
                onClick={triggerDeadlockShowcase}
                disabled={isSimulating}
                className="bg-[#050608] hover:bg-slate-900 disabled:opacity-50 text-amber-400 border border-white/5 font-medium text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                id="btn-run-race-condition"
              >
                <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
                Stress Test Race Condition
              </button>

              <button
                onClick={resetLocksAndThreads}
                className="bg-[#0a0c12] hover:bg-slate-900 border border-white/5 text-slate-300 text-xs p-2.5 rounded-xl cursor-pointer transition-all"
                title="Reset Sandbox"
                id="btn-reset-sandbox"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Speed slider */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">Tick:</span>
              <input
                type="range"
                min="300"
                max="2500"
                step="100"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                className="w-24 h-1.5 bg-[#050608]/80 rounded-lg cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] font-mono text-blue-400 w-12 text-right font-semibold">
                {simulationSpeed}ms
              </span>
            </div>
          </div>

          {/* Threads & Log outputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-[300px]">
            
            {/* Thread Progress Panels */}
            <div className="bg-immersive-panel p-5 rounded-2xl border border-white/5 flex flex-col h-full overflow-y-auto">
              <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-400" />
                QuickJS Thread Pool
              </h3>

              {threads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-10">
                  <Unlock className="h-8 w-8 stroke-[1.5] mb-2 text-slate-600" />
                  <p className="text-xs text-center font-mono">No simulation threads active.<br/>Choose &quot;Run Normal Run&quot; to test locks.</p>
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  {threads.map(t => {
                    let badgeColor = "bg-[#050608] text-slate-400";
                    if (t.stage === 'COMPLETED') badgeColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                    else if (t.stage === 'ACQUIRING_LOCKS') badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                    else if (t.stage === 'EXECUTING_CORE') badgeColor = "bg-blue-500/10 text-blue-405 border border-blue-400/20 animate-pulse";
                    else if (t.stage === 'DEADLOCKED') badgeColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20 text-rose-400 font-bold animate-bounce";
                    
                    return (
                      <div key={t.id} className="p-3.5 rounded-xl bg bg-[#0a0c12]/55 border border-white/5 space-y-2.5 animate-fade-in">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-mono font-medium text-slate-200">
                              {t.id.toUpperCase()}: {t.pluginName}
                            </div>
                            <div className="flex gap-1.5 mt-1 font-mono text-[10px]">
                              <span className="text-slate-400 font-bold">Locks Requested:</span>
                              <span className="text-slate-300">[{t.requestedLocks.join(', ')}]</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono leading-none ${badgeColor}`}>
                            {t.stage}
                          </span>
                        </div>

                        {/* Lock Steps Tracker visual */}
                        <div className="flex items-center gap-1.5 py-1">
                          {t.requestedLocks.map((lock, idx) => {
                            const isAcquired = t.acquiredLocks.includes(lock);
                            const isCurrentGoal = t.requestedLocks[t.indexInLockSequence] === lock && t.stage === 'ACQUIRING_LOCKS';
                            
                            return (
                              <React.Fragment key={lock}>
                                {idx > 0 && <span className="text-slate-600 text-xs">➔</span>}
                                <span className={`text-[10px] px-2 py-1 rounded-md font-mono ${
                                  t.stage === 'DEADLOCKED'
                                    ? 'bg-rose-950/40 text-rose-400 border border-rose-500/20'
                                    : isAcquired
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : isCurrentGoal
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                    : 'bg-[#050608] text-slate-500 border border-white/5'
                                }`}>
                                  {lock}
                                </span>
                              </React.Fragment>
                            );
                          })}
                        </div>

                        {/* Mini individual logs (last log only) */}
                        <div className="bg-[#050608] px-2.5 py-1.5 rounded border border-white/5 text-[10px] font-mono text-slate-400 truncate">
                          {t.logMsgs[t.logMsgs.length - 1]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Simulated System Log Console */}
            <div className="bg-immersive-panel p-5 rounded-2xl border border-white/5 flex flex-col h-full overflow-y-auto">
              <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                <span>Thread Event Terminals</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse animate-duration-1000"></span>
              </h3>

              <div className="bg-[#050608] border border-white/5 p-3 rounded-xl flex-1 font-mono text-[10px] leading-relaxed text-slate-350 overflow-y-auto space-y-2 select-text">
                {simLogs.length === 0 ? (
                  <div className="text-slate-500 italic text-center py-10">
                    Listening for platform thread executions...
                  </div>
                ) : (
                  simLogs.map((log, index) => {
                    let logColor = "text-slate-300";
                    if (log.includes("DEADLOCK")) logColor = "text-rose-400 font-semibold bg-rose-500/10 p-1 rounded border border-rose-500/10";
                    else if (log.includes("concurrency") || log.includes("started")) logColor = "text-indigo-400";
                    else if (log.includes("completed") || log.includes("✓")) logColor = "text-emerald-400";
                    else if (log.includes("Warning") || log.includes("⚠️")) logColor = "text-amber-400";
                    
                    return (
                      <div key={index} className={`${logColor} py-0.5 border-b border-white/5 break-words`}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Deadlock banner warning */}
      {threads.some(t => t.stage === 'DEADLOCKED') && (
        <div className="bg-[#1c0d12] text-rose-300 border-t border-rose-900/60 p-4 flex items-center gap-4 animate-slide-up font-sans text-xs">
          <AlertTriangle className="h-6 w-6 text-rose-400 animate-bounce shrink-0" />
          <div className="space-y-1">
            <span className="font-bold">CONCURRENCY FATAL EXCEPTION: ANKIDROID-ENGINE-STACKS-STUCK</span>
            <p className="text-[11px] text-rose-400 leading-tight">
              A deadlock occurred! Thread Alpha holds lock on &apos;user&apos; and is blocked waiting for &apos;cards&apos;. Thread Beta holds lock on &apos;cards&apos; and is blocked waiting for &apos;user&apos;. <b>Alphabetical Sort-key ordering guarantees this can never happen!</b> Toggle Lock sorting guard to ACTIVE to prevent this deadlock dynamically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
