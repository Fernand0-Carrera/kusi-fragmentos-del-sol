"""
Generador de audio original para "Kusi y los Fragmentos del Sol".

Sintetiza con numpy tres pistas de música en bucle (menú, nivel y jefe),
dos jingles y los efectos de sonido. La música usa la escala pentatónica
menor (La-Do-Re-Mi-Sol), base de muchas melodías andinas, y un ritmo de
huayno (corchea + dos semicorcheas).

Uso:  python3 tools/generar_audio.py   (requiere numpy y ffmpeg)
Salida: public/assets/audio/*.ogg y *.mp3
"""
import os
import subprocess
import wave

import numpy as np

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, 'public', 'assets', 'audio')
TMP = os.path.join(RAIZ, 'tools', '_tmp_audio')
os.makedirs(SALIDA, exist_ok=True)
os.makedirs(TMP, exist_ok=True)

SR = 22050  # frecuencia de muestreo: suficiente para chiptune y archivos ligeros
rng = np.random.default_rng(42)

NOTAS = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def freq(nota):
    """'A4' -> 440 Hz."""
    nombre, octava = nota[:-1], int(nota[-1])
    n = NOTAS[nombre] + (octava + 1) * 12
    return 440.0 * 2 ** ((n - 69) / 12)


# ---------------------------------------------------------------- osciladores
def t_de(dur):
    return np.arange(int(SR * dur)) / SR


def cuadrada(f, dur, ciclo=0.5):
    t = t_de(dur)
    return np.where((t * f) % 1 < ciclo, 1.0, -1.0)


def triangular(f, dur, vibrato=0.0):
    t = t_de(dur)
    fase = f * t + (vibrato * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 3, 0, 1)) / (2 * np.pi) * 6
    return 2 * np.abs(2 * (fase % 1) - 1) - 1


def ruido(dur):
    return rng.uniform(-1, 1, int(SR * dur))


def envolvente(n, ataque=0.005, caida=0.1, sostenido=0.6, liberacion=0.05):
    """ADSR simple sobre n muestras."""
    env = np.ones(n) * sostenido
    a = int(SR * ataque); d = int(SR * caida); r = int(SR * liberacion)
    a = min(a, n); env[:a] = np.linspace(0, 1, a)
    d = min(d, n - a); env[a:a + d] = np.linspace(1, sostenido, d)
    r = min(r, n); env[n - r:] *= np.linspace(1, 0, r)
    return env


def decaimiento(n, tau):
    return np.exp(-np.arange(n) / (SR * tau))


def mezclar(pista, sonido, inicio):
    i = int(inicio * SR)
    fin = min(len(pista), i + len(sonido))
    pista[i:fin] += sonido[:fin - i]


# ---------------------------------------------------------------- instrumentos
def quena(nota, dur):
    s = triangular(freq(nota), dur, vibrato=0.35) * 0.8 + ruido(dur) * 0.03
    return s * envolvente(len(s), 0.04, 0.15, 0.75, min(0.12, dur / 3))


def lider_cuadrado(nota, dur):
    s = cuadrada(freq(nota), dur, 0.5)
    return s * envolvente(len(s), 0.003, 0.08, 0.45, min(0.05, dur / 4)) * 0.6


def charango(nota, dur):
    s = cuadrada(freq(nota), dur, 0.25) * 0.5 + cuadrada(freq(nota) * 2.003, dur, 0.5) * 0.2
    return s * decaimiento(len(s), 0.12)


def bajo(nota, dur):
    s = triangular(freq(nota), dur)
    return s * envolvente(len(s), 0.005, 0.1, 0.7, 0.03) * 0.9


def bombo(dur=0.18):
    t = t_de(dur)
    f = 120 * np.exp(-t * 25) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * decaimiento(len(t), 0.06)


def caja(dur=0.15):
    return (ruido(dur) * 0.7 + cuadrada(190, dur) * 0.2) * decaimiento(int(SR * dur), 0.04)


def platillo(dur=0.05):
    r = ruido(dur)
    r = np.diff(np.concatenate([[0], r]))  # filtro paso alto barato
    return r * decaimiento(len(r), 0.015) * 0.5


# ---------------------------------------------------------------- secuenciador
def secuencia(pista, notas, bpm, instrumento, vol=1.0, desde=0.0):
    """notas: lista de (nota|None, beats). Devuelve el tiempo final en segundos."""
    spb = 60 / bpm
    t = desde
    for nota, beats in notas:
        dur = beats * spb
        if nota:
            mezclar(pista, instrumento(nota, dur * 0.95) * vol, t)
        t += dur
    return t


def acordes_arpegio(pista, acordes, bpm, compases_beats=4, vol=0.35):
    spb = 60 / bpm
    for i, acorde in enumerate(acordes):
        for k in range(compases_beats * 2):
            nota = acorde[k % len(acorde)]
            mezclar(pista, charango(nota, spb * 0.5) * vol, (i * compases_beats + k * 0.5) * spb)


def bateria(pista, compases, bpm, patron='rock', vol=0.6):
    spb = 60 / bpm
    for c in range(compases):
        base = c * 4 * spb
        for b in range(4):
            if patron == 'rock':
                if b in (0, 2):
                    mezclar(pista, bombo() * vol, base + b * spb)
                if b in (1, 3):
                    mezclar(pista, caja() * vol * 0.6, base + b * spb)
            elif patron == 'huayno':
                mezclar(pista, bombo() * vol, base + b * spb)
                if b in (1, 3):
                    mezclar(pista, caja() * vol * 0.5, base + (b + 0.5) * spb)
            elif patron == 'jefe':
                mezclar(pista, bombo() * vol, base + b * spb)
                mezclar(pista, bombo() * vol * 0.7, base + (b + 0.75) * spb)
                if b in (1, 3):
                    mezclar(pista, caja() * vol * 0.7, base + b * spb)
            for s in range(2):
                mezclar(pista, platillo() * vol * 0.6, base + (b + s * 0.5) * spb)


def nueva_pista(beats, bpm):
    return np.zeros(int(SR * beats * 60 / bpm) + 1)


def normalizar(s, pico=0.85):
    m = np.max(np.abs(s))
    return s if m == 0 else s / m * pico


# ---------------------------------------------------------------- música
def musica_menu():
    bpm = 84
    p = nueva_pista(32, bpm)
    melodia = [
        ('E5', 1.5), ('D5', .5), ('C5', 1), ('A4', 1),
        ('G4', 1), ('A4', 1), ('C5', 2),
        ('D5', 1.5), ('E5', .5), ('G5', 1), ('E5', 1),
        ('D5', 2), ('C5', 1), ('D5', 1),
        ('E5', 1.5), ('G5', .5), ('A5', 1), ('G5', 1),
        ('E5', 1), ('D5', 1), ('C5', 2),
        ('D5', 1), ('C5', 1), ('A4', 1), ('G4', 1),
        ('A4', 3.5), (None, .5),
    ]
    secuencia(p, melodia, bpm, quena, 0.55)
    acordes = [['A3', 'C4', 'E4', 'A4'], ['A3', 'C4', 'E4', 'A4'], ['G3', 'D4', 'G4', 'B4'], ['G3', 'D4', 'G4', 'B4'],
               ['C4', 'E4', 'G4', 'C5'], ['A3', 'C4', 'E4', 'A4'], ['G3', 'D4', 'G4', 'B4'], ['A3', 'C4', 'E4', 'A4']]
    acordes_arpegio(p, acordes, bpm, vol=0.22)
    raices = ['A2', 'A2', 'G2', 'G2', 'C3', 'A2', 'G2', 'A2']
    secuencia(p, [(r, 4) for r in raices], bpm, bajo, 0.35)
    return normalizar(p, 0.7)


def musica_nivel():
    bpm = 132
    p = nueva_pista(64, bpm)
    a = [
        ('A4', .5), ('C5', .25), ('D5', .25), ('E5', .5), ('E5', .5), ('D5', .5), ('C5', .5), ('A4', 1),
        ('G4', .5), ('A4', .25), ('C5', .25), ('D5', .5), ('C5', .5), ('A4', 2),
        ('E5', .5), ('G5', .25), ('A5', .25), ('G5', .5), ('E5', .5), ('D5', .5), ('E5', .5), ('G5', 1),
        ('E5', .5), ('D5', .5), ('C5', .5), ('D5', .5), ('E5', 2),
    ]
    b = [
        ('A5', .5), ('G5', .25), ('E5', .25), ('G5', .5), ('A5', .5), ('G5', .5), ('E5', .5), ('D5', 1),
        ('E5', .5), ('D5', .25), ('C5', .25), ('D5', .5), ('E5', .5), ('C5', .5), ('A4', .5), ('G4', 1),
        ('A4', .5), ('C5', .25), ('D5', .25), ('E5', .5), ('G5', .5), ('E5', .5), ('D5', .5), ('C5', 1),
        ('A4', 2), ('A4', .5), ('C5', .5), ('E5', 1),
    ]
    secuencia(p, a + b + a + b, bpm, lider_cuadrado, 0.5)
    raices = ['A2', 'G2', 'A2', 'C3', 'A2', 'G2', 'A2', 'A2'] * 2
    linea = []
    for r in raices:  # bajo de huayno: raíz larga + dos cortas
        quinta = {'A2': 'E3', 'G2': 'D3', 'C3': 'G3'}[r]
        linea += [(r, .5), (r, .25), (r, .25), (quinta, .5), (quinta, .5), (r, .5), (r, .25), (r, .25), (quinta, 1)]
    secuencia(p, linea, bpm, bajo, 0.45)
    acordes = {'A2': ['A4', 'C5', 'E5'], 'G2': ['G4', 'B4', 'D5'], 'C3': ['C5', 'E5', 'G5']}
    acordes_arpegio(p, [acordes[r] for r in raices], bpm, vol=0.12)
    bateria(p, 16, bpm, 'huayno', 0.45)
    return normalizar(p, 0.75)


def musica_jefe():
    bpm = 152
    p = nueva_pista(32, bpm)
    raices = ['E2', 'E2', 'C2', 'D2', 'E2', 'E2', 'C2', 'B1']
    linea = []
    for r in raices:
        oct_ = r[:-1] + str(int(r[-1]) + 1)
        linea += [(r, .25), (r, .25), (oct_, .25), (r, .25)] * 4
    secuencia(p, linea, bpm, lambda n, d: cuadrada(freq(n), d, 0.25) * decaimiento(int(SR * d), 0.08) * 0.6, 0.6)
    golpes = []
    for i, r in enumerate(raices):
        n = {'E2': 'E5', 'C2': 'C5', 'D2': 'D5', 'B1': 'B4'}[r]
        golpes += [(n, .5), (None, .5), (n, .25), (None, .25), (n, .5), (None, 1), ('G5' if i % 2 else 'F#5', 1)]
    secuencia(p, golpes, bpm, lider_cuadrado, 0.45)
    bateria(p, 8, bpm, 'jefe', 0.55)
    return normalizar(p, 0.8)


def jingle_victoria():
    bpm = 140
    p = nueva_pista(9, bpm)
    secuencia(p, [('A4', .5), ('C5', .5), ('E5', .5), ('A5', .5), ('G5', .5), ('A5', .5), ('C6', 2), (None, 4)], bpm, lider_cuadrado, 0.6)
    secuencia(p, [('A2', 1), ('E3', 1), ('A3', 3)], bpm, bajo, 0.5)
    return normalizar(p, 0.8)


def jingle_derrota():
    bpm = 100
    p = nueva_pista(7, bpm)
    secuencia(p, [('E5', .75), ('D5', .75), ('C5', .75), ('A4', .75), ('G4', .5), ('A4', 2.5)], bpm, quena, 0.6)
    secuencia(p, [('A2', 3), ('E2', 3)], bpm, bajo, 0.4)
    return normalizar(p, 0.75)


# ---------------------------------------------------------------- efectos
def barrido(f0, f1, dur, forma='cuadrada', ciclo=0.5):
    t = t_de(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    fase = np.cumsum(f) / SR
    if forma == 'cuadrada':
        return np.where(fase % 1 < ciclo, 1.0, -1.0)
    return np.sin(2 * np.pi * fase)


def sfx_salto():
    s = barrido(280, 620, 0.16, ciclo=0.25)
    return s * decaimiento(len(s), 0.09) * 0.5


def sfx_fragmento():
    a = cuadrada(freq('E6'), 0.06, 0.5) * 0.4
    b = cuadrada(freq('A6'), 0.18, 0.5) * decaimiento(int(SR * 0.18), 0.07) * 0.4
    return np.concatenate([a, b])


def sfx_pisoton():
    n = int(SR * 0.18)
    return (ruido(0.18) * 0.5 + barrido(220, 60, 0.18, 'seno') * 0.8) * decaimiento(n, 0.05)


def sfx_dano():
    s = barrido(520, 120, 0.35, ciclo=0.5)
    return s * decaimiento(len(s), 0.15) * 0.45


def sfx_control():
    out = np.zeros(0)
    for n in ('A5', 'C6', 'E6', 'A6'):
        out = np.concatenate([out, cuadrada(freq(n), 0.07, 0.25) * 0.35])
    return out * decaimiento(len(out), 0.25)


def sfx_resorte():
    t = t_de(0.35)
    f = 220 + 180 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 6) + t * 300
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return s * decaimiento(len(s), 0.15) * 0.6


def sfx_golpe_jefe():
    n = int(SR * 0.4)
    return (ruido(0.4) * 0.6 + barrido(300, 40, 0.4, ciclo=0.5) * 0.5) * decaimiento(n, 0.12)


def sfx_rugido():
    n = int(SR * 0.9)
    t = t_de(0.9)
    s = ruido(0.9) * (0.5 + 0.5 * np.sin(2 * np.pi * 22 * t)) + barrido(90, 55, 0.9, 'seno') * 0.6
    return s * envolvente(n, 0.1, 0.2, 0.7, 0.3) * 0.7


def sfx_hielo():
    n = int(SR * 0.12)
    r = np.diff(np.concatenate([[0], ruido(0.12)]))
    return r * decaimiento(n, 0.03) * 0.6


def sfx_rayo():
    dur = 1.0
    n = int(SR * dur)
    s = np.zeros(n)
    trueno = barrido(105, 34, dur, 'seno') * decaimiento(n, 0.42)
    rugido = np.convolve(ruido(dur), np.ones(120) / 120, mode='same') * decaimiento(n, 0.3)
    crepitar = np.diff(np.concatenate([[0], ruido(0.22)])) * decaimiento(int(SR * 0.22), 0.055)
    mezclar(s, trueno * 0.72 + rugido * 1.8, 0)
    mezclar(s, crepitar * 0.55, 0.01)
    mezclar(s, barrido(72, 28, 0.65, 'seno') * decaimiento(int(SR * 0.65), 0.3) * 0.45, 0.08)
    return normalizar(s, 0.82)


def sfx_portal():
    s = barrido(200, 1200, 0.7, 'seno') * 0.5 + barrido(300, 1800, 0.7, ciclo=0.5) * 0.15
    return s * envolvente(len(s), 0.02, 0.2, 0.7, 0.25)


def sfx_clic():
    s = cuadrada(freq('C6'), 0.05, 0.5)
    return s * decaimiento(len(s), 0.02) * 0.35


def sfx_corazon():
    out = np.concatenate([cuadrada(freq('C5'), 0.08, 0.5), cuadrada(freq('G5'), 0.08, 0.5), cuadrada(freq('C6'), 0.16, 0.5)])
    return out * decaimiento(len(out), 0.2) * 0.35


# ---------------------------------------------------------------- exportación
def exportar(nombre, senal):
    senal = np.clip(senal, -1, 1)
    ruta_wav = os.path.join(TMP, nombre + '.wav')
    with wave.open(ruta_wav, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((senal * 32767).astype(np.int16).tobytes())
    for ext, args in (('ogg', ['-c:a', 'libvorbis', '-q:a', '3']), ('mp3', ['-c:a', 'libmp3lame', '-b:a', '80k'])):
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', ruta_wav, *args, os.path.join(SALIDA, f'{nombre}.{ext}')], check=True)


PISTAS = {
    'musica_menu': musica_menu, 'musica_nivel': musica_nivel, 'musica_jefe': musica_jefe,
    'jingle_victoria': jingle_victoria, 'jingle_derrota': jingle_derrota,
    'sfx_salto': sfx_salto, 'sfx_fragmento': sfx_fragmento, 'sfx_pisoton': sfx_pisoton,
    'sfx_dano': sfx_dano, 'sfx_control': sfx_control, 'sfx_resorte': sfx_resorte,
    'sfx_golpe_jefe': sfx_golpe_jefe, 'sfx_rugido': sfx_rugido, 'sfx_hielo': sfx_hielo,
    'sfx_rayo': sfx_rayo,
    'sfx_portal': sfx_portal, 'sfx_clic': sfx_clic, 'sfx_corazon': sfx_corazon,
}

if __name__ == '__main__':
    for nombre, fn in PISTAS.items():
        exportar(nombre, fn())
        print('ok', nombre)
    for f in os.listdir(TMP):
        os.remove(os.path.join(TMP, f))
    os.rmdir(TMP)
