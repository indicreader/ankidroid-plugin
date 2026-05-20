/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Deck {
  id: string;
  name: string;
  cardCount: number;
  description: string;
  createdAt: string;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string; // ISO String
  customFields?: Record<string, string>;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  isEnabled: boolean;
  requiredPermissions: string[];
  requiredLocks: string[]; // Resources locked during execution: e.g. "cards", "decks", "user"
  hookType: 'onCardLoad' | 'onAnswerSelected' | 'onAppStart' | 'onReviewComplete';
  code: string;
}

export interface LockState {
  resource: string; // e.g. 'cards', 'decks', 'config'
  status: 'FREE' | 'LOCKED' | 'WAITED';
  lockedBy: string | null; // Plugin/Thread ID
  waitingList: string[]; // Plugin/Thread IDs waiting
}

export interface SimulationThread {
  id: string;
  pluginId: string;
  pluginName: string;
  stage: 'IDLE' | 'ACQUIRING_LOCKS' | 'EXECUTING_CORE' | 'RELEASING_LOCKS' | 'COMPLETED' | 'DEADLOCKED' | 'FAILED';
  requestedLocks: string[]; // Original requested list
  acquiredLocks: string[]; // Currently held
  indexInLockSequence: number; // For step-by-step lock sequence analysis
  logMsgs: string[];
  executionSpeedMs: number;
}

export interface RoomTableSchema {
  tableName: string;
  columns: { name: string; type: string; constraints?: string }[];
  relationships?: string[];
}

export interface BridgeLog {
  id: string;
  timestamp: string;
  pluginName: string;
  action: 'READ' | 'WRITE' | 'BLOCK' | 'LOG';
  details: string;
}
