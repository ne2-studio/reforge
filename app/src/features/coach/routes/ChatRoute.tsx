import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCoachStore } from '@/store/coachStore';
import { loadChatHistory, sendChatMessage } from '../useCases';
import { CoachChat } from '../components/CoachChat';
import { Button } from '@/design-system/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Container for /chat. Loads the caller's chat history on mount, wires sendChatMessage, reads
// coachStore — mirrors MealsRoute's container-vs-presentational split (docs/architecture/
// frontend.md). Errors from a failed send are toasted here, not swallowed into the store, same
// reasoning as dayClose's useCases/closeDay — a failed send shouldn't silently look like nothing
// happened.
export function ChatRoute() {
  const navigate = useNavigate();
  const { messages, isLoading } = useCoachStore();

  useEffect(() => {
    void loadChatHistory();
  }, []);

  const handleSendMessage = (message: string) => {
    sendChatMessage(message).catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el mensaje al coach');
    });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/comidas')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <CoachChat messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
