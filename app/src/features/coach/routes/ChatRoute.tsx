import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isApiErrorWithStatus } from '@/api';
import { useCoachStore } from '@/store/coachStore';
import { useFeaturesStore } from '@/store/featuresStore';
import { loadChatHistory, sendChatMessage } from '../useCases';
import { CoachChat } from '../components/CoachChat';
import { AILimitReached } from '@/features/subscription/components/AILimitReached';

// Container for /chat. Loads the caller's chat history on mount, wires sendChatMessage, reads
// coachStore — mirrors MealsRoute's container-vs-presentational split (docs/architecture/
// frontend.md). Errors from a failed send are toasted here, not swallowed into the store, same
// reasoning as dayClose's useCases/closeDay — a failed send shouldn't silently look like nothing
// happened.
//
// Slice 9: a 403 on POST /api/chat means the caller's monthly AI usage limit was hit — but
// only when featuresStore.subscriptions is true, since that's the only backend configuration
// where this endpoint enforces any such limit at all; with the toggle off, a 403 here would
// mean something else entirely and must fall through to the generic error toast unchanged.
export function ChatRoute() {
  const navigate = useNavigate();
  const { messages, isLoading } = useCoachStore();
  const { subscriptions: subscriptionsEnabled } = useFeaturesStore();
  const [isLimitReachedOpen, setIsLimitReachedOpen] = useState(false);

  useEffect(() => {
    void loadChatHistory();
  }, []);

  const handleSendMessage = (message: string) => {
    sendChatMessage(message).catch((err: unknown) => {
      if (subscriptionsEnabled && isApiErrorWithStatus(err, 403)) {
        setIsLimitReachedOpen(true);
        return;
      }
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el mensaje al coach');
    });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Coach IA</h1>
        <CoachChat messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} />
      </div>
      {subscriptionsEnabled && (
        <AILimitReached
          open={isLimitReachedOpen}
          onOpenChange={setIsLimitReachedOpen}
          feature="chatMessages"
          onUpgrade={() => navigate('/suscripcion')}
        />
      )}
    </div>
  );
}
