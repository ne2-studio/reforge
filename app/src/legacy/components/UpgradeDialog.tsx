import { Sparkles, Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: "meal" | "chat" | "general";
}

export function UpgradeDialog({ open, onOpenChange, context = "general" }: UpgradeDialogProps) {
  const getContextTitle = () => {
    switch (context) {
      case "meal":
        return "Análisis ilimitados para avanzar de verdad";
      case "chat":
        return "Coach disponible cuando lo necesites";
      default:
        return "Acompañamiento real, no solo registros";
    }
  };

  const getContextDescription = () => {
    switch (context) {
      case "meal":
        return "El análisis de comidas con IA te ayuda a entender qué estás comiendo realmente. Sin límites, puedes hacer ajustes día a día.";
      case "chat":
        return "El coach funciona mejor cuando puede responderte en el momento. Sin límites, tienes apoyo continuo para tus decisiones diarias.";
      default:
        return "La versión gratuita te permite probar la app, pero el cambio real viene del acompañamiento diario.";
    }
  };

  const benefits = [
    "Análisis IA ilimitados de todas tus comidas",
    "Chat con coach sin límites para dudas y ajustes",
    "Seguimiento continuo adaptado a tu progreso",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-accent" />
          </div>
          <DialogTitle className="text-xl text-center">{getContextTitle()}</DialogTitle>
          <DialogDescription className="text-center leading-relaxed pt-2">
            {getContextDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <Button className="w-full h-12 text-base" size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            Activar coach completo
          </Button>
          <Button
            variant="ghost"
            className="w-full h-12 text-base text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Seguir usando versión gratuita
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          Sin compromisos. Cancela cuando quieras.
        </p>
      </DialogContent>
    </Dialog>
  );
}
