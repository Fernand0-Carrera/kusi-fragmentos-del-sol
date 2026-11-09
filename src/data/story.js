/**
 * Textos de la historia. Cada escena de historia es una lista de paneles;
 * cada panel tiene un texto y el personaje que se muestra junto a él.
 *
 * Vocabulario quechua usado: Inti (sol), sonqo (corazón), chasqui (mensajero),
 * apacheta (montículo de piedras que marca los caminos andinos), chullo (gorro).
 */
export const HISTORIAS = {
  intro: [
    { personaje: 'sol', texto: 'Hace mucho tiempo, sobre los Andes brillaba el Inti Sonqo, el Corazón del Sol. Su luz calentaba los valles y hacía crecer el maíz y la quinua.' },
    { personaje: 'uku', texto: 'Una noche, Uku, el Señor de la Niebla, lo arrancó del cielo y lo partió en mil fragmentos. Desde entonces, una bruma helada cubre las montañas.' },
    { personaje: 'kusi', texto: 'Kusi es la chasqui más veloz de su pueblo. Con su chullo turquesa y el poncho de su abuela, decide seguir el rastro de los fragmentos hasta la cumbre de Uku.' },
    { personaje: 'fragmento', texto: 'Recoge los fragmentos de sol, salta sobre las criaturas de la niebla y llega a la Puerta del Sol al final de cada camino. Las apachetas guardarán tu avance.' }
  ],
  interludio1: [
    { personaje: 'kusi', texto: 'La luz vuelve al Valle de los Colibríes. Pero el rastro de Uku se pierde en las cuevas heladas que hay bajo el volcán.' },
    { personaje: 'murcielago', texto: 'En las Cuevas de Hielo el suelo resbala y las losas flotan sobre el abismo. Kusi tendrá que medir cada salto.' }
  ],
  interludio2: [
    { personaje: 'uku', texto: 'Al fondo de las cuevas, un viento helado sopla desde el cráter. «Ninguna chasqui ha vuelto de mi cumbre», ruge la niebla.' },
    { personaje: 'kusi', texto: 'Uku no puede ser tocado mientras vuela. Esquiva sus esquirlas de hielo, espera a que se lance en picada y salta sobre él cuando quede aturdido.' }
  ],
  final: [
    { personaje: 'uku', texto: 'Con el último golpe, la niebla de Uku se deshace en lluvia fina. Ya no queda nada que oculte el cielo.' },
    { personaje: 'sol', texto: 'Los fragmentos se elevan desde el morral de Kusi y se unen otra vez. El Inti Sonqo vuelve a brillar sobre los Andes.' },
    { personaje: 'kusi', texto: 'Kusi regresa a su pueblo por los caminos de las apachetas. Esa noche, junto al fuego, la abuela teje en su poncho un nuevo sol dorado.' }
  ]
};
