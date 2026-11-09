import Phaser from 'phaser';

/**
 * Bus de eventos global. Permite que escenas y objetos se comuniquen sin
 * conocerse entre sí (por ejemplo, GameScene avisa al HUD que cambió el puntaje).
 * Es una única instancia compartida (patrón Singleton a nivel de módulo).
 */
const EventBus = new Phaser.Events.EventEmitter();
export default EventBus;
