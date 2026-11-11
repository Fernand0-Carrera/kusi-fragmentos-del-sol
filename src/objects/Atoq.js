import Enemy from './Enemy.js';
import StateMachine from '../managers/StateMachine.js';
import { TILE } from '../config/constants.js';

// Ajustes del zorro (en píxeles y segundos)
const ATOQ = {
  velocidadPatrulla: 55,
  velocidadCarga: 210,
  alcanceX: 6 * TILE,       // distancia a la que detecta a Kusi
  alcanceY: TILE,           // solo carga si Kusi está a su misma altura
  tiempoAlerta: 0.45,       // pausa con el "!" antes de cargar (lo que tiene Kusi para reaccionar)
  duracionMaxCarga: 1.6,
  tiempoCansado: 1.2,       // jadeando: el mejor momento para pisarlo
  enfriamiento: 0.8,        // tras cansarse, no vuelve a detectar a Kusi enseguida
  colorNiebla: 0x7af2c9
};

/**
 * Atoq de niebla: zorro andino poseído por la niebla de Uku que embiste.
 *
 * IA con máquina de estados:
 *   patrullar -> alerta -> cargar -> cansado -> patrullar ...
 *
 *  - patrullar: camina como el Neblino (da la vuelta en paredes y bordes).
 *  - alerta:    ve a Kusi, se detiene, eriza la cola y muestra el "!".
 *  - cargar:    corre muy rápido hacia donde estaba Kusi; frena en paredes y bordes.
 *  - cansado:   se echa a jadear; no se mueve.
 * Al pisarlo se libera de la niebla y huye (liberar()).
 */
export default class Atoq extends Enemy {
  constructor(scene, x, y, capa, factorVelocidad = 1) {
    super(scene, x, y, 'atoq', 6);
    this.capa = capa;
    this.factor = factorVelocidad;
    this.direccion = -1;
    this.enfriamiento = 0;
    // Hitbox del cuerpo (sin la cola ni las orejas)
    this.body.setSize(26, 20).setOffset(18, 28);

    this.fsm = new StateMachine(this, {
      patrullar: {
        entrar() { this.play('atoq-andar', true); },
        actualizar(dt) {
          this.enfriamiento -= dt;
          if (this.hayObstaculoDelante()) this.direccion *= -1;
          this.moverX(ATOQ.velocidadPatrulla);
          const kusi = this.scene.jugador;
          if (kusi && this.enfriamiento <= 0 && this.veA(kusi)) this.fsm.cambiar('alerta');
        }
      },

      alerta: {
        entrar() {
          this.setVelocityX(0);
          this.mirarA(this.scene.jugador);
          this.play('atoq-alerta', true);
          // Saltito de sorpresa: refuerza el aviso además del "!" del sprite
          if (this.body.blocked.down) this.setVelocityY(-160);
        },
        actualizar() {
          this.setVelocityX(0);
          if (this.fsm.tiempoEnEstado >= ATOQ.tiempoAlerta) this.fsm.cambiar('cargar');
        }
      },

      cargar: {
        entrar() { this.play('atoq-correr', true); },
        actualizar() {
          // Termina al chocar, al llegar a un borde o tras un tiempo máximo
          if (this.hayObstaculoDelante() || this.fsm.tiempoEnEstado >= ATOQ.duracionMaxCarga) {
            this.fsm.cambiar('cansado');
            return;
          }
          this.moverX(ATOQ.velocidadCarga);
          if (this.scene.efectos && Math.random() < 0.25) {
            this.scene.efectos.polvo(this.x - this.direccion * 18, this.body.bottom, 1, ATOQ.colorNiebla);
          }
        }
      },

      cansado: {
        entrar() {
          this.setVelocityX(0);
          this.play('atoq-cansado', true);
        },
        actualizar() {
          this.setVelocityX(0);
          if (this.fsm.tiempoEnEstado >= ATOQ.tiempoCansado) {
            this.enfriamiento = ATOQ.enfriamiento;
            this.fsm.cambiar('patrullar');
          }
        }
      },

      liberado: {}
    }, 'patrullar');
  }

  update(time, delta) {
    if (!this.vivo) return;
    this.fsm.actualizar(delta / 1000);
  }

  moverX(velocidad) {
    this.setVelocityX(velocidad * this.factor * this.direccion);
    this.setFlipX(this.direccion > 0);
  }

  /** ¿Kusi está delante (o detrás, si está muy cerca) y a su misma altura? */
  veA(kusi) {
    const dx = kusi.x - this.x;
    const delante = Math.sign(dx) === this.direccion || Math.abs(dx) < 2 * TILE;
    return delante && Math.abs(dx) <= ATOQ.alcanceX && Math.abs(kusi.body.bottom - this.body.bottom) <= ATOQ.alcanceY;
  }

  mirarA(kusi) {
    if (!kusi) return;
    this.direccion = kusi.x < this.x ? -1 : 1;
    this.setFlipX(this.direccion > 0);
  }

  /** Misma idea que el Neblino: pared delante o falta de suelo bajo la siguiente pisada. */
  hayObstaculoDelante() {
    const cuerpo = this.body;
    if (this.direccion < 0 && (cuerpo.blocked.left || cuerpo.touching.left)) return true;
    if (this.direccion > 0 && (cuerpo.blocked.right || cuerpo.touching.right)) return true;
    if (!cuerpo.blocked.down) return false;   // en el aire (saltito de alerta) no revisa bordes
    const xDelante = this.direccion > 0 ? cuerpo.right + 2 : cuerpo.left - 2;
    const baldosa = this.capa.getTileAtWorldXY(xDelante, cuerpo.bottom + 4);
    return !baldosa || !baldosa.collides;
  }

  /** Reemplaza el morir() de Enemy: la niebla lo abandona y el zorro huye. */
  morir() {
    if (!this.vivo) return;
    this.vivo = false;
    this.body.enable = false;
    this.fsm.cambiar('liberado');

    this.play('atoq-liberarse');
    this.scene.efectos?.chispas(this.x, this.y - 16, ATOQ.colorNiebla, 14);

    this.scene.time.delayedCall(380, () => {
      if (!this.scene) return;
      this.play('atoq-libre');
      const huida = -this.direccion;
      this.setFlipX(huida > 0);
      this.scene.tweens.add({
        targets: this, x: this.x + huida * 200, alpha: 0, duration: 1000, delay: 250, ease: 'Quad.in',
        onComplete: () => this.destroy()
      });
    });
  }
}

export { ATOQ };
