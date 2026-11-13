import Phaser from 'phaser';
import { ESCENAS, EVENTOS, PUNTOS, TILE } from '../config/constants.js';
import { NIVELES, TOTAL_NIVELES } from '../data/levels.js';
import { MUSICA, SFX } from '../audio/audioKeys.js';
import EventBus from '../managers/EventBus.js';
import InputManager, { reiniciarEntradaTactil } from '../managers/InputManager.js';
import EffectsManager from '../managers/EffectsManager.js';
import PerformanceMonitor from '../managers/PerformanceMonitor.js';
import { audio } from '../managers/AudioManager.js';
import { almacen } from '../managers/StorageManager.js';
import { sesion } from '../managers/GameSession.js';
import { estadoJuego, ESTADO } from '../managers/GameStateManager.js';
import LevelBuilder, { BALDOSA } from '../physics/LevelBuilder.js';
import CollisionSystem from '../physics/CollisionSystem.js';
import ParallaxBackground from '../ui/ParallaxBackground.js';
import Player from '../objects/Player.js';
import Uku from '../objects/Uku.js';
import IceShard from '../objects/IceShard.js';
import Rayo from '../objects/Rayo.js';
import TutorialNivel1 from '../ui/TutorialNivel1.js';

/**
 * Escena de juego: construye el nivel, crea a Kusi, conecta colisiones,
 * cámara, música y HUD, y aplica las reglas de victoria y derrota.
 * El HUD vive en otra escena (UIScene) que corre en paralelo encima de esta.
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super(ESCENAS.JUEGO);
  }

  init(datos) {
    this.numeroNivel = datos?.nivel ?? sesion.nivel ?? 1;
    this.datosNivel = NIVELES[this.numeroNivel - 1];
    this.completando = false;
    this.terminado = false;
    this.cayendo = false;
    this.arenaActiva = false;
    this.tiempoNivel = 0;
  }

  create() {
    if (!estadoJuego.es(ESTADO.JUGANDO)) estadoJuego.cambiar(ESTADO.JUGANDO);

    // --- Mundo y nivel
    this.fondo = new ParallaxBackground(this, this.datosNivel.tema);
    this.nivel = new LevelBuilder(this, this.datosNivel).construir();
    const { anchoPx, altoPx } = this.nivel;
    this.physics.world.setBounds(0, 0, anchoPx, altoPx);
    this.physics.world.setBoundsCollision(true, true, true, false); // abajo abierto: los pozos matan
    this.efectos = new EffectsManager(this);

    // --- Jugador y controles
    this.entrada = new InputManager(this);
    this.jugador = new Player(this, this.nivel.inicio.x, this.nivel.inicio.y, this.entrada, { hielo: this.datosNivel.hielo });
    sesion.iniciarNivel(this.numeroNivel, this.nivel.totalFragmentos);

    this.colisiones = new CollisionSystem(this, this.nivel, this.jugador);
    this.colisiones.registrar();
    if (this.nivel.posicionJefe) this.prepararJefe();

    // --- Tutorial interactivo: solo en el Nivel 1 y solo la primera vez
    this.tutorial = null;
    if (this.numeroNivel === 1 && !almacen.tutorialVisto) {
      const tactil = this.sys.game.device.input.touch || new URLSearchParams(location.search).has('tactil');
      this.tutorial = new TutorialNivel1(this, this.jugador, this.nivel.enemigos, { tactil });
    }

    // --- Cámara con zona muerta y suavizado
    const camara = this.cameras.main;
    camara.setBounds(0, 0, anchoPx, altoPx);
    camara.startFollow(this.jugador, true, 0.12, 0.12);
    camara.setDeadzone(140, 90);
    camara.fadeIn(400, 27, 22, 56);
    if (this.game.renderer.type === Phaser.WEBGL) camara.postFX.addVignette(0.5, 0.5, 0.92, 0.3); // shader de viñeta

    // --- Calidad adaptativa: si el equipo no llega a 45 FPS se quitan efectos
    this.monitor = new PerformanceMonitor(this.game, (fps) => this.aplicarModoLigero(fps));
    if (almacen.graficosLigeros || new URLSearchParams(location.search).has('ligero')) this.aplicarModoLigero();

    // --- Audio, HUD y teclas globales
    audio.reproducirMusica(MUSICA.NIVEL);
    this.scene.launch(ESCENAS.HUD, { nivel: this.datosNivel });
    this.scene.bringToTop(ESCENAS.HUD);

    const teclado = this.input.keyboard;
    teclado.on('keydown-P', () => this.pausar());
    teclado.on('keydown-ESC', () => this.pausar());
    teclado.on('keydown-M', () => audio.alternarSilencio());

    // Eventos del bus (se quitan al cerrar la escena para no acumular oyentes)
    const alPedirPausa = () => this.pausar();
    const alDerrotarJefe = () => this.jefeDerrotado();
    const alPerderFoco = () => this.pausar();
    EventBus.on(EVENTOS.PAUSA_SOLICITADA, alPedirPausa);
    EventBus.on(EVENTOS.JEFE_DERROTADO, alDerrotarJefe);
    this.game.events.on(Phaser.Core.Events.BLUR, alPerderFoco);
    this.events.on('esquirla:rota', (x, y) => this.efectos.chispas(x, y, 0x9fe3ff, 6));
    this.events.on('escupitajo:roto', (x, y) => this.efectos.chispas(x, y, 0x9fe3ff, 6));
    this.events.on('jefe:impacto', (x, y) => this.efectos.chispas(x, y, 0xc9d6e3, 18));
    this.events.once('shutdown', () => {
      EventBus.off(EVENTOS.PAUSA_SOLICITADA, alPedirPausa);
      EventBus.off(EVENTOS.JEFE_DERROTADO, alDerrotarJefe);
      this.game.events.off(Phaser.Core.Events.BLUR, alPerderFoco);
      reiniciarEntradaTactil();
    });

    EventBus.emit(EVENTOS.NIVEL_LISTO, this.datosNivel);
    this.mostrarMensaje(`Nivel ${this.numeroNivel}: ${this.datosNivel.nombre}`, 2600);
  }

  /** Crea a Uku, sus pools de proyectiles y la zona que inicia la pelea. */
  prepararJefe() {
    const { arena } = this.datosNivel;
    const suelo = 14 * TILE;
    this.esquirlas = this.physics.add.group({ classType: IceShard, maxSize: 16, runChildUpdate: false });
    this.rayos = this.physics.add.group({ classType: Rayo, maxSize: 4, runChildUpdate: false });
    this.jefe = new Uku(this, this.nivel.posicionJefe.x, this.nivel.posicionJefe.y, {
      arena: { izquierda: arena.desde * TILE, derecha: arena.hasta * TILE - TILE, suelo },
      esquirlas: this.esquirlas,
      rayos: this.rayos,
      objetivo: this.jugador
    });
    const x = this.nivel.activadorArenaX;
    this.zonaArena = this.add.zone(x + TILE / 2, suelo / 2, TILE, suelo);
    this.physics.add.existing(this.zonaArena, true);
    // Pared invisible en la entrada de la arena que solo frena a los enemigos:
    // así no entran a la pelea patrullando o embistiendo antes que Kusi
    this.barreraArena = this.add.zone(arena.desde * TILE - 4, suelo / 2, 8, suelo);
    this.physics.add.existing(this.barreraArena, true);
    this.colisiones.registrarJefe(this.jefe, this.esquirlas, this.rayos, this.zonaArena, this.barreraArena);
  }

  update(time, delta) {
    if (this.terminado) return;
    this.tiempoNivel += delta / 1000;
    this.monitor.actualizar(delta);
    this.entrada.actualizar();
    this.jugador.update(time, delta);
    this.jefe?.update(time, delta);
    this.tutorial?.actualizar();
    this.fondo.actualizar(this.cameras.main.scrollX, delta / 1000);

    // Caída al vacío: el mundo no tiene suelo en los pozos
    if (!this.jugador.bloqueado && this.jugador.y > this.nivel.altoPx + 40) this.caerAlVacio();

    // Las esquirlas que salen de la pantalla vuelven al pool
    this.esquirlas?.children.each((e) => { if (e.active && e.y > this.nivel.altoPx + 50) e.romper(); });
    this.rayos?.children.each((rayo) => { if (rayo.active && rayo.y > this.nivel.altoPx + 50) rayo.terminar(); });
  }

  /** Desactiva efectos costosos y recuerda la preferencia para próximas partidas. */
  aplicarModoLigero(fps) {
    if (this.modoLigero) return;
    this.modoLigero = true;
    this.fondo.setLigero();
    this.cameras.main.postFX?.clear();
    this.nivel.puerta?.quitarBrillo();
    if (fps !== undefined) {
      almacen.guardarGraficos('ligero');
      this.mostrarMensaje(`Modo de rendimiento activado (${Math.round(fps)} FPS)`, 2600);
    }
  }

  mostrarMensaje(texto, duracion = 2200) {
    EventBus.emit(EVENTOS.MENSAJE, texto, duracion);
  }

  /** Devuelve true si Kusi efectivamente recibió el golpe. */
  danarJugador(origenX, vidas = 1) {
    if (this.completando || this.terminado) return false;
    if (!this.jugador.recibirDano(origenX)) return false;
    audio.efecto(SFX.DANO);
    this.cameras.main.shake(160, 0.006);
    if (!sesion.perderVida(vidas)) this.derrota();
    return true;
  }

  caerAlVacio() {
    if (this.cayendo || this.completando) return;
    this.cayendo = true;
    audio.efecto(SFX.DANO);
    if (!sesion.perderVida()) {
      this.derrota();
      return;
    }
    const camara = this.cameras.main;
    camara.fadeOut(250, 27, 22, 56);
    camara.once('camerafadeoutcomplete', () => {
      const punto = sesion.puntoControl ?? this.nivel.inicio;
      this.jugador.reaparecer(punto.x, punto.y);
      camara.fadeIn(300, 27, 22, 56);
      this.cayendo = false;
    });
  }

  derrota() {
    if (this.terminado) return;
    this.terminado = true;
    this.jugador.morir();
    audio.detenerMusica();
    audio.efecto(SFX.DANO, { detune: -600 });
    estadoJuego.cambiar(ESTADO.DERROTA);
    const nuevoRecord = almacen.actualizarRecord(sesion.puntos);
    this.time.delayedCall(1500, () => {
      this.scene.stop(ESCENAS.HUD);
      this.scene.start(ESCENAS.DERROTA, { nivel: this.numeroNivel, nuevoRecord });
    });
  }

  pausar() {
    if (!estadoJuego.es(ESTADO.JUGANDO) || this.completando || this.terminado || !this.scene.isActive()) return;
    estadoJuego.cambiar(ESTADO.PAUSA);
    reiniciarEntradaTactil();
    this.scene.pause();
    this.scene.launch(ESCENAS.PAUSA, { nivel: this.numeroNivel });
    this.scene.bringToTop(ESCENAS.PAUSA); // el menú de pausa se dibuja sobre el HUD
  }

  /** Al cruzar el activador: se cierra la arena, cambia la música y aparece Uku. */
  activarArena() {
    if (this.arenaActiva) return;
    this.arenaActiva = true;
    const { arena, temaIndice } = this.datosNivel;
    LevelBuilder.cerrarColumna(this.nivel.capa, arena.desde, 2, 13, temaIndice * 4 + BALDOSA.BLOQUE);
    const camara = this.cameras.main;
    camara.setBounds(arena.desde * TILE, 0, (arena.hasta - arena.desde) * TILE, this.nivel.altoPx);
    audio.reproducirMusica(MUSICA.JEFE);
    EventBus.emit(EVENTOS.JEFE_APARECE);
    this.mostrarMensaje('¡Uku ha despertado!', 2000);
    this.time.delayedCall(600, () => this.jefe.activar());
  }

  jefeDerrotado() {
    if (this.terminado) return;
    sesion.sumarPuntos(PUNTOS.jefe);
    this.efectos.textoFlotante(this.nivel.puerta.x, this.nivel.puerta.y - 80, `+${PUNTOS.jefe}`);
    audio.detenerMusica();
    audio.reproducirMusica(MUSICA.VICTORIA, { bucle: false });
    this.esquirlas?.children.each((e) => e.romper());
    this.nivel.puerta.setVisible(true).activar();
    this.mostrarMensaje('La niebla se disipa. ¡Entra en la Puerta del Sol!', 3500);
  }

  /** Kusi llegó a la Puerta del Sol: bonos, guardado y paso a la historia. */
  completarNivel() {
    if (this.completando || this.terminado) return;
    this.completando = true;
    this.jugador.celebrar();
    audio.efecto(SFX.PORTAL);
    this.efectos.chispas(this.jugador.x, this.jugador.y, 0xffe27a, 30);
    this.tweens.add({ targets: this.jugador, alpha: 0, scale: 0.4, y: this.jugador.y - 20, duration: 900, delay: 300 });

    const segundos = Math.round(this.tiempoNivel);
    const bonoTiempo = Math.max(0, this.datosNivel.tiempoObjetivo - segundos) * PUNTOS.porSegundoAhorrado;
    const bonoVidas = sesion.vidas * PUNTOS.porVidaAlFinal;
    sesion.sumarPuntos(bonoTiempo + bonoVidas);
    EventBus.emit('nivel:completado', {
      fragmentos: sesion.fragmentos, total: sesion.fragmentosTotales, segundos, bonoTiempo, bonoVidas, puntos: sesion.puntos
    });

    // Persistencia: récord, mejor resultado del nivel (para el selector),
    // nivel alcanzado y partida para "Continuar"
    const siguiente = this.numeroNivel + 1;
    almacen.actualizarRecord(sesion.puntos);
    almacen.registrarResultadoNivel(this.numeroNivel, {
      puntos: sesion.puntos - sesion.puntosInicioNivel, // solo lo ganado en este nivel, con bonos
      fragmentos: sesion.fragmentos,
      total: sesion.fragmentosTotales,
      segundos
    });
    if (siguiente <= TOTAL_NIVELES) {
      almacen.registrarNivel(siguiente);
      almacen.guardarPartida({ nivel: siguiente, puntos: sesion.puntos, vidas: sesion.vidas });
    } else {
      almacen.borrarPartida();
    }

    this.time.delayedCall(3800, () => {
      this.terminado = true;
      this.cameras.main.fadeOut(400, 27, 22, 56);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop(ESCENAS.HUD);
        estadoJuego.cambiar(ESTADO.HISTORIA);
        const destino = siguiente <= TOTAL_NIVELES
          ? { escena: ESCENAS.JUEGO, datos: { nivel: siguiente } }
          : { escena: ESCENAS.VICTORIA, datos: {} };
        this.scene.start(ESCENAS.HISTORIA, { id: this.datosNivel.historiaAlTerminar, siguiente: destino });
      });
    });
  }
}

