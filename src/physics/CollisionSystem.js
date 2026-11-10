import { FISICA, PUNTOS, SENSACION } from '../config/constants.js';
import { audio } from '../managers/AudioManager.js';
import { sesion } from '../managers/GameSession.js';
import { SFX } from '../audio/audioKeys.js';

/**
 * Registra todas las interacciones físicas del nivel en un solo lugar:
 *  - collider: los cuerpos se separan (suelo, plataformas, paredes)
 *  - overlap:  los cuerpos se atraviesan pero se ejecuta una función
 *              (recoger objetos, recibir daño, activar triggers)
 * Las reglas del juego que dependen de la escena (perder vida, terminar nivel)
 * se delegan a GameScene.
 */
export default class CollisionSystem {
  constructor(scene, nivel, jugador) {
    this.scene = scene;
    this.nivel = nivel;
    this.jugador = jugador;
  }

  registrar() {
    const { physics } = this.scene;
    const n = this.nivel;
    const j = this.jugador;

    // --- Colisiones sólidas
    physics.add.collider(j, n.capa);
    physics.add.collider(j, n.losas);
    physics.add.collider(n.enemigos, n.capa);
    physics.add.collider(n.enemigos, n.puas); // los Neblinos dan la vuelta ante las púas

    // --- Recolección (overlaps)
    physics.add.overlap(j, n.fragmentos, (_j, fragmento) => this.recogerFragmento(fragmento));
    physics.add.overlap(j, n.corazones, (_j, corazon) => this.recogerCorazon(corazon));

    // --- Peligros
    physics.add.overlap(j, n.enemigos, (_j, enemigo) => this.contactoEnemigo(enemigo));
    physics.add.overlap(j, n.puas, (_j, puas) => this.scene.danarJugador(puas.x));

    // --- Triggers (zonas que disparan eventos)
    physics.add.overlap(j, n.puyas, (_j, puya) => this.rebotarEnPuya(puya));
    physics.add.overlap(j, n.apachetas, (_j, apacheta) => this.activarApacheta(apacheta));
    if (n.puerta) physics.add.overlap(j, n.puerta, () => this.llegarAMeta());
  }

  /** Interacciones del jefe y sus proyectiles (solo en el nivel 3). */
  registrarJefe(jefe, esquirlas, rayos, zonaArena) {
    const { physics } = this.scene;
    const j = this.jugador;
    physics.add.collider(jefe, this.nivel.capa);
    physics.add.collider(esquirlas, this.nivel.capa, (esquirla) => esquirla.romper());
    physics.add.overlap(j, esquirlas, (_j, esquirla) => {
      if (this.scene.danarJugador(esquirla.x)) esquirla.romper();
    });
    physics.add.collider(rayos, this.nivel.capa, (rayo) => rayo.terminar());
    physics.add.overlap(j, rayos, (_j, rayo) => {
      if (this.scene.danarJugador(rayo.x, 2)) rayo.terminar();
    });
    physics.add.overlap(j, jefe, () => this.contactoJefe(jefe));
    physics.add.overlap(j, zonaArena, () => this.scene.activarArena());
  }

  recogerFragmento(fragmento) {
    fragmento.recoger();
    sesion.recogerFragmento(PUNTOS.fragmento);
    audio.efecto(SFX.FRAGMENTO, { detune: (sesion.fragmentos % 5) * 100 });
    this.scene.efectos.chispas(fragmento.x, fragmento.y, 0xffe27a);
  }

  recogerCorazon(corazon) {
    corazon.recoger();
    audio.efecto(SFX.CORAZON);
    if (!sesion.ganarVida()) {
      sesion.sumarPuntos(PUNTOS.corazonExtra);
      this.scene.efectos.textoFlotante(corazon.x, corazon.y, `+${PUNTOS.corazonExtra}`);
    }
  }

  /**
   * Si Kusi cae sobre el enemigo desde arriba, lo derrota y rebota;
   * en cualquier otro caso, Kusi recibe daño.
   */
  contactoEnemigo(enemigo) {
    if (!enemigo.vivo || this.jugador.bloqueado) return;
    const j = this.jugador.body;
    const desdeArriba = j.velocity.y > 0 && j.bottom <= enemigo.body.top + 14;
    if (desdeArriba) {
      enemigo.morir();
      this.jugador.impulsar(FISICA.rebotePisoton, true);
      sesion.sumarPuntos(PUNTOS.enemigo);
      audio.efecto(SFX.PISOTON);
      this.scene.efectos.pausaBreve(SENSACION.pausaPisoton);
      this.scene.efectos.chispas(enemigo.x, enemigo.y, 0xc9d6e3);
      this.scene.efectos.textoFlotante(enemigo.x, enemigo.y - 20, `+${PUNTOS.enemigo}`);
    } else {
      this.scene.danarJugador(enemigo.x);
    }
  }

  contactoJefe(jefe) {
    if (!jefe.active || this.jugador.bloqueado) return;
    const j = this.jugador.body;
    const desdeArriba = j.velocity.y > 0 && j.bottom <= jefe.body.top + 24;
    if (desdeArriba && jefe.recibirPisoton()) {
      this.jugador.impulsar(FISICA.salto, true);
      sesion.sumarPuntos(PUNTOS.golpeJefe);
      this.scene.efectos.textoFlotante(jefe.x, jefe.y - 50, `+${PUNTOS.golpeJefe}`);
    } else if (jefe.puedeDanar()) {
      this.scene.danarJugador(jefe.x);
    }
  }

  rebotarEnPuya(puya) {
    const j = this.jugador.body;
    if (j.velocity.y >= 0 && j.bottom <= puya.body.top + 18) {
      puya.activar();
      this.jugador.impulsar(FISICA.resorte);
      audio.efecto(SFX.RESORTE);
    }
  }

  activarApacheta(apacheta) {
    if (!apacheta.activar()) return;
    sesion.puntoControl = { x: apacheta.x, y: apacheta.y - 12 };
    audio.efecto(SFX.CONTROL);
    this.scene.efectos.chispas(apacheta.x, apacheta.y - 20, 0xf5b829);
    this.scene.mostrarMensaje('Apacheta encendida: aquí volverás si caes');
  }

  llegarAMeta() {
    if (this.nivel.puerta.activa) this.scene.completarNivel();
  }
}
