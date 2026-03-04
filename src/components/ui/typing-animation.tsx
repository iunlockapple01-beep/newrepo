'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TypingAnimationProps {
  text: string;
  duration?: number;
  className?: string;
}

export function TypingAnimation({
  text,
  duration = 5000,
  className,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const words = useMemo(() => text.split(/(\s+)/), [text]);

  useEffect(() => {
    setDisplayedText('');
    setIsFinished(false);

    if (words.length === 0) {
        setIsFinished(true);
        return;
    }

    const totalWords = words.length;
    // Ensure delay is not too fast for very long texts
    const delay = Math.max(20, duration / totalWords);

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex < totalWords) {
        // Use ?? '' safety to prevent technical "undefined" concatenation
        const wordToAppend = words[currentIndex] ?? '';
        setDisplayedText((prev) => prev + wordToAppend);
        currentIndex++;
      } else {
        clearInterval(intervalId);
        setIsFinished(true);
      }
    }, delay);

    return () => clearInterval(intervalId);
  }, [words, duration]);

  return (
    <div className={cn(className)}>
      <span className="whitespace-pre-wrap">{displayedText}</span>
      {!isFinished && <span className="inline-block w-[2px] h-4 bg-current animate-pulse ml-1 align-bottom"></span>}
    </div>
  );
}
