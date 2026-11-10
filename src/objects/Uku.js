import Phaser from 'phaser';
import StateMachine from '../managers/StateMachine.js';
import EventBus from '../managers/EventBus.js';
import { audio } from '../managers/AudioManager.js';
import { SFX } from '../audio/audioKeys.js';
import { CAPAS, EVENTOS } from '../config/constants.js';

/**
 * Uku, Señor de la Niebla (jefe final).
 *
 * IA con máquina de estados:
 *   oculto -> entrada -> flotar -> aviso -> picada -> aturdido -> subir -> flotar ...
 *   Si Kusi le cae encima mientras está aturdido: golpeado -> subir (o derrotado).
 *
 * En "flotar" persigue la posición horizontal de Kusi y deja caer esquirlas de hielo.
 * Cada fase aumenta la velocidad y la presión de sus ataques.
 */
export default class Uku extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, { arena, esquirlas, rayos, objetivo }) {
    super(scene, x, y, 'uku', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.allowGravity = false;
    this.body.setSize(66, 56).setOffset(17, 26);
    this.setDepth(CAPAS.enemigos);
    this.setVisible(false);
    this.body.enable = false;

    this.arena = arena;           // { izquierda, derecha, suelo } en píxeles
    this.esquirlas = esquirlas;   // grupo (pool) de IceShard
    this.rayos = rayos;           // grupo (pool) de Rayo
    this.objetivo = objetivo;     // Kusi
    this.vidaMaxima = 6;
    this.vida = this.vidaMaxima;
    this.alturaVuelo = arena.suelo - 300;
    this.reloj = 0;
    this.tandasHielo = 0;

    this.fsm = new StateMachine(this, {
      oculto: {},

      entrada: {
        entrar() {
          this.setVisible(true);
          this.body.enable = true;
          this.setPosition(this.x, this.alturaVuelo - 260);
          audio.efecto(SFX.RUGIDO);
          this.scene.cameras.main.shake(600, 0.006);
          this.scene.tweens.add({
            targets: this, y: this.alturaVuelo, duration: 1500, ease: 'Sine.out',
            onComplete: () => this.fsm.cambiar('flotar')
          });
          this.play('uku-flotar');
        }
      },

      flotar: {
        entrar() {
          this.play('uku-flotar', true);
          this.proximoDisparo = 0.7;
        },
        actualizar(dt) {
          const fase = this.fase;
          // Persecución horizontal suavizada hacia Kusi
          const destinoX = Phaser.Math.Clamp(this.objetivo.x, this.arena.izquierda + 70, this.arena.derecha - 70);
          const maxVel = [0, 160, 230, 300][fase];
          const vx = Phaser.Math.Clamp((destinoX - this.x) * 1.6, -maxVel, maxVel);
          this.reloj += dt;
          const destinoY = this.alturaVuelo + Math.sin(this.reloj * 2) * 12;
          this.setVelocity(vx, (destinoY - this.y) * 3);
          this.setFlipX(this.objetivo.x > this.x);

          this.proximoDisparo -= dt;
          if (this.proximoDisparo <= 0) {
            this.lanzarEsquirlas([0, 1, 3, 5][fase]);
            if (fase === 3) {
              this.tandasHielo += 1;
              if (this.tandasHielo >= 2) {
                this.fsm.cambiar('rayo');
                return;
              }
            } else {
              this.tandasHielo = 0;
            }
            this.proximoDisparo = [0, 1.1, 0.75, 0.55][fase];
          }
          if (this.fsm.tiempoEnEstado > [0, 3.6, 2.8, 2.2][fase]) this.fsm.cambiar('aviso');
        }
      },

      rayo: {
        entrar() {
          this.setVelocity(0, 0);
          const x = Phaser.Math.Clamp(this.objetivo.x, this.arena.izquierda + 20, this.arena.derecha - 20);
          this.rayoActual = this.rayos.get(x, this.arena.suelo - 300);
          this.rayoActual?.avisar(x, this.arena.suelo);
        },
        actualizar() {
          if (this.fsm.tiempoEnEstado > 0.8 && !this.rayoDisparado) {
            this.rayoActual?.lanzar();
            this.rayoDisparado = true;
          }
          if (this.rayoDisparado && (!this.rayoActual?.active || this.fsm.tiempoEnEstado > 1.5)) {
            this.rayoActual = null;
            this.rayoDisparado = false;
            this.tandasHielo = 0;
            this.fsm.cambiar('aviso');
          }
        }
      },

      aviso: {
        entrar() {
          // Telegrafía el ataque: ojos rojos y temblor antes de lanzarse
          this.anims.stop();
          this.setFrame(2);
          this.setVelocity(0, 0);
          audio.efecto(SFX.RUGIDO, { detune: 300 });
          this.temblor = this.scene.tweens.add({ targets: this, x: this.x + 4, duration: 50, yoyo: true, repeat: -1 });
        },
        actualizar() {
          if (this.fsm.tiempoEnEstado > 0.7) this.fsm.cambiar('picada');
        },
        salir() { this.temblor?.stop(); }
      },

      picada: {
        entrar() { this.setVelocity(0, 720); },
        actualizar() {
          if (this.body.blocked.down || this.body.bottom >= this.arena.suelo - 1) this.fsm.cambiar('aturdido');
        }
      },

      aturdido: {
        entrar() {
          this.setVelocity(0, 0);
          this.setFrame(3);
          audio.efecto(SFX.PISOTON);
          this.scene.cameras.main.shake(250, 0.012);
          this.scene.events.emit('jefe:impacto', this.x, this.body.bottom);
          this.crearEstrellas();
        },
        actualizar() {
          this.moverEstrellas();
          if (this.fsm.tiempoEnEstado > [0, 2.4, 1.7, 1.1][this.fase]) this.fsm.cambiar('subir');
        },
        salir() { this.quitarEstrellas(); }
      },

      golpeado: {
        entrar() {
          this.vida -= 1;
          EventBus.emit(EVENTOS.JEFE_VIDA, this.vida, this.vidaMaxima, this.fase);
          audio.efecto(SFX.GOLPE_JEFE);
          this.setTintFill(0xffffff);
          this.scene.time.delayedCall(120, () => this.clearTint());
          this.setVelocity(0, -120);
        },
        actualizar() {
          if (this.fsm.tiempoEnEstado > 0.45) this.fsm.cambiar(this.vida <= 0 ? 'derrotado' : 'subir');
        }
      },

      subir: {
        entrar() { this.play('uku-flotar', true); },
        actualizar() {
          this.setVelocity(0, -280);
          if (this.y <= this.alturaVuelo) this.fsm.cambiar('flotar');
        }
      },

      derrotado: {
        entrar() {
          this.body.enable = false;
          this.setFrame(3);
          audio.efecto(SFX.RUGIDO, { detune: -400 });
          this.scene.cameras.main.shake(900, 0.01);
          this.scene.tweens.add({ targets: this, x: this.x + 5, duration: 40, yoyo: true, repeat: 20 });
          this.scene.tweens.add({
            targets: this, alpha: 0, scale: 1.6, delay: 700, duration: 900,
            onComplete: () => {
              EventBus.emit(EVENTOS.JEFE_DERROTADO);
              this.destroy();
            }
          });
        }
      }
    }, 'oculto');
  }

  get fase() {
    if (this.vida > this.vidaMaxima * 2 / 3) return 1;
    if (this.vida > this.vidaMaxima / 3) return 2;
    return 3;
  }

  /** Arranca la pelea (lo llama GameScene al cruzar el activador de la arena). */
  activar() {
    if (!this.fsm.es('oculto')) return;
    EventBus.emit(EVENTOS.JEFE_VIDA, this.vida, this.vidaMaxima, this.fase);
    this.fsm.cambiar('entrada');
  }

  /** Solo hace daño por contacto cuando no está aturdido ni subiendo. */
  puedeDanar() {
    return ['flotar', 'aviso', 'picada'].includes(this.fsm.actual);
  }

  /** Devuelve true si el pisotón cuenta como golpe. */
  recibirPisoton() {
    if (!this.fsm.es('aturdido')) return false;
    this.fsm.cambiar('golpeado');
    return true;
  }

  lanzarEsquirlas(cantidad) {
    for (let i = 0; i < cantidad; i++) {
      const esquirla = this.esquirlas.get(this.x, this.y);
      if (!esquirla) return; // el pool está lleno: se omite esta esquirla
      const separacion = (i - (cantidad - 1) / 2) * 70;
      esquirla.lanzar(this.x + separacion, this.y + 30, separacion * 0.4);
    }
    audio.efecto(SFX.HIELO, { detune: -200 });
  }

  crearEstrellas() {
    this.estrellas = [0, 1, 2].map(() => this.scene.add.image(this.x, this.y, 'estrella').setDepth(CAPAS.particulas));
  }

  moverEstrellas() {
    const t = this.fsm.tiempoEnEstado * 5;
    this.estrellas?.forEach((estrella, i) => {
      const angulo = t + (i * Math.PI * 2) / 3;
      estrella.setPosition(this.x + Math.cos(angulo) * 40, this.y - 40 + Math.sin(angulo) * 10);
    });
  }

  quitarEstrellas() {
    this.estrellas?.forEach((e) => e.destroy());
    this.estrellas = null;
  }

  update(time, delta) {
    if (!this.active) return;
    this.fsm.actualizar(delta / 1000);
  }
}
