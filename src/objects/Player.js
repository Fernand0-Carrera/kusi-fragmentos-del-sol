import Phaser from 'phaser';
import StateMachine from '../managers/StateMachine.js';
import { FISICA, JUGADOR, CAPAS } from '../config/constants.js';
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
    if (this.enSuelo) this.ultimoSuelo = t;

    // --- Movimiento horizontal con aceleración
    const controla = !this.fsm.es('herido');
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
    if (controla && this.entrada.saltoPresionado) this.ultimoSalto = t;
    const pidioSalto = t - this.ultimoSalto <= FISICA.bufferSalto;
    const puedeSaltar = t - this.ultimoSuelo <= FISICA.tiempoCoyote;
    if (pidioSalto && puedeSaltar && this.body.velocity.y >= -20) this.saltar();

    // --- Salto variable: soltar el botón corta la subida
    if (!this.saltoCortado && this.fsm.es('saltando') && !this.entrada.saltarMantenido() && this.body.velocity.y < -150) {
      this.setVelocityY(this.body.velocity.y * FISICA.corteSalto);
      this.saltoCortado = true;
    }

    this.fsm.actualizar(dt);
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
