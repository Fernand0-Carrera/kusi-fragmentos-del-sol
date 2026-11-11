/**
 * Definición de los niveles en texto (ASCII). Cada carácter es una baldosa de 32×32 px.
 * Editar un nivel es tan simple como cambiar caracteres en estas filas.
 *
 * Leyenda:
 *   #  suelo (la superficie se detecta sola)      X  bloque de piedra
 *   =  plataforma de un solo sentido              ^  púas de hielo
 *   o  fragmento de sol                           h  corazón (vida extra)
 *   e  Neblino (patrulla el suelo)                b  murciélago de escarcha (vuela)
 *   s  flor de puya (resorte)                     c  apacheta (punto de control)
 *   m  losa móvil horizontal (recorre 4 baldosas) M  losa móvil horizontal (6 baldosas)
 *   P  inicio de Kusi                             G  Puerta del Sol (meta)
 *   U  Uku, el jefe final                         A  activador de la arena del jefe
 *   l  llama hechizada (escupe escarcha)          z  Atoq de niebla (zorro que embiste)
 */
export const NIVELES = [
  {
    id: 1,
    nombre: 'Valle de los Colibríes',
    tema: 'valle',          // define fondos y baldosas
    temaIndice: 0,          // posición del tema dentro del tileset
    hielo: false,
    velocidadEnemigos: 1,
    tiempoObjetivo: 120,    // segundos de referencia para el bono de tiempo
    historiaAlTerminar: 'interludio1',
    filas: [
      '                                                                                                                                  ',
      '                                                                                                                                  ',
      '                                                                                                                                  ',
      '                                                                                                                                  ',
      '                                                o o o                                                                             ',
      '                                               =======                                                                            ',
      '                                         h                                                                 o o o                  ',
      '                                        o o                                                               =======                 ',
      '                                       =====                                                                                      ',
      '                                                                       b      o o o                             b                 ',
      '               oo         ooo     o o                        o o             ======                                               ',
      '                                 =====                       ===            X                      ooo                            ',
      '       o o o   XX                                                          XX           ooo                            o o        ',
      '   P           XX    e                        e   s     c                 XXX         e      e          s      z    c       G     ',
      '##########################   ###############################     #################################    ############################',
      '##########################   ###############################     #################################    ############################',
      '##########################   ###############################     #################################    ############################'
    ]
  },
  {
    id: 2,
    nombre: 'Cuevas de Hielo',
    tema: 'hielo',
    temaIndice: 1,
    hielo: true,
    velocidadEnemigos: 1.35,
    tiempoObjetivo: 150,
    historiaAlTerminar: 'interludio2',
    filas: [
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      '    XX       XX       XX       XX       XX       XX       XX       XX       XX       XX       XX       XX       XX       XX       XX       XX       XX',
      '                                                                                                                                                      ',
      '                                                                                                                                                      ',
      '                                                                                                                                                      ',
      '                                                                                                          o o o                                       ',
      '                                                                     o oh                                 =====                                       ',
      '                                              b                      ====                  b                                                          ',
      '                                                                  o          b                                  b                                     ',
      '              o         o o o          ooo          o o          XXX                o o o                                o o o                        ',
      '              X                                     ===        l XXX                                                       ==                         ',
      '      o o o   X       M                                       XXXXXX              M                                                   o o o           ',
      '   P          X                    e   ^^^                c   XXXXXX      e                     c   ^^   e  s       e              e       l    G     ',
      '#####################          ####################     #########################            ############################      #######################',
      '#####################          ####################     #########################            ############################      #######################',
      '#####################          ####################     #########################            ############################      #######################'
    ]
  },
  {
    id: 3,
    nombre: 'Cráter de Uku',
    tema: 'crater',
    temaIndice: 2,
    hielo: false,
    velocidadEnemigos: 1.5,
    tiempoObjetivo: 180,
    // Columnas (en baldosas) de la arena del jefe: la cámara queda fija entre ellas
    arena: { desde: 80, hasta: 111 },
    historiaAlTerminar: 'final',
    filas: [
      '                                                                                                              X',
      '                                                                                                              X',
      '                                                                                                              X',
      '                                                                                                              X',
      '                                                                                                              X',
      '                                                                                                              X',
      '                                  b                     b                                                     X',
      '                                                                                                  U           X',
      '                               o o o                                                                          X',
      '                              XXXXXXXX                oo                                                      X',
      '          oo        o o       XXXXXXXX           oo  ====        o o                                          X',
      '                              XXXXXXXX                                               ====              ====   X',
      '                   m          XXXXXXXX                          m                                             X',
      '   P      ^^   e            s XXXXXXXX  e   c    ^^    l   ^^         z e  c h     A          G               X',
      '###################     ########################################    ###########################################',
      '###################     ########################################    ###########################################',
      '###################     ########################################    ###########################################'
    ]
  }
];

export const TOTAL_NIVELES = NIVELES.length;
