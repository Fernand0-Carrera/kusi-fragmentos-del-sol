import Phaser from 'phaser';
import { ANCHO, ALTO, COLOR, ESCENAS, FUENTE } from '../config/constants.js';
import { HISTORIAS } from '../data/story.js';
import { MUSICA } from '../audio/audioKeys.js';
import { audio } from '../managers/AudioManager.js';
import { estadoJuego, ESTADO } from '../managers/GameStateManager.js';
import ParallaxBackground from '../ui/ParallaxBackground.js';

// Fondo y retrato que acompañan a cada personaje de la historia
const RETRATOS = {
  kusi: { clave: 'kusi', anim: 'kusi-quieto', escala: 4, fondo: 'valle' },
  uku: { clave: 'uku', anim: 'uku-flotar', escala: 2.2, fondo: 'crater' },
  sol: { clave: 'fragmento', anim: 'fragmento-girar', escala: 6, fondo: 'valle' },
  fragmento: { clave: 'fragmento', anim: 'fragmento-girar', escala: 4, fondo: 'valle' },
  murcielago: { clave: 'murcielago', anim: 'murcielago-volar', escala: 4, fondo: 'hielo' }
};

/**
 * Escena de narración entre niveles. Muestra paneles con un retrato animado
 * y el texto escrito letra a letra. Enter, Espacio, clic o toque avanzan;
 * Esc o el botón "Saltar" omiten la historia.
 * Recibe { id, siguiente: { escena, datos } } para saber a dónde ir al terminar.
 */
export default class StoryScene extends Phaser.Scene {
  constructor() {
    super(ESCENAS.HISTORIA);
  }

  init(datos) {
    this.paneles = HISTORIAS[datos.id] ?? [];
    this.siguiente = datos.siguiente;
    this.indice = 0;
    // Phaser reutiliza la misma instancia de la escena: hay que reiniciar las banderas
    this.saliendo = false;
    this.letras = 0;
    this.textoCompleto = '';
  }

  create() {
    if (!estadoJuego.es(ESTADO.HISTORIA)) estadoJuego.cambiar(ESTADO.HISTORIA);
    audio.reproducirMusica(MUSICA.MENU);
    this.fondos = {};
    ['valle', 'hielo', 'crater'].forEach((tema) => {
      const f = new ParallaxBackground(this, tema, { niebla: false });
      f.capas.forEach((c) => c.setAlpha(0));
      this.fondos[tema] = f;
    });
    this.add.rectangle(0, 0, ANCHO, ALTO, COLOR.noche, 0.35).setOrigin(0);

    this.retrato = this.add.sprite(ANCHO / 2, 175, 'kusi');
    this.add.rectangle(ANCHO / 2, ALTO - 130, ANCHO - 80, 190, COLOR.panel, 0.92).setStrokeStyle(2, COLOR.oro);
    this.texto = this.add.bitmapText(70, ALTO - 210, FUENTE, '', 24).setMaxWidth(ANCHO - 140).setLineSpacing(6);
    this.indicador = this.add.bitmapText(ANCHO - 70, ALTO - 52, FUENTE, '', 24).setOrigin(1, 0.5).setTint(COLOR.oro);
    this.puntos = this.add.bitmapText(70, ALTO - 52, FUENTE, '', 24).setOrigin(0, 0.5).setTint(0x8a84b0);

    const saltar = this.add.bitmapText(ANCHO - 30, 26, FUENTE, 'Saltar historia (Esc)', 24).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    saltar.on('pointerup', (p, x, y, evento) => { evento?.stopPropagation(); this.terminar(); });

    this.input.on('pointerup', () => this.avanzar());
    this.input.keyboard.on('keydown-ENTER', () => this.avanzar());
    this.input.keyboard.on('keydown-SPACE', () => this.avanzar());
    this.input.keyboard.once('keydown-ESC', () => this.terminar());

    this.mostrarPanel();
  }

  mostrarPanel() {
    const panel = this.paneles[this.indice];
    if (!panel) { this.terminar(); return; }
    const retrato = RETRATOS[panel.personaje] ?? RETRATOS.kusi;

    // Fundido suave entre fondos según el personaje
    Object.entries(this.fondos).forEach(([tema, f]) =>
      f.capas.forEach((c) => this.tweens.add({ targets: c, alpha: tema === retrato.fondo ? 1 : 0, duration: 500 })));

    this.retrato.setTexture(retrato.clave).setScale(retrato.escala).play(retrato.anim);
    this.retrato.setAlpha(0).setY(195);
    this.tweens.add({ targets: this.retrato, alpha: 1, y: 175, duration: 400, ease: 'Cubic.out' });

    this.puntos.setText(`${this.indice + 1} / ${this.paneles.length}`);
    this.indicador.setText('');
    this.textoCompleto = panel.texto;
    this.letras = 0;
    this.escritura?.remove();
    // Efecto máquina de escribir: una letra cada 22 ms
    this.escritura = this.time.addEvent({
      delay: 22,
      repeat: this.textoCompleto.length - 1,
      callback: () => {
        this.letras += 1;
        this.texto.setText(this.textoCompleto.slice(0, this.letras));
        if (this.letras >= this.textoCompleto.length) this.indicador.setText('Continuar >');
      }
    });
  }

  avanzar() {
    if (this.saliendo) return;
    if (this.letras < this.textoCompleto.length) {
      // Primer toque: muestra el texto completo de golpe
      this.escritura?.remove();
      this.letras = this.textoCompleto.length;
      this.texto.setText(this.textoCompleto);
      this.indicador.setText('Continuar >');
      return;
    }
    this.indice += 1;
    this.mostrarPanel();
  }

  terminar() {
    if (this.saliendo) return;
    this.saliendo = true;
    this.cameras.main.fadeOut(350, 27, 22, 56);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const destino = this.siguiente ?? { escena: ESCENAS.MENU };
      if (destino.escena === ESCENAS.JUEGO) estadoJuego.cambiar(ESTADO.JUGANDO);
      if (destino.escena === ESCENAS.VICTORIA) estadoJuego.cambiar(ESTADO.VICTORIA);
      if (destino.escena === ESCENAS.MENU) estadoJuego.cambiar(ESTADO.MENU);
      this.scene.start(destino.escena, destino.datos ?? {});
    });
  }
}
