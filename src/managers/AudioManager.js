import EventBus from './EventBus.js';
import { almacen } from './StorageManager.js';
import { EVENTOS } from '../config/constants.js';
import { VOLUMEN_SFX } from '../audio/audioKeys.js';

/**
 * Centraliza la música y los efectos de sonido.
 * - Mantiene una sola pista de música a la vez (se conserva entre escenas).
 * - Aplica y guarda la configuración de silencio (mute).
 * - Si el navegador aún no permite audio (política de reproducción automática),
 *   deja la música pendiente hasta la primera interacción del usuario.
 */
class AudioManager {
  iniciar(game) {
    this.sonido = game.sound;
    this.musica = null;
    this.clavePendiente = null;
    // Se guarda el estado en una variable propia: en WebAudio, sound.mute
    // se aplica con un pequeño retraso y leerlo justo después da el valor anterior.
    this.mute = almacen.audio.silencio;
    this.sonido.setMute(this.mute);
    this.sonido.pauseOnBlur = true;
    this.sonido.on('unlocked', () => {
      if (this.clavePendiente) this.reproducirMusica(this.clavePendiente);
    });
  }

  reproducirMusica(clave, { bucle = true } = {}) {
    if (!this.sonido) return;
    if (this.musica && this.musica.key === clave && this.musica.isPlaying) return;
    this.detenerMusica();
    if (this.sonido.locked) {
      this.clavePendiente = clave;
      return;
    }
    this.clavePendiente = null;
    this.musica = this.sonido.add(clave, { loop: bucle, volume: almacen.audio.volumenMusica });
    this.musica.play();
  }

  detenerMusica() {
    if (this.musica) {
      this.musica.stop();
      this.musica.destroy();
      this.musica = null;
    }
  }

  efecto(clave, opciones = {}) {
    if (!this.sonido || this.sonido.locked) return;
    const volumen = (VOLUMEN_SFX[clave] ?? 0.7) * almacen.audio.volumenEfectos;
    this.sonido.play(clave, { volume: volumen, ...opciones });
  }

  get silenciado() {
    return this.mute ?? false;
  }

  alternarSilencio() {
    this.mute = !this.mute;
    this.sonido.setMute(this.mute);
    almacen.guardarAudio({ silencio: this.mute });
    EventBus.emit(EVENTOS.AUDIO_CAMBIO, this.mute);
    return this.mute;
  }
}

export const audio = new AudioManager();
