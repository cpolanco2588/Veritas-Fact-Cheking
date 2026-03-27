# Documentación del Proyecto Veritas Fact Checking

## Visión General

Veritas es una extensión de Chrome para verificación autónoma de datos en tiempo real.

## Arquitectura

### Componentes Principales

1. **Background Service Worker** (`src/background/`)
   - Agente principal de verificación
   - Gestión de temas activos
   - Coordinación de servicios

2. **Content Scripts** (`src/content/`)
   - Extracción de información de páginas web
   - Detección de artículos y claims

3. **Popup UI** (`src/popup/`)
   - Interfaz de usuario
   - Control de investigaciones
   - Visualización de reportes

4. **Servicios** (`src/services/`)
   - `TopicManager`: Gestión de temas
   - `NewsScraper`: Búsqueda y extracción de noticias
   - `FactChecker`: Verificación de hechos
   - `ReportGenerator`: Generación de reportes

5. **Storage** (`src/storage/`)
   - `StorageManager`: Persistencia de datos

## Flujo de Trabajo

1. Usuario ingresa tema en el popup
2. Background worker inicia investigación
3. NewsScraper busca noticias virales
4. FactChecker verifica cada artículo
5. StorageManager guarda verificaciones
6. ReportGenerator crea reporte diario CSV

## APIs Externas

- Google Search (para búsqueda de noticias)
- Google Fact Check API (para verificación)
- Google Sheets API (para exportación)

## Estructura de Datos

### Tema Activo
```json
{
  "id": "topic_1234567890_abc123",
  "name": "Tema de investigación",
  "status": "active",
  "startTime": "2024-01-01T00:00:00Z",
  "articlesFound": 0,
  "verificationsCompleted": 0
}
```

### Verificación
```json
{
  "id": "verification_1234567890_xyz",
  "topic": "tema",
  "article": {...},
  "verification": {
    "overallVerdict": "true|false|mixed",
    "confidence": 0.85,
    "claims": [...],
    "sources": [...]
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Reporte
```json
{
  "id": "report_20240101_tema_abc",
  "type": "daily_report",
  "topic": "tema",
  "date": "2024-01-01",
  "summary": "...",
  "articles": [...],
  "statistics": {...},
  "verdict": "VERDADERO|MAYORMENTE VERDADERO|MIXTO|MAYORMENTE FALSO|FALSO",
  "confidence": 0.75
}
```

## Niveles de Veracidad

- `true`: Verdadero
- `mostly_true`: Mayormente verdadero
- `mixed`: Mixto/Parcial
- `mostly_false`: Mayormente falso
- `false`: Falso
- `unverified`: Sin verificar

## Configuración

Ver `config/` para archivos de configuración.

## Desarrollo

Ver README.md principal para instrucciones de instalación y desarrollo.

## Licencia

MIT
