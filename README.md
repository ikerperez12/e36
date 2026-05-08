# E36 Scroll Cine

[![CI](https://github.com/ikerperez12/e36/actions/workflows/ci.yml/badge.svg)](https://github.com/ikerperez12/e36/actions/workflows/ci.yml)

Pieza web cinematografica sobre el **BMW 318is Coupe Pack M (E36, Hellrot 314)**. La experiencia muestra portada con video, siete escenas verticales con scroll bloqueado, posters instantaneos, gestos tactiles, teclado, deep links y cierre de motor con capo abierto.

Live: [https://e36.vercel.app](https://e36.vercel.app)

![E36 Scroll Cine en desktop](https://e36.vercel.app/assets/screenshots/desktop-scene-02.png)

## Mobile

![E36 Scroll Cine en mobile](https://e36.vercel.app/assets/screenshots/mobile-scene-07.png)

## Features

- Experiencia 9:16 optimizada para mobile.
- Portada con video E36, logo BMW y paleta BMW Motorsport: `#4599FE`, `#001E49`, `#E00405`, `#FFFDFE`, `#2D4046`, `#B8CAD1`.
- Siete transiciones: prologo, presencia, M-Technic, interior, motor, carretera y capo abierto.
- Nuevo cierre con capo abierto, logo BMW en las transiciones y ficha del M44B19.
- Posters JPG por escena para evitar pantalla negra antes del video.
- Video final recortado/reencodado para ocultar marca de agua y reducir peso.
- Gestos tactiles con swipe vertical y horizontal.
- Deep-linking por escena con `#scene=7`.
- PWA instalable con `manifest.webmanifest` y `sw.js`.
- Control de audio compacto y accesible.
- Pagina legal: [`/legal.html`](https://e36.vercel.app/legal.html).
- Vercel Functions minimas:
  - `GET /api/health`
  - `POST /api/track`

## Stack

- HTML, CSS y JavaScript sin framework.
- Vercel Functions Node.js.
- Service Worker para cache de shell, posters y videos.
- Playwright + axe-core para QA renderizado.
- `ffmpeg-static` para regenerar posters y optimizar video.

## Run Local

```bash
npm ci
npm run dev
```

Abre `http://localhost:5173/`.

Para probar las Functions localmente:

```bash
npm run vercel:dev
```

## Scripts

```bash
npm run dev              # servidor estatico local
npm run vercel:dev       # entorno Vercel local con /api/*
npm run validate:html    # valida index, legacy redirect y legal
npm run check:js         # valida sintaxis JS
npm run audit:public     # escaneo de rutas locales, agentes y secretos
npm run test:rendered    # Playwright + axe
npm run check            # HTML + JS + auditoria publica
npm run build:posters    # regenera posters desde videos
npm run vercel:deploy    # preview Vercel
npm run vercel:prod      # produccion Vercel
```

## Quality

```bash
npm ci
npm run check
npm run test:rendered
npm audit --audit-level=moderate
```

GitHub Actions ejecuta validacion, auditoria publica, tests renderizados y audit de dependencias en `main` y pull requests.

## Deploy

El proyecto esta preparado para Vercel:

```bash
vercel link
vercel deploy
vercel deploy --prod
```

`vercel.json` define headers de seguridad, cache inmutable para assets/videos, `Accept-Ranges: bytes` para los videos y `no-store` para `/api/*`.

Los binarios de media (`assets/` y `videos/`) son recursos de despliegue y no se versionan en el repo publico. Para publicar una version completa con video hay que desplegar desde el workspace local que contiene esas carpetas o subir la media a un storage/CDN equivalente y actualizar las rutas.

Smoke tests de produccion:

```bash
curl -I https://e36.vercel.app
curl -I https://e36.vercel.app/legal.html
curl -I https://e36.vercel.app/videos/01.mp4
curl https://e36.vercel.app/api/health
```

## Project Structure

```text
api/                     Vercel Functions
assets/                  recursos de media locales, ignorados por Git
videos/                  videos MP4 9:16 locales, ignorados por Git
tools/                   utilidades de QA y media
tests/                   tests renderizados Playwright + axe
index.html               experiencia principal
E36 - Scroll Cine.html   redirect legacy a /
legal.html               aviso legal fan/no oficial
manifest.webmanifest     PWA manifest
sw.js                    service worker
vercel.json              config de deploy
```

## Privacy

`/api/track` recibe eventos anonimos de experiencia y Web Vitals. No guarda datos personales ni persiste en una base de datos por defecto.

## Legal

E36 Scroll Cine es una experiencia fan-made sobre el BMW 318is Coupe Pack M (E36). No es un sitio oficial de BMW AG y no esta afiliado, patrocinado, aprobado ni respaldado por BMW AG. Consulta [`NOTICE.md`](NOTICE.md) y [`/legal.html`](https://e36.vercel.app/legal.html).

## License

Codigo bajo licencia MIT. Los nombres, marcas y assets de terceros permanecen bajo sus respectivos titulares.
