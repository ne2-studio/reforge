import { useState } from "react";
import { UsageLimits } from "./UsageLimits";
import { UpgradeDialog } from "./UpgradeDialog";
import { AILimitReached } from "./AILimitReached";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

/**
 * Componente de demostración para mostrar todos los estados de límites de IA
 * Este componente es SOLO para visualización de diseño - no incluye lógica funcional
 */
export function FreemiumDemo() {
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeContext, setUpgradeContext] = useState<"meal" | "chat" | "general">("general");
  const [currentView, setCurrentView] = useState<"limits" | "meal-limit" | "chat-limit">("limits");

  const openUpgrade = (context: "meal" | "chat" | "general") => {
    setUpgradeContext(context);
    setUpgradeDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-primary">Sistema Freemium - Demo de UI</h1>
          <p className="text-muted-foreground">
            Visualización de componentes y estados para límites de IA
          </p>
        </div>

        <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="limits">Indicador de Uso</TabsTrigger>
            <TabsTrigger value="meal-limit">Límite en Comida</TabsTrigger>
            <TabsTrigger value="chat-limit">Límite en Chat</TabsTrigger>
          </TabsList>

          {/* Vista 1: Indicador de uso de IA */}
          <TabsContent value="limits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1️⃣ Indicador de uso de IA (feedback de control)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Estado: Usuario ha usado 5 de 10 análisis y 8 de 10 mensajes
                  </p>
                  <UsageLimits
                    mealAnalysisUsed={5}
                    mealAnalysisLimit={10}
                    chatMessagesUsed={8}
                    chatMessagesLimit={10}
                    isPro={false}
                  />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Estado: Usuario cerca del límite (9/10 en ambos)
                  </p>
                  <UsageLimits
                    mealAnalysisUsed={9}
                    mealAnalysisLimit={10}
                    chatMessagesUsed={9}
                    chatMessagesLimit={10}
                    isPro={false}
                  />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Estado: Límite alcanzado en análisis de comidas (10/10)
                  </p>
                  <UsageLimits
                    mealAnalysisUsed={10}
                    mealAnalysisLimit={10}
                    chatMessagesUsed={5}
                    chatMessagesLimit={10}
                    isPro={false}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📍 Ubicación sugerida</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Este componente debería aparecer en la pestaña "Inicio" o "Perfil", visible pero
                  no intrusivo. Se muestra solo para usuarios gratuitos.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vista 2: Límite alcanzado en análisis de comidas */}
          <TabsContent value="meal-limit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>2️⃣ Registro de comida con IA - Estado límite alcanzado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  Cuando el usuario intenta analizar una comida pero ha agotado sus análisis
                  gratuitos, ve esta pantalla en lugar del formulario normal.
                </p>
                <div className="border-2 border-border rounded-lg">
                  <AILimitReached
                    type="meal"
                    onUpgrade={() => openUpgrade("meal")}
                    onContinueWithoutAI={() =>
                      alert(
                        "El usuario sería redirigido al modo 'Manual' para guardar la comida sin análisis IA"
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📋 Flujo de usuario</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Usuario abre "Registrar comida" y selecciona tab "Con IA"</li>
                  <li>Ve esta pantalla intermedia (no un error técnico)</li>
                  <li>
                    Puede elegir: "Desbloquear análisis ilimitados" o "Guardar sin analizar"
                  </li>
                  <li>
                    Si guarda sin analizar, pasa automáticamente al tab "Manual" donde puede
                    ingresar valores
                  </li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vista 3: Límite alcanzado en chat */}
          <TabsContent value="chat-limit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>3️⃣ Chat IA - Estado límite alcanzado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  Simulación del estado del chat cuando el usuario ha agotado sus mensajes
                  gratuitos. El área de input se reemplaza por el mensaje de límite alcanzado.
                </p>
                <div className="border-2 border-border rounded-lg bg-card">
                  {/* Simulación de mensajes anteriores */}
                  <div className="p-4 space-y-4 border-b border-border">
                    <div className="flex gap-3">
                      <div className="bg-accent/30 rounded-full p-2 h-fit">
                        <span className="text-xs">🤖</span>
                      </div>
                      <div className="bg-accent/10 rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm">
                          ¡Hola! Veo que has registrado 3 comidas hoy. ¿Cómo te sientes con tu
                          progreso?
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <div className="bg-primary/20 rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm">Bien, pero tengo dudas sobre la cena...</p>
                      </div>
                      <div className="bg-primary/30 rounded-full p-2 h-fit">
                        <span className="text-xs">👤</span>
                      </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground py-2">
                      ...mensajes anteriores visibles...
                    </p>
                  </div>

                  {/* Estado de límite alcanzado en el área de input */}
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="text-accent">✨</span>
                          <p className="text-sm font-medium">El coach gratuito llega hasta aquí</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Para seguimiento diario y ajustes reales, necesitas el plan completo.
                        </p>
                      </div>
                      <Button onClick={() => openUpgrade("chat")} className="w-full h-12">
                        ✨ Activar coach completo
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📋 Comportamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>El input de texto queda deshabilitado pero visible</li>
                  <li>El histórico del chat sigue siendo completamente accesible (scroll)</li>
                  <li>No se muestra como un mensaje de error técnico</li>
                  <li>
                    Copy empático: "El coach gratuito llega hasta aquí" - sin urgencia artificial
                  </li>
                  <li>Un solo CTA claro para upgrade</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Paywall suave - siempre visible para testing */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>4️⃣ Paywall suave (Dialog de upgrade)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este dialog aparece cuando el usuario hace clic en cualquiera de los botones de
              upgrade. Tiene 3 variantes de contexto:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button variant="outline" onClick={() => openUpgrade("meal")}>
                Ver contexto: Comidas
              </Button>
              <Button variant="outline" onClick={() => openUpgrade("chat")}>
                Ver contexto: Chat
              </Button>
              <Button variant="outline" onClick={() => openUpgrade("general")}>
                Ver contexto: General
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Principios de diseño */}
        <Card className="bg-accent/5 border-accent/20">
          <CardHeader>
            <CardTitle>🎯 Principios de diseño aplicados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>
                  <strong>Empático y práctico:</strong> Copy orientado a beneficios reales, no a
                  limitaciones técnicas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>
                  <strong>Sin urgencia artificial:</strong> No hay timers, descuentos ficticios ni
                  mensajes agresivos
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>
                  <strong>Funcionalidad básica preservada:</strong> El usuario puede seguir usando
                  la app (registro manual, biblioteca, histórico)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>
                  <strong>Valor claro:</strong> "Acompañamiento real, no solo registros" - se
                  enfoca en el impacto
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>
                  <strong>Respeto al usuario:</strong> Siempre hay opción de cerrar o continuar con
                  versión gratuita
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Dialog reutilizable */}
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        context={upgradeContext}
      />
    </div>
  );
}
