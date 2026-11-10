import Phaser from 'phaser';
import StateMachine from '../managers/StateMachine.js';
import { FISICA, JUGADOR, CAPAS, DASH, SENSACION } from '../config/constants.js';
import { audio } from '../managers/AudioManager.js';
import { SFX } from '../audio/audioKeys.js';

/** Acerca "actual" a "objetivo" sin pasarse, como máximo "paso" unidades. */
const acercar = (actual, objetivo, paso) =>
  actual < objetivo ? Math.min(actual + paso, objetivo) : Math.max(actual - paso, objetivo);

/**
 * Kusi, la protagonista. Hereda de Arcade.Sprite, así que tiene cuerpo físico,
 * gravedad y animaciones. Su comportamiento se organiza con una máquina de estados.
 *
 * Técnicas de "game feel" implementadas:
 *  - aceleración y frenado (y suelo resbaloso en el nivel de hielo)
 *  - tiempo coyote: se puede saltar unos milisegundos después de dejar un borde
 *  - buffer de salto: el salto pulsado justo antes de aterrizar no se pierde
 *  - salto variable: soltar el botón antes acorta el salto
 *  - dash: impulso horizontal corto, sin gravedad, uno por salto
 *  - polvo al aterrizar fuerte y al correr, y estela de siluetas en el dash
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, entrada, { hielo = false } = {}) {
    super(scene, x, y, 'kusi', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.entrada = entrada;
    this.hielo = hielo;
    this.setDepth(CAPAS.jugador);
    // Cuerpo más estrecho que el dibujo para que las colisiones se sientan justas
    this.body.setSize(18, 40).setOffset(9, 8);
    this.body.setMaxVelocity(1000, FISICA.caidaMaxima);
    this.setCollideWorldBounds(true);

    this.ultimoSuelo = -10;     // segundo en que tocó suelo por última vez
    this.ultimoSalto = -10;     // segundo en que se pulsó saltar
    this.saltoCortado = false;
    this.invulnerableHasta = 0;

    this.dashListo = true;       // se recarga al tocar suelo: un dash por salto
    this.finEnfriamientoDash = 0;
    this.direccionDash = 1;
    this.tiempoEstela = 0;
    this.tiempoPolvo = 0;
    this.enSueloAnterior = false;
    this.vyAnterior = 0;         // velocidad vertical del fotograma anterior (para el aterrizaje)
    this.colorPolvo = hielo ? 0xc9e8ff : 0xe8d9bd;

    this.fsm = new StateMachine(this, {
      quieto: {
        entrar() { this.play('kusi-quieto', true); },
        actualizar() {
          if (!this.enSuelo) this.fsm.cambiar('cayendo');
          else if (Math.abs(this.body.velocity.x) > 25) this.fsm.cambiar('corriendo');
        }
      },
      corriendo: {
        entrar() { this.play('kusi-correr', true); },
        actualizar() {
          if (!this.enSuelo) this.fsm.cambiar('cayendo');
          else if (Math.abs(this.body.velocity.x) < 25) this.fsm.cambiar('quieto');
        }
      },
      saltando: {
        entrar() { this.play('kusi-saltar', true); },
        actualizar() {
          if (this.body.velocity.y > 0) this.fsm.cambiar('cayendo');
        }
      },
      cayendo: {
        entrar() { this.play('kusi-caer', true); },
        actualizar() {
          if (this.enSuelo) this.fsm.cambiar('quieto');
        }
      },
      dash: {
        entrar() {
          this.play('kusi-correr', true);
          this.anims.timeScale = 2;
          this.body.allowGravity = false;
          this.setVelocity(this.direccionDash * DASH.velocidad, 0);
          this.tiempoEstela = 0;
        },
        actualizar(dt) {
          this.setVelocity(this.direccionDash * DASH.velocidad, 0);
          this.tiempoEstela -= dt;
          if (this.tiempoEstela <= 0) {
            this.scene.efectos?.estela(this, this.colorPolvo);
            this.tiempoEstela = SENSACION.intervaloEstela;
          }
          const choco = this.direccionDash > 0 ? this.body.blocked.right : this.body.blocked.left;
          if (choco || this.fsm.tiempoEnEstado >= DASH.duracion) this.fsm.cambiar(this.enSuelo ? 'quieto' : 'cayendo');
        },
        salir() {
          this.anims.timeScale = 1;
          this.body.allowGravity = true;
          // Al terminar se conserva la velocidad de carrera para salir con fluidez
          // (un empuje por daño es menor y no se toca)
          if (Math.abs(this.body.velocity.x) > FISICA.velocidadCarrera * 1.5) {
            this.setVelocityX(Math.sign(this.body.velocity.x) * FISICA.velocidadCarrera);
          }
        }
      },
      herido: {
        entrar() { this.play('kusi-herido', true); },
        actualizar() {
          // breve pérdida de control tras el golpe
          if (this.fsm.tiempoEnEstado > 0.35) this.fsm.cambiar(this.enSuelo ? 'quieto' : 'cayendo');
        }
      },
      muerto: {
        entrar() {
          this.play('kusi-herido', true);
          this.body.checkCollision.none = true; // atraviesa el suelo al caer
          this.setCollideWorldBounds(false);
          this.setVelocity(0, -420);
        }
      },
      celebrando: {
        entrar() {
          this.play('kusi-quieto', true);
          this.setVelocity(0, 0);
          this.body.allowGravity = false;
        }
      }
    }, 'quieto');
  }

  get enSuelo() {
    return this.body.blocked.down || this.body.touching.down;
  }

  get bloqueado() {
    return this.fsm.es('muerto') || this.fsm.es('celebrando');
  }

  /** Se llama en cada fotograma desde GameScene.update */
  update(time, delta) {
    const dt = delta / 1000;
    const t = time / 1000;
    if (this.bloqueado) {
      this.fsm.actualizar(dt);
      return;
    }
    const enSuelo = this.enSuelo;
    if (enSuelo) {
      this.ultimoSuelo = t;
      this.dashListo = true;
    }
    this.revisarAterrizaje(enSuelo);

    const controla = !this.fsm.es('herido');
    if (controla && this.entrada.saltoPresionado) this.ultimoSalto = t;

    // --- Durante el dash el impulso manda: no hay aceleración ni salto
    if (this.fsm.es('dash')) {
      this.fsm.actualizar(dt);
      this.recordarFotograma(enSuelo);
      return;
    }

    // --- Movimiento horizontal con aceleración
    let direccion = 0;
    if (controla) {
      if (this.entrada.izquierda()) direccion -= 1;
      if (this.entrada.derecha()) direccion += 1;
    }
    const aceleracion = this.hielo ? FISICA.aceleracionHielo : FISICA.aceleracion;
    const frenado = this.hielo && this.enSuelo ? FISICA.frenadoHielo : FISICA.frenado;
    const tasa = (direccion !== 0 ? aceleracion : frenado) * (this.enSuelo ? 1 : 0.8);
    this.setVelocityX(acercar(this.body.velocity.x, direccion * FISICA.velocidadCarrera, tasa * dt));
    if (direccion !== 0) this.setFlipX(direccion < 0);

    // --- Salto con buffer y tiempo coyote
    const pidioSalto = t - this.ultimoSalto <= FISICA.bufferSalto;
    const puedeSaltar = t - this.ultimoSuelo <= FISICA.tiempoCoyote;
    if (pidioSalto && puedeSaltar && this.body.velocity.y >= -20) this.saltar();

    // --- Salto variable: soltar el botón corta la subida
    if (!this.saltoCortado && this.fsm.es('saltando') && !this.entrada.saltarMantenido() && this.body.velocity.y < -150) {
      this.setVelocityY(this.body.velocity.y * FISICA.corteSalto);
      this.saltoCortado = true;
    }

    // --- Dash: Shift / X o el botón táctil
    if (controla && this.entrada.dashPresionado && this.puedeDash(t)) this.iniciarDash(direccion, t);

    if (this.fsm.es('corriendo') && enSuelo) this.levantarPolvo(dt);

    this.fsm.actualizar(dt);
    this.recordarFotograma(enSuelo);
  }

  puedeDash(t) {
    return this.dashListo && t >= this.finEnfriamientoDash;
  }

  /** Lanza el dash hacia donde se pulsa o, si no se pulsa nada, hacia donde mira Kusi. */
  iniciarDash(direccion, t) {
    this.direccionDash = direccion !== 0 ? direccion : (this.flipX ? -1 : 1);
    this.setFlipX(this.direccionDash < 0);
    this.dashListo = false;
    this.finEnfriamientoDash = t + DASH.duracion + DASH.enfriamiento;
    if (this.enSuelo) this.scene.efectos?.polvo(this.x - this.direccionDash * 10, this.body.bottom, 5, this.colorPolvo);
    this.fsm.cambiar('dash');
    audio.efecto(SFX.DASH);
  }

  /** Nubecita de polvo en los pies cada cierto tiempo mientras corre. */
  levantarPolvo(dt) {
    this.tiempoPolvo -= dt;
    if (this.tiempoPolvo > 0) return;
    this.tiempoPolvo = SENSACION.intervaloPolvo;
    const atras = this.flipX ? 8 : -8;
    this.scene.efectos?.polvo(this.x + atras, this.body.bottom, 1, this.colorPolvo);
  }

  /** Polvo al tocar suelo tras una caída rápida; más polvo cuanto más fuerte cae. */
  revisarAterrizaje(enSuelo) {
    if (!enSuelo || this.enSueloAnterior || this.vyAnterior < SENSACION.aterrizajeFuerte) return;
    const cantidad = Math.min(12, Math.round(this.vyAnterior / 70));
    this.scene.efectos?.polvo(this.x, this.body.bottom, cantidad, this.colorPolvo);
  }

  recordarFotograma(enSuelo) {
    this.enSueloAnterior = enSuelo;
    this.vyAnterior = this.body.velocity.y;
  }

  saltar() {
    this.setVelocityY(-FISICA.salto);
    this.ultimoSalto = -10;
    this.ultimoSuelo = -10;
    this.saltoCortado = false;
    this.fsm.cambiar('saltando');
    audio.efecto(SFX.SALTO);
  }

  /** Impulso externo: resorte o rebote al pisar un enemigo. */
  impulsar(fuerza, permitirCorte = false) {
    this.setVelocityY(-fuerza);
    this.ultimoSuelo = -10;
    this.saltoCortado = !permitirCorte;
    if (this.fsm.es('saltando')) this.play('kusi-saltar', true);
    this.fsm.cambiar('saltando');
  }

  esInvulnerable() {
    return this.scene.time.now < this.invulnerableHasta || this.bloqueado;
  }

  /**
   * Aplica el golpe (empuje + parpadeo). Devuelve false si no se aplicó
   * porque Kusi era invulnerable. La pérdida de vida la decide GameScene.
   */
  recibirDano(origenX) {
    if (this.esInvulnerable()) return false;
    const lado = this.x < origenX ? -1 : 1;
    this.setVelocity(lado * FISICA.empujeDano, -FISICA.empujeDano * 1.2);
    this.fsm.cambiar('herido');
    this.volverseInvulnerable(JUGADOR.invulnerable);
    return true;
  }

  volverseInvulnerable(segundos) {
    this.invulnerableHasta = this.scene.time.now + segundos * 1000;
    this.parpadeo?.stop();
    this.parpadeo = this.scene.tweens.add({
      targets: this, alpha: 0.25, duration: 90, yoyo: true,
      repeat: Math.floor((segundos * 1000) / 180),
      onComplete: () => this.setAlpha(1)
    });
  }

  morir() {
    this.parpadeo?.stop();
    this.setAlpha(1);
    this.fsm.cambiar('muerto');
  }

  celebrar() {
    this.fsm.cambiar('celebrando');
  }

  /** Vuelve a aparecer en el último punto de control. */
  reaparecer(x, y) {
    this.body.checkCollision.none = false;
    this.body.allowGravity = true;
    this.setCollideWorldBounds(true);
    this.body.reset(x, y);
    this.setVelocity(0, 0);
    this.fsm.cambiar('quieto');
    this.volverseInvulnerable(1);
  }
}
