# Veritas Fact Checking

Extensión de Chrome para verificación de datos en tiempo real.

## Descripción

Veritas es un agente autónomo de verificación de datos que:
- Investiga noticias virales sobre un tema específico
- Verifica información en múltiples fuentes
- Genera hojas de cálculo diarias con síntesis, fuentes y veredictos
- Opera continuamente mientras la extensión está activa

## Estructura del Proyecto

```
veritas-fact-checking/
├── src/
│   ├── background/      # Service worker y lógica principal
│   ├── content/         # Scripts de contenido
│   ├── popup/           # Interfaz de usuario
│   ├── utils/           # Utilidades compartidas
│   ├── services/        # Servicios externos (APIs, scraping)
│   └── storage/         # Gestión de almacenamiento
├── assets/              # Recursos estáticos
├── config/              # Configuraciones
├── docs/                # Documentación
└── tests/               # Pruebas unitarias, integración y E2E
```

## Requisitos

- Node.js >= 18.x
- Chrome >= 110

## Instalación

```bash
npm install
npm run build
```

## Desarrollo

```bash
npm run dev
```

## Licencia

MIT
