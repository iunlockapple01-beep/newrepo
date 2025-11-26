import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-code-improvements.ts';
import '@/ai/flows/analyze-html-for-improvements.ts';
import '@/ai/flows/fix-html-code.ts';
