"""Pruebas funcionales de Kusi con Playwright.

Uso: npm run dev (en otra terminal) y luego: python3 tests/pruebas_funcionales.py
Requiere: pip install playwright && playwright install chromium
Se usa el modo Canvas (?canvas) para que la medición no dependa de la GPU.
"""
from playwright.sync_api import sync_playwright
import json, time, sys

BASE = 'http://localhost:5173/'
R = {}
JS = """
window.T = {
  g: () => window.__kusi,
  gs: () => window.__kusi.scene.getScene('GameScene'),
  d: () => window.__kusiDebug,
  activa: (k) => window.__kusi.scene.isActive(k),
  tp: (x, y) => { const j = window.__kusi.scene.getScene('GameScene').jugador; j.body.reset(x, y); j.setVelocity(0, 0); },
  estado: () => { const gs = window.__kusi.scene.getScene('GameScene'); const s = window.__kusiDebug.sesion;
    return { x: Math.round(gs.jugador.x), y: Math.round(gs.jugador.y), vy: Math.round(gs.jugador.body.velocity.y), fsm: gs.jugador.fsm.actual,
             vidas: s.vidas, puntos: s.puntos, frag: s.fragmentos, total: s.fragmentosTotales, estadoJuego: window.__kusiDebug.estadoJuego.estado }; }
};
"""


def esperar(pg, cond, t=15000):
    pg.wait_for_function(cond, timeout=t)


def ok(nombre, cond, detalle=''):
    R[nombre] = {'ok': bool(cond), 'detalle': detalle}
    print(('OK  ' if cond else 'FALLA ') + nombre, detalle, flush=True)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 960, 'height': 540})
    errores = []
    pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.on('console', lambda m: errores.append(m.text) if m.type == 'error' else None)
    pg.goto(BASE + '?canvas')
    esperar(pg, "window.__kusi && window.__kusi.scene.isActive('MenuScene')", 20000)
    pg.evaluate(JS)
    pg.evaluate("T.d().almacen.reiniciarTodo()")

    # --- Menú -> historia -> nivel 1
    pg.keyboard.press('Enter')
    esperar(pg, "T.activa('StoryScene')")
    ok('menu_nueva_partida_abre_historia', True)
    for _ in range(9):
        pg.keyboard.press('Enter'); pg.wait_for_timeout(150)
    esperar(pg, "T.activa('GameScene') && T.activa('UIScene')", 8000)
    pg.wait_for_timeout(500)
    e = pg.evaluate("T.estado()")
    ok('historia_avanza_al_nivel_1', e['total'] == 31 and e['vidas'] == 3, e)

    # --- Movimiento y salto con teclado
    x0 = e['x']
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(500); pg.keyboard.up('ArrowRight')
    e = pg.evaluate("T.estado()")
    ok('movimiento_derecha', e['x'] > x0 + 60, f"{x0} -> {e['x']}")
    pg.wait_for_timeout(300)
    y0 = pg.evaluate("T.estado()")['y']
    pg.keyboard.down('Space'); pg.wait_for_timeout(120)
    alto = pg.evaluate("T.estado()")
    pg.wait_for_timeout(250); pg.keyboard.up('Space')
    ymin = y0
    for _ in range(10):
        ymin = min(ymin, pg.evaluate("T.estado()")['y']); pg.wait_for_timeout(40)
    ok('salto', y0 - ymin > 60 and alto['fsm'] == 'saltando', f'subió {y0 - ymin}px')
    pg.wait_for_timeout(800)

    # --- Fragmento
    p0 = pg.evaluate("T.estado()")
    pg.evaluate("(()=>{const f=T.gs().nivel.fragmentos.getChildren().find(f=>f.body.enable); T.tp(f.x, f.y)})()"); pg.wait_for_timeout(200)
    p1 = pg.evaluate("T.estado()")
    ok('recoger_fragmento', p1['frag'] > p0['frag'] and p1['puntos'] >= p0['puntos'] + 10, f"{p0['frag']}->{p1['frag']}")

    # --- Pisotón sobre Neblino (col 21)
    pg.wait_for_timeout(300)
    n = pg.evaluate("T.gs().nivel.enemigos.getChildren().filter(e=>e.texture.key==='neblino'&&e.vivo).length")
    ex = pg.evaluate("(()=>{const e=T.gs().nivel.enemigos.getChildren().find(e=>e.texture.key==='neblino'&&e.vivo); return [e.x,e.body.top]})()")
    pts = pg.evaluate("T.estado().puntos")
    pg.evaluate(f"(()=>{{T.tp({ex[0]}, {ex[1]}-60); T.gs().jugador.setVelocityY(300)}})()")
    pg.wait_for_timeout(400)
    n2 = pg.evaluate("T.gs().nivel.enemigos.getChildren().filter(e=>e.texture.key==='neblino'&&e.vivo).length")
    e = pg.evaluate("T.estado()")
    ok('pisoton_derrota_enemigo', n2 == n - 1 and e['puntos'] >= pts + 50 and e['vidas'] == 3, f'enemigos {n}->{n2}, puntos +{e["puntos"]-pts}')

    # --- Daño por contacto lateral (siguiente Neblino)
    pg.wait_for_timeout(1500)
    ex = pg.evaluate("(()=>{const e=T.gs().nivel.enemigos.getChildren().find(e=>e.texture.key==='neblino'&&e.vivo); return [e.x,e.y]})()")
    pg.evaluate(f"T.tp({ex[0]}, {ex[1]}-8)")
    pg.wait_for_timeout(150)
    e = pg.evaluate("T.estado()")
    inv = pg.evaluate("T.gs().jugador.esInvulnerable()")
    ok('dano_por_contacto_y_invulnerabilidad', e['vidas'] == 2 and inv, e)
    pg.wait_for_timeout(1600)

    # --- Resorte (col 50)
    pg.evaluate("T.tp(50*32+16, 11*32)"); pg.wait_for_timeout(60)
    ymin = 9999
    for _ in range(40):
        ymin = min(ymin, pg.evaluate("T.estado()")['y']); pg.wait_for_timeout(40)
    ok('resorte_puya', ymin < 6 * 32, f'altura mínima y={ymin}')
    pg.wait_for_timeout(1200)

    # --- Apacheta (col 56) y caída al vacío con reaparición
    pg.evaluate("T.tp(56*32+16, 12*32)"); pg.wait_for_timeout(300)
    pc = pg.evaluate("T.d().sesion.puntoControl")
    ok('apacheta_guarda_punto_de_control', pc is not None, pc)
    v0 = pg.evaluate("T.estado().vidas")
    pg.evaluate("T.tp(62*32, 15*32)"); pg.wait_for_timeout(1300)
    e = pg.evaluate("T.estado()")
    ok('caida_al_vacio_resta_vida_y_reaparece', e['vidas'] == v0 - 1 and abs(e['x'] - pc['x']) < 40, e)

    # --- Pausa y reanudación
    pg.wait_for_timeout(500)
    pg.keyboard.press('p'); pg.wait_for_timeout(400)
    pausado = pg.evaluate("T.activa('PauseScene') && T.g().scene.isPaused('GameScene')")
    pg.screenshot(path='capturas_prueba_pausa.png')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    reanudado = pg.evaluate("!T.activa('PauseScene') && T.activa('GameScene')")
    ok('pausa_y_reanudar', pausado and reanudado)

    # --- Silencio persistente
    pg.keyboard.press('m'); pg.wait_for_timeout(100)
    mute = pg.evaluate("[T.g().sound.mute, JSON.parse(localStorage.getItem('kusi.fragmentos-del-sol.v1')).audio.silencio]")
    pg.keyboard.press('m'); pg.wait_for_timeout(100)
    ok('silencio_con_tecla_M_y_guardado', mute == [True, True], mute)

    # --- Llegar a la meta del nivel 1
    pg.evaluate("T.tp(124*32+32, 12*32)")
    esperar(pg, "T.gs().completando", 3000)
    datos = pg.evaluate("JSON.parse(localStorage.getItem('kusi.fragmentos-del-sol.v1'))")
    ok('meta_guarda_progreso', datos['nivelAlcanzado'] == 2 and datos['partida']['nivel'] == 2 and datos['record'] > 0, datos)
    esperar(pg, "T.activa('StoryScene')", 8000)
    pg.wait_for_timeout(300)
    pg.keyboard.press('Escape')
    try:
        esperar(pg, "T.activa('GameScene') && T.gs().numeroNivel===2", 8000)
    except Exception:
        print('DIAG', pg.evaluate("window.__kusi.scene.getScenes(false).map(s=>s.sys.settings.key+':'+s.sys.settings.status)"), pg.evaluate("T.d().estadoJuego.estado"), errores)
        raise
    pg.wait_for_timeout(600)
    ok('interludio_y_nivel_2', True, pg.evaluate("T.estado()"))

    # --- Losa móvil arrastra al jugador (nivel 2, col 22 fila 12)
    pg.evaluate("(()=>{const l=T.gs().nivel.losas.getChildren()[0]; T.tp(l.x, l.y-40);})()")
    pg.wait_for_timeout(400)
    a = pg.evaluate("(()=>{const l=T.gs().nivel.losas.getChildren()[0]; return [T.gs().jugador.x, l.x, T.gs().jugador.body.blocked.down||T.gs().jugador.body.touching.down]})()")
    pg.wait_for_timeout(700)
    c = pg.evaluate("(()=>{const l=T.gs().nivel.losas.getChildren()[0]; return [T.gs().jugador.x, l.x]})()")
    dj, dl = c[0] - a[0], c[1] - a[1]
    ok('losa_movil_arrastra_al_jugador', abs(dl) > 20 and abs(dj - dl) < 12, f'jugador {dj:.0f}px, losa {dl:.0f}px, apoyado={a[2]}')
    pg.screenshot(path='capturas_prueba_hielo.png')

    # --- Suelo resbaloso: tras soltar la tecla sigue deslizando más que en el nivel 1
    pg.evaluate("T.tp(5*32, 12*32)"); pg.wait_for_timeout(400)
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(600); pg.keyboard.up('ArrowRight')
    x1 = pg.evaluate("T.estado().x"); pg.wait_for_timeout(500); x2 = pg.evaluate("T.estado().x")
    ok('hielo_desliza', x2 - x1 > 25, f'deslizó {x2 - x1}px tras soltar')

    # --- Game Over y reintento
    pg.evaluate("T.d().sesion.vidas = 1; T.d().sesion.emitir()")
    pg.evaluate("T.tp(40*32, 15*32)")  # pozo
    esperar(pg, "T.activa('GameOverScene')", 6000)
    pg.wait_for_timeout(600)
    pg.screenshot(path='capturas_prueba_gameover.png')
    pg.keyboard.press('Enter')
    esperar(pg, "T.activa('GameScene') && T.gs().numeroNivel===2", 6000)
    pg.wait_for_timeout(300)
    ok('game_over_y_reintentar', pg.evaluate("T.estado().vidas") == 3)

    # --- Nivel 3: jefe
    pg.evaluate("T.g().scene.getScene('UIScene').scene.stop(); T.gs().scene.start('GameScene',{nivel:3})")
    esperar(pg, "T.activa('GameScene') && T.gs().numeroNivel===3 && T.gs().jefe", 8000)
    pg.wait_for_timeout(500)
    pg.evaluate("T.d().sesion.vidas = 5; T.d().sesion.emitir()")
    pg.evaluate("T.tp(83*32+16, 12*32)")
    esperar(pg, "T.gs().arenaActiva", 3000)
    esperar(pg, "T.gs().jefe.fsm.actual==='flotar'", 6000)
    ok('arena_activa_y_jefe_entra', True)
    golpes = 0
    for ronda in range(8):
        try:
            esperar(pg, "!T.gs().jefe.active || T.gs().jefe.fsm.actual==='aturdido'", 12000)
        except Exception:
            break
        if not pg.evaluate("T.gs().jefe.active"):
            break
        if ronda == 1:
            pg.screenshot(path='capturas_prueba_jefe_aturdido.png')
        pg.evaluate("T.d().sesion.vidas = 5; T.d().sesion.emitir()")
        pg.evaluate("(()=>{const u=T.gs().jefe; T.tp(u.x, u.body.top-70); T.gs().jugador.setVelocityY(350); T.gs().jugador.invulnerableHasta=0})()")
        pg.wait_for_timeout(500)
        golpes = 6 - pg.evaluate("T.gs().jefe.active ? T.gs().jefe.vida : 0")
        if ronda == 3:
            pg.screenshot(path='capturas_prueba_jefe.png')
    esperar(pg, "T.d().sesion && T.gs().nivel.puerta.activa", 8000)
    ok('jefe_derrotado_tras_6_pisotones', golpes == 6, f'golpes={golpes}')
    pg.wait_for_timeout(800)
    pg.screenshot(path='capturas_prueba_puerta.png')
    pg.evaluate("(()=>{const p=T.gs().nivel.puerta; T.tp(p.x, p.y);})()")
    esperar(pg, "T.activa('StoryScene')", 8000)
    pg.keyboard.press('Escape')
    esperar(pg, "T.activa('VictoryScene')", 6000)
    pg.wait_for_timeout(1200)
    pg.screenshot(path='capturas_prueba_victoria.png')
    datos = pg.evaluate("JSON.parse(localStorage.getItem('kusi.fragmentos-del-sol.v1'))")
    ok('victoria_final_y_record', datos['record'] > 1000 and datos['partida'] is None, {'record': datos['record'], 'nivel': datos['nivelAlcanzado']})

    # --- Menú muestra Continuar tras recargar con partida guardada
    pg.evaluate("T.d().almacen.guardarPartida({nivel:2, puntos:300, vidas:3})")
    pg.goto(BASE + '?canvas')
    esperar(pg, "window.__kusi && window.__kusi.scene.isActive('MenuScene')", 20000)
    pg.wait_for_timeout(500)
    pg.screenshot(path='capturas_prueba_menu_continuar.png')
    pg.evaluate(JS)
    pg.keyboard.press('Enter')
    esperar(pg, "T.activa('GameScene') && T.gs().numeroNivel===2", 8000)
    ok('continuar_desde_menu', pg.evaluate("T.estado().puntos") == 300)

    ok('sin_errores_en_consola', len(errores) == 0, errores[:5])
    b.close()

json.dump(R, open('resultados_pruebas.json', 'w'), indent=1, ensure_ascii=False)
print('TOTAL', sum(v['ok'] for v in R.values()), '/', len(R))
