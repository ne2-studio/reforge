import { useState } from 'react';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { Button } from '@/design-system/components/ui/button';
import { Input } from '@/design-system/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/design-system/components/ui/card';
import type { ChatMessage } from '@/types';

const SUGGESTED_QUESTIONS = [
  '¿Qué debería desayunar hoy?',
  '¿Cuánta proteína debo consumir?',
  '¿Cómo voy hoy?',
  '¿Cómo puedo ganar músculo y perder grasa?',
];

interface CoachChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

// Presentational — no react-router-dom/store/useCases imports. Ported from
// reforge-frontend/src/components/CoachChat.tsx: WhatsApp-style header, message bubbles (user
// right-aligned, assistant left-aligned with a Bot icon), suggested-question buttons on the
// empty state, input + send button, loading indicator while awaiting a reply. Drops entirely:
// the AI-usage-limit props/UI (`chatMessagesUsed`/`chatMessagesLimit`/`onUpgrade`/`isPro`,
// Stripe/Slice 9, deferred), the `isDayClosureMessage` auto-save-to-`dailyMenu` branch (an
// unported legacy concept with no equivalent in this migration — day-close already lives in
// features/dayClose), and the `forwardRef`/`sendAutoMessage` imperative handle (nothing in this
// slice's actual scope — just FloatingCoachButton opening /chat — needs to pre-fill and
// auto-send a message, so it's left out per YAGNI rather than ported speculatively).
export function CoachChat({ messages, isLoading, onSendMessage }: CoachChatProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-4rem)] border-2 border-primary/20 overflow-hidden">
      <CardHeader className="border-b-2 border-border shrink-0">
        <CardTitle className="flex items-center gap-3">
          <div className="bg-accent/30 rounded-full p-2">
            <Bot className="h-6 w-6 text-accent" />
          </div>
          <span>Coach de IA</span>
        </CardTitle>
        <CardDescription>Tu coach personal de nutrición y entrenamiento</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full text-center space-y-4 py-8">
            <div className="bg-primary/10 rounded-full p-6 border-2 border-primary/30">
              <Bot className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-primary">¡Hola! Soy tu coach</h3>
              <p className="text-muted-foreground max-w-md text-sm">¿En qué te puedo ayudar hoy? 💪</p>
            </div>
            <div className="grid grid-cols-1 gap-2 max-w-md text-sm w-full">
              {SUGGESTED_QUESTIONS.map((question) => (
                <Button
                  key={question}
                  type="button"
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4"
                  onClick={() => setInput(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-3">
              <div className="flex gap-3 justify-end">
                <div className="bg-primary/20 rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">{message.userMessage}</p>
                </div>
                <div className="bg-primary/30 rounded-full p-2 h-fit">
                  <User className="h-4 w-4" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-accent/30 rounded-full p-2 h-fit">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-accent/10 rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm whitespace-pre-wrap">{message.assistantMessage}</p>
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="bg-accent/30 rounded-full p-2 h-fit">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-accent/10 rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </CardContent>

      <div className="p-4 border-t border-border shrink-0 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          disabled={isLoading}
          className="h-12"
        />
        <Button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="h-12 px-6"
          aria-label="Enviar mensaje"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </Card>
  );
}
