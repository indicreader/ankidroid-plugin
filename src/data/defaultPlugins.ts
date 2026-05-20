/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plugin } from '../types';

export const defaultPlugins: Plugin[] = [
  {
    id: 'plugin-romaji-auto',
    name: 'Auto-Transliteration (Romaji Assistant)',
    description: 'Automatically detects Japanese text, performs dynamic Romaji tokenization, and attaches speech scaffolding fields.',
    version: '1.2.0',
    author: 'AnkiDev Team',
    isEnabled: true,
    requiredPermissions: ['READ_CARDS', 'WRITE_CARDS'],
    requiredLocks: ['cards', 'config'], // alphabetical locks sorted 'cards', 'config'
    hookType: 'onCardLoad',
    code: `// AnkiDroid No-Code Plugin Workspace
// Exposes secure 'bridge' to read/write without direct Android native calls.

function onCardLoad(card) {
  bridge.log("Romaji assistant triggered for card: " + card.id);
  
  if (card.deckId === "deck-1") {
    // Read current custom fields
    let fields = card.customFields || {};
    
    // Check if romaji exists, if not - execute dynamic mock transliteration
    if (!fields.romaji) {
      bridge.log("Detecting Japanese text on card face");
      let text = card.front;
      let romanized = "";
      
      if (text.includes("食べる")) romanized = "taberu";
      else if (text.includes("水")) romanized = "mizu";
      else if (text.includes("猫")) romanized = "neko";
      else if (text.includes("赤い")) romanized = "akai";
      else if (text.includes("先生")) romanized = "sensei";
      else romanized = "untranslated_kana";
      
      fields.romaji = romanized;
      fields.plugin_generated_phonetic_scaffold = "yes";
      
      card.customFields = fields;
      
      // Save revised card through Room DB boundary
      bridge.saveCard(card);
      bridge.notify("Romaji auto-applied: " + romanized);
    }
  }
  return card;
}
`
  },
  {
    id: 'plugin-med-hyperlinker',
    name: 'Cardiology Diagnostics Hyperlinker',
    description: 'Injects clinical evidence links and interactive diagnostic panels if cardiological keywords are detected.',
    version: '2.0.4',
    author: 'Dr. Elizabeth Blackwell',
    isEnabled: true,
    requiredPermissions: ['READ_CARDS', 'WRITE_CARDS', 'NOTIFY'],
    requiredLocks: ['cards'], // only needs 'cards'
    hookType: 'onCardLoad',
    code: `// Cardio Diagnostic Deep Hyperlinking Rule

function onCardLoad(card) {
  bridge.log("Scanning cardiology terminology on: " + card.front);
  
  // Scans for cardiac clinical triggers
  const description = card.back || "";
  if (description.toLowerCase().includes("infarction") || description.toLowerCase().includes("bradycardia")) {
    let fields = card.customFields || {};
    
    // Inject dynamic clinical links securely
    fields.clinical_guidelines = "https://www.acc.org/guidelines";
    fields.emergency_protocol = "Administer oxygen, ECG monitoring, Aspirin 325mg stat, contact STEMI team.";
    fields.auto_rendered_diagnostic_hint = "⚠️ Clinical emergency protocols available.";
    
    card.customFields = fields;
    bridge.saveCard(card);
    bridge.log("Successfully attached clinical trial diagnostics.");
  }
  return card;
}
`
  },
  {
    id: 'plugin-leitner-scheduler',
    name: 'Leitner Exponential Ease Scheduler',
    description: 'Bypasses the default SM-2 interval algorithm. Uses a custom response-based Leitner scale to adjust card ease factor.',
    version: '3.1.2',
    author: 'SuperMemo Enthusiast',
    isEnabled: true,
    requiredPermissions: ['READ_CARDS', 'WRITE_CARDS'],
    requiredLocks: ['cards', 'user'], // Sorted locks: 'cards', 'user'
    hookType: 'onAnswerSelected',
    code: `// Leitner Scheduler Extension
// Updates interval based on selection: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy

function onAnswerSelected(card, rating) {
  bridge.log("Custom Scheduler hook active. Card: " + card.front + " with Rating: " + rating);
  
  let ease = card.easeFactor || 250;
  let interval = card.intervalDays || 1;
  let reps = card.repetitions || 0;
  
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
  
  // Custom metadata stamping
  let fields = card.customFields || {};
  fields.scheduler_type = "Custom Leitner Exp";
  fields.last_ratingStr = ["", "Again", "Hard", "Good", "Easy"][rating];
  fields.calculated_ease = ease.toString();
  
  card.easeFactor = ease;
  card.intervalDays = interval;
  card.repetitions = reps;
  card.customFields = fields;
  
  // Write changes securely through the mutex lock
  bridge.saveCard(card);
  bridge.notify("Custom Leitner Scheduled. Next review in " + interval + " days.");
  return card;
}
`
  },
  {
    id: 'plugin-md-markdown',
    name: 'Jetpack Compose Rich Markdown Stylist',
    description: 'Parses card headers, lists, and markdown syntax, formatting them into rich typography with custom tailwind-equivalent styles.',
    version: '1.0.1',
    author: 'ComposeCraft',
    isEnabled: false,
    requiredPermissions: ['READ_CARDS'],
    requiredLocks: ['config'], // 'config' only
    hookType: 'onCardLoad',
    code: `// Markdown Layout Beautifier

function onCardLoad(card) {
  bridge.log("Markdown renderer processing fields.");
  
  // Simplistic local markdown parser triggers back rendering
  if (card.back && card.back.includes("Systole vs Diastole")) {
    let fields = card.customFields || {};
    fields.formatted_render_mode = "ComposeRichText";
    fields.formatted_html_badge = "<span style='color: #4f46e5; font-weight: bold;'>⚡ Systole Contraction</span> vs <span style='color: #0891b2; font-weight: bold;'>💧 Diastole Relaxation</span>";
    card.customFields = fields;
    bridge.saveCard(card);
  }
  return card;
}
`
  }
];
