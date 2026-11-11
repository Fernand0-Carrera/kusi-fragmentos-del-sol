"""
Generador de recursos gráficos originales para "Kusi y los Fragmentos del Sol".

Todos los sprites se dibujan píxel a píxel a escala 1x y se amplían x2 con
vecino más cercano para conservar el estilo pixel art. Los fondos se dibujan
a resolución completa y son repetibles horizontalmente (tileSprite).

Uso:  python3 tools/generar_imagenes.py
Salida: public/assets/images/*.png, public/assets/fonts/pixel.png + pixel.xml,
        public/icons/*.png
"""
import math
import os
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(RAIZ, 'public', 'assets', 'images')
FONTS = os.path.join(RAIZ, 'public', 'assets', 'fonts')
ICONS = os.path.join(RAIZ, 'public', 'icons')
for carpeta in (IMG, FONTS, ICONS):
    os.makedirs(carpeta, exist_ok=True)

random.seed(7)


def hexa(c, a=255):
    c = c.lstrip('#')
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)


T = (0, 0, 0, 0)  # transparente

# Paleta inspirada en los textiles andinos
PAL = {
    'noche': '#1b1638', 'niebla': '#c9d6e3', 'oro': '#f5b829', 'oro2': '#ffe27a',
    'grana': '#c8233c', 'grana2': '#8e1730', 'turquesa': '#2bb3a3', 'turq2': '#1d7f74',
    'lana': '#f3e6cf', 'piel': '#c68642', 'piel2': '#9c6331', 'pelo': '#2b1b17',
    'pantalon': '#3a2e4f', 'sandalia': '#6b4226', 'blanco': '#ffffff',
}


class Lienzo:
    """Pequeña ayuda para pintar píxeles sobre una imagen RGBA."""

    def __init__(self, w, h):
        self.im = Image.new('RGBA', (w, h), T)
        self.px = self.im.load()
        self.w, self.h = w, h

    def p(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[x, y] = hexa(c) if isinstance(c, str) else c

    def r(self, x, y, w, h, c):
        for i in range(x, x + w):
            for j in range(y, y + h):
                self.p(i, j, c)

    def linea_h(self, x0, x1, y, c):
        for i in range(x0, x1 + 1):
            self.p(i, y, c)


def ampliar(im, k=2):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


def contorno(im, color='#1b1638'):
    """Añade un contorno de 1 px alrededor de los píxeles opacos (mejor contraste)."""
    w, h = im.size
    src = im.load()
    out = im.copy()
    dst = out.load()
    c = hexa(color)
    for x in range(w):
        for y in range(h):
            if src[x, y][3] == 0:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and src[nx, ny][3] > 0:
                        dst[x, y] = c
                        break
    return out


def hoja(frames):
    """Une varios cuadros del mismo tamaño en una tira horizontal."""
    w, h = frames[0].size
    tira = Image.new('RGBA', (w * len(frames), h), T)
    for i, f in enumerate(frames):
        tira.paste(f, (i * w, 0))
    return tira


def guardar(im, nombre, k=2, borde=True):
    if borde:
        # el contorno se aplica por cuadro antes de unir; aquí solo amplía
        pass
    ampliar(im, k).save(os.path.join(IMG, nombre))


# ---------------------------------------------------------------------------
# Kusi, la chasqui (16x24 por cuadro, 9 cuadros)
# 0-1 reposo, 2-5 carrera, 6 salto, 7 caída, 8 daño
# ---------------------------------------------------------------------------
def kusi(cuadro):
    L = Lienzo(18, 24)  # 1 px extra a cada lado para el contorno
    ox = 1
    bob = 1 if cuadro == 1 else 0
    herido = cuadro == 8

    def P(x, y, c):
        L.p(x + ox, y, c)

    def R(x, y, w, h, c):
        L.r(x + ox, y, w, h, c)

    y0 = 1 + bob
    # Chullo (gorro andino) turquesa con borla y orejeras
    P(8, y0, PAL['oro'])
    R(6, y0 + 1, 5, 1, PAL['turquesa'])
    R(5, y0 + 2, 7, 3, PAL['turquesa'])
    for x in (6, 8, 10):
        P(x, y0 + 3, PAL['lana'])
    R(5, y0 + 4, 7, 1, PAL['grana'])
    # Cara
    R(6, y0 + 5, 6, 4, PAL['piel'])
    R(6, y0 + 5, 6, 1, PAL['pelo'])  # flequillo
    # orejeras con trenza
    R(4, y0 + 5, 2, 3, PAL['turq2'])
    P(4, y0 + 8, PAL['oro'])
    if herido:
        P(10, y0 + 6, PAL['noche']); P(9, y0 + 7, PAL['noche']); P(11, y0 + 7, PAL['noche'])
    else:
        P(10, y0 + 6, PAL['noche'])
        P(10, y0 + 7, PAL['piel2'])
    P(11, y0 + 8, PAL['piel2'])
    # Poncho grana con franjas doradas
    py = y0 + 9
    R(5, py, 8, 1, PAL['grana'])
    R(4, py + 1, 10, 5, PAL['grana'])
    R(4, py + 2, 10, 1, PAL['oro'])
    R(4, py + 4, 10, 1, PAL['grana2'])
    for x in range(4, 14, 2):
        P(x, py + 5, PAL['oro'])
    P(8, py, PAL['piel'])  # cuello

    # Brazos / manos según el cuadro
    if cuadro in (6, 7) or herido:  # brazos arriba
        R(2, py - 1, 2, 2, PAL['piel'])
        R(14, py - 1, 2, 2, PAL['piel'])
    elif cuadro in (2, 4):
        R(3, py + 3, 1, 2, PAL['piel']); R(14, py + 1, 1, 2, PAL['piel'])
    elif cuadro in (3, 5):
        R(3, py + 1, 1, 2, PAL['piel']); R(14, py + 3, 1, 2, PAL['piel'])
    else:
        R(3, py + 3, 1, 2, PAL['piel']); R(14, py + 3, 1, 2, PAL['piel'])

    # Pantalón y piernas
    ly = py + 6
    R(6, ly, 6, 2, PAL['pantalon'])
    piernas = {
        0: ((6, 7), (10, 11)), 1: ((6, 7), (10, 11)),
        2: ((4, 5), (11, 12)), 3: ((6, 7), (9, 10)),
        4: ((11, 12), (4, 5)), 5: ((9, 10), (6, 7)),
        6: ((5, 6), (10, 11)), 7: ((5, 6), (11, 12)), 8: ((6, 7), (10, 11)),
    }[cuadro]
    alto = 2 if cuadro != 6 else 1
    for (a, b) in piernas:
        R(a, ly + 2, 2, alto, PAL['pantalon'] if cuadro == 6 else PAL['piel2'])
        R(a, ly + 2 + alto, 2, 1, PAL['sandalia'])
    return contorno(L.im)


frames_kusi = [kusi(i) for i in range(9)]
guardar(hoja(frames_kusi), 'kusi.png')  # cuadros de 36x48


# ---------------------------------------------------------------------------
# Neblino: criatura de niebla que patrulla (16x16, 3 cuadros)
# ---------------------------------------------------------------------------
def neblino(cuadro):
    L = Lienzo(18, 16)
    cuerpo, sombra = '#b8c4d6', '#7f8ca6'
    if cuadro == 2:  # aplastado
        L.r(2, 11, 14, 4, cuerpo); L.r(2, 14, 14, 1, sombra)
        L.r(5, 12, 2, 1, PAL['noche']); L.r(11, 12, 2, 1, PAL['noche'])
        return contorno(L.im)
    dy = 1 if cuadro == 1 else 0
    for y in range(3 + dy, 15):
        ancho = int(6 + 6 * math.sin(min(1, (y - 2 - dy) / 6) * math.pi / 2))
        x0 = 9 - ancho // 2 - 1
        L.r(x0, y, ancho + 2, 1, cuerpo)
    L.r(3, 13, 12, 2, sombra)
    # bucles de niebla en la base
    for x in (3, 7, 11, 14):
        L.p(x, 15, cuerpo)
    # ojos enojados
    L.r(5, 7 + dy, 3, 3, PAL['blanco']); L.r(10, 7 + dy, 3, 3, PAL['blanco'])
    L.p(6, 8 + dy, PAL['noche']); L.p(11, 8 + dy, PAL['noche'])
    L.r(5, 6 + dy, 2, 1, PAL['noche']); L.r(11, 6 + dy, 2, 1, PAL['noche'])
    L.r(7, 11 + dy, 4, 1, '#5d6782')
    return contorno(L.im)


guardar(hoja([neblino(i) for i in range(3)]), 'neblino.png')  # 36x32


# ---------------------------------------------------------------------------
# Murciélago de escarcha (16x12, 3 cuadros: alas arriba, abajo, derrotado)
# ---------------------------------------------------------------------------
def murcielago(cuadro):
    L = Lienzo(20, 14)
    cuerpo, ala, hielo = '#4b3f72', '#6c5ba8', '#9fe3ff'
    L.r(8, 5, 4, 5, cuerpo)
    L.p(8, 4, cuerpo); L.p(11, 4, cuerpo)
    L.p(9, 6, hielo); L.p(10, 6, hielo)
    if cuadro == 0:
        for i in range(6):
            L.r(2 + i, 2 + i // 2, 1, 3, ala); L.r(17 - i, 2 + i // 2, 1, 3, ala)
        L.p(2, 1, hielo); L.p(17, 1, hielo)
    elif cuadro == 1:
        for i in range(6):
            L.r(2 + i, 8 - i // 2, 1, 3, ala); L.r(17 - i, 8 - i // 2, 1, 3, ala)
        L.p(2, 11, hielo); L.p(17, 11, hielo)
    else:
        L.r(4, 9, 12, 2, ala)
        L.p(9, 6, PAL['noche']); L.p(10, 6, PAL['noche'])
    return contorno(L.im)


guardar(hoja([murcielago(i) for i in range(3)]), 'murcielago.png')  # 40x28


# ---------------------------------------------------------------------------
# Enemigos poseídos por la niebla de Uku: Llama hechizada y Atoq de niebla.
#  - Cuerpo FRÍO (azul lavanda) = poseído; cuerpo CÁLIDO = liberado.
#  - Color ESPECTRAL (verde-cian) reservado para ojos y remolinos de niebla;
#    la niebla va en una capa propia, sin contorno oscuro.
#  - Todos los cuadros de un animal comparten tamaño y línea de suelo.
#  - Miran a la IZQUIERDA (como el Neblino); en el juego se usa setFlipX.
# ---------------------------------------------------------------------------
# --- Señal de posesión (compartida por los dos animales)
ESP = '#7af2c9'       # verde-cian espectral
ESP_O = '#3fb59a'     # espectral oscuro (borde de los remolinos)
ESP_BRILLO = '#d9fff2'

# --- Proyectil (escarcha, mismo lenguaje visual que la esquirla de Uku)
HIELO, HIELO_O = '#9fe3ff', '#5fa8d6'


class Capa(Lienzo):
    """Lienzo con margen: las coordenadas del dibujo son locales al animal."""

    def __init__(self, w, h, mx, my):
        super().__init__(w + mx, h + my)
        self.mx, self.my = mx, my

    def p(self, x, y, c):
        super().p(x + self.mx, y + self.my, c)


def fundir(cuerpo, niebla, alfa=225):
    """Contorno solo al cuerpo; la niebla se superpone semitransparente y con borde espectral."""
    base = contorno(cuerpo.im)
    nb = contorno(niebla.im, ESP_O)
    px = nb.load()
    for x in range(nb.width):
        for y in range(nb.height):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (r, g, b, alfa)
    base.alpha_composite(nb)
    return base


def remolino(N, x, y, tam=1, c=ESP):
    """Voluta de niebla pequeña (forma de 'S' tumbada)."""
    if tam == 0:
        N.r(x, y, 2, 1, c)
        return
    N.r(x + 1, y, 2, 1, c)
    N.r(x, y + 1, 1, 1, c); N.r(x + 3, y + 1, 1, 1, c)
    N.r(x + 1, y + 2, 2, 1, c)
    N.p(x + 2, y + 1, ESP_BRILLO)


def particula(N, x, y, c=ESP):
    N.r(x, y, 2, 2, c)


# ===========================================================================
# LLAMA HECHIZADA — cuadro de 32x32 (64x64 en el juego), suelo en la fila 31
# 0-1 quieta · 2 inflada (aviso) · 3 escupe · 4 liberándose · 5 liberada
# ===========================================================================
LL_W, LL_H, LL_MX, LL_MY = 26, 28, 6, 4
LL_FRIO = ('#a3b0e6', '#7381c2', '#4c5592', '#c9d2f5')    # cuerpo, sombra, oscuro, claro
LL_CALIDO = (PAL['lana'], '#dcc39c', '#9c7a52', '#fff7e8')


def llama(cuadro):
    C = Capa(LL_W, LL_H, LL_MX, LL_MY)
    N = Capa(LL_W, LL_H, LL_MX, LL_MY)
    libre = cuadro == 5
    c, s, o, cl = LL_CALIDO if libre else LL_FRIO

    # Postura de la cabeza según el estado
    hx, hy = {0: (0, 0), 1: (0, 1), 2: (0, 1), 3: (-2, 1), 4: (0, -1), 5: (0, -2)}[cuadro]

    # --- Patas (suelo fijo: pezuñas en la fila 27)
    patas = [(9, c, True), (12, s, False), (18, c, True), (21, s, False)]
    for x, col, cerca in patas:
        if libre and x == 9:          # liberada: levanta la pata delantera (paso alegre)
            C.r(9, 22, 2, 2, col); C.r(8, 23, 2, 2, col); C.r(7, 25, 2, 1, o)
            continue
        C.r(x, 22, 2, 5, col)
        C.r(x, 27, 2, 1, o)

    # --- Cuerpo lanudo
    C.r(10, 16, 12, 1, c)
    for x in (11, 14, 17, 20):
        C.p(x, 15, c)                 # bultitos de lana en el lomo
    C.r(8, 17, 16, 4, c)
    C.r(9, 21, 14, 1, s)
    C.r(9, 18, 1, 2, cl)              # pecho claro
    # cola: alta y contenta si está libre, caída si está poseída
    if libre:
        C.r(23, 13, 2, 3, c); C.p(24, 12, c)
    else:
        C.r(24, 17, 1, 3, s); C.p(23, 17, c)

    # --- Manta tejida (textil andino)
    C.r(12, 16, 8, 1, PAL['grana'])
    C.r(12, 17, 8, 1, PAL['oro'])
    for x in (13, 15, 17, 19):
        C.p(x, 17, PAL['grana2'])
    C.r(12, 18, 8, 1, PAL['turquesa'])
    for x in (12, 14, 16, 18):
        C.p(x, 19, PAL['grana'])      # flecos

    # --- Cuello largo (se separa de la cabeza con la sombra de la mandíbula)
    cuello_arriba = 8 + hy
    C.r(8 + max(hx, -1), cuello_arriba, 4, 17 - cuello_arriba, c)
    C.r(11 + max(hx, -1), cuello_arriba + 1, 1, 16 - cuello_arriba, s)
    if hx < 0:                        # cuello inclinado hacia delante
        C.r(8 + hx, cuello_arriba, 3, 3, c)

    # --- Cabeza: óvalo horizontal con hocico corto y nariz pequeña
    X, Y = hx, hy
    C.r(5 + X, 4 + Y, 6, 1, c)
    C.r(3 + X, 5 + Y, 8, 1, c)
    C.r(2 + X, 6 + Y, 9, 1, c)
    C.r(2 + X, 7 + Y, 8, 1, c)
    C.r(4 + X, 8 + Y, 5, 1, s)        # mandíbula en sombra: marca dónde acaba la cabeza
    C.p(2 + X, 6 + Y, o)              # nariz
    C.p(9 + X, 7 + Y, s)
    # orejas altas en forma de banana
    C.r(5 + X, 1 + Y, 2, 3, c); C.p(6 + X, 0 + Y, c)
    C.r(9 + X, 1 + Y, 2, 3, c); C.p(9 + X, 0 + Y, c)
    C.p(6 + X, 2 + Y, s); C.p(9 + X, 2 + Y, s)          # interior de la oreja
    C.r(7 + X, 3 + Y, 2, 1, cl)                          # copete de lana
    C.p(4 + X, 2 + Y, PAL['grana']); C.p(4 + X, 3 + Y, PAL['grana2'])   # borlas
    C.p(11 + X, 2 + Y, PAL['turquesa']); C.p(11 + X, 3 + Y, PAL['turq2'])

    # --- Ojos y boca (la expresión cuenta el estado)
    ex, ey = 5 + X, 5 + Y
    if cuadro in (0, 1):              # poseída: ojo luminoso y ceja enojada
        C.r(ex, ey, 2, 1, ESP); C.p(ex, ey, ESP_BRILLO)
        C.p(ex - 1, ey - 1, PAL['noche']); C.p(ex, ey - 1, o)
    elif cuadro == 2:                 # inflada: ojo apretado + cachete enorme
        C.r(ex - 1, ey, 3, 1, PAL['noche'])
        C.p(ex + 1, ey - 1, ESP)
        C.r(0 + X, 6 + Y, 5, 4, c); C.r(1 + X, 10 + Y, 3, 1, c); C.r(-1 + X, 7 + Y, 1, 2, c)
        C.r(0 + X, 7 + Y, 3, 2, cl); C.p(1 + X, 7 + Y, '#ffffff')
        C.p(0 + X, 6 + Y, o)
    elif cuadro == 3:                 # escupe: ojo muy abierto y boca abierta
        C.r(ex, ey, 2, 1, ESP_BRILLO); C.p(ex + 1, ey, ESP)
        C.p(ex - 1, ey - 1, PAL['noche'])
        C.r(2 + X, 7 + Y, 3, 2, PAL['noche'])            # boca abierta
        C.r(3 + X, 9 + Y, 3, 1, s)                       # mandíbula baja
    elif cuadro == 4:                 # liberándose: destello blanco en el ojo
        C.r(ex, ey, 2, 1, '#ffffff')
        C.p(ex - 1, ey - 1, o)
    else:                             # liberada: ojo tranquilo con pestaña y sonrisa
        C.p(ex, ey, PAL['noche']); C.p(ex + 1, ey, o)
        C.p(ex - 1, ey - 1, PAL['noche'])
        C.p(3 + X, 7 + Y, o); C.p(4 + X, 8 + Y, o)

    # --- Capa de niebla espectral (solo mientras está poseída)
    if cuadro in (0, 1):
        d = cuadro                    # los remolinos se desplazan entre cuadros
        remolino(N, 12 + d, 2 - d)
        remolino(N, 15 - d, 12 + d, 0)
        remolino(N, 19 + d, 12 - d)
        N.p(13 - d, 6, ESP)
    elif cuadro == 2:                 # aviso: la niebla se concentra en la cabeza
        remolino(N, 12, 1); remolino(N, 12, 6); remolino(N, 17, 12)
        N.r(-2, 4, 2, 1, ESP)
    elif cuadro == 3:                 # escupe: la niebla sale disparada hacia delante
        N.r(-3, 8, 4, 1, ESP); N.r(-4, 9, 3, 1, ESP_O)
        particula(N, -6, 6); particula(N, -6, 11); N.p(-5, 9, ESP_BRILLO)
        remolino(N, 17, 12, 0)
    elif cuadro == 4:                 # liberándose: la niebla se desprende hacia arriba
        remolino(N, 2, -3); remolino(N, 10, -2); remolino(N, 15, 9); remolino(N, 20, 10)
        particula(N, 7, -4); particula(N, 14, 4); particula(N, 22, 6)
    else:                             # liberada: un par de destellos dorados
        C.p(13, 3, PAL['oro2']); C.p(13, 1, PAL['oro']); C.p(12, 2, PAL['oro']); C.p(14, 2, PAL['oro'])
    return fundir(C, N)


def escupitajo():
    """Proyectil (archivo aparte, 10x8 -> 20x16): bola de escarcha con núcleo blanco y estela."""
    L = Lienzo(10, 8)
    L.r(1, 2, 4, 4, HIELO); L.r(2, 1, 2, 6, HIELO); L.r(0, 3, 6, 2, HIELO)
    L.r(1, 3, 2, 2, '#ffffff')
    L.r(4, 4, 1, 1, HIELO_O)
    L.r(7, 3, 2, 1, HIELO); L.p(8, 5, HIELO_O)
    return contorno(L.im)


# ===========================================================================
# ATOQ DE NIEBLA — cuadro de 32x24 (64x48 en el juego), suelo en la fila 23
# 0-1 patrulla · 2 alerta · 3-4 carga · 5 cansado · 6 liberándose · 7 liberado
# ===========================================================================
AT_W, AT_H, AT_MX, AT_MY = 30, 20, 2, 4
#            cuerpo     sombra     patas/orejas  panza      cola       punta de cola
AT_FRIO = ('#8796cf', '#5e6aa3', '#434a85', '#c3cdf2', '#7280bd', ESP)
AT_CALIDO = ('#de8a4c', '#a85b2c', '#4a2f24', PAL['lana'], '#cf7a3f', '#ffffff')
ROJO = '#ff4d5e'


def atoq(cuadro):
    C = Capa(AT_W, AT_H, AT_MX, AT_MY)
    N = Capa(AT_W, AT_H, AT_MX, AT_MY)
    libre = cuadro == 7
    c, s, pt, pz, cola, punta = AT_CALIDO if libre else AT_FRIO
    SUELO = 19

    # Postura: (desplazamiento de cabeza x, y) e inclinación del cuerpo
    cab = {0: (0, 0), 1: (0, 0), 2: (0, -1), 3: (-2, 3), 4: (-1, 2), 5: (0, 5), 6: (0, -1), 7: (0, -2)}[cuadro]
    hx, hy = cab
    cuerpo_y = {3: 12, 4: 11, 5: 14}.get(cuadro, 10)    # fila superior del lomo

    # --- Patas (la cercana en tono de patas, la lejana en sombra y separada 1 px)
    if cuadro in (0, 1, 2, 6, 7):
        paso = 1 if cuadro == 1 else 0
        for x, lejana in ((8, False), (11, True), (16, False), (19, True)):
            dx = (1 if not lejana else -1) * paso
            col = s if lejana else pt
            C.r(x + dx, cuerpo_y + 4, 2, SUELO - cuerpo_y - 4, col)
            C.r(x + dx, SUELO, 2, 1, PAL['noche'] if not libre else '#2b1b17')
    elif cuadro == 3:                 # galope estirado: patas en diagonal, bien separadas
        C.r(5, 16, 2, 2, pt); C.r(3, 18, 3, 1, pt); C.r(2, SUELO, 3, 1, PAL['noche'])   # delantera
        C.r(9, 16, 2, 2, s); C.r(7, 18, 2, 2, s)
        C.r(19, 16, 2, 2, pt); C.r(21, 18, 2, 1, pt); C.r(22, SUELO, 3, 1, PAL['noche'])  # trasera
        C.r(16, 16, 2, 2, s); C.r(17, 18, 2, 2, s)
    elif cuadro == 4:                 # galope recogido: patas juntas bajo el cuerpo
        C.r(10, 15, 2, 4, pt); C.r(9, SUELO, 3, 1, PAL['noche'])
        C.r(13, 15, 2, 3, s); C.r(13, 18, 2, 2, s)
        C.r(17, 15, 2, 4, pt); C.r(17, SUELO, 3, 1, PAL['noche'])
    else:                             # cansado: echado, patas delanteras estiradas
        C.r(3, 18, 6, 1, pt); C.r(2, SUELO, 6, 1, PAL['noche'])
        C.r(16, 18, 4, 2, s)

    # --- Cuerpo (inclinado hacia delante durante la carga)
    y0 = cuerpo_y
    if cuadro == 3:
        C.r(8, y0 + 1, 12, 3, c); C.r(9, y0, 9, 1, c); C.r(18, y0 - 1, 3, 3, c)
        C.r(9, y0 + 4, 9, 1, s)
    elif cuadro == 4:
        C.r(8, y0 + 1, 11, 3, c); C.r(9, y0, 9, 1, c); C.r(17, y0 - 1, 3, 2, c)
        C.r(9, y0 + 4, 9, 1, s)
    else:
        C.r(9, y0, 10, 1, c)
        C.r(8, y0 + 1, 12, 3, c)
        C.r(9, y0 + 4, 10, 1, pz)     # panza clara

    # --- Cola tupida con punta contrastante
    if cuadro == 2:                   # alerta: erizada
        for i, x in enumerate(range(19, 27)):
            alto = 4 + (i % 2) * 2
            C.r(x, y0 - alto + 2, 1, alto + 1, cola)
        C.r(26, y0 - 4, 2, 4, punta)
    elif cuadro in (3, 4):            # carga: recta hacia atrás
        C.r(20, y0 - 1, 6, 3, cola); C.r(21, y0 - 2, 4, 1, cola); C.r(21, y0 + 2, 4, 1, s)
        C.r(26, y0 - 1, 2, 3, punta)
    elif cuadro == 5:                 # cansado: caída en el suelo
        C.r(19, 17, 7, 2, cola); C.r(20, 16, 4, 1, cola); C.r(26, 17, 2, 2, punta)
    else:                             # patrulla / liberado: alta y esponjosa
        sube = 2 if libre else 0
        C.r(19, y0 - 1 - sube, 2, 3, cola)
        C.r(21, y0 - 4 - sube, 4, 6, cola)
        C.r(20, y0 - 3 - sube, 6, 4, cola)
        C.r(22, y0 + 1 - sube, 3, 1, s)
        C.r(25, y0 - 5 - sube, 2, 3, punta); C.p(26, y0 - 2 - sube, punta)

    # --- Cabeza: cráneo, hocico afilado, mejilla clara
    X, Y = hx, hy
    C.r(5 + X, 6 + Y, 5, 1, c)
    C.r(4 + X, 7 + Y, 6, 1, c)
    C.r(2 + X, 8 + Y, 8, 1, c)
    C.r(0 + X, 9 + Y, 9, 1, pz)                       # hocico largo y fino, blanco abajo
    C.r(3 + X, 10 + Y, 5, 1, pz)
    C.p(0 + X, 8 + Y, PAL['noche']); C.p(-1 + X, 9 + Y, PAL['noche'])   # nariz en la punta
    C.r(1 + X, 8 + Y, 1, 1, c)
    # cuello
    C.r(7 + X // 2, 8 + Y, 4, max(1, y0 - 7 - Y), c)
    # orejas triangulares (erguidas y más altas en alerta, caídas al cansarse)
    alto = {2: 5, 5: 2}.get(cuadro, 4)
    for ox in (5, 8):
        for k in range(alto):
            ancho = 2 if k < alto - 1 else 1
            C.r(ox + X, 5 + Y - k, ancho, 1, pt)
        C.p(ox + X, 5 + Y, s)                        # interior

    # --- Ojos
    ex, ey = 4 + X, 7 + Y
    if cuadro in (0, 1):
        C.r(ex, ey, 2, 1, ESP); C.p(ex, ey, ESP_BRILLO)
    elif cuadro in (2, 3, 4):
        C.r(ex, ey, 2, 1, ROJO); C.p(ex, ey - 1, PAL['noche']); C.p(ex + 1, ey - 1, PAL['noche'])
    elif cuadro == 5:
        C.r(ex, ey, 2, 1, PAL['noche'])
        C.r(0 + X, 10 + Y, 2, 2, PAL['grana'])        # lengua (jadeo)
    elif cuadro == 6:
        C.r(ex, ey, 2, 1, '#ffffff')
    else:                             # liberado: ojo feliz en arco y boca sonriente
        C.p(ex, ey, PAL['noche']); C.p(ex + 1, ey - 1, PAL['noche']); C.p(ex + 2, ey, PAL['noche'])
        C.p(2 + X, 10 + Y, PAL['noche'])

    # --- Niebla espectral
    if cuadro in (0, 1):
        d = cuadro
        remolino(N, 10 + d, 1 - d)
        remolino(N, 14 - d, 6 + d, 0)
        N.p(26, 3 + d, ESP_BRILLO)
    elif cuadro == 2:                 # "!" espectral sobre la cabeza: pausa antes de cargar
        N.r(12, -4, 2, 4, ESP); N.r(12, 1, 2, 2, ESP)
        remolino(N, 16, 5, 0)
    elif cuadro in (3, 4):            # estela detrás
        k = cuadro - 3
        N.r(28, 9 + k, 2, 1, ESP); N.r(26, 14 - k, 3, 1, ESP)
        particula(N, 28 - k, 12)
        remolino(N, 10, 4 + k, 0)
    elif cuadro == 5:                 # niebla débil
        remolino(N, -2, 4, 0); N.p(1, 3, ESP_O)
    elif cuadro == 6:                 # se desprende hacia arriba
        remolino(N, 3, -2); remolino(N, 12, -3); remolino(N, 20, -1)
        particula(N, 9, -4); particula(N, 16, 3); particula(N, 27, -2)
    else:                             # destellos dorados
        C.p(13, 1, PAL['oro2']); C.p(13, 0, PAL['oro']); C.p(12, 1, PAL['oro']); C.p(14, 1, PAL['oro'])
    return fundir(C, N)


guardar(hoja([llama(i) for i in range(6)]), 'llama.png')  # 64x64 por cuadro
guardar(escupitajo(), 'escupitajo.png')  # 20x16
guardar(hoja([atoq(i) for i in range(8)]), 'atoq.png')  # 64x48 por cuadro


# ---------------------------------------------------------------------------
# Uku, Señor de la Niebla (jefe final) 48x48, 4 cuadros
# 0-1 flotando, 2 ataque (ojos rojos), 3 aturdido
# ---------------------------------------------------------------------------
def uku(cuadro):
    L = Lienzo(50, 50)
    base, luz, borde = '#3a3360', '#6c6496', '#241f45'
    off = 1 if cuadro == 1 else 0
    # cuerpo de nube: varios círculos
    nubes = [(25, 26, 15), (14, 30, 10), (36, 30, 10), (19, 18, 9), (31, 18, 9), (25, 36, 10)]
    for (cx, cy, rad) in nubes:
        for x in range(cx - rad, cx + rad + 1):
            for y in range(cy - rad, cy + rad + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad:
                    L.p(x, y + off, base)
    # remolinos claros
    for (cx, cy, rad) in [(18, 24, 4), (33, 33, 4), (27, 15, 3)]:
        for a in range(0, 300, 12):
            ang = math.radians(a)
            rr = rad * a / 300
            L.p(int(cx + rr * math.cos(ang)), int(cy + rr * math.sin(ang)) + off, luz)
    # corona de carámbanos
    for i, x in enumerate(range(15, 36, 4)):
        alto = 7 if i % 2 == 0 else 5
        for k in range(alto):
            L.r(x + k // 3, 10 - k + off, 2 - k // 4, 1, '#9fe3ff')
    # ojos y boca
    if cuadro == 3:  # aturdido: ojos en espiral
        for cx in (19, 31):
            for a in range(0, 540, 30):
                ang = math.radians(a)
                rr = 3 * a / 540
                L.p(int(cx + rr * math.cos(ang)), int(25 + rr * math.sin(ang)), PAL['oro2'])
        L.r(21, 33, 9, 2, borde)
    else:
        ojo = '#ff4b5c' if cuadro == 2 else '#7fe7ff'
        for cx in (19, 31):
            L.r(cx - 3, 23 + off, 6, 4, ojo)
            L.r(cx - 1, 24 + off, 2, 2, PAL['blanco'])
        L.r(16, 21 + off, 7, 1, borde); L.r(28, 21 + off, 7, 1, borde)
        boca_y = 32 + off
        L.r(19, boca_y, 13, 3 if cuadro == 2 else 2, borde)
        for x in range(20, 31, 3):
            L.p(x, boca_y, PAL['blanco'])
    return contorno(L.im)


guardar(hoja([uku(i) for i in range(4)]), 'uku.png')  # 100x100


# ---------------------------------------------------------------------------
# Fragmento de sol (12x12, 6 cuadros de giro)
# ---------------------------------------------------------------------------
def fragmento(cuadro):
    L = Lienzo(14, 14)
    escala = abs(math.cos(cuadro / 6 * math.pi))
    ancho = max(1, int(5 * escala))
    for y in range(2, 12):
        mitad = int(ancho * (1 - abs(y - 7) / 5.5)) + 1
        L.r(7 - mitad, y, mitad * 2, 1, PAL['oro'])
    L.r(6, 4, 1, 3, PAL['oro2'])
    L.p(7, 1, PAL['oro2']); L.p(7, 12, PAL['oro2'])
    return contorno(L.im, '#7a4a00')


guardar(hoja([fragmento(i) for i in range(6)]), 'fragmento.png')  # 28x28


# Corazón (12x11, 2 cuadros: lleno y vacío) para HUD y recolectable
def corazon(lleno):
    L = Lienzo(13, 12)
    forma = ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"]
    c = PAL['grana'] if lleno else '#4a4060'
    for j, fila in enumerate(forma):
        for i, v in enumerate(fila):
            if v == '1':
                L.r(i * 2 - 1 + 1, j * 2, 2, 2, c)
    if lleno:
        L.r(2, 2, 2, 2, '#ff8a8a')
    return contorno(L.im)


guardar(hoja([corazon(True), corazon(False)]), 'corazon.png')  # 26x24


# Apacheta (montículo de piedras) como punto de control: apagada / encendida
def apacheta(encendida):
    L = Lienzo(18, 26)
    piedras = [(3, 21, 12, 4, '#8a8a9a'), (4, 17, 10, 4, '#a3a3b5'), (5, 13, 8, 4, '#8a8a9a'), (6, 9, 6, 4, '#a3a3b5')]
    for (x, y, w, h, c) in piedras:
        L.r(x, y, w, h, c)
        L.r(x, y + h - 1, w, 1, '#62627a')
    if encendida:
        for k, c in enumerate([PAL['grana'], PAL['oro'], PAL['oro2']]):
            L.r(7 + k // 2, 3 + k * 2, 4 - k, 6 - k * 2, c)
        L.p(9, 1, PAL['oro2'])
    else:
        L.r(8, 6, 2, 3, '#62627a')
    return contorno(L.im)


guardar(hoja([apacheta(False), apacheta(True)]), 'apacheta.png')  # 36x52


# Flor de puya como resorte (16x16): normal / comprimida
def puya(comprimida):
    L = Lienzo(18, 16)
    tallo_y = 9 if comprimida else 5
    L.r(8, tallo_y, 2, 15 - tallo_y, '#2e7d32')
    for i in range(5):
        L.r(3 + i, 15 - i, 1, i + 1, '#4caf50'); L.r(14 - i, 15 - i, 1, i + 1, '#4caf50')
    cab = 4 if comprimida else 2
    L.r(4, tallo_y - cab, 10, cab + 1, PAL['turquesa'])
    L.r(5, tallo_y - cab - 1, 8, 1, PAL['oro'])
    return contorno(L.im)


guardar(hoja([puya(False), puya(True)]), 'puya.png')  # 36x32


# Púas de hielo (16x16)
def puas():
    L = Lienzo(16, 16)
    for base_x in (1, 6, 11):
        for k in range(10):
            ancho = max(1, 4 - k // 3)
            L.r(base_x + (4 - ancho) // 2, 15 - k, ancho, 1, '#9fe3ff' if k > 5 else '#5fa8d3')
    return contorno(L.im)


guardar(puas(), 'puas.png')  # 32x32


# Puerta del Sol (meta de cada nivel) 32x48, 2 cuadros
def puerta(activa):
    L = Lienzo(34, 48)
    piedra, sombra = '#8f8173', '#5f5448'
    L.r(1, 6, 32, 6, piedra)
    L.r(3, 12, 7, 36, piedra); L.r(24, 12, 7, 36, piedra)
    L.r(1, 11, 32, 1, sombra)
    for x in range(3, 31, 4):  # friso escalonado (chakana)
        L.r(x, 7, 2, 2, sombra); L.r(x + 1, 9, 2, 1, sombra)
    sol = PAL['oro'] if activa else '#6a6a7a'
    for x in range(10, 25):
        for y in range(0, 14):
            if (x - 17) ** 2 + (y - 7) ** 2 <= 20:
                L.p(x, y, sol)
    if activa:
        L.r(10, 12, 14, 36, '#ffe27a')
        L.r(12, 14, 10, 34, '#fff3c4')
    else:
        L.r(10, 12, 14, 36, '#2a2340')
    return contorno(L.im)


guardar(hoja([puerta(False), puerta(True)]), 'puerta.png')  # 68x96


# Esquirla de hielo (proyectil del jefe) 8x16
def esquirla():
    L = Lienzo(10, 16)
    for k in range(14):
        ancho = max(1, 6 - abs(k - 4))
        L.r(5 - ancho // 2, k, ancho, 1, '#9fe3ff' if k < 6 else '#5fa8d3')
    L.p(4, 2, PAL['blanco'])
    return contorno(L.im)


guardar(esquirla(), 'esquirla.png')  # 20x32


# Plataforma móvil: losa con borde dorado 48x12
def losa():
    L = Lienzo(48, 12)
    L.r(0, 0, 48, 12, '#6b5d8f')
    L.r(0, 0, 48, 2, PAL['oro'])
    L.r(0, 10, 48, 2, '#463a66')
    for x in range(4, 44, 8):
        L.r(x, 4, 4, 4, '#8577b0')
    return L.im


guardar(losa(), 'losa.png')  # 96x24


# Partículas: punto y estrella
L = Lienzo(4, 4); L.r(0, 0, 4, 4, PAL['blanco']); guardar(L.im, 'particula.png')
L = Lienzo(7, 7)
for i in range(7):
    L.p(3, i, PAL['oro2']); L.p(i, 3, PAL['oro2'])
L.p(2, 2, PAL['oro']); L.p(4, 4, PAL['oro']); L.p(2, 4, PAL['oro']); L.p(4, 2, PAL['oro'])
guardar(L.im, 'estrella.png')


# ---------------------------------------------------------------------------
# Tileset: 3 temas x 4 baldosas (superficie, relleno, plataforma, bloque)
# Cada baldosa 16x16 -> 32x32
# ---------------------------------------------------------------------------
TEMAS = {
    'valle': dict(sup='#4caf50', sup2='#2e7d32', rel='#8d5a3b', rel2='#6d4129', pla='#a0703c', pla2='#6d4a26', blo='#8a8a9a', blo2='#5f5f72'),
    'hielo': dict(sup='#e8f4ff', sup2='#9fc6ea', rel='#5b7fa6', rel2='#3f5f85', pla='#9fd3f2', pla2='#5fa8d3', blo='#6b8db5', blo2='#46668f'),
    'crater': dict(sup='#ff7043', sup2='#c2410c', rel='#4a2b3a', rel2='#2e1a26', pla='#5c3a5c', pla2='#3a2240', blo='#6a4a5a', blo2='#44303c'),
}


def baldosa(tema, tipo):
    c = TEMAS[tema]
    L = Lienzo(16, 16)
    rnd = random.Random(hash((tema, tipo)) & 0xffff)
    if tipo in ('sup', 'rel'):
        L.r(0, 0, 16, 16, c['rel'])
        for _ in range(10):
            L.r(rnd.randrange(16), rnd.randrange(16), 2, 1, c['rel2'])
        if tipo == 'sup':
            L.r(0, 0, 16, 4, c['sup'])
            for x in range(0, 16, 2):
                L.p(x, 4 + (x // 2) % 2, c['sup2'])
            L.r(0, 3, 16, 1, c['sup2'])
    elif tipo == 'pla':
        L.r(0, 0, 16, 6, c['pla'])
        L.r(0, 5, 16, 1, c['pla2'])
        for x in (0, 8):
            L.r(x, 0, 1, 6, c['pla2'])
        L.r(2, 6, 2, 3, c['pla2']); L.r(12, 6, 2, 3, c['pla2'])
    else:
        L.r(0, 0, 16, 16, c['blo'])
        L.r(0, 7, 16, 1, c['blo2']); L.r(0, 15, 16, 1, c['blo2'])
        L.r(7, 0, 1, 7, c['blo2']); L.r(3, 8, 1, 7, c['blo2']); L.r(12, 8, 1, 7, c['blo2'])
    return L.im


tiles = []
for tema in ('valle', 'hielo', 'crater'):
    for tipo in ('sup', 'rel', 'pla', 'blo'):
        tiles.append(baldosa(tema, tipo))
guardar(hoja(tiles), 'tileset.png')  # 384x32, 12 baldosas de 32


# ---------------------------------------------------------------------------
# Fondos con paralaje (960x540, repetibles en horizontal)
# ---------------------------------------------------------------------------
W, H = 960, 540


def degradado(arriba, abajo):
    im = Image.new('RGBA', (W, H))
    d = ImageDraw.Draw(im)
    a, b = hexa(arriba), hexa(abajo)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,))
    return im


def silueta(color, base, amplitud, armonicos, semilla, picos_nieve=None):
    """Montañas periódicas en W para que el tileSprite no tenga cortes."""
    im = Image.new('RGBA', (W, H), T)
    d = ImageDraw.Draw(im)
    rnd = random.Random(semilla)
    fases = [rnd.random() * 2 * math.pi for _ in armonicos]
    puntos = []
    for x in range(W + 1):
        y = base
        for (k, amp), f in zip(armonicos, fases):
            y -= amplitud * amp * math.sin(2 * math.pi * k * x / W + f)
        puntos.append((x, y))
    d.polygon(puntos + [(W, H), (0, H)], fill=hexa(color))
    if picos_nieve:
        for x, y in puntos:
            if y < picos_nieve:
                d.line([(x, y), (x, min(picos_nieve, y + 14))], fill=hexa('#eef4ff'))
    return im


def fondo_valle():
    cielo = degradado('#f7a76c', '#fde7b0')
    d = ImageDraw.Draw(cielo)
    d.ellipse([620, 120, 760, 260], fill=hexa('#ffe27a'))  # sol del atardecer (tenue)
    lejos = silueta('#9c7ab0', 330, 90, [(2, 1.0), (5, 0.45), (9, 0.2)], 1, picos_nieve=270)
    cerca = silueta('#4b7f52', 430, 50, [(3, 1.0), (7, 0.4), (13, 0.15)], 2)
    # pequeños árboles de queñua sobre las colinas cercanas
    dc = ImageDraw.Draw(cerca)
    for x in range(20, W, 75):
        col = cerca.getpixel((x, H - 1))
        y = next(yy for yy in range(H) if cerca.getpixel((x, yy))[3] > 0)
        dc.rectangle([x, y - 18, x + 3, y], fill=hexa('#5a3d2b'))
        dc.ellipse([x - 9, y - 34, x + 12, y - 14], fill=hexa('#2f5d38'))
    return cielo, lejos, cerca


def fondo_hielo():
    cielo = degradado('#0f1d3d', '#2d4f7c')
    d = ImageDraw.Draw(cielo)
    rnd = random.Random(3)
    for _ in range(70):  # cristales brillando en la roca
        x, y = rnd.randrange(W), rnd.randrange(H)
        d.rectangle([x, y, x + 1, y + 1], fill=hexa('#9fe3ff', 180))
    lejos = Image.new('RGBA', (W, H), T)
    dl = ImageDraw.Draw(lejos)
    for i in range(0, W, 48):  # estalactitas
        largo = 60 + int(50 * (0.5 + 0.5 * math.sin(i * 0.11)))
        dl.polygon([(i, 0), (i + 40, 0), (i + 20, largo)], fill=hexa('#3f5f85'))
    for i in range(16, W, 64):  # segunda hilera de estalactitas, más clara
        dl.polygon([(i, 0), (i + 28, 0), (i + 14, 40 + (i * 7) % 50)], fill=hexa('#2d4f7c'))
    cerca = silueta('#24406a', 440, 45, [(4, 1.0), (9, 0.35)], 4)
    return cielo, lejos, cerca


def fondo_crater():
    cielo = degradado('#2a0f2e', '#7a2235')
    d = ImageDraw.Draw(cielo)
    rnd = random.Random(5)
    for _ in range(90):  # estrellas tras la niebla
        x, y = rnd.randrange(W), rnd.randrange(300)
        d.point((x, y), fill=hexa('#ffd6e0'))
    lejos = silueta('#4a1f3d', 320, 110, [(1, 1.0), (4, 0.3), (8, 0.15)], 6)
    cerca = silueta('#2e1a26', 450, 40, [(5, 1.0), (11, 0.3)], 7)
    dc = ImageDraw.Draw(cerca)
    for x in range(0, W, 40):  # grietas de lava
        y = next(yy for yy in range(H) if cerca.getpixel((x, yy))[3] > 0)
        dc.line([(x, y + 8), (x + 12, y + 30), (x + 6, y + 60)], fill=hexa('#ff7043'), width=2)
    return cielo, lejos, cerca


# Optimización: las capas 1 y 2 se recortan a la franja que tiene píxeles visibles.
# Así la GPU no pinta miles de píxeles transparentes en cada fotograma.
# La posición vertical de cada capa recortada se guarda en fondos.json.
import json
posiciones = {}
for nombre, fn in (('valle', fondo_valle), ('hielo', fondo_hielo), ('crater', fondo_crater)):
    capas = fn()
    for i, capa in enumerate(capas):
        clave = f'fondo_{nombre}_{i}'
        y0 = 0
        if i > 0:
            caja = capa.getbbox()
            if caja:
                y0, y1 = caja[1], caja[3]
                capa = capa.crop((0, y0, W, y1))
        posiciones[clave] = {'y': y0, 'alto': capa.height}
        capa.save(os.path.join(IMG, clave + '.png'))
with open(os.path.join(IMG, 'fondos.json'), 'w', encoding='utf-8') as fh:
    json.dump(posiciones, fh, indent=1)


# Niebla: capa semitransparente repetible
niebla = Image.new('RGBA', (W, 200), T)
dn = ImageDraw.Draw(niebla)
for i in range(18):
    x = (i * 137) % W
    dn.ellipse([x - 120, 60 + (i * 31) % 80, x + 120, 160 + (i * 31) % 80], fill=(230, 238, 248, 38))
niebla = niebla.filter(ImageFilter.GaussianBlur(14))
# repetir bordes para que sea continuo
mitad = niebla.crop((0, 0, W // 2, 200))
niebla.alpha_composite(Image.new('RGBA', (W, 200), T))
niebla.save(os.path.join(IMG, 'niebla.png'))


# ---------------------------------------------------------------------------
# Iconos de interfaz (12x12 -> 24x24... ampliado a 48 para pantallas táctiles)
# 0 pausa, 1 sonido, 2 silencio, 3 izquierda, 4 derecha, 5 saltar, 6 pantalla completa, 7 dash
# ---------------------------------------------------------------------------
def icono(tipo):
    L = Lienzo(12, 12)
    c = PAL['lana']
    if tipo == 0:
        L.r(3, 2, 2, 8, c); L.r(7, 2, 2, 8, c)
    elif tipo in (1, 2):
        L.r(1, 4, 3, 4, c)
        for k in range(4):
            L.r(4 + k, 4 - k, 1, 4 + 2 * k, c)
        if tipo == 1:
            L.r(9, 4, 1, 4, c); L.r(11, 2, 1, 8, c)
        else:
            for k in range(4):
                L.p(8 + k, 4 + k, PAL['grana']); L.p(11 - k, 4 + k, PAL['grana'])
    elif tipo in (3, 4):
        for k in range(5):
            x = 2 + k if tipo == 3 else 9 - k
            L.r(x, 6 - k, 1, 1 + 2 * k, c)
        L.r(5 if tipo == 3 else 2, 5, 5, 2, c)
    elif tipo == 5:
        for k in range(5):
            L.r(6 - k, 2 + k, 1 + 2 * k - 1 if k else 1, 1, c)
            L.r(5 - k, 2 + k, 2 + 2 * k, 1, c)
        L.r(4, 7, 4, 3, c)
    elif tipo == 6:
        for (x, y) in ((1, 1), (8, 1), (1, 8), (8, 8)):
            L.r(x, y, 3, 1, c); L.r(x if x == 1 else x + 2, y, 1, 3, c)
        L.r(1, 10, 3, 1, c); L.r(8, 10, 3, 1, c)
    elif tipo == 7:
        # dash: doble flecha ">>"
        for x0 in (1, 6):
            for k in range(4):
                L.r(x0 + k, 2 + k, 2, 1, c)
                L.r(x0 + k, 9 - k, 2, 1, c)
    return contorno(L.im)


guardar(hoja([icono(i) for i in range(8)]), 'iconos.png', k=4)  # cuadros 48x48


# ---------------------------------------------------------------------------
# Logotipo del título con fuente pixelada
# ---------------------------------------------------------------------------
fuente_titulo = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
fuente_sub = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 12)
logo = Image.new('RGBA', (250, 60), T)
dl = ImageDraw.Draw(logo)
dl.fontmode = '1'
tw = dl.textlength('KUSI', font=fuente_titulo)
for dx, dy in ((2, 2), (1, 2), (2, 1)):
    dl.text(((250 - tw) / 2 + dx, 2 + dy), 'KUSI', font=fuente_titulo, fill=hexa(PAL['grana2']))
dl.text(((250 - tw) / 2, 2), 'KUSI', font=fuente_titulo, fill=hexa(PAL['oro']))
sw_ = dl.textlength('y los Fragmentos del Sol', font=fuente_sub)
dl.text(((250 - sw_) / 2 + 1, 37), 'y los Fragmentos del Sol', font=fuente_sub, fill=hexa(PAL['noche']))
dl.text(((250 - sw_) / 2, 36), 'y los Fragmentos del Sol', font=fuente_sub, fill=hexa(PAL['lana']))
# franja textil escalonada bajo el título
for x in range(20, 230, 6):
    dl.rectangle([x, 54, x + 2, 56], fill=hexa(PAL['turquesa']))
    dl.rectangle([x + 3, 52, x + 5, 54], fill=hexa(PAL['grana']))
logo = contorno(logo)
ampliar(logo, 3).save(os.path.join(IMG, 'logo.png'))  # 750x180


# ---------------------------------------------------------------------------
# Fuente bitmap (formato BMFont XML) a partir de DejaVu Sans Bold 12 px
# sin suavizado, con contorno oscuro, ampliada x2.
# ---------------------------------------------------------------------------
def fuente_bitmap():
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 12)
    chars = [chr(c) for c in range(32, 127)] + list('áéíóúÁÉÍÓÚñÑüÜ¡¿·—“”‘’…×☀')
    ascent, descent = f.getmetrics()
    alto_linea = ascent + descent + 2
    glifos = []
    for ch in chars:
        try:
            ancho = int(math.ceil(f.getlength(ch)))
        except Exception:
            continue
        if ch == '☀':
            ancho = 11
        im = Image.new('RGBA', (ancho + 2, alto_linea), T)
        d = ImageDraw.Draw(im)
        d.fontmode = '1'
        if ch == '☀':  # dibujado a mano: sol pequeño
            for a in range(0, 360, 45):
                x = 6 + 5 * math.cos(math.radians(a)); y = 7 + 5 * math.sin(math.radians(a))
                d.point((x, y), fill=hexa(PAL['blanco']))
            d.ellipse([3, 4, 9, 10], fill=hexa(PAL['blanco']))
        else:
            d.text((1, 1), ch, font=f, fill=hexa(PAL['blanco']))
        im = contorno(im, '#120e26')
        glifos.append((ch, im, ancho))
    # empaquetado en filas
    ancho_atlas = 256
    x = y = 0
    fila_alto = alto_linea
    pos = []
    for ch, im, av in glifos:
        if x + im.width > ancho_atlas:
            x = 0
            y += fila_alto + 1
        pos.append((ch, x, y, im, av))
        x += im.width + 1
    alto_atlas = y + fila_alto + 1
    atlas = Image.new('RGBA', (ancho_atlas, alto_atlas), T)
    for ch, x, y, im, av in pos:
        atlas.paste(im, (x, y))
    k = 2
    ampliar(atlas, k).save(os.path.join(FONTS, 'pixel.png'))
    lineas = [
        '<?xml version="1.0"?>', '<font>',
        f'  <info face="pixel" size="{12 * k}" bold="1" italic="0" charset="" unicode="1" stretchH="100" smooth="0" aa="1" padding="0,0,0,0" spacing="0,0"/>',
        f'  <common lineHeight="{alto_linea * k}" base="{(ascent + 1) * k}" scaleW="{ancho_atlas * k}" scaleH="{alto_atlas * k}" pages="1" packed="0"/>',
        '  <pages><page id="0" file="pixel.png"/></pages>',
        f'  <chars count="{len(pos)}">',
    ]
    for ch, x, y, im, av in pos:
        lineas.append(f'    <char id="{ord(ch)}" x="{x * k}" y="{y * k}" width="{im.width * k}" height="{im.height * k}" xoffset="{-1 * k}" yoffset="0" xadvance="{av * k}" page="0" chnl="15"/>')
    lineas += ['  </chars>', '</font>']
    with open(os.path.join(FONTS, 'pixel.xml'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lineas))


fuente_bitmap()


# ---------------------------------------------------------------------------
# Iconos PWA (192 y 512) con Kusi sobre el sol
# ---------------------------------------------------------------------------
for tam in (192, 512):
    ic = Image.new('RGBA', (tam, tam), hexa(PAL['noche']))
    d = ImageDraw.Draw(ic)
    m = tam // 8
    d.ellipse([m, m, tam - m, tam - m], fill=hexa(PAL['oro']))
    sprite = frames_kusi[0]
    esc = (tam // 2) // sprite.height
    sp = sprite.resize((sprite.width * esc, sprite.height * esc), Image.NEAREST)
    ic.alpha_composite(sp, ((tam - sp.width) // 2, (tam - sp.height) // 2 + tam // 16))
    ic.save(os.path.join(ICONS, f'icon-{tam}.png'))

print('Imágenes generadas en', IMG)
