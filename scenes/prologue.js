import { loadPrologue } from '../loaders.js';
import { prologue } from './playerFormatters.js';

export const loadFrames = () => prologue(loadPrologue());
