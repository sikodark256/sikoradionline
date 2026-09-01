# 📻 Mi Radio PWA — Versión Mejorada

> Transformación de tu radio en **PWA 100% responsiva** para celular, PC y TV, con historial de reproducciones recientes.

---

## ✨ Novedades agregadas

### 1. 📺 Diseño totalmente responsivo para TV
- **Celular**: Layout vertical apilado
- **Tablet**: 3-4 columnas en la sección de recientes
- **Desktop**: 2 columnas (reproductor + recientes lado a lado)
- **TV Full HD (≥1920px)**: Tipografía agrandada, botones más grandes
- **TV 4K (≥2560px)**: Espaciado optimizado, todo más legible a distancia
- **Orientación**: Cambiada de `portrait` a `any` — funciona perfectamente en horizontal (TV)

### 2. 🎧 Sección "Reproducido recientemente"
- Muestra **hasta 20 canciones** (mínimo 12 visibles) con carátula, nombre, artista y cuándo sonó
- **Historial real**: Guarda automáticamente cada canción que suena en la radio en `localStorage`
- **Vista previa inteligente**: Si aún no hay historial, muestra canciones demo para que se vea completa
- **Carátulas**: Usa las imágenes obtenidas de Deezer (igual que el reproductor principal)
- **Grilla adaptativa**: 2 → 3 → 4 → 5 → 6 columnas según el tamaño de pantalla

### 3. ⚡ PWA completa
- ✅ `manifest.ts` actualizado (orientación any)
- ✅ **Service Worker** propio (`/public/sw.js`) — caché de activos, instalable como app
- ✅ Botón "Instalar app" ya funcionando
- ✅ Media Session API (controles en pantalla de bloqueo)

### 4. 🎯 Optimizaciones para control remoto (TV)
- Anillos de enfoque más visibles
- Botones con altura mínima para fácil selección
- Tipografía escalable según resolución

---

## 📁 Archivos modificados / creados

| Archivo | Cambio |
|---------|--------|
| `app/page.tsx` | Nuevo layout de 2 columnas responsivo |
| `app/manifest.ts` | Orientación: `portrait` → `any` |
| `app/globals.css` | Media queries para TV HD/4K/8K |
| `components/radio-player.tsx` | Guarda historial en localStorage + registra Service Worker |
| `components/recent-tracks.tsx` | **NUEVO** — Componente de canciones recientes |
| `public/sw.js` | **NUEVO** — Service Worker para PWA |

---

## 🚀 Cómo ejecutar

```bash
# Instalar dependencias
pnpm install
# o npm install

# Desarrollo
pnpm dev

# Producción
pnpm build
pnpm start
```

---

## 📺 Cómo se ve en cada pantalla

| Dispositivo | Layout |
|-------------|--------|
| 📱 Celular | Todo apilado, 2 columnas de recientes |
| 📱 Tablet | 3-4 columnas de recientes |
| 💻 Laptop | Reproductor a la izquierda, recientes a la derecha (5 cols) |
| 🖥️ Desktop | Más espaciado, 6 columnas de recientes |
| 📺 TV Full HD | Fuente +12.5%, botones más grandes |
| 📺 TV 4K | Fuente +37.5%, espaciado amplio, ideal para ver a distancia |

---

## 💡 Notas técnicas

- El historial se guarda en **localStorage** del navegador/dispositivo
- Las canciones demo se reemplazan automáticamente por canciones reales en cuanto la radio empiece a transmitir
- Las carátulas se obtienen de la API de Deezer (ya venía configurado en tu proyecto)
- El Service Worker cachea iconos y la página principal, pero **no cachea el stream de audio** (para siempre tener la señal en vivo)
