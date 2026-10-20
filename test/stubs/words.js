import { mock } from 'node:test';

export const pickFirstWord = () => mock.method(Math, 'random', () => 0);

export const FIRST_WORD = 'Маяковский';
export const FIRST_WORD_LETTERS = [...new Set(FIRST_WORD.toLowerCase())];
