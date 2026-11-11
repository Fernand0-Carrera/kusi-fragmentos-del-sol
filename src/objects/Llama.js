import Enemy from './Enemy.js';
import StateMachine from '../managers/StateMachine.js';
import { audio } from '../managers/AudioManager.js';
import { SFX } from '../audio/audioKeys.js';
import { TILE } from '../config/constants.js';

// Ajustes de la llama (en píxeles y segundos)
const LLAMA = {
  alcanceX: 8 * TILE,       // distancia horizontal a la que "ve" a Kusi
  alcanceY: 2 * TILE,       // diferencia de altura máxima para disparar
  tiempoAviso: 0.55,        // mejillas infladas antes de escupir (lo que tiene Kusi para reaccionar)
  tiempoEscupir: 0.25,      // cuánto se mantiene el cuadro "escupe"
  enfriamiento: 1.8,        // espera entre disparos (se divide por velocidadEnemigos)
  velocidadProyectil: 220,
  colorNiebla: 0x7af2c9     // color espectral de la posesión (mismo que en los sprites)
};

/**
 * Llama hechizada: animal poseído por la niebla de Uku que escupe escarcha.
 *
 * IA con máquina de estados:
 *   quieta -> inflar (aviso) -> escupir -> quieta ...
 *   Al pisarla no "muere": se libera de la niebla y se va saltando (liberar()).
 *
 * No se mueve: se gira hacia Kusi y dispara solo si está a su altura y a su alcance.
 * Los escupitajos salen de un pool compartido (como las esquirlas de Uku).
 */
export default class Llama extends Enemy {
  constructor(scene, x, y, escupitajos, factorVelocidad = 1) {
    super(scene, x, y, 'llama', 4);
    this.escupitajos = escupitajos;          // grupo (pool) de Escupitajo
    this.factor = factorVelocidad;
    this.direccion = -1;                     // el sprite mira a la izquierda por defecto
    // Hitbox solo del cuerpo y las patas (el cuello y la cabeza no dañan al tocarlos)
    this.body.setSize(32, 26).setOffset(28, 38);
    this.body.setImmovable(true);

    this.fsm = new StateMachine(this, {
      quieta: {
        entrar() {
          this.play('llama-quieta', true);
          this.espera = LLAMA.enfriamiento / this.factor;
        },
        actualizar(dt) {
          this.espera -= dt;
          const kusi = this.scene.jugador;
          if (!kusi) return;
          if (this.veA(kusi)) this.mirarA(kusi);
          if (this.espera <= 0 && this.veA(kusi) && this.enPantalla()) this.fsm.cambiar('inflar');
        }
      },

      inflar: {
        entrar() {
          this.play('llama-inflar', true);
          // Pequeño "estirón" para que el aviso se note incluso en pantallas pequeñas
          this.scene.tweens.add({ targets: this, scaleY: 1.06, duration: 120, yoyo: true });
        },
        actualizar() {
          if (this.fsm.tiempoEnEstado >= LLAMA.tiempoAviso) this.fsm.cambiar('escupir');
        }
      },

      escupir: {
        entrar() {
          this.play('llama-escupir', true);
          this.disparar();
        },
        actualizar() {
          if (this.fsm.tiempoEnEstado >= LLAMA.tiempoEscupir) this.fsm.cambiar('quieta');
        }
      },

      liberada: {}   // ya no piensa: solo corre la animación de liberación
    }, 'quieta');
  }

  update(time, delta) {
    if (!this.vivo) return;
    this.fsm.actualizar(delta / 1000);
  }

  /** ¿Kusi está a su altura y dentro del alcance? */
  veA(kusi) {
    return Math.abs(kusi.x - this.x) <= LLAMA.alcanceX && Math.abs(kusi.y - this.body.center.y) <= LLAMA.alcanceY;
  }

  mirarA(kusi) {
    this.direccion = kusi.x < this.x ? -1 : 1;
    this.setFlipX(this.direccion > 0);
    // setFlipX no voltea el hitbox: como el cuerpo está detrás de la cabeza
    // (no centrado en el cuadro de 64 px), hay que reflejar el offset a mano.
    this.body.setOffset(this.direccion < 0 ? 28 : 64 - 28 - 32, 38);
  }

  /** Evita que disparen llamas que el jugador todavía no ve. */
  enPantalla() {
    return this.scene.cameras.main.worldView.contains(this.x, this.y);
  }

  disparar() {
    // Posición de la boca: delante de la cabeza (el sprite mide 64x64 en el juego)
    const bocaX = this.x + this.direccion * 26;
    const bocaY = this.y - 12;
    const escupitajo = this.escupitajos.get(bocaX, bocaY);
    if (!escupitajo) return;                  // pool lleno: se salta este disparo
    escupitajo.lanzar(bocaX, bocaY, this.direccion, LLAMA.velocidadProyectil * this.factor);
    audio.efecto(SFX.HIELO);                  // provisional: se puede crear sfx_escupir
  }

  /**
   * Reemplaza el morir() de Enemy: en lugar de desvanecerse, la niebla sale
   * de la llama y esta se va saltando, libre.
   */
  morir() {
    if (!this.vivo) return;
    this.vivo = false;
    this.body.enable = false;
    this.fsm.cambiar('liberada');
    this.scene.tweens.killTweensOf(this);
    this.setScale(1);

    this.play('llama-liberarse');
    this.scene.efectos?.chispas(this.x, this.y - 20, LLAMA.colorNiebla, 14);

    this.scene.time.delayedCall(380, () => {
      if (!this.scene) return;
      this.play('llama-libre');
      const huida = -this.direccion;          // escapa en dirección contraria a Kusi
      this.setFlipX(huida > 0);
      // Saltitos de alegría mientras se aleja y desaparece
      this.scene.tweens.add({ targets: this, y: this.y - 10, duration: 160, yoyo: true, repeat: 3, ease: 'Sine.out' });
      this.scene.tweens.add({
        targets: this, x: this.x + huida * 140, alpha: 0, duration: 1300, delay: 200,
        onComplete: () => this.destroy()
      });
    });
  }
}

export { LLAMA };
