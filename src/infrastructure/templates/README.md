# Plantillas oficiales

Este directorio contiene las plantillas versionadas derivadas de `ref_docs/Problemas.pdf`.

Estado actual:

- Ejercicio 1: verificado contra el motor canonico.
- Ejercicios 2, 3, 4, 5 y 7: presentes como datos de trabajo y marcados como `draft`.
- Ejercicio 6: fuera de v1 porque requiere Tournament.

Cada plantilla debe declarar:

- `id`, `exerciseNumber`, `title`, `statement` y referencia al PDF.
- `branchSequence` con la secuencia canonica de saltos.
- Una o varias `variants` con `predictorConfig`, estado inicial, resumen de solucion oficial y estadisticas esperadas.
- `verificationStatus`, para distinguir plantillas verificadas de borradores.

Las plantillas no deben exponer soluciones calculadas a mano como fuente de verdad: deben validarse ejecutando el mismo motor de dominio que usa la aplicacion.
