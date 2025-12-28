import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, MessageCircle, Send, User, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Answer {
  id: string;
  answer: string;
  is_official: boolean;
  created_at: string;
  user_name?: string;
}

interface Question {
  id: string;
  question: string;
  is_answered: boolean;
  created_at: string;
  user_name?: string;
  answers: Answer[];
}

interface ProductQAProps {
  productId: string;
}

export function ProductQA({ productId }: ProductQAProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [productId]);

  const fetchQuestions = async () => {
    try {
      const { data: questionsData } = await supabase
        .from('product_questions')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (!questionsData) return;

      const questionsWithAnswers: Question[] = [];

      for (const q of questionsData) {
        // Get user name
        let userName = 'Anonymous';
        if (q.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', q.user_id)
            .single();
          if (profile?.full_name) userName = profile.full_name;
        }

        // Get answers
        const { data: answersData } = await supabase
          .from('product_answers')
          .select('*')
          .eq('question_id', q.id)
          .order('is_official', { ascending: false });

        const answers: Answer[] = [];
        for (const a of answersData || []) {
          let answerUserName = 'Almans Team';
          if (!a.is_official && a.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', a.user_id)
              .single();
            if (profile?.full_name) answerUserName = profile.full_name;
          }
          answers.push({
            ...a,
            user_name: answerUserName,
          });
        }

        questionsWithAnswers.push({
          ...q,
          user_name: userName,
          answers,
        });
      }

      setQuestions(questionsWithAnswers);
    } catch (error) {
      console.error('Error fetching Q&A:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!user) {
      toast({ title: 'Please login to ask a question', variant: 'destructive' });
      return;
    }

    if (!newQuestion.trim()) {
      toast({ title: 'Please enter your question', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('product_questions').insert({
        product_id: productId,
        user_id: user.id,
        question: newQuestion.trim(),
      });

      if (error) throw error;

      toast({ title: 'Question submitted!' });
      setNewQuestion('');
      setShowForm(false);
      fetchQuestions();
    } catch (error) {
      toast({ title: 'Failed to submit question', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-border pt-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl font-bold">Questions & Answers</h2>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Ask a Question
        </Button>
      </div>

      {/* Question Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-xl p-4 mb-6 border border-border"
          >
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="What would you like to know about this product?"
              className="mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmitQuestion} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Question
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 border border-border"
            >
              <button
                onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                className="w-full text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">Q</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{question.question}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{question.user_name}</span>
                      <span>•</span>
                      <span>{new Date(question.created_at).toLocaleDateString()}</span>
                      {question.answers.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-primary">{question.answers.length} answer(s)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expandedQuestion === question.id && question.answers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pl-11 space-y-3"
                  >
                    {question.answers.map((answer) => (
                      <div key={answer.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          {answer.is_official ? (
                            <Badge className="bg-primary/10 text-primary gap-1">
                              <Shield className="h-3 w-3" />
                              Official Answer
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              {answer.user_name}
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(answer.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{answer.answer}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
