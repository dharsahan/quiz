'use client';

import type { QuizQuestion } from '@/types/quiz';
import { useState, useEffect } from 'react';
import { QuestionCard } from './question-card';
import { QuizResults } from './quiz-results';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TimerIcon } from 'lucide-react';
import type { Difficulty } from '@/app/page';

const SECONDS_PER_QUESTION: Record<Difficulty, number> = {
  Easy: 30,
  Medium: 20,
  Hard: 15,
};

interface QuizDisplayProps {
  quiz: QuizQuestion[];
  onRestart: () => void;
  difficulty: Difficulty;
}

export function QuizDisplay({ quiz, onRestart, difficulty }: QuizDisplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isAborted, setIsAborted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.length * SECONDS_PER_QUESTION[difficulty]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsAborted(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    setIsAnswered(false);
    setCurrentQuestionIndex((prev) => prev + 1);
  };
  
  const handleAbort = () => {
    setIsAborted(true);
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentQuestionIndex + (isAnswered ? 1: 0)) / quiz.length) * 100;
  const isQuizFinished = currentQuestionIndex >= quiz.length || isAborted;

  if (isQuizFinished) {
    return <QuizResults score={score} totalQuestions={quiz.length} onRestart={onRestart} />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Progress value={progress} className="w-full h-2" />
        <div className="flex items-center gap-2 text-lg font-semibold tabular-nums text-muted-foreground">
          <TimerIcon className="h-5 w-5" />
          {formatTime(timeLeft)}
        </div>
      </div>
      <QuestionCard
        key={currentQuestionIndex}
        question={quiz[currentQuestionIndex]}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={quiz.length}
        onAnswerSubmit={handleAnswerSubmit}
      />
      <div className="flex justify-center items-center gap-4">
        {isAnswered && (
          <Button onClick={handleNextQuestion} className="animate-in fade-in">
            {currentQuestionIndex === quiz.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </Button>
        )}
        <Button onClick={handleAbort} variant="ghost" size="sm">
            End Quiz
        </Button>
      </div>
    </div>
  );
}
