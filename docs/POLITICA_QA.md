# Politica de QA y pruebas

Este documento forma parte del diseno del simulador. Su objetivo es fijar como se prueban las piezas conforme se implementan, que agentes participan y que condiciones deben cumplirse antes de aceptar cada bloque de trabajo.

La politica aplica a todo codigo de v1 descrito en `docs/REQUISITOS.md`, `docs/ARQUITECTURA.md` y `docs/DECISIONES_TECNICAS_Y_AGENTES.md`.

## Estado actual de QA

Fecha de sincronización documental: 2026-06-14.

La suite actual cubre dominio, aplicación, infraestructura y algunos componentes/store de presentación con Vitest y Testing Library.

Cobertura ya presente:

- Contadores, predictores principales, registros de historia e indexadores.
- Motor de simulación, expansión de secuencias y cálculo de estadísticas.
- Parsers/traductores C/RISC-V y secuencia manual.
- Corrección de estadísticas y respuestas de tabla.
- Proyectores de tabla/cálculo.
- YAML, esquemas Zod de configuración y plantillas.
- Exportadores CSV/Markdown.
- Store Zustand y `DashboardShell`.

Gates usados actualmente:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Pendiente de QA para v1:

- Playwright para flujos completos: cargar plantilla, ejecutar, comprobar, importar/exportar.
- Revisión visual/responsive/accesibilidad.
- Tests de i18n cuando los catálogos ES/EN estén completos.
- Validación oficial de plantillas 2, 3, 4, 5 y 7 contra `ref_docs/Problemas.pdf`.

## 0. Autoridad y cambios del documento

Jerarquia documental:

1. `docs/REQUISITOS.md` manda sobre todo y no se modifica salvo instruccion explicita del usuario.
2. `docs/ARQUITECTURA.md` define la arquitectura y requiere confirmacion explicita del usuario para cambiar.
3. `docs/POLITICA_QA.md` define testing y QA y requiere confirmacion explicita del usuario para cambiar.
4. `docs/DECISIONES_TECNICAS_Y_AGENTES.md` y `.codex/AGENTES.md` deben derivar de los tres documentos anteriores.
5. Codigo, README y scaffold obedecen a todos los documentos superiores.

Este documento no puede ser editado por workers. Solo el jefe puede modificarlo, y solo despues de confirmacion textual del usuario.

El agente `Guardian documental` revisa coherencia entre documentos y codigo, pero no modifica archivos.

## 1. Principios

- Ninguna clase de dominio, aplicacion o infraestructura se considera terminada sin su test unitario correspondiente.
- Ningun caso de uso se considera terminado sin test de integracion sobre sus colaboraciones principales.
- Ningun flujo de UI critico se considera terminado sin test de componente o e2e, segun su riesgo.
- Los tests se escriben y mantienen a la vez que el codigo. Si una clase cambia de contrato, su test debe actualizarse en el mismo bloque de trabajo.
- Las pruebas verifican comportamiento observable y contratos de capa, no detalles accidentales de implementacion.
- Las plantillas oficiales se validan con el mismo motor que simula sesiones manuales.
- Un fallo de test nuevo bloquea la integracion salvo que el documento de diseno se actualice primero y justifique el cambio de comportamiento.

## 2. Gates de calidad

| Gate | Nombre | Que valida | Bloquea si |
| --- | --- | --- | --- |
| 0 | Diseno documental | El cambio esta trazado a requisitos, arquitectura, agente responsable, criterios de aceptacion y pruebas previstas. | La funcionalidad no aparece en documentos o contradice la arquitectura. |
| 1 | Dominio | Predictores, indexado, saturacion, historia, simulacion, bucles, estadisticas y correccion tienen Vitest. | La traza canonica no respalda el comportamiento. |
| 2 | Arquitectura | Se mantiene `presentation -> application -> domain`; dominio no depende de React, MUI, YAML, LocalStorage ni DOM. | Hay dependencia de capa incorrecta o logica de dominio en UI. |
| 3 | Proyeccion | `TableProjector`, `CalculationViewBuilder` y visibilidad por modo se prueban antes de la UI final. | La tabla, calculos o estadisticas salen de datos no canonicos. |
| 4 | UI Material | Componentes y flujos respetan Material, claridad academica, modo examen/solucion, i18n y accesibilidad basica. | Modo examen filtra soluciones, calculos o estadisticas antes de comprobar/calcular. |
| 5 | Revision final | QA explorer o jefe revisa cobertura, riesgos, rutas cambiadas y pruebas ejecutadas. | Quedan huecos no justificados o tests relevantes sin ejecutar. |

## 3. Piramide de pruebas

| Nivel | Herramienta | Alcance | Cuando se exige |
| --- | --- | --- | --- |
| Unitario | Vitest | Clases, funciones puras, predictores, indexadores, parsers, calculadoras y reglas de correccion. | Al terminar cada clase o unidad funcional. |
| Integracion de aplicacion | Vitest | Casos de uso conectados a dominio y puertos fake/in-memory. | Al terminar cada caso de uso. |
| Integracion de infraestructura | Vitest | YAML, repositorios, validadores Zod, exportadores y plantillas. | Al terminar cada adaptador o formato. |
| Componentes UI | Testing Library | Componentes React, visibilidad por modo, formularios, tablas y estados de error. | Al terminar cada componente con comportamiento propio. |
| E2E local | Playwright | Flujos de usuario completos: cargar plantilla, simular, comprobar, importar/exportar. | Al cerrar cada flujo funcional o hito de UI. |
| Revision estatica | TypeScript, ESLint, Prettier | Tipado estricto, reglas de capas y formato. | Antes de cerrar cualquier bloque de implementacion. |

## 4. Regla por tipo de pieza

| Pieza implementada | Prueba minima obligatoria | Prueba adicional esperada |
| --- | --- | --- |
| Value object o utilidad pura | Test unitario de casos nominales, limites y errores. | Property-like tests con tablas de casos cuando haya combinatoria alta. |
| Entidad de dominio | Test unitario de invariantes y transiciones validas/invalidas. | Test de serializacion solo si cruza capa de persistencia. |
| Predictor | Test unitario de `predict`, `update`, saturacion, historia, indexado y traza emitida. | Caso oficial o mini-traza manual con aciertos/fallos esperados. |
| Indexer | Test unitario de calculo de indice, bits usados, alineamiento, XOR o concatenacion. | Casos de aliasing cuando proceda. |
| Parser/traductor RISC-V/C | Test unitario por instruccion soportada y errores claros. | Test de integracion con `ParseRiscVUseCase` o `TranslateCUseCase`. |
| `SimulationEngine` o `SequenceExpander` | Test unitario de paso, ejecucion completa, bucles y snapshots. | Test de equivalencia entre saltar bucle y ejecutar paso a paso. |
| `StatsCalculator` | Test unitario de aciertos, fallos, tasas, memoria, aliasing y estados finales. | Tests con fracciones y porcentajes esperados. |
| Regla de correccion | Test unitario de acierto, fallo, tolerancia y mensajes. | Integracion con `AnswerChecker`. |
| Caso de uso | Test de integracion con repositorios fake y dominio real. | Test de errores de entrada y permisos de modo examen/solucion. |
| Adaptador de infraestructura | Test de integracion de ida/vuelta o exportacion estable. | Snapshot textual solo para YAML/Markdown cuando aporte claridad. |
| Componente UI | Test con Testing Library de render, acciones, estados y accesibilidad basica. | Test visual/e2e si participa en un flujo critico. |
| Pantalla o flujo | Test e2e Playwright. | Captura revisada si hay cambios visuales relevantes. |

## 5. Cobertura funcional minima de v1

Antes de declarar completa la v1 deben existir pruebas para:

- Predictor de un nivel con contadores de 1 y 2 bits.
- Predictor multinivel `(n,m)`, incluyendo `(1,1)`, `(1,2)` y `(3,2)`.
- Correlacionado global, `gshare`, `gselect` y correlacionado local.
- Politicas de indexado por LSB, alineamiento, indice manual, XOR y concatenacion.
- Deteccion de saltos RISC-V del subconjunto inicial.
- Secuencia manual de saltos y rangos repetidos.
- Equivalencia entre ejecutar un bucle paso a paso y saltarlo completo.
- Estadisticas normales y avanzadas bajo demanda.
- Correccion de tablas y estadisticas con enteros, fracciones, porcentajes, unidades y margen configurable.
- Exportacion/importacion YAML sin datos calculables y sin C desincronizado.
- Exportacion CSV y Markdown desde proyecciones, no desde el DOM.
- Catalogos i18n ES/EN para textos visibles.
- Plantillas oficiales de ejercicios 1, 2, 3, 4, 5 y 7.

## 6. Matrices obligatorias de riesgo

### 6.1 Modo examen y solucion

- En modo examen no se muestran soluciones oficiales antes de pulsar comprobar.
- En modo examen no se muestran calculos compactos ni expandidos antes de comprobar.
- Las estadisticas no se muestran hasta que el usuario pulsa calcular o comprobar.
- En modo solucion la tabla puede rellenarse desde la traza canonica, no desde valores escritos a mano en UI.

### 6.2 Persistencia YAML

- Sesion sincronizada: guarda C y RISC-V.
- Sesion desincronizada: guarda RISC-V y no guarda C.
- No guarda tabla calculada si puede regenerarse.
- No guarda estadisticas calculadas si pueden regenerarse.
- Importar y exportar conserva input editable del usuario sin contaminarlo con datos derivados.

## 7. Politica de agentes QA

El programador jefe mantiene la responsabilidad final sobre calidad. Los agentes QA ayudan, pero no sustituyen la revision final ni la ejecucion local de pruebas.

Roles:

- `QA unitario`: worker especializado en Vitest para dominio, aplicacion e infraestructura. Debe trabajar sobre archivos de test o pequenas correcciones necesarias para hacer testeable una pieza, siempre con propiedad clara.
- `QA integracion`: worker especializado en casos de uso, repositorios fake, validacion de plantillas y flujos entre capas.
- `QA e2e`: worker especializado en Playwright cuando ya exista UI ejecutable.
- `QA revisor`: explorer sin cambios de archivos para revisar cobertura, riesgos, dependencias entre capas y posibles huecos frente a requisitos.

Reglas de uso:

- Si un worker implementa una clase, puede incluir su test unitario en la misma zona de propiedad.
- Si la implementacion es grande o critica, se lanza un agente QA separado sobre los tests para evitar sesgo de autor.
- Los agentes QA no deben reescribir arquitectura ni cambiar comportamiento sin pedir primero actualizacion documental.
- Cada agente QA debe indicar rutas modificadas, pruebas ejecutadas y huecos restantes.
- El jefe integra, resuelve conflictos, ejecuta la suite relevante y decide si el bloque se acepta.

## 8. Politica de agentes de diseno UI

La UI debe tener revision de diseno separada cuando se creen pantallas, tablas complejas o flujos de interaccion.

Roles:

- `Diseno UX academico`: explorer que revisa flujos, wireframes, jerarquia de informacion, modo examen/solucion, estados vacios, errores y claridad pedagogica. No modifica archivos salvo encargo explicito.
- `QA Visual Material`: explorer o worker que revisa coherencia MUI, densidad de tablas, responsive, contraste, i18n visual y capturas Playwright.
- `UI Material`: worker que implementa la pantalla o componente final con React, MUI, Zustand, TanStack Table y Monaco, siguiendo la revision de diseno aprobada.

Reglas:

- El diseno UI no puede introducir funcionalidad que no este en requisitos o arquitectura.
- El diseno UI puede proponer cambios de arquitectura de presentacion, pero primero deben documentarse y revisarse.
- Las pantallas operativas deben priorizar claridad, densidad legible y flujos academicos sobre apariencia de landing page.
- Cambios visuales significativos requieren prueba de componente y, si hay navegador local, verificacion Playwright con captura.

## 9. Convenciones de archivos de test

La estructura exacta puede ajustarse al scaffold inicial de Vite, pero la convencion base es:

```text
src/
  domain/
    predictors/
      SaturatingCounter.ts
      SaturatingCounter.test.ts
  application/
    use-cases/
      RunSimulationUseCase.ts
      RunSimulationUseCase.integration.test.ts
  infrastructure/
    persistence/
      SessionYamlMapper.ts
      SessionYamlMapper.integration.test.ts
  presentation/
    components/
      SimulationTable.tsx
      SimulationTable.test.tsx
  test/
    fixtures/
    builders/
    fakes/
e2e/
  load-template.spec.ts
  simulate-and-check.spec.ts
```

Los fixtures oficiales derivados del PDF deben vivir junto a plantillas o en `src/test/fixtures`, segun convenga a la validacion, pero no deben duplicar datos calculables si pueden generarse con el motor.

## 10. Criterio de cierre de bloque

Un bloque de trabajo queda cerrado solo si:

- El codigo implementado esta cubierto por el tipo de test que le corresponde.
- Los tests relevantes pasan localmente o se documenta claramente por que no pudieron ejecutarse.
- No se han roto las reglas de dependencia entre capas.
- No se ha introducido funcionalidad fuera de documentos de diseno.
- Los agentes implicados han devuelto rutas cambiadas, pruebas ejecutadas y riesgos abiertos.
- El programador jefe ha revisado integracion, coherencia documental y resultado final.

## 11. Cambios de comportamiento

Si una prueba falla porque el comportamiento esperado ya no encaja con el diseno, el orden obligatorio es:

1. Explicar el cambio necesario.
2. Actualizar el documento de diseno correspondiente.
3. Revisar que el cambio cuadra con `docs/REQUISITOS.md`, `docs/ARQUITECTURA.md`, `docs/DECISIONES_TECNICAS_Y_AGENTES.md` y este documento.
4. Actualizar implementacion y tests.
5. Ejecutar la suite relevante.

No se acepta actualizar un test para "hacerlo pasar" si el nuevo comportamiento no esta documentado.
