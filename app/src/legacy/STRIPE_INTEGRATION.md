# Integración con Stripe para Pagos de Suscripción

Este documento explica cómo configurar la integración de pagos con Stripe para la funcionalidad de suscripción Premium.

## Estado Actual

La pantalla de suscripción está **completamente funcional** con URLs de demostración. Los endpoints del backend están implementados y listos para recibir la configuración de Stripe.

## Configuración para Producción

### 1. Crear cuenta en Stripe

1. Ve a [stripe.com](https://stripe.com) y crea una cuenta
2. Activa tu cuenta completando la información de negocio
3. Obtén tus claves API desde el Dashboard

### 2. Crear el Producto Premium

1. En el Dashboard de Stripe, ve a **Productos**
2. Crea un nuevo producto llamado "Coach Recomp Premium"
3. Configura el precio: $9.99/mes (recurring)
4. Copia el **Price ID** (ejemplo: `price_xxxxxxxxxxxxx`)

### 3. Configurar Variables de Entorno

Agrega tu clave secreta de Stripe en Supabase:

```bash
# En Supabase Dashboard > Settings > Edge Functions > Secrets
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # Tu clave secreta de Stripe
```

### 4. Actualizar el Código del Backend

En `/supabase/functions/server/index.tsx`, descomenta e implementa la integración real con Stripe:

#### Instalar la librería de Stripe

```typescript
import Stripe from 'npm:stripe@14';
```

#### Actualizar el endpoint de checkout

Reemplaza el código TODO en `create-checkout`:

```typescript
const stripe = new Stripe(stripeApiKey);

const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price: 'price_xxxxxxxxxxxxx', // Tu Price ID de Stripe
    quantity: 1,
  }],
  mode: 'subscription',
  success_url: `${c.req.header('origin')}/subscription?success=true`,
  cancel_url: `${c.req.header('origin')}/subscription`,
  client_reference_id: user.id,
  customer_email: user.email,
});

return c.json({ checkoutUrl: session.url });
```

#### Actualizar el portal de cliente

Reemplaza el código TODO en `customer-portal`:

```typescript
const stripe = new Stripe(stripeApiKey);
const subscriptionData = await kv.get(`subscription:${user.id}`);

if (!subscriptionData?.stripeCustomerId) {
  return c.json({ error: 'No active subscription found' }, 404);
}

const session = await stripe.billingPortal.sessions.create({
  customer: subscriptionData.stripeCustomerId,
  return_url: `${c.req.header('origin')}/subscription`,
});

return c.json({ portalUrl: session.url });
```

### 5. Configurar Webhooks de Stripe

1. En el Dashboard de Stripe, ve a **Developers > Webhooks**
2. Agrega un nuevo endpoint: `https://[tu-proyecto].supabase.co/functions/v1/server/stripe-webhook`
3. Selecciona los eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copia el **Webhook Secret** (ejemplo: `whsec_xxxxxxxxxxxxx`)
5. Agrégalo como variable de entorno: `STRIPE_WEBHOOK_SECRET`

#### Actualizar el handler de webhooks

```typescript
const stripe = new Stripe(stripeApiKey);
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

// Verificar la firma del webhook
const signature = c.req.header('stripe-signature');
const body = await c.req.text();

let event;
try {
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
} catch (err) {
  console.log('Webhook signature verification failed:', err.message);
  return c.json({ error: 'Invalid signature' }, 400);
}

// Procesar el evento...
```

## Flujo de Usuario

### Upgrade a Premium

1. Usuario hace clic en "Mejorar a Premium"
2. Se redirige a Stripe Checkout
3. Usuario completa el pago
4. Stripe envía webhook `checkout.session.completed`
5. Backend actualiza la suscripción del usuario a `premium`
6. Usuario es redirigido de vuelta a la app
7. Los límites de IA se desbloquean automáticamente

### Gestión de Suscripción

1. Usuario hace clic en "Gestionar suscripción"
2. Se redirige al Stripe Customer Portal
3. Usuario puede:
   - Actualizar método de pago
   - Ver historial de facturas
   - Cancelar suscripción
4. Los webhooks de Stripe mantienen sincronizado el estado

## Testing en Modo Test

Stripe proporciona tarjetas de prueba:

- **Éxito**: `4242 4242 4242 4242`
- **Requiere autenticación**: `4000 0025 0000 3155`
- **Rechazada**: `4000 0000 0000 9995`

Usa cualquier fecha futura y CVC válido (ej: 123)

## Límites de IA y Suscripciones

El sistema freemium ya implementado verificará automáticamente el tier:

```typescript
// En el backend, los límites se verifican así:
const subscription = await kv.get(`subscription:${user.id}`);
const isPremium = subscription?.tier === 'premium';

if (!isPremium) {
  // Verificar y aplicar límites
  const usageLimits = await kv.get(`usage_limits:${user.id}`);
  if (usageLimits.mealAnalysisCount >= 10) {
    return c.json({ error: 'Free tier limit reached' }, 429);
  }
}
```

## URLs de Demostración Actuales

Mientras no configures Stripe, el sistema usa URLs de demostración:

- Checkout: `https://buy.stripe.com/test_demo?client_reference_id={userId}`
- Portal: `https://billing.stripe.com/p/login/test_demo?client_reference_id={userId}`

Estas URLs permiten probar la UX sin una integración real.

## Seguridad

- ✅ La clave secreta de Stripe NUNCA se expone al frontend
- ✅ Los webhooks verifican la firma para prevenir falsificaciones
- ✅ Las sesiones de checkout son temporales y expiran
- ✅ El backend valida el `access_token` en cada request

## Próximos Pasos

1. **Ahora mismo**: La funcionalidad está lista para usar con URLs de demo
2. **Para producción**: Sigue los pasos 1-5 de arriba para activar pagos reales
3. **Opcional**: Implementa lógica adicional para trials, descuentos, etc.

## Soporte

- [Documentación de Stripe](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
