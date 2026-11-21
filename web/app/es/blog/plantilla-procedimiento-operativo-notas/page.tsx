import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-procedimiento-operativo-notas");

// Spanish version of /blog/apple-notes-sop-template, 21 Nov 2026.
// Google autocomplete (hl=es, gl=es), 21 Nov: "procedimiento operativo estandar plantilla"
// returned "procedimiento operativo estándar plantilla" and "plantilla de procedimiento
// operativo estándar poe"; "plantilla de procedimiento operativo" returned the standard variant.
// Apple Spanish support read 21 Nov 2026: /es-es/guide/notes/apd93c815aa0/mac (listas,
// Formato > Más > Anular todo), /es-es/guide/notes/apd0a136b9cc/mac (Formato > Tabla,
// convertir texto, Tabulador), /es-es/guide/notes/not9474646a9/mac (Archivo > Duplicar nota),
// /es-es/guide/iphone/iph1ac0b3a2/ios (botones Formato, lista y tabla). No picture.

const ui = UI.es;
const TEMPLATE = `Procedimiento: enviar el informe semanal al cliente

Inicio: viernes a las 14:00, cuando esté anotado el trabajo de la semana.
Responsable: Maya, responsable de cuenta. Sustituto: Leo.
Resultado: Estudio Calle Norte recibe un informe correcto antes de las 16:00.
Material necesario: registro de trabajo semanal y lista actual de contactos del cliente.
Versión: 1.2, actualizada el 20 de noviembre de 2026.
Próxima revisión: 18 de diciembre de 2026. Maya se encarga.

Pasos
1. Abrir el registro de Estudio Calle Norte. Usar el trabajo de lunes a viernes de esta semana.
2. Copiar el trabajo terminado a un informe nuevo. Poner el pendiente en Próxima semana.
3. Sumar las horas de cada trabajo terminado. Comparar el total con el registro.
4. Exportar el informe como PDF llamado CalleNorte-semana-2026-11-20.pdf. Cambiar la fecha cada semana.
5. Abrir el PDF exportado. Leer cada página y comprobar el cliente y la semana.
6. Hacer las comprobaciones de abajo. Enviar el PDF al contacto actual del cliente por correo.
7. Anotar hora y remitente en una nota de ejecución fechada. Registrar allí cualquier incidencia.

Excepciones
Si ocurre esto\tHaz esto
Las horas no coinciden con el registro\tParar. Pedir a quien las anotó que corrija el origen y exportar otra vez.
Maya está ausente\tLeo ejecuta el procedimiento y anota su nombre en la nota de ejecución.
El informe no se puede enviar antes de las 16:00\tAvisar al cliente antes de las 16:00 con una nueva hora. Anotarla en la nota de ejecución.

Comprobaciones antes de enviar
El cliente y la semana coinciden con el registro de trabajo.
Las horas coinciden; ningún trabajo pendiente figura como terminado.
El PDF exportado abre y contiene todas las páginas.
El destinatario coincide con la lista actual de contactos del cliente.

Registro de ejecución
20 de noviembre de 2026, 15:42. Maya envió el informe. Sin incidencias.

Registro de cambios
20 de noviembre de 2026, v1.2. Añadida la comprobación de apertura del PDF tras una exportación vacía.
`;
const FAQ = [
  { q: "¿Puedo escribir un procedimiento operativo en Notas?", a: ["Sí. Usa una nota por procedimiento, con inicio, responsable, pasos numerados, excepciones, comprobaciones y fecha de revisión. Copia este ejemplo y adáptalo."] },
  { q: "¿Los pasos van numerados o en casillas?", a: ["Numera los pasos cuando el orden importa. Deja una lista de comprobación aparte para las verificaciones finales. Conserva el procedimiento maestro sin marcar y registra cada ejecución en otra nota."] },
  { q: "¿Cada cuánto reviso el procedimiento?", a: ["Elige una fecha y una persona responsable. Revísalo antes si una incidencia descubre un paso ausente o cambian los materiales. La fecha escrita necesita un recordatorio aparte."] },
  { q: "¿Pinto Notes recupera una versión anterior?", a: ["Sí. Guarda versiones de la nota y puede restaurar una anterior sin perder el texto sustituido. Mantén el registro escrito para explicar por qué cambió cada paso."] },
];

export default function Page() {
  return <LocalPostPage lang="es" slug="plantilla-procedimiento-operativo-notas"
    intro={<>Copia este procedimiento operativo en Notas de Apple para una tarea que se repite. Incluye inicio, responsable, pasos, excepciones, comprobaciones y una fecha de revisión.</>}
    answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[
      { href: "#plantilla", label: "Copia el procedimiento" }, { href: "#preparacion", label: "Prepáralo" },
      { href: "#uso", label: "Ejecútalo y revísalo" }, { href: "#limites", label: "Sus límites" },
      { href: "#pinto-notes", label: "Versiones anteriores" },
    ]}><p>Una nota por procedimiento basta para mantener los pasos en orden y una lista aparte para las comprobaciones. Pega el ejemplo de informe semanal, cambia nombres y horarios y pruébalo en una ejecución real. Guarda cada ejecución en otra nota.</p>
      <PostCta slug="es/plantilla-procedimiento-operativo-notas" path="/es/blog/plantilla-procedimiento-operativo-notas" position="answer" ui={ui.cta} title="Conserva las versiones anteriores">
        <p>Pinto Notes funciona como Notas de Apple en iPhone y Mac y guarda versiones que puedes recuperar. Después de conectarlo, ChatGPT o Claude pueden leer y editar el procedimiento.</p>
      </PostCta></Answer>} faq={FAQ}>
    <h2 id="plantilla">Ejemplo: enviar el informe semanal</h2>
    <p>Una responsable de cuenta envía el mismo tipo de informe cada viernes. Cambia el cliente, los documentos de origen y el plazo. Si trabajas solo, pon tu nombre y elimina el sustituto si nadie puede cubrirte.</p>
    <Keep title="Procedimiento para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy} note="Pégalo en una nota nueva. Convierte las cuatro comprobaciones en lista y las cuatro líneas con tabulaciones de Excepciones en tabla." />
    <p>Cada paso debe indicar una acción y un resultado visible. «Abrir el PDF exportado» es más preciso que «revisar el informe». Deja junto a los pasos las condiciones que obligan a parar.</p>
    <h2 id="preparacion">Prepara el procedimiento en Notas</h2>
    <Paths rows={[{ on: "Mac, excepciones", steps: ["Formato", "Tabla"] }, { on: "iPhone, títulos", steps: ["Botón Formato", "Encabezamiento"] }]} />
    <ol>
      <li>Pega el texto en una nota nueva. En el iPhone, usa el botón Nueva nota. La primera línea será el título. Selecciona los títulos de sección y dales formato.</li>
      <li>En el Mac, selecciona los cuatro párrafos de Comprobaciones y pulsa Lista de comprobación. En el iPhone, inicia una lista e introduce los cuatro. Deja los pasos numerados.</li>
      <li>En el Mac, selecciona desde «Si ocurre esto» hasta la última excepción y pulsa Tabla. Cada tabulación separa las dos columnas. También puedes elegir Formato, Tabla.</li>
      <li>En el iPhone, crea una tabla e introduce las parejas en dos columnas. En el Mac, Tabulador en la última celda añade una fila. Hay más controles en la <a href="/blog/apple-notes-tables" hrefLang="en">guía de tablas</a> (en inglés).</li>
    </ol>
    <p>Usa una nota de iCloud o guardada en el Mac para las listas. Apple indica que algunas funciones no están disponibles con otros proveedores. Hay más <a href="/blog/apple-notes-templates" hrefLang="en">plantillas</a> (en inglés).</p>
    <h2 id="uso">Pruébalo y corrige lo que no quede claro</h2>
    <p>Ejecuta los pasos con el registro y el PDF reales. Si alguien te sustituirá, pídele que siga la nota sin ayuda. Anota dónde se detiene y añade los nombres de archivo o decisiones que falten.</p>
    <p>Conserva la nota maestra. Para registrar un viernes, selecciónala en el Mac y elige Archivo, Duplicar nota. Titula la copia «Informe semanal, 27 de noviembre de 2026» y borra el registro de ejemplo. Para empezar con las casillas vacías, usa Formato, Más, Anular todo. Una copia de una nota compartida no se comparte.</p>
    <p>Anota quién hizo el envío y cualquier incidencia. Si puede repetirse, añade una respuesta al procedimiento maestro, sube su versión y explica el cambio. En la fecha de revisión, compara los pasos con los documentos actuales.</p>
    <h2 id="limites">Hasta dónde llega</h2>
    <p>Una casilla marcada no demuestra que el adjunto fuese correcto ni que el cliente lo recibiera. Guarda el mensaje enviado o la prueba que necesite tu trabajo. La fecha de revisión requiere un aviso aparte. Identifica cuál es la nota maestra; este esquema por sí solo no da aprobaciones formales ni un registro de auditoría controlado.</p>
    <h2 id="pinto-notes">Revisa el procedimiento sin perder versiones</h2>
    <p>Pinto Notes se parece a Notas de Apple y funciona igual en iPhone y Mac. Su <a href="/blog/apple-notes-version-history" hrefLang="en">historial de versiones</a> (en inglés) permite recuperar una anterior y conserva también el texto sustituido. El registro de cambios explica por qué se revisó un paso.</p>
    <p>Tras <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a> (en inglés), puede leer y editar tus notas. Pídele que proponga una excepción para un registro de trabajo que llegue tarde sin mover el plazo, y que enumere sus suposiciones antes de editar. Comprueba la propuesta con el trabajo real.</p>
    <p>Puedes <a href="/blog/move-from-apple-notes" hrefLang="en">importar tus notas de Apple en el Mac</a> (en inglés) sin cambiarlas allí. La app está en inglés.</p>
  </LocalPostPage>;
}
