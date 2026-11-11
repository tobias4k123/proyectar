# Prueba de usabilidad — RNF-04

**Requisito del informe:** el 80 % de los usuarios entiende el sistema en menos de 2 minutos.

El informe no define qué significa "entender el sistema", así que este protocolo lo hace medible: una persona *entiende* ProyectAR si, tras **como máximo 2 minutos de exploración sin ninguna explicación**, responde correctamente **al menos 3 de 4 preguntas de comprensión**. El requisito se cumple si al menos el 80 % de los participantes lo logra.

## 1. Participantes

- **Mínimo 5, ideal 10.** Con 5 personas, el 80 % equivale a 4 de 5; con 10, a 8 de 10.
- Perfil: estudiantes o egresados de IFES (el usuario real del sistema), de distintos años si es posible.
- **Que no hayan participado del desarrollo ni visto la aplicación antes.** Los integrantes del equipo no cuentan como participantes.
- Una persona por sesión, individualmente, para que nadie vea cómo le fue a otro.

## 2. Preparación (una sola vez, ~10 min)

1. Levantar la aplicación (ver el [README](../README.md)) con el plan cargado.
2. Crear una cuenta de demostración desde la aplicación (por ejemplo `demo@example.com`) e iniciar sesión.
3. Cargarle historial desde **Mi Carrera**: tocar cada materia de 1.º año y usar los botones del panel de la derecha. Aprobar unas 6 (empezar a cursar → aprobar por promoción, con nota de 8 para arriba, que es el mínimo del régimen) y dejar 2 en *cursando*. Así el mapa muestra los cinco estados: aprobadas, cursando, regulares, disponibles y bloqueadas.
4. Dejar la pantalla **Mi Carrera** abierta en la vista **Mapa**, sin ninguna materia seleccionada.
5. Tener a mano un cronómetro y la planilla de la sección 5 (impresa o en una hoja de cálculo).

> **En computadora** la pantalla abre directamente en la vista Mapa. **En celular** abre en la vista Lista, porque el mapa no entra a lo ancho: en ese caso tocar el botón *Mapa* antes de empezar, para que todos los participantes arranquen desde el mismo lugar.

## 3. Guion de cada sesión (~10 min)

**Introducción (30 s).** Leer tal cual:
> "Estamos probando una aplicación para alumnos. Te evaluamos a la aplicación, no a vos: si algo no se entiende, el problema es nuestro. Vas a mirarla un par de minutos y después te hago unas preguntas. No te voy a explicar nada ni a ayudar mientras tanto; pensá en voz alta si querés. Tus respuestas son anónimas. ¿Estás de acuerdo en participar?"

**Exploración (máx. 2:00).** Dar el mouse y decir: *"Explorá la aplicación como quieras."* Iniciar el cronómetro. Anotar por qué pantallas pasa y dónde duda, **sin intervenir**. Si pregunta algo, responder solo: *"Lo que te parezca."* A los 2:00, cortar la exploración.

**Preguntas de comprensión.** Hacerlas en este orden, sin dar pistas. La persona puede seguir mirando la pantalla.

| # | Pregunta | Se considera correcta si… |
|---|---|---|
| P1 | "¿Qué representan los cuadros y las flechas del mapa?" | Dice que cada cuadro es una materia y que las flechas son correlatividades (hay que tener una para poder hacer la otra). |
| P2 | "¿Qué significan los colores?" | Distingue correctamente al menos las materias aprobadas de las que todavía no puede cursar (bloqueadas), y reconoce la diferencia con las que está cursando o disponibles. |
| P3 | "Señalame una materia que podrías cursar ahora." | Señala una materia en estado *disponible*. |
| P4 | "Tocá el botón *Ruta crítica*. ¿Qué creés que te está mostrando?" | Dice, con sus palabras, que muestra la cadena más larga de materias pendientes / el camino más largo hasta terminar la carrera. |

Marcar cada respuesta como **✔** (correcta) o **✘** (incorrecta o no sabe). No corregir ni explicar durante la sesión.

**Cierre (1 min).** Preguntar: *"¿Qué fue lo más confuso?"* y *"¿Qué fue lo más útil?"*. Anotar textual. Agradecer y recién ahora, si quiere, explicarle lo que no entendió.

## 4. Criterio de resultado

- **Participante que entiende:** ≥ 3 de 4 respuestas correctas, habiendo explorado ≤ 2 minutos.
- **Resultado:** `participantes que entienden ÷ participantes totales × 100`.
- **El RNF-04 se cumple** si el resultado es **≥ 80 %**.

## 5. Planilla de resultados

| Participante | Año / perfil | P1 | P2 | P3 | P4 | Aciertos | ¿Entiende? (≥3) | Dónde dudó | Lo más confuso | Lo más útil |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | /4 | | | | |
| 2 | | | | | | /4 | | | | |
| 3 | | | | | | /4 | | | | |
| 4 | | | | | | /4 | | | | |
| 5 | | | | | | /4 | | | | |

**Resultado final:** ___ de ___ participantes entienden = ___ %  →  RNF-04: ☐ cumple  ☐ no cumple

## 6. Qué hacer con los resultados

- **Si cumple:** copiar al informe el criterio de la sección 4, la cantidad de participantes, el resultado y los comentarios más repetidos.
- **Si no cumple:** mirar qué pregunta falló más. Si fue P2, probablemente haga falta una leyenda de colores más visible; si fue P4, un texto explicativo al activar *Ruta crítica*. Corregirlo y repetir con participantes nuevos.
- **Aclarar siempre la limitación:** con 5 a 10 personas el resultado es *indicativo*, no estadísticamente significativo. Decirlo en el informe suma credibilidad.
- Anotar también cualquier problema de usabilidad que aparezca aunque no entre en las preguntas: sirve como "trabajo futuro".

---

## Anexo — qué cambió respecto de la versión anterior

El protocolo original se escribió cuando la aplicación tenía tres pantallas separadas (*Plan de Estudios*, *Historial Académico* y *Ruta Crítica*). El rediseño las unificó en **Mi Carrera**, así que se actualizaron:

- La preparación, que ahora carga el historial desde Mi Carrera y respeta las notas mínimas del régimen (8 para promocionar, 4 para el final).
- La pantalla de partida: *Mi Carrera* en vista Mapa, con la aclaración para celulares.
- **P4**, que preguntaba por "la sección *Ruta Crítica*" cuando hoy es un botón dentro de Mi Carrera. Sin ese cambio la pregunta es irrespondible y el resultado del RNF queda viciado.
- P1, que hablaba de "líneas" cuando ahora el mapa dibuja flechas con dirección: van de la correlativa a la materia que la necesita.
