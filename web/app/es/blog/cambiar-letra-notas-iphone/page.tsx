import { LocalPostPage, localPostMetadata } from "@/lib/i18n/LocalPostPage";
import { UI } from "@/lib/i18n/blog";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = localPostMetadata("es", "cambiar-letra-notas-iphone");
// Versión de /blog/apple-notes-font. Google autocomplete, hl=es, gl=es, 21 Nov 2026:
// "cambiar letra notas iphone" ofreció "cambiar tamaño letra notas iphone",
// "cambiar color letra notas iphone" y "cambiar letra en notas iphone".
// Apple, leído el 21 Nov 2026: support.apple.com/es-es/guide/notes/apd1955d3b21/mac
// (Tipo de letra > Mostrar tipos de letra); /apd97da26aed/mac (Tamaño de texto por omisión);
// /apd8b73d28be/mac (zoom); /guide/mac-help/mchlp2544/mac (Color del texto);
// /guide/iphone/iph1ac0b3a2/ios (Formato); /iph3c076905a/ios (Texto más grande);
// /iph1f48544ab/ios (Ajustes por app).
const ui = UI.es;
const FAQ = [
  {q:"¿Cómo aumento la letra de Notas en el iPhone?",a:["Ve a Ajustes (Configuración en algunos países), Accesibilidad, Pantalla y tamaño del texto, Texto más grande. Mueve el regulador. Para ajustar solo Notas, añádela en Ajustes por app."]},
  {q:"¿Puedo cambiar el tipo de letra en Notas para Mac?",a:["Sí. Selecciona texto, haz clic con Control y elige Tipo de letra > Mostrar tipos de letra. Cambia el tipo en la ventana que se abre. El tamaño por omisión de todas las notas se controla por separado."]},
  {q:"¿Cómo cambio el color de la letra?",a:["En Mac, selecciona texto, abre Tipo de letra > Mostrar tipos de letra y usa “Color del texto”. La guía de iPhone documenta el resaltado, pero no esa misma ventana de colores."]},
  {q:"¿Por qué una nota nueva empieza con letras grandes?",a:["En Mac, revisa la opción que decide cómo empiezan las notas nuevas en los ajustes de Notas. El tamaño de texto por omisión es otro control y afecta al tamaño de visualización de todas las notas."]},
];
export default function Page() { return <LocalPostPage lang="es" slug="cambiar-letra-notas-iphone"
  intro={<>En Mac puedes cambiar el tipo de letra del texto seleccionado desde el menú contextual. En iPhone, usa Formato para los estilos y los ajustes de accesibilidad para aumentar el tamaño del texto.</>}
  answer={<Answer label={ui.shortAnswer} jumpTo={ui.jumpTo} jump={[{href:"#tipo-mac",label:"Tipo en Mac"},{href:"#tamano-mac",label:"Tamaño en Mac"},{href:"#iphone",label:"iPhone"},{href:"#color",label:"Color"}]}>
    <p>En Mac, selecciona texto y elige Tipo de letra &gt; Mostrar tipos de letra para cambiar su fuente. Para agrandar todas las notas, usa “Tamaño de texto por omisión” en los ajustes de Notas. En iPhone, usa Ajustes, Accesibilidad, Pantalla y tamaño del texto, Texto más grande. Dentro de una nota, Formato aplica encabezados, negrita o cursiva.</p>
    <PostCta slug="es/cambiar-letra-notas-iphone" path="/es/blog/cambiar-letra-notas-iphone" position="answer" ui={ui.cta} title="Deja que tu IA trabaje en tus notas"><p>Pinto Notes se parece a Notas en iPhone y Mac. Al conectar ChatGPT o Claude, pueden leer y editar tus apuntes, y Pinto conserva las versiones anteriores.</p></PostCta>
  </Answer>} faq={FAQ}>
  <h2 id="tipo-mac">Cambiar el tipo de letra en Mac</h2>
  <MenuPaths rows={[{on:"Texto seleccionado",steps:["Clic con Control","Tipo de letra","Mostrar tipos de letra"]}]} />
  <Steps><li>Abre la nota y selecciona el texto.</li><li>Haz clic con Control en la selección y elige Tipo de letra &gt; Mostrar tipos de letra.</li><li>Elige una fuente y un tamaño en la ventana “Tipos de letra”.</li></Steps>
  <p>El cambio afecta a la selección. Apple documenta la ruta en <a href="https://support.apple.com/es-es/guide/notes/apd1955d3b21/mac">Dar formato a notas en Mac</a>. Para encabezados y negrita también puedes usar el botón de formato de la nota.</p>
  <h2 id="tamano-mac">Aumentar el texto de todas las notas en Mac</h2>
  <p>Abre los ajustes de Notas y mueve el regulador “Tamaño de texto por omisión”. Cambia el tamaño de visualización en todas las notas. Para acercar solo una, usa los controles de zoom del menú Visualización. Apple los explica en <a href="https://support.apple.com/es-es/guide/notes/apd8b73d28be/mac">Ver notas en el Mac</a>.</p>
  <p>La opción que decide cómo empiezan las notas nuevas elige el estilo del primer párrafo. Es distinta del tamaño de texto por omisión. Ambas figuran en los <a href="https://support.apple.com/es-es/guide/notes/apd97da26aed/mac">ajustes de Notas</a>.</p>
  <h2 id="iphone">Cambiar el tamaño en el iPhone</h2>
  <MenuPaths rows={[{on:"Todas las apps compatibles",steps:["Ajustes","Accesibilidad","Pantalla y tamaño del texto","Texto más grande"]},{on:"Solo Notas",steps:["Ajustes","Accesibilidad","Ajustes por app","Añadir app","Notas"]}]} />
  <Steps><li>Abre Ajustes (Configuración en algunos países), Accesibilidad, Pantalla y tamaño del texto.</li><li>Toca “Texto más grande” y ajusta el regulador.</li><li>Activa “Tamaños más grandes” si necesitas ampliar más.</li></Steps>
  <p>Afecta a las apps compatibles, incluida Notas. También puedes activar “Texto en negrita”. La <a href="https://support.apple.com/es-es/guide/iphone/iph3c076905a/ios">guía de legibilidad</a> explica estos controles. Para modificar solo Notas, entra en Accesibilidad, Ajustes por app, toca “Añadir app” y elige Notas. Apple documenta estos <a href="https://support.apple.com/es-es/guide/iphone/iph1f48544ab/ios">ajustes por app</a>.</p>
  <h2 id="estilos">Encabezados y estilos en iPhone</h2>
  <p>En una nota, toca Formato para aplicar encabezado, negrita, cursiva o resaltado. Para dividir una nota larga, selecciona el título de una sección y elige Encabezado o Subtítulo. Apple explica los pasos en <a href="https://support.apple.com/es-es/guide/iphone/iph1ac0b3a2/ios">Crear y aplicar formato a notas</a>. Si todo el texto resulta pequeño, usa los ajustes de tamaño anteriores. Hay <a href="/es/blog/plantilla-recetas-notas-iphone">plantillas de recetas</a> que puedes copiar como ejemplo.</p>
  <h2 id="color">Cambiar el color o resaltar texto</h2>
  <p>En Mac, selecciona texto y abre la ventana “Tipos de letra”. Haz clic en la paleta “Color del texto” y elige uno en la ventana Colores. Apple describe ese control en su <a href="https://support.apple.com/es-es/guide/mac-help/mchlp2544/mac">guía de tipos de letra</a>.</p>
  <p>Para resaltar en Mac, selecciona texto y usa el botón de resaltado del formato; el círculo de al lado permite cambiar el color. En iPhone, Formato incluye resaltado, pero Apple no indica allí la misma ruta de color de letra que en Mac.</p>
  <h2 id="limites">Qué permite cada dispositivo</h2>
  <p>La guía de iPhone muestra estilos y tamaño de visualización, pero no un selector de fuentes como la ventana del Mac. En Mac, algunos formatos dependen de la cuenta: los estilos de párrafo requieren notas en iCloud o guardadas en el Mac.</p>
  <h2 id="pinto">Si también quieres editar con IA</h2>
  <p>Pinto Notes funciona en iPhone y Mac, guarda notas en Markdown y conserva versiones anteriores. Al <a href="/blog/connect-chatgpt-to-your-notes" hrefLang="en">conectar ChatGPT o Claude</a>, pueden leerlas y editarlas. Tus Notas de Apple se <a href="/blog/move-from-apple-notes" hrefLang="en">importan en un Mac</a> sin modificarlas.</p>
</LocalPostPage>; }
