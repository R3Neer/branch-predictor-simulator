# Branch Predictor Simulator

Aplicacion web local para estudiar y resolver ejercicios de predictores de saltos de la asignatura Estructura de Computadores de la Universidad Complutense de Madrid.

La app permite trabajar desde C didactico, RISC-V o una secuencia manual de saltos, ejecutar la simulacion paso a paso o completa, consultar tablas y estadisticas, corregir respuestas del usuario y exportar sesiones/resultados.

## Fuente De Verdad

La documentacion viva del proyecto es:

- `docs/REQUISITOS.md`: alcance funcional y requisitos de v1.
- `docs/ARQUITECTURA.md`: modelo de dominio, capas, contratos y patrones.
- `docs/POLITICA_QA.md`: politica de pruebas, gates y responsabilidades QA.
- `docs/DECISIONES_TECNICAS_Y_AGENTES.md`: decisiones tecnicas, herramientas y agentes Codex.
- `.codex/AGENTES.md`: chuleta operativa para subagentes.
- `ref_docs/Problemas.pdf`: ejercicios oficiales de predictores.
- `ref_docs/Teoría.pdf`: material de referencia.

`docs/REQUISITOS.md` y `docs/ARQUITECTURA.md` mandan sobre las decisiones de implementacion.

## Estado Actual

Estado estimado de v1: aproximadamente 45-50%.

Ya esta implementado:

- Scaffold Vite + React + TypeScript.
- Arquitectura por capas: `domain`, `application`, `infrastructure` y `presentation`.
- Motor canonico de simulacion con ejecucion paso a paso, ejecucion completa, reinicio por reconstruccion de traza, expansion de bucles y snapshots en traza.
- Predictores v1 principales: un nivel, dos niveles `(n,m)`, correlacionado global, `gshare`, `gselect` y correlacionado local.
- Indexadores LSB, manual, XOR y concatenacion.
- Estadisticas desde traza canonica: aciertos, fallos, tasas, memoria, entradas usadas y aliasing.
- Proyeccion de tabla, calculos compactos, exportacion CSV/Markdown y YAML de sesion.
- Parser RISC-V inicial para saltos condicionales, etiquetas, direcciones y comentarios.
- Traductor C didactico para bucles y operaciones simples orientadas a ejercicios de saltos.
- Secuencia manual editable en texto con `B1..Bn`, `T/NT`, direccion/indice, comentarios y rangos repetidos.
- Correccion de estadisticas y respuestas de tabla.
- Plantillas oficiales de ejercicios 1, 2, 3, 4, 5 y 7 versionadas como datos; el ejercicio 1 esta verificado y el resto sigue marcado como borrador.
- UI funcional con MUI, Zustand y controles principales de plantilla, variante, editores, tabla, estadisticas, importacion/exportacion y modos examen/solucion.

Pendiente para cerrar v1:

- Revisar y verificar contra PDF las plantillas 2, 3, 4, 5 y 7.
- Completar configurador visual de predictores y flujos de UI esperados.
- Sustituir editores de texto por Monaco donde aporte valor operativo.
- Integrar TanStack Table en la tabla principal si la complejidad de columnas lo justifica.
- Completar i18n real ES/EN.
- Cubrir flujos UI criticos con Testing Library y Playwright.
- QA visual, responsive, accesibilidad basica y checklist de release.

## Stack

- TypeScript
- Vite
- React
- MUI Material UI
- Zustand
- TanStack Table, instalado para tablas avanzadas
- Monaco Editor, instalado para editores de codigo
- Zod
- yaml
- i18next + react-i18next
- Vitest
- Testing Library
- Playwright previsto para e2e
- ESLint + Prettier

## Desarrollo Local

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

`npm.cmd` es recomendable en Windows si PowerShell bloquea el wrapper `npm.ps1`.

Antes de cerrar cambios de codigo deben pasar:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

## Estructura

```text
src/
+-- domain/
|   +-- correction/
|   +-- indexing/
|   +-- predictors/
|   +-- shared/
|   +-- simulation/
|   +-- source/
|   +-- stats/
+-- application/
|   +-- projectors/
|   +-- SimulationSessionService.ts
+-- infrastructure/
|   +-- export/
|   +-- persistence/
|   +-- predictors/
|   +-- templates/
+-- presentation/
    +-- components/
    +-- screens/
    +-- stores/
    +-- theme/
docs/
ref_docs/
```

Regla clave: el dominio no depende de React, MUI, Zustand, YAML, DOM ni almacenamiento de navegador. La UI llama a la capa de aplicacion y consume proyecciones derivadas de la traza canonica.
