# Autoevaluación (borrador para completar por el estudiante)

> Este documento es un punto de partida. Revisa cada fila, ajusta el puntaje según tu criterio y completa la sección de herramientas utilizadas. La autoevaluación es tuya.

**Estudiante:** ______________________ **Fecha:** ______________

## Rúbrica

| Criterio | Peso | Autoevaluación | Justificación |
| --- | --- | --- | --- |
| Funcionalidad principal | 20 % | __ / 20 | El juego se juega de inicio a fin: menú, historia, 3 niveles, jefe, victoria, Game Over y reinicio. 22 pruebas automatizadas aprobadas. |
| Mecánicas de juego | 15 % | __ / 15 | Saltos con tiempo coyote, buffer y altura variable; plataformas de un solo sentido; resortes; losas móviles; suelo de hielo; checkpoints; jefe con dos fases. |
| Física y colisiones | 10 % | __ / 10 | Arcade Physics con gravedad, colliders con tilemap, overlaps, triggers (apachetas, meta, arena) y rebotes. |
| Arquitectura y modularidad | 15 % | __ / 15 | Carpetas `scenes`, `objects`, `ui`, `managers`, `physics`, `audio` y `assets`; máquina de estados reutilizable; EventBus; niveles definidos como datos. |
| Rendimiento y optimización | 10 % | __ / 10 | 60 FPS en modo Canvas; pooling, texturas precalculadas, fondos recortados y calidad adaptativa. **Pendiente: medir con `?fps` en un equipo con GPU y anotar el resultado aquí:** ____ FPS. |
| UX/UI | 10 % | __ / 10 | Menús navegables con teclado, ratón y toque; HUD con vidas, puntos, fragmentos, minimapa y barra del jefe; pausa y Game Over claros. |
| Audio e inmersión | 5 % | __ / 5 | 3 músicas, 2 jingles y 12 efectos originales; silencio con botón y tecla M, guardado entre sesiones. |
| Responsividad y táctil | 5 % | __ / 5 | `Scale.FIT`, controles táctiles multitáctiles probados en un móvil simulado en horizontal, pantalla completa y aviso de orientación. |
| Código limpio y documentación | 5 % | __ / 5 | Comentarios en cada módulo, nombres descriptivos, README y guía técnica. |
| README, video y presentación | 5 % | __ / 5 | README completo y 6 capturas. **Pendiente: video demo (ver `GUION_VIDEO.md`).** |
| **Total** | **100 %** | **__ / 100** | |
| Bonus | hasta +10 % | | Jefe final, minimapa, PWA instalable y efectos de shader. |

## Fortalezas

- Historia propia con identidad cultural andina, presente en la narración, los personajes y la música pentatónica.
- Todos los recursos gráficos y sonoros son originales y se pueden regenerar con scripts.
- Arquitectura clara y fácil de extender: un nivel nuevo se agrega como texto.
- Pruebas automatizadas que detectaron y ayudaron a corregir errores reales (historias bloqueadas tras la introducción y silencio mal guardado).

## Limitaciones

- El arte es pixel art sencillo, generado por código.
- Solo hay un tipo de jefe y tres niveles.
- El rendimiento en WebGL debe confirmarse en un equipo con GPU.
- Los controles táctiles solo se probaron en un móvil simulado, no en un dispositivo físico.

## Mejoras futuras

- Más niveles y un selector de niveles.
- Tabla de récords en línea (leaderboard).
- Más patrones de ataque para Uku y nuevos enemigos.
- Ajuste de volumen de música y efectos por separado en el menú.

## Herramientas utilizadas

_Describe aquí con honestidad qué herramientas usaste (editor, librerías, generadores, asistentes) y cómo comprobaste que entiendes cada parte del código._
