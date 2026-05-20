/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Deck, Card } from '../types';

export const defaultDecks: Deck[] = [
  {
    id: 'deck-1',
    name: '日本語 Essential N5 Vocab',
    cardCount: 5,
    description: 'Beginner Japanese vocabulary with kanji, hiragana, and meanings.',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'deck-2',
    name: 'Medical Terminology - Cardiology',
    cardCount: 4,
    description: 'Crucial jargon and anatomic components of the human cardiovascular system.',
    createdAt: '2026-02-15T09:30:00Z',
  },
  {
    id: 'deck-3',
    name: 'Advanced Algorithms & Big-O',
    cardCount: 4,
    description: 'Core computational complexity theory, data structures, and trade-offs.',
    createdAt: '2026-03-01T12:00:00Z',
  },
];

export const defaultCards: Card[] = [
  // Japanese Deck
  {
    id: 'card-1-1',
    deckId: 'deck-1',
    front: '食べる (たべる)',
    back: 'To eat',
    intervalDays: 3,
    easeFactor: 250,
    repetitions: 2,
    nextReviewDate: '2026-05-20T10:00:00Z',
    customFields: {
      romaji: 'taberu',
      example: 'りんごを食べる (I eat an apple)',
      partOfSpeech: 'Verb (Ru-verb)',
    },
  },
  {
    id: 'card-1-2',
    deckId: 'deck-1',
    front: '水 (みず)',
    back: 'Water',
    intervalDays: 8,
    easeFactor: 260,
    repetitions: 4,
    nextReviewDate: '2026-05-22T14:00:00Z',
    customFields: {
      romaji: 'mizu',
      example: 'お水をください (Water, please)',
      partOfSpeech: 'Noun',
    },
  },
  {
    id: 'card-1-3',
    deckId: 'deck-1',
    front: '猫 (ねこ)',
    back: 'Cat',
    intervalDays: 1,
    easeFactor: 190,
    repetitions: 1,
    nextReviewDate: '2026-05-20T12:00:00Z',
    customFields: {
      romaji: 'neko',
      example: '猫が寝ている (The cat is sleeping)',
      partOfSpeech: 'Noun',
    },
  },
  {
    id: 'card-1-4',
    deckId: 'deck-1',
    front: '赤い (あかい)',
    back: 'Red',
    intervalDays: 14,
    easeFactor: 270,
    repetitions: 6,
    nextReviewDate: '2026-06-03T18:00:00Z',
    customFields: {
      romaji: 'akai',
      example: '赤い車 (A red car)',
      partOfSpeech: 'i-Adjective',
    },
  },
  {
    id: 'card-1-5',
    deckId: 'deck-1',
    front: '先生 (せんせい)',
    back: 'Teacher',
    intervalDays: 5,
    easeFactor: 240,
    repetitions: 3,
    nextReviewDate: '2026-05-21T09:00:00Z',
    customFields: {
      romaji: 'sensei',
      example: '頼もしい先生 (A reliable teacher)',
      partOfSpeech: 'Noun',
    },
  },

  // Medical Deck
  {
    id: 'card-2-1',
    deckId: 'deck-2',
    front: 'Myocardial Infarction',
    back: 'Heart attack; occlusion of one or more coronary arteries causing myocardial muscle necrosis.',
    intervalDays: 5,
    easeFactor: 250,
    repetitions: 3,
    nextReviewDate: '2026-05-20T11:00:00Z',
    customFields: {
      symptoms: 'Chest pain, shortness of breath, left arm pain',
      diagnostics: 'ECG showing ST-elevation, Troponin levels',
    },
  },
  {
    id: 'card-2-2',
    deckId: 'deck-2',
    front: 'Bradycardia',
    back: 'An abnormally slow heart rate, typically defined as under 60 beats per minute in adults.',
    intervalDays: 1,
    easeFactor: 170,
    repetitions: 1,
    nextReviewDate: '2026-05-20T13:00:00Z',
    customFields: {
      causes: 'Athletic training, SA node damage, beta-blockers',
      pacings: 'Atropine, pacemaker installation',
    },
  },
  {
    id: 'card-2-3',
    deckId: 'deck-2',
    front: 'Systole vs Diastole',
    back: 'Systole: Contraction phase of the cardiac cycle (pumping).\nDiastole: Relaxation phase of the cardiac cycle (filling).',
    intervalDays: 18,
    easeFactor: 280,
    repetitions: 8,
    nextReviewDate: '2026-06-07T12:00:00Z',
    customFields: {
      ratios: 'Normal ratio is roughly 1/3 systole, 2/3 diastole at rest.',
    },
  },
  {
    id: 'card-2-4',
    deckId: 'deck-2',
    front: 'Mitral Valve',
    back: 'A dual-flap valve in the heart that lies between the left atrium and the left ventricle.',
    intervalDays: 12,
    easeFactor: 250,
    repetitions: 5,
    nextReviewDate: '2026-06-01T15:00:00Z',
    customFields: {
      alternativeName: 'Bicuspid Valve',
      pathology: 'Mitral valve prolapse (MVP), regurgitation',
    },
  },

  // Computer Science Deck
  {
    id: 'card-3-1',
    deckId: 'deck-3',
    front: 'Heap Sort Complexity',
    back: 'Best: O(n log n)\nAverage: O(n log n)\nWorst: O(n log n)\nSpace: O(1) auxiliary.',
    intervalDays: 4,
    easeFactor: 240,
    repetitions: 2,
    nextReviewDate: '2026-05-20T10:30:00Z',
    customFields: {
      structure: 'Binary Heap (usually max-heap array representation)',
      stability: 'Unstable sorting algorithm',
    },
  },
  {
    id: 'card-3-2',
    deckId: 'deck-3',
    front: 'B-Trees vs Binary Search Trees',
    back: 'B-Trees: Self-balancing search trees optimized for systems that read and write large blocks of data (databases/filesystems). They have multi-way branching.\nBSTs: Each node has at most two children. Fast in-memory but high disk overhead.',
    intervalDays: 6,
    easeFactor: 250,
    repetitions: 3,
    nextReviewDate: '2026-05-23T11:00:00Z',
    customFields: {
      branching_degree: 'Dynamic parameter m, where each node has up to m children.',
    },
  },
  {
    id: 'card-3-3',
    deckId: 'deck-3',
    front: 'Dijkstra\'s Algorithm Complexity',
    back: 'With Fibonacci heap: O(E + V log V)\nWith binary heap / Priority Queue: O((E + V) log V)',
    intervalDays: 2,
    easeFactor: 210,
    repetitions: 2,
    nextReviewDate: '2026-05-21T09:30:00Z',
    customFields: {
      restriction: 'Only works with non-negative edge weights.',
    },
  },
  {
    id: 'card-3-4',
    deckId: 'deck-3',
    front: 'P vs NP',
    back: 'P: Decision problems solvable in polynomial time.\nNP: Decision problems where a proposed solution can be verified in polynomial time.',
    intervalDays: 32,
    easeFactor: 310,
    repetitions: 11,
    nextReviewDate: '2026-06-21T10:00:00Z',
    customFields: {
      millionDollarQuestion: 'Does P = NP? (Millennium Prize Problem)',
    },
  },
];
