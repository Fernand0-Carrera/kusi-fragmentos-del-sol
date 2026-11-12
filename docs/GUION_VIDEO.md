# Guion del video demo (45 a 90 segundos)

El enunciado pide mostrar gameplay, menús, audio y funcionalidades. Graba con el sonido del sistema activado (por ejemplo, con OBS Studio o la grabadora de Windows con Win + Alt + R).

## Antes de grabar

- Para que salga el tutorial, entra a **Cómo jugar** y pulsa **Repetir tutorial**.
- Para tener los 3 niveles abiertos en el selector, juega hasta el nivel 3 una vez, o escribe `__kusiDebug.almacen.registrarNivel(3)` en la consola del navegador (F12) con `npm run dev` y recarga la página.

## Guion

| Tiempo | Qué mostrar |
| --- | --- |
| 0–8 s | Menú principal con la música; se ven el récord y el nivel alcanzado. Abrir **Cómo jugar** y pasar rápido por las 4 páginas animadas (controles, objetos, enemigos y jefe). |
| 8–14 s | **Elegir nivel**: mostrar las tarjetas (un nivel con candado si aún no se alcanzó) y volver. "Nueva partida": un panel de la historia y "Saltar historia". |
| 14–32 s | Nivel 1 con el **tutorial**: cartel de moverse, de saltar ("¡Bien!") y de dash. Recoger fragmentos, pisar un Neblino (con su pausa breve y el polvo al aterrizar), usar la flor de puya y encender una apacheta. Caer a un pozo para mostrar la reaparición. |
| 32–38 s | Pausa (P): mostrar el menú y silenciar/activar el sonido. Continuar. |
| 38–50 s | Nivel 2: suelo de hielo resbaloso, una losa móvil y la **Llama hechizada** escupiendo escarcha. Esquivar con un salto o un **dash** y pisarla para liberarla. |
| 50–75 s | Nivel 3: el **Atoq** que embiste (pisarlo cuando queda cansado) y la pelea con Uku: esquivar esquirlas, pisarlo aturdido, el **cambio de fase** (color, rugido y temblor) y, en la fase 3, la sombra amarilla y el **rayo**. Mostrar la barra con la fase (F1, F2, F3) y el minimapa. |
| 75–85 s | Puerta del Sol, epílogo y pantalla de victoria con el récord. |
| 85–90 s | Opcional: el juego en el móvil o con `?tactil` mostrando los controles táctiles, incluido el botón de dash. |

Consejo: para grabar el nivel 3 sin rejugar todo, usa **Elegir nivel** → Nivel 3, o "Continuar" si tienes una partida guardada en ese nivel.
