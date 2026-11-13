# Guía técnica: Kusi y los Fragmentos del Sol

Esta guía explica cómo está construido el juego, por qué se tomó cada decisión y dónde está cada parte en el código. Sirve para estudiar el proyecto y para responder preguntas en la defensa.

## 1. Arquitectura general

El juego sigue la arquitectura sugerida en el enunciado: escenas en la parte superior y servicios reutilizables (managers) debajo.

```
                    main.js  (configuración de Phaser)
                        │
   ┌────────────────────┼─────────────────────────────┐
   │              SCENE MANAGER (Phaser)               │
   │ Boot → Preload → Menu ⇄ Help                      │
   │                   │                               │
   │                   ▼                               │
   │      Story ⇄ Game + UI (en paralelo) ⇄ Pause      │
   │                   │                               │
   │          GameOver / Victory                       │
   └────────────────────┬─────────────────────────────┘
                        │ usan
   ┌──────────────┬─────┴───────┬───────────────┬──────────────┐
   │ objects/     │ physics/    │ ui/           │ managers/    │
   │ Player, Uku, │ LevelBuilder│ HUD: Minimap, │ EventBus,    │
   │ enemigos,    │ Collision-  │ BossBar,      │ StateMachine,│
   │ objetos      │ System      │ TouchControls │ Audio, Input,│
   │              │             │ TextButton... │ Storage,     │
   │              │             │               │ Session...   │
   └──────────────┴─────────────┴───────────────┴──────────────┘
```

Cada carpeta tiene una responsabilidad: `scenes` decide el flujo, `objects` el comportamiento de cada entidad, `physics` cómo interactúan, `ui` cómo se dibuja la información y `managers` los servicios compartidos (audio, guardado, entrada, eventos).

## 2. Flujo de escenas

| Escena | Responsabilidad |
| --- | --- |
| `BootScene` | Carga solo la fuente pixelada para poder mostrar texto en la pantalla de carga. |
| `PreloadScene` | Recorre `assetManifest.js`, muestra la barra de progreso, registra errores de carga y crea las animaciones. |
| `MenuScene` | Nueva partida, Continuar (si hay partida guardada), Elegir nivel, Cómo jugar y Sonido. Muestra récord y nivel alcanzado. |
| `LevelSelectScene` | Selector de niveles: una tarjeta por nivel con vista previa del fondo y su mejor resultado (`resultadoNivel` en `StorageManager`); solo se eligen los niveles ya alcanzados (`nivelAlcanzado`). |
| `HelpScene` | "Cómo jugar" en 4 páginas (controles, objetos, enemigos y jefe) con los sprites y sus animaciones reales. Permite repetir el tutorial. |
| `StoryScene` | Paneles de historia con retrato animado y efecto máquina de escribir. Recibe a dónde ir al terminar. |
| `GameScene` | Construye el nivel, crea a Kusi, conecta colisiones, cámara y música, y aplica victoria y derrota. |
| `UIScene` | HUD que corre **en paralelo** encima de GameScene. |
| `PauseScene` | Overlay de pausa; GameScene queda congelada con `scene.pause()`. "Cómo jugar" duerme la pausa (`scene.sleep()`) y abre HelpScene encima; al volver, la pausa se despierta y la partida sigue igual. |
| `GameOverScene` | Resumen, récord y reintento del nivel. |
| `VictoryScene` | Final de la partida, récord y opciones para volver a jugar. |

**¿Por qué el HUD está en otra escena?** Porque la cámara de GameScene sigue a Kusi, y si el HUD estuviera en esa escena habría que fijar cada elemento con `setScrollFactor(0)`. Además, así la lógica del juego no conoce cómo se dibuja la interfaz: solo emite eventos.

## 3. Sistema de estados

Hay dos niveles de estados.

1. **Estado global** (`managers/GameStateManager.js`): `cargando`, `menu`, `historia`, `jugando`, `pausa`, `derrota` y `victoria`, con una tabla de transiciones permitidas. Se usa, por ejemplo, para que la tecla P solo pause cuando el estado es `jugando`.
2. **Máquinas de estados de entidades** (`managers/StateMachine.js`): una clase genérica que guarda el estado actual y llama a `entrar`, `actualizar` y `salir`.
   - **Kusi:** `quieto`, `corriendo`, `saltando`, `cayendo`, `dash`, `herido`, `muerto` y `celebrando`. Cada estado elige su animación y decide a cuál pasar.
   - **Uku:** `oculto`, `entrada`, `flotar`, `rayo`, `aviso`, `picada`, `aturdido`, `golpeado`, `subir` y `derrotado`.
   - **Llama:** `quieta`, `inflar`, `escupir` y `liberada`. **Atoq:** `patrullar`, `alerta`, `cargar`, `cansado` y `liberado`.

Ventaja: en vez de muchos `if` mezclados en `update()`, cada estado describe solo lo suyo, y agregar un estado nuevo no rompe los demás.

## 4. Niveles a partir de texto (ASCII)

`src/data/levels.js` define cada nivel como 17 filas de texto; cada carácter es una baldosa de 32×32 px. `physics/LevelBuilder.js`:

1. Crea un Tilemap vacío (`make.tilemap` + `createBlankLayer`).
2. Recorre cada carácter: `#` pone suelo y elige la baldosa con superficie si arriba hay aire; `X` es bloque; `=` es plataforma de un solo sentido.
3. Los demás caracteres crean objetos: fragmentos, enemigos, púas, apachetas, resortes, losas, la puerta y el jefe.
4. Activa las colisiones con `setCollisionBetween` y, para las plataformas `=`, solo la cara superior: `tile.setCollision(false, false, true, false)`. Así Kusi puede atravesarlas saltando desde abajo y pararse encima.

Para crear un nivel nuevo basta con agregar un objeto al arreglo `NIVELES`.

## 5. Física y colisiones (`physics/CollisionSystem.js`)

| Tipo | Ejemplos |
| --- | --- |
| `collider` (los cuerpos se separan) | Kusi y Neblinos contra el tilemap; Kusi contra las losas móviles; Uku contra el suelo; esquirlas contra el suelo |
| `overlap` (se atraviesan y se ejecuta una función) | Recoger fragmentos y corazones, tocar enemigos, púas, esquirlas o al jefe |
| Triggers | Apachetas (punto de control), Puerta del Sol (meta), zona invisible que inicia la pelea con Uku |
| Gravedad y rebotes | Gravedad global de 1300 px/s²; rebote al pisar enemigos; resorte de la puya |

**Pisotón:** al tocar un enemigo se compara la velocidad vertical de Kusi (debe estar cayendo) y la posición de su borde inferior respecto al borde superior del enemigo. Si viene desde arriba, el enemigo muere y Kusi rebota; si no, Kusi recibe daño.

**Pozos:** el mundo no tiene borde inferior (`setBoundsCollision(true, true, true, false)`), así que GameScene detecta cuando Kusi cae por debajo del mapa.

**Losas móviles:** se mueven con velocidad, no cambiando su posición a mano, y son `immovable`. Por eso Arcade Physics arrastra a quien está encima usando la fricción del cuerpo. Solo colisionan por arriba.

## 6. Kusi y el "game feel" (`objects/Player.js`)

- **Aceleración y frenado:** la velocidad horizontal se acerca al objetivo poco a poco con la función `acercar`. En el nivel de hielo el frenado es muy bajo, por eso Kusi resbala.
- **Tiempo coyote (0,1 s):** se puede saltar justo después de salir de un borde.
- **Buffer de salto (0,12 s):** si se pulsa saltar un instante antes de aterrizar, el salto no se pierde.
- **Salto variable:** al soltar el botón mientras sube, la velocidad se multiplica por 0,45.
- **Dash:** con Shift, X o el botón táctil, Kusi sale disparada en horizontal a 600 px/s durante 0,16 s (unas 3 baldosas). Es un estado propio de la máquina de estados (`dash`): al entrar apaga la gravedad y al salir la devuelve y recorta la velocidad a la de carrera. Solo hay un dash por salto (se recarga al tocar suelo) y tiene 0,45 s de enfriamiento; si choca con una pared, termina antes.
- **Polvo y estela:** al aterrizar tras una caída rápida se levanta polvo, más cuanto más fuerte cae; al correr salen nubecitas en los pies, y durante el dash queda una estela de siluetas que se desvanecen. En el nivel de hielo el polvo es celeste.
- **Pausa al pisar enemigos (hit stop):** al pisar un enemigo la física se congela 70 ms para que el golpe se sienta. Si llega otro pisotón durante la pausa, se alarga en vez de acumularse.
- **Invulnerabilidad:** tras un golpe hay 1,3 s de parpadeo (tween de alpha) durante los que no recibe más daño.
- Los números están en `config/constants.js`, en los objetos `FISICA`, `DASH` y `SENSACION`. Con salto 560 y gravedad 1300, la altura máxima es v²/2g ≈ 120 px (unas 3,7 baldosas); los niveles respetan ese límite.

## 7. IA de enemigos y del jefe

- **Neblino:** patrulla; da la vuelta si choca (`body.blocked`) o si la baldosa delante de sus pies no existe (`capa.getTileAtWorldXY`).
- **Murciélago:** sin gravedad. Patrulla en horizontal y su velocidad vertical es la derivada de una onda seno, así el vuelo es suave.
- **Llama hechizada:** no se mueve. Se gira hacia Kusi y, si está dentro de su alcance (8 baldosas en horizontal y 2 de diferencia de altura), infla las mejillas 0,55 s como aviso y escupe un proyectil de escarcha tomado de un pool (`escupitajos`). Al pisarla se libera de la niebla en vez de morir.
- **Atoq de niebla:** patrulla como el Neblino. Si ve a Kusi a su misma altura (6 baldosas), se detiene con un "!" durante 0,45 s y embiste a 210 px/s; frena en paredes y bordes y queda `cansado` 1,2 s, que es el mejor momento para pisarlo.
- **Uku:**
  - En `flotar` persigue la posición X de Kusi con velocidad limitada y suelta esquirlas.
  - Luego avisa (ojos rojos y temblor), se lanza en `picada`, queda `aturdido` y vuelve a subir.
  - Solo es vulnerable en `aturdido`.
  - Tiene **3 fases** según su vida (más de 2/3, más de 1/3 y el resto). En cada fase sube la velocidad (160, 230 y 300), suelta más esquirlas por tanda (1, 3 y 5) y pasa menos tiempo aturdido (2,4 s, 1,7 s y 1,1 s).
  - Al cambiar de fase cambia de color, ruge y sacude la cámara. La barra del jefe muestra la fase (F1, F2, F3).
  - En la fase 3, cada 2 tandas de hielo pasa al estado `rayo`: marca una sombra amarilla en el suelo donde está Kusi y, 0,8 s después, deja caer un rayo (`Rayo.js`, también con pool).

## 8. Comunicación entre partes: EventBus

`managers/EventBus.js` es un `EventEmitter` único. Ejemplos:

- `GameSession` emite `sesion:cambio` cuando cambian puntos o vidas, y el HUD se redibuja.
- Uku emite `jefe:vida` y `jefe:derrotado`; el HUD actualiza la barra y GameScene activa la puerta.
- El botón de pausa del HUD emite `pausa:solicitada` y GameScene decide si puede pausar.

Cada escena **se desuscribe en `shutdown`**. Si no lo hiciera, al reiniciar un nivel se acumularían oyentes duplicados.

## 9. Persistencia (`managers/StorageManager.js`)

Se guarda un único JSON en `localStorage` con la clave `kusi.fragmentos-del-sol.v1`:

```json
{ "record": 4215, "nivelAlcanzado": 3,
  "audio": { "silencio": false, "volumenMusica": 0.5, "volumenEfectos": 0.8 },
  "partida": { "nivel": 2, "puntos": 870, "vidas": 3 },
  "graficos": "normal",
  "tutorialVisto": true,
  "niveles": { "1": { "puntos": 1840, "fragmentos": 31, "total": 31, "segundos": 102 } } }
```

`niveles` guarda el mejor resultado de cada nivel completado: al cruzar la Puerta del Sol, `GameScene` llama a `registrarResultadoNivel`, que se queda con el máximo de puntos y fragmentos y el mínimo de tiempo por separado. El selector de niveles lo muestra en cada tarjeta.

Todas las lecturas y escrituras están dentro de `try/catch`, porque el almacenamiento puede estar bloqueado (modo privado). En ese caso el juego sigue funcionando con los datos en memoria.

## 10. Audio (`managers/AudioManager.js`)

- Mantiene una sola música a la vez y la conserva entre escenas, sin reiniciarla si ya suena.
- Los navegadores bloquean el audio hasta la primera interacción: si el audio está bloqueado, la música queda pendiente y empieza al desbloquearse.
- El estado de silencio se guarda en una variable propia. En WebAudio, `sound.mute` se aplica con un pequeño retraso y leerlo justo después devuelve el valor anterior; este error se detectó en las pruebas y se corrigió.
- Cada audio se carga en OGG y MP3; Phaser elige el formato que soporta el navegador.

## 11. Rendimiento y optimización

| Técnica | Dónde |
| --- | --- |
| Object pooling de esquirlas (`group.get`, `maxSize: 16`) | `objects/IceShard.js`, `GameScene.prepararJefe` |
| Un emisor por tipo de partícula reutilizado con `explode`, y un pool de siluetas para la estela del dash | `managers/EffectsManager.js` |
| Minimapa dibujado una vez en una textura | `ui/Minimap.js` |
| Tutorial del Nivel 1 solo la primera vez (`tutorialVisto` en `StorageManager`) | `ui/TutorialNivel1.js` |
| Fondos como TileSprite recortados a su franja visible | `ui/ParallaxBackground.js`, `fondos.json` |
| Phaser en un archivo separado (caché del navegador) | `vite.config.js` |
| Calidad adaptativa: si el promedio baja de 45 FPS se quitan niebla y shaders | `managers/PerformanceMonitor.js` |
| Carga con barra de progreso antes de jugar (sin tirones por carga) | `PreloadScene` |

## 12. Controles táctiles y responsive

- `Scale.FIT` con `CENTER_BOTH` escala el lienzo de 960×540 sin deformarlo.
- `TouchControls` escribe en un objeto compartido (`entradaTactil`) que `InputManager` lee junto con el teclado. Por eso teclado y táctil producen exactamente las mismas acciones.
- Se habilitan 3 punteros para poder correr y saltar a la vez.
- En móviles en vertical, una regla CSS muestra el aviso de girar el dispositivo.

## 13. Cómo extender el juego

- **Nuevo nivel:** agrega un objeto a `NIVELES` en `data/levels.js`, con un tema existente (`valle`, `hielo` o `crater`), y un texto en `data/story.js` para `historiaAlTerminar`.
- **Nuevo enemigo:** crea una clase que extienda `Enemy`, implementa `update()`, añade un carácter en `LevelBuilder.crearObjeto` y su sprite en `assetManifest.js`.
- **Nuevo sonido:** agrégalo en `tools/generar_audio.py`, en `AUDIOS` del manifiesto y en `audioKeys.js`.

## 14. Preguntas probables en la defensa

1. **¿Qué es una escena y por qué usar varias?** Es una unidad con su propio ciclo de vida (`init`, `preload`, `create`, `update`). Separar menú, juego, HUD y pausa evita mezclar responsabilidades y permite pausar el juego sin pausar el menú de pausa.
2. **¿Diferencia entre `collider` y `overlap`?** El collider separa los cuerpos (no se atraviesan); el overlap solo detecta el contacto y ejecuta una función.
3. **¿Cómo funcionan las plataformas de un solo sentido?** Solo la cara superior de la baldosa colisiona: `setCollision(false, false, true, false)`.
4. **¿Por qué una máquina de estados?** Ordena el comportamiento: cada estado tiene su animación y sus transiciones, y se evitan combinaciones inválidas (por ejemplo, saltar estando muerto).
5. **¿Qué es el object pooling?** Reutilizar objetos desactivados en vez de crear y destruir. Reduce el trabajo del recolector de basura y evita tirones.
6. **¿Cómo se garantiza que el HUD no deje oyentes colgados?** Cada suscripción al EventBus se elimina en el evento `shutdown` de la escena.
7. **¿Qué se guarda en localStorage y por qué con `try/catch`?** Récord, nivel alcanzado, mejor resultado por nivel, partida, audio, gráficos y si ya se vio el tutorial. El `try/catch` evita que el juego falle si el navegador bloquea el almacenamiento.
8. **¿Cómo detecta el Neblino el borde de una plataforma?** Consulta la baldosa que está delante y debajo de sus pies; si no hay una baldosa con colisión, da la vuelta.
9. **¿Cómo se mantiene el rendimiento?** Pooling, texturas precalculadas, fondos recortados, partículas reutilizadas y calidad adaptativa por debajo de 45 FPS.
10. **¿Qué pasa si el audio no puede reproducirse al inicio?** El AudioManager guarda la música pendiente y la inicia cuando el navegador desbloquea el audio con la primera interacción.

## 15. Sugerencia para el historial de Git

El enunciado pide un repositorio con historial de commits. Lo ideal es subir el proyecto por etapas, en commits pequeños y descriptivos, por ejemplo:

1. Estructura base con Vite, Phaser y escenas vacías.
2. Generadores de recursos (imágenes y audio).
3. Tilemap desde ASCII y movimiento de Kusi.
4. Enemigos, colisiones y sistema de vidas.
5. HUD, menú, pausa y Game Over.
6. Persistencia y audio.
7. Niveles 2 y 3 y jefe Uku.
8. Controles táctiles, PWA y optimizaciones.
9. Documentación, pruebas y capturas.
