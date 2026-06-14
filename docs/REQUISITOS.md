# Requisitos del simulador de branch predictors

## 1. Objetivo

Crear una aplicación web local para estudiar y resolver ejercicios de predictores de saltos de la asignatura Estructura de Computadores de la UCM.

El simulador debe permitir:

- Simular predictores paso a paso o de golpe.
- Rellenar tablas similares a las de los ejercicios.
- Comprobar soluciones introducidas por el usuario.
- Cargar plantillas oficiales basadas en los ejercicios del PDF.
- Trabajar desde código C o directamente desde ensamblador RISC-V.
- Introducir manualmente secuencias de saltos, incluyendo rangos repetidos.
- Guardar y cargar sesiones en YAML.

La primera versión debe centrarse en los ejercicios de predictores de saltos del PDF, dejando la arquitectura preparada para predictores más avanzados en versiones futuras.

## 2. Alcance de la primera versión

La v1 debe incluir:

- Predictor de un nivel con contadores configurables, especialmente 1 bit y 2 bits.
- Predictor multinivel configurable `(n,m)`.
- Predictor correlacionado global.
- Predictor correlacionado global `gshare`.
- Predictor correlacionado global `gselect`.
- Predictor correlacionado local clásico:
  - Tabla de historia local por salto.
  - Tabla de predicción indexada por la historia local.
- Plantillas oficiales para los ejercicios 1, 2, 3, 4, 5 y 7 del PDF.
- Tabla dinámica de simulación.
- Modo paso a paso, ejecución completa, reinicio y salto de bucles.
- Edición/comprobación manual de tablas.
- Estadísticas calculadas solo bajo demanda.
- Interfaz en español de España e inglés británico.

No entran en v1, pero la arquitectura debe dejarlos previstos:

- Tournament predictor.
- TAGE.
- Simulación detallada de pipeline.
- ROB.
- Pila de retorno.
- Penalizaciones temporales por fallo de predicción.

## 3. Predictores soportados

### 3.1 Convenciones comunes

- `0 = NT`, no tomado.
- `1 = T`, tomado.
- Los estados de los predictores se muestran con bits.
- Los contadores saturan:
  - Si el resultado real es `T`, el contador incrementa hasta su máximo.
  - Si el resultado real es `NT`, el contador decrementa hasta cero.
- En contadores de 2 bits:
  - `00` y `01` predicen `NT`.
  - `10` y `11` predicen `T`.

### 3.2 Predictor de un nivel

Debe permitir configurar:

- Número de bits por contador.
- Estado inicial.
- Número de entradas.
- Política de indexado.
- Dirección o índice asociado a cada salto.

Casos típicos:

- Predictor de 1 bit.
- Predictor de 2 bits bimodal.

### 3.3 Predictor multinivel `(n,m)`

La notación `(n,m)` significa:

- `n`: número de bits de historia.
- `m`: número de bits por contador.

Ejemplo: `(3,2)` implica 8 posibles historias y contadores de 2 bits.

Debe permitir configurar:

- Tamaño del registro de historia.
- Bits por contador.
- Estado inicial del GHR.
- Estado inicial de los contadores.
- Número de entradas principales.
- Número de contadores por entrada.
- Política de indexado.

### 3.4 Correlacionado global

Debe usar una historia global compartida por todos los saltos.

Debe permitir configurar:

- Tamaño del GHR.
- Estado inicial del GHR.
- Tabla de predicción.
- Bits por contador.
- Política de actualización.

### 3.5 Gshare

Debe calcular el índice combinando dirección del salto e historia global mediante XOR.

Debe permitir configurar:

- Número de bits de dirección usados.
- Número de bits del GHR usados.
- Estado inicial del GHR.
- Estado inicial de los contadores.
- Número total de entradas.

### 3.6 Gselect

Debe calcular el índice concatenando bits de dirección y bits de historia global.

Ejemplo:

```text
indice = PC[k bits] || GHR[n bits]
```

Debe tener presets razonables basados en los ejercicios y en configuraciones comunes.

### 3.7 Correlacionado local

Debe implementar el modelo clásico:

- Una tabla de historia local asociada a saltos o índices de salto.
- Una tabla de predicción indexada con la historia local.

Debe permitir configurar:

- Tamaño de la historia local.
- Estado inicial de cada historia local.
- Bits por contador.
- Estado inicial de los contadores.
- Tamaño de la tabla de historia local.
- Tamaño de la tabla de predicción local.

## 4. Indexado y direcciones

La app debe permitir varias políticas de indexado:

- Usar los LSBs directos de la dirección.
- Ignorar bits bajos por alineamiento de instrucciones.
- Introducir manualmente el índice de cada salto.

LSB significa bits menos significativos. Por ejemplo, si la dirección es `0x54`, en binario `01010100`, usar los 8 LSBs equivale a usar `01010100`.

Algunos ejercicios usan explícitamente los LSBs de la dirección del salto, por ejemplo “usar los 9 LSBs”.

## 5. Entrada de datos

La aplicación debe ofrecer dos formas principales de entrada:

- Entrada desde código C/RISC-V.
- Entrada manual mediante tabla de secuencia de saltos.

### 5.1 Entrada desde C y RISC-V

La pantalla debe tener:

- Editor de C arriba a la izquierda.
- Editor de RISC-V arriba a la derecha.
- Tabla del predictor abajo.

El código C es una ayuda para el usuario, pero la simulación se alimenta del RISC-V.

El traductor C a RISC-V no necesita ser completo. Debe cubrir de forma didáctica:

- Saltos condicionales relevantes para los ejercicios.
- Bucles.
- Cargas y guardados.
- Operaciones aritméticas con registros.
- Operaciones aritméticas con literales.
- Enteros.
- Flotantes básicos.

No es necesario implementar:

- Gestión completa de pila.
- ABI completa.
- Llamadas a función complejas.
- Runtime real de C.

### 5.2 Sincronización C/RISC-V

Si el usuario modifica manualmente el RISC-V:

- El código C queda visualmente bloqueado.
- La edición del C queda impedida.
- La interfaz avisa de que el C ya no está sincronizado con el RISC-V.

Si el usuario intenta editar el C estando desincronizado:

- Se muestra un mensaje indicando que editar el C resincronizará desde C y se perderán los cambios manuales del RISC-V.
- Si acepta, se regenera el RISC-V desde C.

Si el C ya no corresponde al RISC-V, el C no debe guardarse en la sesión YAML.

### 5.3 Detección de saltos RISC-V

El simulador debe detectar saltos en RISC-V, incluyendo:

- `beq`
- `bne`
- `blt`
- `bge`
- Pseudoinstrucciones habituales como `bgt`
- Otros saltos condicionales que se incorporen en el subconjunto soportado

En v1, el foco está en saltos condicionales.

### 5.4 Comportamiento real de los saltos

La simulación debe avanzar por el código RISC-V y resaltar la instrucción de salto correspondiente.

El comportamiento real `T/NT` no se calcula necesariamente desde el C. Se introduce desde la secuencia de saltos.

Ejemplo de situación:

```asm
0x38 bge r4, r0, else  # B1
0x44 bne r7, r8, loop  # B2
```

El simulador detecta que existen `B1` y `B2`, pero necesita una secuencia de ejecuciones reales como:

```text
B1 NT
B2 T
B1 T
B2 T
B1 NT
B2 NT
```

Propuesta para v1:

- El simulador genera una tabla base con los saltos detectados.
- El usuario completa o importa la secuencia real `T/NT`.
- Las plantillas oficiales ya vienen con esa secuencia configurada.

## 6. Entrada manual de secuencia

Debe existir un modo manual donde cada fila represente una ejecución de un salto.

Columnas esperadas:

- Salto (`B1`, `B2`, ...).
- Dirección opcional.
- Comportamiento real (`T/NT`).
- Etiqueta o comentario opcional.

Los saltos deben poder llamarse `B1`, `B2`, ..., `Bn`.

### 6.1 Bucles visuales

La tabla manual debe permitir definir repeticiones de forma visual:

- El usuario puede marcar el inicio de un rango desde la zona superior de una celda o fila.
- Luego marca el final del rango.
- La app interpreta que todo lo intermedio forma un bucle.
- El número de repeticiones por defecto es 10.
- El número de repeticiones es configurable.

En ejecución paso a paso:

- Al llegar a un bucle debe aparecer una opción para saltar el bucle completo.
- Saltar el bucle ejecuta internamente todas las iteraciones.
- El estado final del predictor debe ser el mismo que si se hubieran ejecutado los pasos uno por uno.
- Debe mostrarse un resumen del tramo saltado.

## 7. Tabla de simulación

La tabla debe ser dinámica según el predictor seleccionado.

Debe seguir un patrón estándar y añadir columnas o dividirse en subtablas cuando sea más claro.

Columnas comunes:

- Iteración.
- Salto.
- Dirección o índice.
- Estado de historia antes.
- Estado del predictor antes.
- Predicción.
- Comportamiento real.
- Acierto/fallo.
- Estado del predictor después.
- Estado de historia después.

Columnas adicionales posibles:

- GHR.
- Historia local.
- Índice de segundo nivel.
- Entrada BTB/BHT si procede.
- Contadores `P0`, `P1`, ..., `Pn`.
- Cálculo de índice en `gshare`.
- Cálculo de índice en `gselect`.
- Información de aliasing.

Para ejercicios como los del PDF, debe poder mostrarse en varias tablas:

- Tabla principal de saltos.
- Tabla de predictores por salto.
- Tabla de GHR.
- Tabla de estadísticas.

## 8. Modos de uso

### 8.1 Simulación

Debe incluir:

- Ejecutar un paso.
- Ejecutar todo.
- Reiniciar.
- Retroceder pasos si es razonable implementarlo sin mucha complejidad.
- Saltar bucle completo cuando la ejecución llegue a un rango repetido.

Durante la ejecución:

- Debe resaltarse la fila activa de la tabla.
- Debe resaltarse la instrucción RISC-V activa si procede.

### 8.2 Modo examen

En modo examen:

- Las soluciones permanecen ocultas.
- Las estadísticas permanecen ocultas.
- Los cálculos permanecen ocultos.
- El usuario puede rellenar tabla y estadísticas.
- Solo se corrige al pulsar comprobar.

### 8.3 Modo solución

En modo solución:

- La app puede rellenar la tabla.
- La app puede mostrar la solución oficial de una plantilla.
- La app puede mostrar cálculos compactos.
- Los cálculos compactos pueden expandirse para ver más detalle.

### 8.4 Edición manual de tabla

El usuario debe poder introducir su solución en la tabla.

La corrección:

- No se muestra inmediatamente.
- Se ejecuta solo al pulsar comprobar.
- Debe comparar bits, predicciones, aciertos/fallos y estadísticas.

## 9. Estadísticas

Las estadísticas no deben mostrar valores antes de pulsar el botón correspondiente.

La interfaz debe mostrar:

- Nombre de la estadística.
- Campo para que el usuario introduzca su respuesta.
- Unidad cuando corresponda.
- Botón para calcular/comprobar.

Estadísticas normales:

- Número de aciertos.
- Número de fallos.
- Tasa de acierto.
- Tasa de fallo.

Más estadísticas, en un desplegable:

- Memoria total del predictor.
- Entradas usadas.
- Predictores usados.
- Aliasing.
- Estado final del GHR.
- Estado final de contadores.
- Estado final de historias locales.

### 9.1 Corrección de estadísticas

Debe aceptar:

- Enteros.
- Fracciones equivalentes.
- Porcentajes.
- Unidades cuando correspondan.

Ejemplos:

- `1/2` y `2/4` deben considerarse iguales.
- `50%` debe poder compararse con `1/2`.
- Los porcentajes deben aceptar un margen de error configurable.

### 9.2 Cálculos

Debe existir una opción “mostrar cálculos”.

Formato deseado:

- Explicación compacta por defecto.
- Secciones expandibles para ver una traza más detallada.

## 10. Aliasing

Aliasing significa que dos o más saltos distintos usan la misma entrada del predictor.

Ejemplo:

- `B1` y `B2` tienen direcciones distintas.
- La política de indexado usa solo algunos bits de la dirección.
- Ambas direcciones producen el mismo índice.
- Los dos saltos actualizan el mismo contador.

Esto puede:

- Perjudicar si los saltos tienen comportamientos opuestos.
- Ayudar si los saltos tienen comportamientos compatibles.

La app debe poder indicar si se ha producido aliasing y en qué entradas.

## 11. Plantillas oficiales

La app debe incluir plantillas basadas en los ejercicios del PDF de predictores.

Cada plantilla debe contener:

- Título.
- Enunciado visible dentro de la app.
- Configuración del predictor.
- Secuencia de saltos.
- Estado inicial.
- Solución oficial.
- Estadísticas esperadas.

Plantillas de v1:

- Ejercicio 1: predictor de 2 bits.
- Ejercicio 2: predictor multinivel `(1,1)` y `(1,2)`.
- Ejercicio 3: predictor `(3,2)` con 512 entradas y 9 LSBs.
- Ejercicio 4: correlacionado `(2,2)` con B1/B2.
- Ejercicio 5: `gshare`.
- Ejercicio 7: patrón `T-T-NT` con predictor `(2,2)`.

El ejercicio 6 se deja para una versión posterior por requerir Tournament.

## 12. Guardado y carga

El formato visible para el usuario debe ser YAML.

Debe guardarse solo input del usuario, no datos calculables.

Debe guardar:

- Configuración del predictor.
- Secuencia de saltos.
- Bucles/repeticiones definidos.
- Código RISC-V.
- Código C solo si está sincronizado con el RISC-V.
- Idioma.
- Modo de visualización relevante.
- Respuestas introducidas por el usuario.

No debe guardar:

- Tabla calculada si puede regenerarse.
- Estadísticas calculadas si pueden regenerarse.
- Código C desincronizado respecto al RISC-V.

Internamente se puede usar la estructura más cómoda para implementar, aunque el usuario vea YAML al importar/exportar.

Persistencia automática:

- Deseable si no añade demasiada complejidad.
- Puede implementarse con almacenamiento local del navegador.
- No sustituye a importar/exportar YAML.

## 13. Exportación

La app debería permitir exportar:

- YAML de sesión.
- Tabla final a CSV.
- Tabla final a Markdown.
- Imagen de tabla o vista para apuntes, si es razonable implementarlo.

## 14. Idiomas

La interfaz debe poder cambiar entre:

- Español de España.
- Inglés británico.

Los términos técnicos comunes no se traducen si se usan así normalmente:

- `GHR`
- `BTB`
- `BHT`
- `T`
- `NT`
- `gshare`
- `gselect`
- `Tournament`
- `TAGE`

Algunas columnas pueden cambiar si mejora la claridad:

- `Acierto` / `Hit`
- `Fallo` / `Miss`
- `Comportamiento real` / `Actual outcome`

## 15. Interfaz

Debe ser una web local.

Estilo deseado:

- Inspirado en Material Design de Android.
- Claro, académico y poco abrumador.
- Controles visibles para lo esencial.
- Opciones avanzadas escondidas en desplegables o paneles expandibles.
- Paneles densos pero legibles.

Distribución principal:

- Arriba izquierda: editor C.
- Arriba derecha: editor RISC-V.
- Abajo: tabla de predictor.
- Estadísticas en zona lateral o panel inferior, sin mostrar resultados hasta solicitarlos.

La app debe estar contenida en una carpeta exportable.

Se pueden usar dependencias externas si quedan instaladas dentro del proyecto o son accesibles de forma reproducible.

## 16. Arquitectura técnica deseada

Debe estar preparada para extender predictores.

Recomendación de diseño:

- Núcleo de simulación independiente de la UI.
- Interfaz común de predictor.
- Implementaciones separadas por tipo de predictor.
- Serialización/deserialización separada del núcleo.
- Plantillas oficiales como datos versionados.
- Capa de i18n separada.

Interfaz conceptual de predictor:

```text
initialise(config)
predict(branch, state) -> prediction + trace
update(branch, actualOutcome, state) -> newState + trace
getStats(trace) -> stats
```

La traza debe contener suficiente información para:

- Rellenar tablas.
- Mostrar cálculos.
- Comprobar respuestas del usuario.
- Exportar resultados.

## 17. Decisiones de v1

- La simulación se basa en saltos RISC-V y secuencias reales introducidas o precargadas.
- No se ejecuta C real.
- El C sirve para generar RISC-V didáctico.
- La tabla de secuencia manual es la fuente de verdad del comportamiento real.
- Las soluciones oficiales del PDF se cargan como plantillas.
- Tournament y TAGE no aparecen como seleccionables en v1, pero la arquitectura debe dejarlos previstos.

## 18. Puntos pendientes menores

- Decidir si se implementa retroceso paso a paso en v1 o se pospone.
- Decidir si la exportación a imagen entra en v1 o v1.1.
- Definir los presets exactos por predictor.
- Definir el subconjunto exacto de RISC-V aceptado por el parser inicial.
- Definir el margen de error por defecto para porcentajes.

## 19. Diseño y arquitectura

Los diagramas de casos de uso, el modelo de dominio y la arquitectura inicial se mantienen en [ARQUITECTURA.md](ARQUITECTURA.md).

## 20. Estado de implementación

Fecha de sincronización documental: 2026-06-14.

Este apartado no cambia el alcance de v1; solo refleja el estado actual de la codebase frente a los requisitos anteriores.

Implementado:

- Predictores de un nivel, multinivel `(n,m)`, correlacionado global, `gshare`, `gselect` y correlacionado local.
- Motor de simulación canónico, expansión de bucles, ejecución parcial/completa y estadísticas desde traza.
- Indexado por LSB, índice manual, XOR y concatenación.
- Parser RISC-V inicial para saltos condicionales, etiquetas, direcciones hexadecimales y comentarios.
- Traductor C didáctico orientado a generar RISC-V suficiente para ejercicios de bucles y saltos; no es un compilador C general.
- Secuencia manual editable en texto con saltos `B1..Bn`, resultados `T/NT`, dirección o índice opcional, comentarios y rangos repetidos.
- YAML de sesión con validación Zod y exclusión de datos derivados.
- Exportación de tabla a CSV y Markdown desde proyecciones, no desde el DOM.
- Corrección de respuestas de estadísticas y respuestas de tabla contra la traza canónica.
- Plantillas de ejercicios 1, 2, 3, 4, 5 y 7 en datos versionados; el ejercicio 1 está verificado y el resto queda como borrador hasta validación contra el PDF.
- UI local funcional con MUI y Zustand para plantillas, variantes, editores, tabla, estadísticas, corrección e importación/exportación.

Pendiente o incompleto:

- Configurador visual completo de predictores.
- Edición visual de bucles; hoy existe representación textual y expansión de rangos.
- Resaltado fino de instrucción RISC-V activa.
- Retroceso paso a paso como acción explícita de UI.
- i18n ES/EN completo en todos los textos visibles.
- QA e2e Playwright, revisión visual, responsive y accesibilidad básica.
- Verificación oficial de plantillas 2, 3, 4, 5 y 7.
