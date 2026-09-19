# Sistema Freemium - Documentación de Diseño UI

## 📋 Resumen

Sistema de límites de uso de IA diseñado con enfoque empático y práctico para una app móvil de coaching de recomposición corporal. El objetivo es mostrar el valor del acompañamiento continuo sin frustrar al usuario.

---

## 🎨 Componentes Creados

### 1. **UsageLimits** - Indicador de uso de IA
**Archivo:** `/components/UsageLimits.tsx`

**Propósito:** Mostrar de forma visual y no intrusiva cuántos análisis de IA y mensajes de chat ha usado el usuario.

**Características:**
- Barras de progreso con colores dinámicos:
  - Verde (accent) cuando hay uso normal
  - Amarillo cuando se acerca al límite (≥80%)
  - Rojo cuando alcanza el límite (100%)
- Contador claro: "X / Y usados"
- Mensaje contextual cuando se acerca al límite
- Se oculta automáticamente para usuarios Pro

**Ubicación sugerida:** Pestaña "Inicio" o "Perfil"

---

### 2. **AILimitReached** - Pantalla de límite alcanzado
**Archivo:** `/components/AILimitReached.tsx`

**Propósito:** Pantalla intermedia empática cuando el usuario alcanza su límite de IA.

**Variantes:**
- **Tipo "meal":** Para análisis de comidas
  - Título: "Este era uno de tus últimos análisis gratis"
  - Botón primario: "Desbloquear análisis ilimitados"
  - Botón secundario: "Guardar comida sin analizar"
  
- **Tipo "chat":** Para mensajes de coach
  - Título: "El coach gratuito llega hasta aquí"
  - Copy enfocado en seguimiento continuo
  - Un solo CTA para upgrade

**Copy destacado:**
> "El coach funciona mejor cuando te acompaña a diario"

---

### 3. **UpgradeDialog** - Paywall suave
**Archivo:** `/components/UpgradeDialog.tsx`

**Propósito:** Dialog reutilizable para promover el upgrade de forma respetuosa.

**Características:**
- 3 contextos adaptables (meal, chat, general)
- Título dinámico según contexto
- 3 bullets con beneficios del plan completo
- CTA principal: "Activar coach completo"
- CTA secundario: "Seguir usando versión gratuita"
- Disclaimer: "Sin compromisos. Cancela cuando quieras."

**Título por contexto:**
- **meal:** "Análisis ilimitados para avanzar de verdad"
- **chat:** "Coach disponible cuando lo necesites"
- **general:** "Acompañamiento real, no solo registros"

---

### 4. **MealLogger** (modificado) - Registro de comidas con límites
**Archivo:** `/components/MealLogger.tsx`

**Props añadidas:**
```typescript
mealAnalysisUsed?: number;
mealAnalysisLimit?: number;
onUpgrade?: () => void;
isPro?: boolean;
```

**Comportamiento:**
- Tab "Con IA" muestra `AILimitReached` cuando se alcanza el límite
- Usuario siempre puede usar tabs "Biblioteca" y "Manual"
- Botón "Guardar sin analizar" cambia automáticamente al modo Manual

---

### 5. **CoachChat** (modificado) - Chat con límites
**Archivo:** `/components/CoachChat.tsx`

**Props añadidas:**
```typescript
chatMessagesUsed?: number;
chatMessagesLimit?: number;
onUpgrade?: () => void;
isPro?: boolean;
```

**Comportamiento:**
- Área de input se reemplaza por mensaje de límite alcanzado
- Histórico completo de mensajes sigue accesible
- No se deshabilita bruscamente, sino que muestra mensaje empático
- Botón "Activar coach completo" en lugar del input

---

### 6. **FreemiumDemo** - Demostración interactiva
**Archivo:** `/components/FreemiumDemo.tsx`

**Propósito:** Componente de demostración que muestra todos los estados visualmente.

**Incluye:**
- Tab 1: Indicadores de uso en diferentes estados
- Tab 2: Límite alcanzado en análisis de comidas
- Tab 3: Límite alcanzado en chat
- Acceso rápido a variantes del paywall
- Documentación de principios de diseño

---

## 🎯 Principios de Diseño Aplicados

### ✅ Tono empático y práctico
- Copy orientado a beneficios reales
- Lenguaje natural, no técnico
- Enfoque en acompañamiento, no en features

### ✅ Sin urgencia artificial
- No hay timers de cuenta regresiva
- No hay descuentos ficticios por tiempo limitado
- No se usan palabras como "última oportunidad"

### ✅ Funcionalidad preservada
- Usuario free siempre puede:
  - Registrar comidas manualmente
  - Usar la biblioteca personal
  - Ver histórico completo
  - Ver análisis anteriores en chat

### ✅ Valor claro
- Mensajes como "Acompañamiento real, no solo registros"
- Enfocado en el impacto del coaching continuo
- Beneficios explicados en lenguaje humano

### ✅ Respeto al usuario
- Siempre hay opción de cerrar o continuar gratis
- No se bloquea ninguna funcionalidad básica
- Transparencia sobre lo que incluye cada plan

---

## 📱 Flujos de Usuario

### Flujo 1: Análisis de comida con límite alcanzado
1. Usuario hace clic en "Registrar comida"
2. Selecciona tab "Con IA"
3. Ve pantalla `AILimitReached` tipo "meal"
4. Opciones:
   - **A.** Hacer clic en "Desbloquear análisis ilimitados" → Abre `UpgradeDialog`
   - **B.** Hacer clic en "Guardar sin analizar" → Cambia automáticamente a tab "Manual"

### Flujo 2: Chat con límite alcanzado
1. Usuario abre pestaña "Coach"
2. Ve todo su historial de mensajes anterior
3. En lugar del input, ve mensaje de límite alcanzado
4. Hace clic en "Activar coach completo" → Abre `UpgradeDialog`

### Flujo 3: Visualización de uso
1. Usuario está en pestaña "Inicio" o "Perfil"
2. Ve tarjeta `UsageLimits` mostrando su uso actual
3. Cuando se acerca al límite (≥80%), aparece mensaje adicional
4. Puede continuar usando la app normalmente

---

## 🎨 Estilo Visual

### Colores utilizados
- **Accent (lime/verde neón):** `#c4f51b` - Para elementos de IA y acciones positivas
- **Primary (cyan):** `#22d3ee` - Para elementos principales
- **Muted/foreground:** Variantes de gris para texto secundario
- **Background/card:** Tonos oscuros según el tema de la app

### Iconografía
- **Sparkles (✨):** Representa funciones de IA
- **Bot (🤖):** Para el coach AI
- **Check (✓):** Para confirmaciones y beneficios
- **Library (📚):** Para funciones de biblioteca

### Espaciado y tamaño
- Botones principales: `h-12` (48px)
- Padding de cards: `p-4` a `p-6`
- Gaps entre elementos: `gap-2` a `gap-4`
- Textos: `text-sm` para body, `text-xs` para auxiliar

---

## 💬 Copy Destacado

### Títulos principales
- "Acompañamiento real, no solo registros"
- "Este era uno de tus últimos análisis gratis"
- "El coach gratuito llega hasta aquí"

### Mensajes empáticos
- "El coach funciona mejor cuando te acompaña a diario"
- "Para seguimiento diario y ajustes reales, necesitas el plan completo"
- "Puedes seguir usando todas las funciones básicas gratis"

### CTAs
- **Primario:** "Activar coach completo" / "Desbloquear análisis ilimitados"
- **Secundario:** "Seguir usando versión gratuita" / "Guardar sin analizar"

### Disclaimers
- "Sin compromisos. Cancela cuando quieras."

---

## 🔧 Integración en App.tsx (Propuesta)

```typescript
// Estado para límites (ejemplo con valores mock)
const [aiUsage, setAiUsage] = useState({
  mealAnalysisUsed: 7,
  mealAnalysisLimit: 10,
  chatMessagesUsed: 8,
  chatMessagesLimit: 10,
  isPro: false,
});

// Handler para upgrade
const handleUpgrade = () => {
  setUpgradeDialogOpen(true);
};

// En la pestaña "Inicio" o "Perfil"
<UsageLimits
  mealAnalysisUsed={aiUsage.mealAnalysisUsed}
  mealAnalysisLimit={aiUsage.mealAnalysisLimit}
  chatMessagesUsed={aiUsage.chatMessagesUsed}
  chatMessagesLimit={aiUsage.chatMessagesLimit}
  isPro={aiUsage.isPro}
/>

// En MealLogger
<MealLogger
  accessToken={accessToken}
  onMealLogged={handleMealLogged}
  mealAnalysisUsed={aiUsage.mealAnalysisUsed}
  mealAnalysisLimit={aiUsage.mealAnalysisLimit}
  onUpgrade={handleUpgrade}
  isPro={aiUsage.isPro}
/>

// En CoachChat
<CoachChat
  accessToken={accessToken}
  todaysMeals={todaysMeals}
  dailyMenu={dailyMenu}
  chatMessagesUsed={aiUsage.chatMessagesUsed}
  chatMessagesLimit={aiUsage.chatMessagesLimit}
  onUpgrade={handleUpgrade}
  isPro={aiUsage.isPro}
/>

// Dialog de upgrade (compartido)
<UpgradeDialog
  open={upgradeDialogOpen}
  onOpenChange={setUpgradeDialogOpen}
  context={upgradeContext}
/>
```

---

## 🚀 Próximos Pasos (NO implementados)

Esto es SOLO diseño de UI. Para implementar el sistema completo se necesitaría:

1. **Backend:**
   - Tabla de suscripciones en base de datos
   - Contador de uso de IA por usuario
   - Lógica para verificar límites en rutas del servidor
   - Sistema de pagos (Stripe, etc.)

2. **Frontend:**
   - Integrar contadores reales desde el backend
   - Implementar flujo de pago
   - Manejar estados de suscripción (activo, cancelado, etc.)
   - Persistir estado Pro en autenticación

3. **Tracking:**
   - Analytics para conversión de free a pro
   - Métricas de uso antes de alcanzar límites
   - A/B testing de copy y límites

---

## 📝 Notas Finales

Este diseño prioriza:
- **UX sobre conversión agresiva:** El usuario no se siente bloqueado
- **Valor claro:** Copy enfocado en beneficios reales
- **Respeto:** Siempre hay forma de continuar usando la app
- **Consistencia:** Mismo lenguaje y tono en todos los componentes

El sistema está listo para integrarse cuando se implemente la lógica de backend y suscripciones.
