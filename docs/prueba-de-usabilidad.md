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
2. Crear una cuenta de demostración desde la aplicación (por ejemplo `demo@example.com`) y cargarle historial desde la pantalla *Historial Académico*: aprobar unas 6 materias de 1.º año y dejar 2 en *cursando*. Así el grafo muestra todos los estados: aprobadas, cursando, disponibles y bloqueadas.
3. Iniciar sesión con esa cuenta y dejar abierta la pantalla **Plan de Estudios**.
4. Tener a mano un cronómetro y la planilla de la sección 5 (impresa o en una hoja de cálculo).

## 3. Guion de cada sesión (~10 min)

**Introducción (30 s).** Leer tal cual:
> "Estamos probando una aplicación para alumnos. Te evaluamos a la aplicación, no a vos: si algo no se entiende, el problema es nuestro. Vas a mirarla un par de minutos y después te hago unas preguntas. No te voy a explicar nada ni a ayudar mientras tanto; pensá en voz alta si querés. Tus respuestas son anónimas. ¿Estás de acuerdo en participar?"

**Exploración (máx. 2:00).** Dar el mouse y decir: *"Explorá la aplicación como quieras."* Iniciar el cronómetro. Anotar por qué pantallas pasa y dónde duda, **sin intervenir**. Si pregunta algo, responder solo: *"Lo que te parezca."* A los 2:00, cortar la exploración.

**Preguntas de comprensión.** Hacerlas en este orden, sin dar pistas. La persona puede seguir mirando la pantalla.

| # | Pregunta | Se considera correcta si… |
|---|---|---|
| P1 | "¿Qué representan los cuadros y las líneas del gráfico?" | Dice que cada cuadro es una materia y que las líneas son correlatividades (hay que tener una para poder hacer la otra). |
| P2 | "¿Qué significan los colores?" | Distingue correctamente al menos las materias aprobadas de las que todavía no puede cursar (bloqueadas), y reconoce la diferencia con las que está cursando o disponibles. |
| P3 | "Señalame una materia que podrías cursar ahora." | Señala una materia en estado *disponible*. |
| P4 | "¿Qué creés que te muestra la sección *Ruta Crítica*?" | Dice, con sus palabras, que muestra la cadena más larga de materias pendientes / el camino más largo hasta terminar la carrera. |

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
- **Si no cumple:** mirar qué pregunta falló más. Si fue P2, probablemente haga falta una leyenda de colores más visible; si fue P4, un texto explicativo en *Ruta Crítica*. Corregirlo y repetir con participantes nuevos.
- **Aclarar siempre la limitación:** con 5 a 10 personas el resultado es *indicativo*, no estadísticamente significativo. Decirlo en el informe suma credibilidad.
- Anotar también cualquier problema de usabilidad que aparezca aunque no entre en las preguntas: sirve como "trabajo futuro".
