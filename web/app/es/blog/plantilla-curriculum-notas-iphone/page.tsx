import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep, Paths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "plantilla-curriculum-notas-iphone");
// Spanish version of /blog/apple-notes-resume-template, 21 Nov 2026. Autocomplete hl=es, gl=es:
// "plantilla curriculum" suggests "plantilla curriculum vitae", "plantilla curriculum gratis",
// "plantilla curriculum word" and "plantilla curriculum ats". The Notes-qualified seed has no suggestions.
// Apple Support read 21 Nov: /es-es/guide/notes/apd1955d3b21/mac (botón Formato, Encabezamiento),
// /es-es/guide/notes/apd93c815aa0/mac (Lista de comprobación, Formato > Más > Anular todo),
// /es-es/guide/notes/apd0a136b9cc/mac (Formato > Tabla),
// /es-es/guide/notes/not9474646a9/mac (Archivo > Duplicar nota),
// /es-es/guide/iphone/iph1ac0b3a2/ios (encabezado, tabla y lista). No unverified menu name. No picture.
const ui = UI.es;
const TEMPLATE = `Lucía Martín, historial profesional
Actualizado: 21 de noviembre de 2026

Contacto
Madrid
lucia.martin@example.com | 612 345 678
Portfolio: https://example.com/lucia

Perfil
Coordinadora de operaciones de atención al cliente con experiencia desde 2020.
Prepara informes del equipo y guías de incorporación para agentes de soporte.

Experiencia
Sierra Suministros | Coordinadora de operaciones de soporte
Madrid | Enero de 2023 hasta hoy

12 de noviembre de 2026: preparé una lista de clasificación de consultas que usan seis agentes. La mediana del tiempo hasta la primera respuesta del equipo bajó de 14 horas en septiembre a 9 en octubre.
Prueba: informe de la cola de septiembre y octubre, guardado el 2 de noviembre de 2026.
Mi aportación: escribí la lista y dirigí la revisión semanal. El equipo atendió las consultas.

28 de junio de 2026: escribí una guía de incorporación y formé a cuatro agentes de soporte durante junio.
Prueba: guía de incorporación y registro de asistencia a la formación de junio.
Ejemplo de guía: https://example.com/lucia/incorporacion

Casa del Puerto | Agente de atención al cliente
Madrid | Septiembre de 2020 a diciembre de 2022

31 de marzo de 2022: resolví entre 35 y 45 consultas por semana durante marzo.
Prueba: informe individual de consultas de marzo. No es el total del equipo.

Competencias
Informes en Excel, clasificación de consultas, formación de nuevos agentes, redacción de guías

Formación
Grado en Comunicación | Universidad Complutense de Madrid | Mayo de 2020

Datos que comprobar antes de usar
Confirmar los nombres exactos de los puestos con los contratos
Revisar las cifras de respuesta y los meses comparados
Sustituir el contacto y los enlaces de ejemplo
Quitar del currículum enviado a empresas los enlaces a informes internos
`;
const EVIDENCE = `Fecha del logro\tPrueba que conservar
12 de noviembre de 2026\tInforme de consultas de septiembre y octubre, guardado el 2 de noviembre
28 de junio de 2026\tGuía de incorporación y registro de formación de junio
31 de marzo de 2022\tInforme individual de consultas de marzo
`;
const FAQ = [
 {q:"¿Qué debe incluir esta plantilla de currículum?",a:["Contacto, perfil breve, puestos y fechas, competencias y formación. Bajo cada empleo, anota logros fechados y las pruebas. Es un historial para preparar el currículum final."]},
 {q:"¿Envío esta nota a una empresa?",a:["No. Copia solo lo pertinente en un editor de documentos, quita informes internos y notas de comprobación, y revisa el archivo final antes de enviarlo en el formato solicitado."]},
 {q:"¿Cómo anoto un logro sin cifras?",a:["Escribe qué hiciste, cuándo y qué puedes comprobar. Nombra la guía y quién la usó. No inventes un porcentaje si no tienes una fuente."]},
];
export default function Page() {
 return <LocalPostPage lang="es" slug="plantilla-curriculum-notas-iphone"
 intro={<>Usa Notas de Apple para guardar tu historial de empleos y logros fechados. Después copia lo pertinente en un editor de documentos. Esta plantilla deja las pruebas junto a cada afirmación.</>}
 answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#plantilla",label:"La plantilla"},{href:"#preparar",label:"Prepararla"},{href:"#adaptar",label:"Redactar el currículum"},{href:"#limites",label:"Sus límites"},{href:"#pinto",label:"Borrador con IA"}]}>
 <p>Una nota sirve como historial: contacto, empleos con fechas y logros con sus pruebas. Sustituye el ejemplo por tu experiencia y termina el currículum en un editor de documentos.</p>
 <PostCta slug="es/plantilla-curriculum-notas-iphone" path="/es/blog/plantilla-curriculum-notas-iphone" position="answer" ui={ui.cta} title="Elige los logros pertinentes"><p>Pinto Notes funciona como Notas de Apple en iPhone y Mac. Una vez conectados, ChatGPT o Claude pueden leer tu historial y guardar otro borrador para que lo revises.</p></PostCta>
 </Answer>} hero={<></>} faq={FAQ}>
 <h2 id="plantilla">La plantilla: conserva todo el historial</h2>
 <p>Lucía y sus datos son ficticios. Sustituye todo, incluidos los enlaces. Conserva los puestos antiguos y los logros útiles en esta nota aunque no entren en la candidatura de hoy.</p>
 <Keep title="Historial profesional para Notas de Apple" text={TEMPLATE} copyLabel={ui.copy} note="Pégalo en una nota nueva. Los encabezados y las líneas de revisión empiezan como texto normal." />
 <h2 id="preparar">Añade encabezados y una lista para comprobar datos</h2>
 <p>Usa una nota de iCloud. Apple advierte que algunas funciones no están disponibles con otros proveedores. Deja las fechas de los logros junto a cada afirmación.</p>
 <Paths rows={[{on:"Mac",steps:["Botón Formato","Encabezamiento"]},{on:"iPhone",steps:["Botón Formato","Encabezamiento"]}]} />
 <p>Selecciona nombres de sección como Experiencia y aplica Encabezamiento desde el botón Formato. En el Mac, selecciona las cuatro líneas de Datos que comprobar y pulsa Lista de comprobación. En iPhone, toca ese botón y escribe los puntos, con Retorno entre ellos. Marca cada uno solo después de comprobarlo.</p>
 <p>En el Mac, Formato, Más, Anular todo reinicia la lista para otra revisión. Consulta las <a href="/blog/apple-notes-templates" hrefLang="en">plantillas de Notas</a> (en inglés) para guardar un modelo vacío.</p>
 <h2 id="pruebas">Guarda pruebas que puedas encontrar</h2>
 <p>Añade un logro cuando termine el trabajo. Separa tu aportación del resultado del equipo y especifica el período de cada cifra. Guarda el título de la fuente o un enlace. Conserva en tus notas personales solo la información laboral que tengas permiso para guardar.</p>
 <Keep title="Índice opcional de pruebas" text={EVIDENCE} copyLabel={ui.copy} note="Hay un tabulador entre fecha y prueba. Pega el bloque debajo y conviértelo en tabla." />
 <Paths rows={[{on:"Mac",steps:["Formato","Tabla"]}]} />
 <p>En el Mac, pega las cuatro líneas, selecciónalas y pulsa Tabla. Cada tabulador separa una columna. También puedes usar Formato, Tabla y escribir las celdas. Tabulador en la última celda añade una fila. En iPhone, añade una tabla y escribe los datos. Consulta la <a href="/blog/apple-notes-tables" hrefLang="en">guía de tablas</a> (en inglés).</p>
 <h2 id="adaptar">Elige los datos para una candidatura</h2>
 <p>En el Mac, elige Archivo, Duplicar nota y pon a la copia el puesto y la fecha. Conserva el original. Para operaciones de soporte, Lucía pondría primero la lista de clasificación y los informes. Para formación, destacaría la guía de incorporación.</p>
 <p>Comprueba cada logro con su prueba. La mejora del tiempo de respuesta pertenece al equipo; Lucía no debe atribuírsela entera. Quita informes internos y la lista de comprobación de la copia para la empresa. Lleva las candidaturas aparte con la <a href="/es/blog/plantilla-busqueda-de-empleo-notas">plantilla de búsqueda de empleo</a>.</p>
 <h2 id="limites">Hasta dónde llega</h2>
 <p>Esta nota contiene más detalle del que necesita una empresa. Termina el currículum en un editor de documentos y revisa saltos de página, espacios y archivo final. Respeta el formato pedido. La plantilla no promete una puntuación en sistemas de selección ni un PDF de una página.</p>
 <h2 id="pinto">Pide un borrador aparte a tu IA</h2>
 <p>En Pinto Notes, <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conecta ChatGPT o Claude</a> para que lea y edite tus notas. Pídele que lea el historial y la oferta y guarde otra nota con los logros pertinentes. Indícale que no cambie el original y que señale los datos que falten sin inventar cifras ni competencias.</p>
 <p>Comprueba el borrador, sobre todo fechas y créditos compartidos. Pinto conserva las versiones anteriores. Termina el currículum en un editor de documentos. Puedes traer las notas de Apple con <a href="/blog/move-from-apple-notes" hrefLang="en">una importación en el Mac</a> (en inglés); Notas de Apple no cambia. La app está en inglés.</p>
 </LocalPostPage>;
}

