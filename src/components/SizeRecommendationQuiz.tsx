import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, ChevronRight, ChevronLeft, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface QuizQuestion {
  id: string;
  question: string;
  options: { value: string; label: string; description?: string }[];
}

const questions: QuizQuestion[] = [
  {
    id: 'height',
    question: 'What is your height?',
    options: [
      { value: 'short', label: 'Under 5\'4" (163cm)', description: 'Petite frame' },
      { value: 'average', label: '5\'4" - 5\'8" (163-173cm)', description: 'Average height' },
      { value: 'tall', label: '5\'9" - 6\'0" (175-183cm)', description: 'Tall' },
      { value: 'very-tall', label: 'Over 6\'0" (183cm)', description: 'Very tall' },
    ],
  },
  {
    id: 'build',
    question: 'How would you describe your body build?',
    options: [
      { value: 'slim', label: 'Slim', description: 'Lean and slender build' },
      { value: 'athletic', label: 'Athletic', description: 'Muscular, toned physique' },
      { value: 'average', label: 'Average', description: 'Moderate build' },
      { value: 'broad', label: 'Broad/Large', description: 'Wider frame or fuller figure' },
    ],
  },
  {
    id: 'fit',
    question: 'What fit do you prefer?',
    options: [
      { value: 'tight', label: 'Fitted', description: 'Close to the body' },
      { value: 'regular', label: 'Regular', description: 'Standard comfortable fit' },
      { value: 'relaxed', label: 'Relaxed', description: 'Loose and comfortable' },
      { value: 'oversized', label: 'Oversized', description: 'Extra roomy' },
    ],
  },
  {
    id: 'chest',
    question: 'How do you usually find chest/bust area in standard sizes?',
    options: [
      { value: 'tight', label: 'Usually tight', description: 'Often need to size up' },
      { value: 'perfect', label: 'Usually fits well', description: 'Standard sizes work' },
      { value: 'loose', label: 'Usually loose', description: 'Could size down' },
    ],
  },
];

const getSizeRecommendation = (answers: Record<string, string>): string => {
  let sizeScore = 0;

  // Height scoring
  if (answers.height === 'short') sizeScore -= 1;
  if (answers.height === 'tall') sizeScore += 1;
  if (answers.height === 'very-tall') sizeScore += 2;

  // Build scoring
  if (answers.build === 'slim') sizeScore -= 1;
  if (answers.build === 'athletic') sizeScore += 0.5;
  if (answers.build === 'broad') sizeScore += 1.5;

  // Fit preference
  if (answers.fit === 'tight') sizeScore -= 0.5;
  if (answers.fit === 'relaxed') sizeScore += 0.5;
  if (answers.fit === 'oversized') sizeScore += 1;

  // Chest fit
  if (answers.chest === 'tight') sizeScore += 1;
  if (answers.chest === 'loose') sizeScore -= 0.5;

  // Determine size
  if (sizeScore <= -1.5) return 'XS';
  if (sizeScore <= 0) return 'S';
  if (sizeScore <= 1.5) return 'M';
  if (sizeScore <= 3) return 'L';
  if (sizeScore <= 4.5) return 'XL';
  return 'XXL';
};

interface SizeRecommendationQuizProps {
  onSizeSelected?: (size: string) => void;
}

export function SizeRecommendationQuiz({ onSizeSelected }: SizeRecommendationQuizProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Calculate recommendation
      const size = getSizeRecommendation(answers);
      setRecommendedSize(size);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendedSize(null);
  };

  const handleSelectSize = () => {
    if (recommendedSize && onSizeSelected) {
      onSizeSelected(recommendedSize);
    }
    setOpen(false);
    handleReset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Ruler className="h-4 w-4" />
          Find Your Size
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Size Recommendation Quiz
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {recommendedSize ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-6 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl font-bold text-primary">{recommendedSize}</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Your Recommended Size</h3>
              <p className="text-muted-foreground mb-6">
                Based on your answers, we recommend size <strong>{recommendedSize}</strong> for the best fit.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleReset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retake Quiz
                </Button>
                <Button onClick={handleSelectSize} className="gap-2">
                  <Check className="h-4 w-4" />
                  Select Size {recommendedSize}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-4"
            >
              <Progress value={progress} className="mb-6" />
              
              <h3 className="font-medium mb-4">
                {currentStep + 1}. {currentQuestion.question}
              </h3>

              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={handleAnswer}
                className="space-y-3"
              >
                {currentQuestion.options.map((option) => (
                  <motion.div
                    key={option.value}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Label
                      htmlFor={option.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        answers[currentQuestion.id] === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                      <div>
                        <p className="font-medium">{option.label}</p>
                        {option.description && (
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        )}
                      </div>
                    </Label>
                  </motion.div>
                ))}
              </RadioGroup>

              <div className="flex justify-between mt-6">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                  className="gap-2"
                >
                  {currentStep === questions.length - 1 ? 'Get Result' : 'Next'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
