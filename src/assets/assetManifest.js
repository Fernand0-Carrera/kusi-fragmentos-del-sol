/**
 * Lista central de recursos. PreloadScene recorre este manifiesto, así que
 * añadir un recurso nuevo solo requiere declararlo aquí.
 * Las rutas son relativas (sin "/" inicial) para que funcionen en desarrollo
 * y dentro de dist/ en cualquier servidor estático.
 */
const IMG = 'assets/images/';
const AUD = 'assets/audio/';

export const IMAGENES = [
  'logo', 'tileset', 'losa', 'puas', 'esquirla', 'particula', 'estrella', 'niebla',
  'fondo_valle_0', 'fondo_valle_1', 'fondo_valle_2',
  'fondo_hielo_0', 'fondo_hielo_1', 'fondo_hielo_2',
  'fondo_crater_0', 'fondo_crater_1', 'fondo_crater_2'
].map((clave) => ({ clave, ruta: `${IMG}${clave}.png` }));

// Hojas de sprites: tamaño de cada cuadro en píxeles
export const HOJAS = [
  { clave: 'kusi', ruta: `${IMG}kusi.png`, ancho: 36, alto: 48 },
  { clave: 'neblino', ruta: `${IMG}neblino.png`, ancho: 36, alto: 32 },
  { clave: 'murcielago', ruta: `${IMG}murcielago.png`, ancho: 40, alto: 28 },
  { clave: 'uku', ruta: `${IMG}uku.png`, ancho: 100, alto: 100 },
  { clave: 'fragmento', ruta: `${IMG}fragmento.png`, ancho: 28, alto: 28 },
  { clave: 'corazon', ruta: `${IMG}corazon.png`, ancho: 26, alto: 24 },
  { clave: 'apacheta', ruta: `${IMG}apacheta.png`, ancho: 36, alto: 52 },
  { clave: 'puya', ruta: `${IMG}puya.png`, ancho: 36, alto: 32 },
  { clave: 'puerta', ruta: `${IMG}puerta.png`, ancho: 68, alto: 96 },
  { clave: 'iconos', ruta: `${IMG}iconos.png`, ancho: 48, alto: 48 }
];

// Cada audio se ofrece en OGG y MP3; Phaser elige el que el navegador soporte
export const AUDIOS = [
  'musica_menu', 'musica_nivel', 'musica_jefe', 'jingle_victoria', 'jingle_derrota',
  'sfx_salto', 'sfx_fragmento', 'sfx_pisoton', 'sfx_dano', 'sfx_control', 'sfx_resorte',
  'sfx_golpe_jefe', 'sfx_rugido', 'sfx_hielo', 'sfx_rayo', 'sfx_portal', 'sfx_clic', 'sfx_corazon'
].map((clave) => ({ clave, rutas: [`${AUD}${clave}.ogg`, `${AUD}${clave}.mp3`] }));

export const FUENTE_BITMAP = { clave: 'pixel', imagen: 'assets/fonts/pixel.png', xml: 'assets/fonts/pixel.xml' };

// Índices de cuadro dentro de la hoja "iconos"
export const ICONO = { PAUSA: 0, SONIDO: 1, SILENCIO: 2, IZQUIERDA: 3, DERECHA: 4, SALTAR: 5, PANTALLA: 6 };
