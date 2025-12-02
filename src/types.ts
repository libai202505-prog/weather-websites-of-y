

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


export interface Artist {
  id: string;
  name: string;
  genre: string;
  image: string;
  day: string;
  description: string;
  link?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export enum Section {
  HERO = 'hero',
  LINEUP = 'lineup',
  EXPERIENCE = 'experience',
  TICKETS = 'tickets',
}

export interface BilingualText {
  en: string;
  zh: string;
}

export interface RawSourceItem {
  id: string;
  name: BilingualText;
  genre: BilingualText;
  day: string;
  image: string;
  description: BilingualText;
  link?: string;
}

export interface RawCategory {
  title: BilingualText;
  description: BilingualText;
  sources: RawSourceItem[];
}

export type FuyaoPersonality = 'PLAYFUL' | 'CYBER' | 'ANCIENT' | 'CARING' | 'RANDOM';
