/** Claves de audio: evita escribir cadenas sueltas al reproducir sonidos. */
export const MUSICA = {
  MENU: 'musica_menu',
  NIVEL: 'musica_nivel',
  JEFE: 'musica_jefe',
  VICTORIA: 'jingle_victoria',
  DERROTA: 'jingle_derrota'
};

export const SFX = {
  SALTO: 'sfx_salto',
  FRAGMENTO: 'sfx_fragmento',
  PISOTON: 'sfx_pisoton',
  DANO: 'sfx_dano',
  CONTROL: 'sfx_control',
  RESORTE: 'sfx_resorte',
  GOLPE_JEFE: 'sfx_golpe_jefe',
  RUGIDO: 'sfx_rugido',
  HIELO: 'sfx_hielo',
  PORTAL: 'sfx_portal',
  CLIC: 'sfx_clic',
  CORAZON: 'sfx_corazon'
};

// Volumen relativo de cada efecto (algunos sintetizados suenan más fuerte que otros)
export const VOLUMEN_SFX = {
  [SFX.SALTO]: 0.5, [SFX.FRAGMENTO]: 0.55, [SFX.PISOTON]: 0.8, [SFX.DANO]: 0.8,
  [SFX.CONTROL]: 0.7, [SFX.RESORTE]: 0.7, [SFX.GOLPE_JEFE]: 0.9, [SFX.RUGIDO]: 0.9,
  [SFX.HIELO]: 0.45, [SFX.PORTAL]: 0.8, [SFX.CLIC]: 0.6, [SFX.CORAZON]: 0.7
};
