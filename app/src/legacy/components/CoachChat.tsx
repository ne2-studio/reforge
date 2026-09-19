import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { MessageCircle, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AILimitReached } from "./AILimitReached";
import { coachService } from "../services/coach.service";
import { useAuthStore } from "../store/useAuthStore";
import { useMealStore } from "../store/useMealStore";
import { Message } from "../types";

interface CoachChatProps {
  autoSendMessage?: string | null;
  onAutoMessageSent?: () => void;
  onAnalysisSaved?: () => void;
  chatMessagesUsed?: number;
  chatMessagesLimit?: number;
  onUpgrade?: () => void;
  isPro?: boolean;
}

export interface CoachChatRef {
  sendAutoMessage: (message: string) => Promise<void>;
}

export const CoachChat = forwardRef<CoachChatRef, CoachChatProps>(({ autoSendMessage, onAutoMessageSent, onAnalysisSaved, chatMessagesUsed, chatMessagesLimit, onUpgrade, isPro }, ref) => {
  const { accessToken } = useAuthStore();
  const { meals, dailyMenu, fetchDailyMenu } = useMealStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = meals.filter((meal: any) => new Date(meal.timestamp).toISOString().split('T')[0] === today);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatHistory = async () => {
    if (!accessToken) {
      console.log("No access token available, skipping chat history load");
      setIsFetchingHistory(false);
      return;
    }
    
    try {
      const data = await coachService.getChatHistory(accessToken);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [accessToken]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-send message when prop changes
  useEffect(() => {
    if (autoSendMessage && !isFetchingHistory) {
      sendMessageInternal(autoSendMessage);
      if (onAutoMessageSent) {
        onAutoMessageSent();
      }
    }
  }, [autoSendMessage, isFetchingHistory]);

  // Expose sendAutoMessage to parent via ref
  useImperativeHandle(ref, () => ({
    sendAutoMessage: async (message: string) => {
      await sendMessageInternal(message);
    }
  }));

  const sendMessageInternal = async (userInput: string) => {
    if (!userInput.trim()) return;

    setIsLoading(true);

    try {
      const data = await coachService.sendMessage(accessToken, userInput);
      
      // Add new message to state
      setMessages((prev) => [
        ...prev,
        {
          userMessage: userInput,
          assistantMessage: data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);

      // If this was a day closure analysis, save it to the daily menu
      const isDayClosureMessage = userInput.toLowerCase().includes("cerrado mi día") || 
                                  userInput.toLowerCase().includes("cómo estuvo");
      
      if (isDayClosureMessage && data.reply) {
        try {
          const today = new Date().toISOString().split('T')[0];
          await coachService.saveAnalysis(accessToken, today, data.reply);
          
          console.log("Coach analysis saved to daily menu");
          // Trigger refresh of daily menu
          await fetchDailyMenu();
          if (onAnalysisSaved) {
            onAnalysisSaved();
          }
        } catch (error) {
          console.error("Error saving coach analysis to daily menu:", error);
          // Don't show error to user, just log it
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Error al conectar con el servidor");
      setInput(userInput); // Restore input
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userInput = input;
    setInput("");
    await sendMessageInternal(userInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isFetchingHistory) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Fixed WhatsApp-style Header */}
        <div className="bg-card border-b-2 border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-accent/30 rounded-full p-2">
              <Bot className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Coach Recomp AI</h3>
              <p className="text-xs text-muted-foreground">Tu coach personal de recomposición corporal</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center flex-1 bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Fixed WhatsApp-style Header */}
      <div className="bg-card border-b-2 border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-accent/30 rounded-full p-2">
            <Bot className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-primary">Coach Recomp AI</h3>
            <p className="text-xs text-muted-foreground">Tu coach personal de recomposición corporal</p>
          </div>
        </div>
      </div>
      
      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full text-center space-y-4 py-8">
              <div className="bg-primary/10 rounded-full p-6 border-2 border-primary/30">
                <Bot className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-primary">¡Hola! Soy tu Coach Recomp</h3>
                <p className="text-muted-foreground max-w-md text-sm">
                  {todaysMeals.length === 0 
                    ? "Veo que aún no has registrado comidas hoy. ¿Empezamos?"
                    : `Llevas ${todaysMeals.length} comida${todaysMeals.length > 1 ? 's' : ''} registrada${todaysMeals.length > 1 ? 's' : ''} hoy. ¿En qué te puedo ayudar?`
                  } 💪
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 max-w-md text-sm">
                {todaysMeals.length === 0 ? (
                  <>
                    <Button
                      variant="outline"
                      className="justify-start text-left h-auto py-3 px-4"
                      onClick={() => setInput("¿Qué debería desayunar hoy?")}
                    >
                      🌅 ¿Qué debería desayunar hoy?
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start text-left h-auto py-3 px-4"
                      onClick={() => setInput("¿Cuánta proteína debo consumir?")}
                    >
                      💪 ¿Cuánta proteína debo consumir?
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="justify-start text-left h-auto py-3 px-4"
                      onClick={() => setInput("¿Cómo voy hoy?")}
                    >
                      📊 ¿Cómo voy hoy?
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start text-left h-auto py-3 px-4"
                      onClick={() => setInput("¿Qué me recomiendas para la siguiente comida?")}
                    >
                      🍽️ ¿Qué me recomiendas para la siguiente comida?
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start text-left h-auto py-3 px-4"
                      onClick={() => setInput("Cierra mi día")}
                    >
                      ✅ Cierra mi día
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4"
                  onClick={() => setInput("¿Cómo puedo ganar músculo y perder grasa?")}
                >
                  🎯 ¿Cómo puedo ganar músculo y perder grasa?
                </Button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className="space-y-4">
                  {/* User message */}
                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary/20 rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">{msg.userMessage}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="bg-primary/30 rounded-full p-2 h-fit">
                      <User className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Assistant message */}
                  <div className="flex gap-3">
                    <div className="bg-accent/30 rounded-full p-2 h-fit">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-accent/10 rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm whitespace-pre-wrap">{msg.assistantMessage}</p>
                    </div>
                  </div>
                </div>
              ))}
              
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
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="p-4 border-t border-border shrink-0">
        {chatMessagesUsed && chatMessagesLimit && chatMessagesUsed >= chatMessagesLimit && !isPro ? (
          <div className="space-y-3">
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <p className="text-sm font-medium">El coach gratuito llega hasta aquí</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Para seguimiento diario y ajustes reales, necesitas el plan completo.
              </p>
            </div>
            <Button onClick={() => onUpgrade?.()} className="w-full h-12">
              <Sparkles className="mr-2 h-4 w-4" />
              Activar coach completo
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
              className="h-12"
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim()} 
              className="h-12 px-6"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

CoachChat.displayName = "CoachChat";