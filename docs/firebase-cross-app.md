# Eaty y Body Matter (mismo Firebase, repos separados)

Eaty y Body Matter son **código y despliegues independientes**. Solo comparten configuración cuando tú quieres usar el **mismo proyecto Firebase** y los mismos orígenes públicos en variables de entorno.

## Dominios autorizados

En Firebase Console → Authentication → Settings → **Authorized domains**, añade:

- El dominio de producción de Eaty (Vercel u otro).
- El dominio de producción de Body Matter.
- `localhost` para desarrollo local.

## Variables de entorno

- **Eaty**: `NEXT_PUBLIC_BODYMATTER_ORIGIN` = URL pública de Body Matter.
- **Body Matter**: `NEXT_PUBLIC_EATY_ORIGIN` = URL pública de Eaty.

En local, por defecto: Eaty `http://localhost:3000`, Body Matter `http://localhost:3001`. Ejecuta `pnpm dev` dentro de `Eaty/` y dentro de `BodyMatter/` si ambos repos viven en el mismo workspace.

Las claves `NEXT_PUBLIC_FIREBASE_*` y la cuenta de servicio (donde aplique) deben corresponder al **mismo** proyecto Firebase en ambas apps si quieres datos unificados.

### Vercel (sesión con cookie de servidor)

En el proyecto de Vercel, en **Environment Variables**, define `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON del Service Account en **una línea**) o, más fiable, `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` con el archivo JSON codificado en Base64 (ver comentarios en `BodyMatter/.env.example`). Sin esto, `POST /api/auth/session` no puede crear la cookie HttpOnly.

## Cookie de sesión entre subdominios

Ambas apps pueden usar la misma cookie HttpOnly `eaty_session` tras `POST /api/auth/session`.

Para que una sola sesión sirva en **dos subdominios** del mismo sitio (p. ej. `eaty.example.com` y `gym.example.com`), define en **ambas** apps el mismo valor:

`SERVER_SESSION_COOKIE_DOMAIN=.example.com`

Sin esta variable, cada host guarda su propia cookie (comportamiento habitual en local con puertos distintos).

## Datos

Firestore y Storage siguen las mismas rutas por `uid` (`workouts`, `routines`, `bodyMeasurements`, `users/{uid}/gym/…`, etc., según lo que use cada app). Las reglas de seguridad validan `request.auth.uid`; no dependen del host.
