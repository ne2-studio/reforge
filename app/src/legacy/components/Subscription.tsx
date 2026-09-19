import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Crown, Check, Sparkles } from "lucide-react";
import { useUserStore } from "../store/useUserStore";

interface SubscriptionProps {
  onPlanUpdated?: () => void;
}

export function Subscription({ onPlanUpdated }: SubscriptionProps) {
  const { subscription, isLoadingSubscription, fetchSubscription } = useUserStore();
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">("free");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setSelectedPlan(subscription?.tier || "free");
  }, [subscription]);

  const handleUpdatePlan = () => {
    setIsUpdating(true);
    
    // Simular actualización
    setTimeout(() => {
      setIsUpdating(false);
      toast.success("Tu plan ha sido actualizado ✨");
      
      // Llamar callback para volver a home
      if (onPlanUpdated) {
        onPlanUpdated();
      }
    }, 500);
  };

  if (isLoadingSubscription) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-accent" />
          <h2 className="text-2xl">Mi suscripción</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.tier || "free";
  const hasChanges = selectedPlan !== currentPlan;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Crown className="h-6 w-6 text-accent" />
        <h2 className="text-2xl">Mi suscripción</h2>
      </div>

      {/* Plans */}
      <div className="space-y-4">
        {/* Free Plan */}
        <Card 
          className={`p-6 cursor-pointer transition-all ${
            selectedPlan === "free" 
              ? "border-2 border-primary bg-primary/5" 
              : "border-2 border-border hover:border-primary/50"
          }`}
          onClick={() => setSelectedPlan("free")}
        >
          <div className="flex items-start gap-4">
            {/* Radio button */}
            <div className="mt-1">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === "free" 
                  ? "border-primary bg-primary" 
                  : "border-muted-foreground"
              }`}>
                {selectedPlan === "free" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Gratuito</h3>
                {currentPlan === "free" && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    Actual
                  </span>
                )}
              </div>
              
              <p className="text-2xl font-bold mb-4">$0 <span className="text-sm font-normal text-muted-foreground">/ mes</span></p>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>Registro manual de comidas</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>10 análisis con IA al mes</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>20 mensajes con coach al mes</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>Tracking básico de progreso</span>
                </li>
              </ul>

              {currentPlan === "free" && subscription && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Análisis: </span>
                      <span className="font-medium">{subscription.mealAnalysisUsed || 0} / {subscription.mealAnalysisLimit || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mensajes: </span>
                      <span className="font-medium">{subscription.chatMessagesUsed || 0} / {subscription.chatMessagesLimit || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Premium Plan */}
        <Card 
          className={`p-6 cursor-pointer transition-all relative overflow-hidden ${
            selectedPlan === "premium" 
              ? "border-2 border-accent bg-accent/5" 
              : "border-2 border-border hover:border-accent/50"
          }`}
          onClick={() => setSelectedPlan("premium")}
        >
          {/* Premium badge */}
          <div className="absolute top-3 right-3">
            <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Premium
            </span>
          </div>

          <div className="flex items-start gap-4">
            {/* Radio button */}
            <div className="mt-1">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === "premium" 
                  ? "border-accent bg-accent" 
                  : "border-muted-foreground"
              }`}>
                {selectedPlan === "premium" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-foreground" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pr-16">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-accent" />
                <h3 className="text-xl font-semibold">Premium</h3>
                {currentPlan === "premium" && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                    Actual
                  </span>
                )}
              </div>
              
              <p className="text-2xl font-bold mb-4">$9.99 <span className="text-sm font-normal text-muted-foreground">/ mes</span></p>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span className="font-medium">Análisis con IA ilimitados</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span className="font-medium">Chat con coach ilimitado</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span>Análisis nutricional detallado</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span>Recomendaciones personalizadas</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span>Todo del plan gratuito</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Update button */}
      {hasChanges && (
        <Button 
          onClick={handleUpdatePlan}
          disabled={isUpdating}
          className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground"
          size="lg"
        >
          {isUpdating ? "Actualizando..." : "Actualizar plan"}
        </Button>
      )}

      {/* Info */}
      <p className="text-center text-sm text-muted-foreground">
        🔒 Pagos seguros procesados por Stripe
      </p>
    </div>
  );
}