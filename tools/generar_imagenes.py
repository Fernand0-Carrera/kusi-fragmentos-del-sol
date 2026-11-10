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
