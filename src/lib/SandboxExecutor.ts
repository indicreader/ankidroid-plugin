/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card, Deck, Plugin } from '../types';

/**
 * Validates the schema and data integrity of a card object modified by a plugin.
 * Throws an descriptive error if the contract is violated.
 */
export function validateCardSchema(card: any): void {
  if (!card || typeof card !== 'object') {
    throw new Error('DataIntegrityException: Card object is null or invalid.');
  }

  if (typeof card.id !== 'string' || card.id.trim() === '') {
    throw new Error('DataIntegrityException: Card of must possess a valid string id.');
  }

  if (typeof card.front !== 'string' || card.front.trim() === '') {
    throw new Error('DataIntegrityException: Card front field must be a non-empty string.');
  }

  if (typeof card.back !== 'string') {
    throw new Error('DataIntegrityException: Card back field must be a valid string.');
  }

  if (typeof card.intervalDays !== 'number' || card.intervalDays < 1 || isNaN(card.intervalDays)) {
    throw new Error('DataIntegrityException: Card intervalDays must be a positive integer >= 1.');
  }

  if (typeof card.easeFactor !== 'number' || card.easeFactor < 130 || isNaN(card.easeFactor)) {
    throw new Error('DataIntegrityException: Card easeFactor cannot be lower than the Anki spec minimum of 130.');
  }

  if (typeof card.repetitions !== 'number' || card.repetitions < 0 || isNaN(card.repetitions)) {
    throw new Error('DataIntegrityException: Card repetitions count must be a non-negative integer.');
  }
}

interface SandboxOptions {
  plugin: Plugin;
  cards: Card[];
  decks: Deck[];
  onLogBridgeAction: (pluginName: string, action: 'READ' | 'WRITE' | 'BLOCK' | 'LOG', details: string) => void;
  onNotificationRaised: (message: string) => void;
  onUpdateCardRecord: (card: Card) => void;
  onScheduleCardRating?: (cardId: string, rating: number) => void;
}

/**
 * Compiles and runs a plugin script inside an asynchronous sandboxed context.
 * It intercepts and resolves bridge calls after validating permissions and locking constraints.
 */
export async function executePluginSandbox(
  hookName: 'onCardLoad' | 'onAnswerSelected',
  payload: { card: Card; rating?: number },
  options: SandboxOptions
): Promise<{ card: Card; logs: string[]; error?: string }> {
  const { 
    plugin, 
    cards, 
    onLogBridgeAction, 
    onNotificationRaised, 
    onUpdateCardRecord,
    onScheduleCardRating
  } = options;

  const logs: string[] = [];
  const appendLog = (msg: string) => {
    logs.push(msg);
  };

  // 1. Check if plugin is enabled
  if (!plugin.isEnabled) {
    return { card: payload.card, logs };
  }

  // 2. Setup Secure Asynchronous Bridge API
  const bridge = {
    // Basic sandboxed logging
    log: (message: string) => {
      const sanitized = String(message);
      appendLog(sanitized);
      onLogBridgeAction(plugin.name, 'LOG', sanitized);
    },

    // User-friendly UI alerts and notices (requires NOTIFY permission)
    notify: async (message: string) => {
      if (!plugin.requiredPermissions.includes('NOTIFY')) {
        const errorMsg = `SecurityException: Permission 'NOTIFY' not declared index by plugin '${plugin.name}'.`;
        onLogBridgeAction(plugin.name, 'BLOCK', errorMsg);
        throw new Error(errorMsg);
      }
      const sanitized = String(message);
      onNotificationRaised(sanitized);
      onLogBridgeAction(plugin.name, 'LOG', `UI Feedback: "${sanitized}"`);
      appendLog(`[UI Prompt] ${sanitized}`);
    },

    // Read card details securely (requires READ_CARDS permission and 'cards' lock)
    getCard: async (cardId: string): Promise<Card | null> => {
      if (!plugin.requiredPermissions.includes('READ_CARDS')) {
        const errorMsg = `SecurityException: Permission 'READ_CARDS' Access Denied for plugin '${plugin.name}'.`;
        onLogBridgeAction(plugin.name, 'BLOCK', errorMsg);
        throw new Error(errorMsg);
      }

      if (!plugin.requiredLocks.includes('cards')) {
        const errorMsg = `LockConflictException: Unacquired lock 'cards' on read operation for plugin '${plugin.name}'. Resources must be locked in types config first.`;
        onLogBridgeAction(plugin.name, 'BLOCK', errorMsg);
        throw new Error(errorMsg);
      }

      const found = cards.find(c => c.id === cardId);
      if (!found) return null;

      onLogBridgeAction(plugin.name, 'READ', `Securely accessed database record: [${cardId}]`);
      appendLog(`Loaded card details for '${found.front}'`);
      return JSON.parse(JSON.stringify(found)); // Return deep copy to prevent direct pointer manipulation
    },

    // Save/persist card details safely (requires WRITE_CARDS permission and 'cards' lock)
    saveCard: async (cardObj: any): Promise<void> => {
      if (!plugin.requiredPermissions.includes('WRITE_CARDS')) {
        const errorMsg = `SecurityException: Permission 'WRITE_CARDS' Access Denied for plugin '${plugin.name}'.`;
        onLogBridgeAction(plugin.name, 'BLOCK', errorMsg);
        throw new Error(errorMsg);
      }

      if (!plugin.requiredLocks.includes('cards')) {
        const errorMsg = `LockConflictException: Unacquired lock 'cards' on database update for plugin '${plugin.name}'.`;
        onLogBridgeAction(plugin.name, 'BLOCK', errorMsg);
        throw new Error(errorMsg);
      }

      // Check schema contract and fields validation
      validateCardSchema(cardObj);

      // Mutate backing SQLite record
      onUpdateCardRecord(cardObj);
      onLogBridgeAction(plugin.name, 'WRITE', `Persisted secure SQLite UPDATE: '${cardObj.id}'`);
      appendLog(`Saved card updates for '${cardObj.front}'`);
    },

    // Execute card score rating scheduling (requires WRITE_CARDS and both 'cards' & 'user' lock permissions)
    scheduleCard: async (cardId: string, rating: number): Promise<void> => {
      if (!plugin.requiredPermissions.includes('WRITE_CARDS')) {
        const errorMsg = `SecurityException: Permission 'WRITE_CARDS' Access Denied for scheduling in plugin '${plugin.name}'.`;
        onLogBridgeAction(plugin.name, 'BLOCK', errorMsg);
        throw new Error(errorMsg);
      }

      if (!plugin.requiredLocks.includes('cards') || !plugin.requiredLocks.includes('user')) {
        const errorMsg = `LockConflictException: Concurrency mismatch. Plugin '${plugin.name}' must lock both 'cards' and 'user' resources before calling scheduleCard.`;
        onLogBridgeAction(plugin.name, 'BLOCK', errorMsg);
        throw new Error(errorMsg);
      }

      if (typeof rating !== 'number' || rating < 1 || rating > 4) {
        throw new Error('DataIntegrityException: Scheduling rating must be a valid integer between 1 and 4.');
      }

      if (onScheduleCardRating) {
        onScheduleCardRating(cardId, rating);
        appendLog(`Asynchronously scheduled card [${cardId}] rating as ${rating}`);
      }
    }
  };

  // 3. Dynamic Compilation & Safe Wrapping of the code
  try {
    // We isolate and scope globals to shield against malicious window or document updates
    const wrappedCode = `
      const window = undefined;
      const document = undefined;
      const fetch = undefined;
      const XMLHttpRequest = undefined;
      const alert = undefined;
      
      ${plugin.code}

      if (typeof ${hookName} !== 'function') {
        throw new Error("CompatibilityException: The entry function '${hookName}' is missing or is not registered in the plugin.");
      }
      return ${hookName};
    `;

    // Create Function in isolated wrapper
    const scriptCompiler = new Function('bridge', wrappedCode);
    const hookFunction = scriptCompiler(bridge);

    // 4. Run the Sandbox script asynchronously
    let finalCard = JSON.parse(JSON.stringify(payload.card));
    
    if (hookName === 'onCardLoad') {
      const returnedValue = await Promise.resolve(hookFunction(finalCard));
      if (returnedValue && typeof returnedValue === 'object') {
        // Enforce schema validation on return type to prevent corruption
        validateCardSchema(returnedValue);
        finalCard = returnedValue;
      }
    } else if (hookName === 'onAnswerSelected') {
      const returnedValue = await Promise.resolve(hookFunction(finalCard, payload.rating || 3));
      if (returnedValue && typeof returnedValue === 'object') {
        validateCardSchema(returnedValue);
        finalCard = returnedValue;
      }
    }

    return { card: finalCard, logs };
  } catch (err: any) {
    const crashDetails = err.stack || err.message || String(err);
    appendLog(`🔴 Sandbox Crashed: ${err.message}`);
    onLogBridgeAction(plugin.name, 'BLOCK', `CRITICAL EXCEPTION: Plugin script execution failed. Trace: ${err.message}`);
    return {
      card: payload.card,
      logs,
      error: `CRITICAL SECURE FAULT: ${err.name || 'ComponentError'} - ${err.message}`
    };
  }
}
