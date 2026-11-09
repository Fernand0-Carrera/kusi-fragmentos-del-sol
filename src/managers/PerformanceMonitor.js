/**
 * Monitor de rendimiento (calidad adaptativa).
 * Tras unos segundos de juego mide los FPS promedio; si quedan por debajo
 * del umbral (45 FPS, el mínimo que pide el proyecto), avisa una sola vez
 * para que la escena desactive efectos costosos (niebla, viñeta y brillos).
 */
export default class PerformanceMonitor {
  constructor(game, alBajar, { umbral = 45, espera = 3, ventana = 3 } = {}) {
    this.game = game;
    this.alBajar = alBajar;
    this.umbral = umbral;
    this.espera = espera;
    this.ventana = ventana;
    this.transcurrido = 0;
    this.reiniciarVentana();
    this.disparado = false;
  }

  reiniciarVentana() {
    this.suma = 0;
    this.muestras = 0;
    this.tiempoVentana = 0;
  }

  actualizar(delta) {
    if (this.disparado) return;
    const dt = delta / 1000;
    this.transcurrido += dt;
    if (this.transcurrido < this.espera) return; // se ignora el arranque del nivel
    this.suma += this.game.loop.actualFps;
    this.muestras += 1;
    this.tiempoVentana += dt;
    if (this.tiempoVentana >= this.ventana) {
      const promedio = this.suma / this.muestras;
      if (promedio < this.umbral) {
        this.disparado = true;
        this.alBajar(promedio);
      }
      this.reiniciarVentana();
    }
  }
}
