# Veritas Fact Checking - Guía de Desarrollo

## Requisitos Previos

- Node.js >= 18.x
- npm >= 9.0.0
- Chrome >= 110

## Instalación

```bash
# Instalar dependencias
npm install

# Construir para desarrollo
npm run dev

# Construir para producción
npm run build
```

## Cargar la Extensión en Chrome

1. Abrir Chrome y navegar a `chrome://extensions/`
2. Activar "Modo desarrollador" (toggle en esquina superior derecha)
3. Click en "Cargar descomprimida"
4. Seleccionar la carpeta `dist` del proyecto

## Estructura del Proyecto

```
veritas-fact-checking/
├── src/
│   ├── background/         # Service worker principal
│   │   └── index.js        # Agente Veritas
│   ├── content/            # Content scripts
│   │   └── index.js        # Extracción de páginas
│   ├── popup/              # Interfaz de usuario
│   │   ├── index.html
│   │   ├── popup.js
│   │   └── ../styles/popup.css
│   ├── services/           # Servicios principales
│   │   ├── topicManager.js
│   │   ├── newsScraper.js
│   │   ├── factChecker.js
│   │   └── reportGenerator.js
│   ├── storage/            # Gestión de almacenamiento
│   │   └── storageManager.js
│   ├── utils/              # Utilidades
│   └── components/         # Componentes UI reutilizables
├── assets/
│   └── icons/              # Iconos de la extensión
├── config/                 # Configuraciones
├── docs/                   # Documentación
├── tests/                  # Pruebas
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── manifest.json           # Manifiesto de Chrome
├── package.json
├── tsconfig.json
└── vite.config.js
```

## Scripts Disponibles

```bash
npm run dev          # Build con watch mode
npm run build        # Build para producción
npm run lint         # Ejecutar ESLint
npm test             # Ejecutar pruebas
npm run test:watch   # Pruebas en modo watch
```

## Flujo de Desarrollo

### 1. Modificar Código

Los cambios en `src/` se recompilan automáticamente en modo desarrollo.

### 2. Probar Cambios

Recargar la extensión en `chrome://extensions/` haciendo click en el botón de refresh.

### 3. Debugging

- **Background Worker**: `chrome://extensions/` → Inspect views → background page
- **Popup**: Click derecho en el popup → Inspect
- **Content Scripts**: DevTools normales de la página

## Arquitectura de Mensajes

### Background ↔ Popup

```javascript
// Popup envía mensaje
chrome.runtime.sendMessage({ 
  type: 'START_TOPIC', 
  topic: 'mi tema' 
});

// Background responde
{ 
  success: true, 
  message: 'Topic started' 
}
```

### Tipos de Mensajes

- `START_TOPIC`: Iniciar investigación
- `STOP_TOPIC`: Detener investigación
- `GET_STATUS`: Obtener estado actual
- `GET_REPORTS`: Obtener reportes
- `STATUS_UPDATE`: Actualización automática de estado

## Almacenamiento

La extensión usa `chrome.storage.local` para:

- Temas activos
- Verificaciones realizadas
- Reportes generados

## Generación de Reportes

Los reportes se generan diariamente en formato CSV con:

- Síntesis de información
- Lista de artículos verificados
- Fuentes consultadas
- Veredicto general
- Nivel de confianza

## Mejores Prácticas

1. **Manejo de Errores**: Siempre usar try-catch en operaciones async
2. **Logging**: Usar console.log con prefijo [Veritas] o [Componente]
3. **Memoria**: Limpiar listeners y timeouts cuando no se necesiten
4. **Storage**: Validar datos antes de guardar

## Troubleshooting

### La extensión no carga

- Verificar que manifest.json sea válido
- Revisar consola en `chrome://extensions/`

### El service worker se detiene

- Es normal en Manifest V3, se reactiva con eventos
- Verificar que los listeners estén bien configurados

### Los mensajes no llegan

- Asegurar que `return true` en onMessage para respuestas async
- Verificar que los tipos de mensaje coincidan

## Próximos Pasos

1. Implementar APIs reales de fact-checking
2. Integrar Google Sheets API
3. Añadir más fuentes de noticias
4. Mejorar algoritmos de detección de viralidad
5. Implementar notificaciones push

## Contribución

1. Crear branch desde `main`
2. Hacer cambios
3. Ejecutar tests
4. Crear pull request

## Licencia

MIT
