import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const CURSO_SLUG = "customer-experience-estrategia";

type LeccionSeed = {
  slug: string;
  titulo: string;
  descripcion: string;
  contenido: string;
  minutos: number;
};

type ModuloSeed = {
  titulo: string;
  descripcion: string;
  lecciones: LeccionSeed[];
};

const MODULOS: ModuloSeed[] = [
  {
    titulo: "Fundamentos de X Management",
    descripcion:
      "CX no es un departamento ni un conjunto de herramientas: es una forma de pensar y actuar de toda la organizacion.",
    lecciones: [
      {
        slug: "marketing-vs-customer-experience",
        titulo: "Marketing vs Customer Experience: la brecha real",
        descripcion:
          "Marketing promete, la organizacion cumple. La distincion que atraviesa todo el curso.",
        minutos: 7,
        contenido: `## Marketing vs Customer Experience: la brecha real

El marketing promete. La organizacion cumple. Esta distincion es el punto de partida de todo el curso.

> **Concepto clave - La ecuacion basica**
>
> **Marketing:** genera expectativa. Disena propuesta de valor, posicionamiento, campana, promesa. Es quien atrae.
>
> **Customer Experience:** cumple esa expectativa. Opera, entrega, atiende, resuelve, responde por fallas. Es quien retiene (o pierde).
>
> Cuando marketing y experience estan desalineados, el cliente vive una decepcion: me prometieron X, recibi Y. **Ahi nace el detractor.**

### Datos: dos mundos distintos

| Marketing | Customer Experience |
|---|---|
| Data sociodemografica (edad, NSE, distrito) | Data comportamental (cada interaccion, cada queja) |
| Estudios puntuales (focus, encuestas) | Cientos de miles de interacciones diarias |
| Top of mind, recordacion, posicionamiento | NPS, CES, INS, BCX por transaccion |
| Analiza arquetipos y segmentos | Conoce el caso individual |
| Opera desde oficina / agencia | Opera en punto de contacto, 24/7, todos los canales |

> **Reflexion**
>
> Nadie conoce mejor al cliente que Customer Experience, porque maneja cada interaccion, queja, grabacion y chat. El problema: muchas veces esa area no lo sabe o no lo explota. Un call center con 500,000 llamadas al mes de 17 minutos promedio es una mina de informacion que casi nadie esta minando.`,
      },
      {
        slug: "la-x-multiples-experiencias",
        titulo: "La X: multiples experiencias bajo un paraguas",
        descripcion:
          "Por que la letra X deliberadamente quita el foco exclusivo del cliente final.",
        minutos: 5,
        contenido: `## La X: multiples experiencias bajo un paraguas

La letra X en "X Management" es intencional: quita la responsabilidad exclusiva del "customer". Si solo miramos al cliente final, nos perdemos todo el ecosistema que hace posible (o imposible) esa experiencia.

> **Concepto clave - Las experiencias que X Management gobierna**
>
> - **Brand Experience** — lo que proyecta la marca.
> - **Product Experience** — lo que se siente al usarlo.
> - **Employee Experience** — lo que vive el colaborador.
> - **Customer Experience** — lo que vive el cliente final.
> - **User Experience** — interaccion con producto/plataforma.
> - **Supplier Experience** — como te tratan tus proveedores y como los tratas.
> - **Ecosystem / Stakeholder Experience** — todos los actores indirectos.

Todas estas se gestionan con una misma filosofia, estrategia y gobierno. Separarlas en areas independientes (una persona de marca por aca, otra de CX por alla, otra de UX por otro lado, RRHH en su silo) es la receta para que la compania entregue experiencias incoherentes.`,
      },
      {
        slug: "senales-patrones-tendencias-comportamientos",
        titulo: "Senales, patrones, tendencias y comportamientos",
        descripcion: "El vocabulario central del experto en CX.",
        minutos: 4,
        contenido: `## Senales, patrones, tendencias y comportamientos

> **Concepto clave**
>
> - **Senal:** un dato individual — una queja, una llamada, un comentario.
> - **Patron:** una senal que se repite — varios clientes se quejan de lo mismo.
> - **Tendencia:** un patron sostenido con direccion clara.
> - **Comportamiento:** suma de tendencias que define como el cliente actua, compra, se queda o se va.

El trabajo del experto en CX es leer esta cadena: desde las senales individuales hasta identificar los comportamientos de fondo. Los buenos ejecutivos de marketing ya son buenos leyendo senales; la diferencia en CX es el **volumen de data y la granularidad** — cada interaccion es una oportunidad de lectura.`,
      },
      {
        slug: "cuatro-culturas-organizacionales",
        titulo: "Las 4 culturas organizacionales (modelo Cameron)",
        descripcion:
          "Jerarquica, mercado, clan, adocratica. No se elige, se hereda — pero se entiende.",
        minutos: 7,
        contenido: `## Las 4 culturas organizacionales (modelo Cameron)

Kim Cameron y Robert Quinn identificaron 4 tipos basicos de cultura organizacional. **No se elige, se hereda.** Pero si se puede entender en cual estas parado.

> **Las 2 dimensiones**
>
> Vertical: flexibilidad vs control. Horizontal: orientacion interna vs externa.

| Cultura | Ejes | Descripcion | Motivador |
|---|---|---|---|
| Jerarquica | Control + Interna | Protocolos, manuales, auditorias, reportes. Piramide rigida. | Seguridad |
| Mercado | Control + Externa | Ritmo fuerte, competencia interna, obsesion por resultados. | Logro |
| Clan | Flexible + Interna | Familiar, colaborativa, celebraciones, lideres cercanos. | Pertenencia |
| Adocratica | Flexible + Externa | Alta innovacion, velocidad, empoderamiento, desafios. | Desafios |

> **Donde florece CX**
>
> Las culturas **adocraticas** son donde mas naturalmente crece CX: flexibilidad + orientacion externa = innovacion con foco en cliente. Google, Tesla, Meta, SpaceX. Las jerarquicas y de mercado pueden trabajar CX, pero cuesta mas. Las de clan a veces ocultan ineficiencia bajo el paternalismo.

> **Reflexion - No hay culturas buenas ni malas**
>
> Las culturas no son buenas ni malas — son las que tenemos. Tu trabajo no es pelearte con la cultura, es entender en cual estas y mover las cosas desde ahi. Si tu empresa es una clinica centenaria o un banco regulado, no pretendas trabajar como startup de Palo Alto. Hay estilos de liderazgo y momentos de negocio. Entiende el tuyo.`,
      },
      {
        slug: "autonomia-empoderamiento",
        titulo: "Autonomia y empoderamiento: la columna de CX",
        descripcion:
          "Sin autonomia en el front, la experiencia muere en la fila de aprobaciones.",
        minutos: 5,
        contenido: `## Autonomia y empoderamiento

En un mundo de experiencia, la autonomia lo es todo. Si un colaborador tiene que pedirle a su jefe, y al gerente, y al director para aprobar una devolucion de $50 — la experiencia ya murio.

> **Concepto clave - La escalera de decision adocratica**
>
> Compania adocratica bien disenada:
> - Colaborador en front: decisiones hasta $500 sin pedir permiso.
> - Supervisor/coordinador: hasta $1,500.
> - Jefe de area: hasta $5,000.
> - Niveles superiores segun impacto.

Esto no es regalar dinero. Si Manuel toma una decision de $500, Manuel va a explicar por que. Nadie lo despide, pero hay feedback y formacion. Ese mecanismo construye criterio y protege al negocio.

### Por que falla la experiencia sin autonomia

- Procesos bloqueados, firmas redundantes.
- Politicas contradictorias que desautorizan al front-line.
- CX como departamento aislado, no cultura.
- La compania no puede tomar decisiones rapidas.

> **Tip - Dos caminos para construir CX**
>
> 1. **Bottom-up (fogata fuerte):** equipos pequenos convencidos que contagian. Lento pero sostenible.
> 2. **Top-down (gran lider):** el CEO cree, lo pone en agenda del directorio, baja a toda la organizacion. Rapido pero depende de esa persona.
>
> La combinacion es lo ideal: lider arriba + fogatas abajo. Sin alguna, la experiencia no prende.`,
      },
    ],
  },
  {
    titulo: "Estrategia y diferenciacion",
    descripcion:
      "FODA, angulos de ataque, oceanos azules, piramide de atributos — con lente de experiencia.",
    lecciones: [
      {
        slug: "matriz-fo-fa-do-da",
        titulo: "Matriz estrategica FO / FA / DO / DA",
        descripcion: "Los 4 cuadrantes del FODA y la estrategia resultante.",
        minutos: 4,
        contenido: `## Matriz estrategica: FO, FA, DO, DA

El FODA clasico (Fortalezas, Oportunidades, Debilidades, Amenazas) se cruza en 4 cuadrantes que definen la estrategia.

| Cruce | Estrategia | Logica |
|---|---|---|
| FO — Fortalezas + Oportunidades | Ofensiva / Ataque | Tengo potencia, mercado abre puerta. Ataco. |
| FA — Fortalezas + Amenazas | Defensiva | Tengo potencia, entorno hostil. Protejo. |
| DO — Debilidades + Oportunidades | Adaptabilidad | Veo camino, no estoy listo. Construyo capacidad. |
| DA — Debilidades + Amenazas | Ataque o defensa reactiva | Situacion critica: sobrevivir. |

> **Regla ejecutiva**
>
> Marketing utiliza fortalezas, corrige debilidades, aprovecha oportunidades, se protege de amenazas. Eso es estrategia pura. Pero para hacer CX, antes hay que saber como esta mi organizacion: **atacando, defendiendo o adaptandome.** La estrategia de experiencia se disena diferente en cada cuadrante.`,
      },
      {
        slug: "matriz-angulos-ataque",
        titulo: "Matriz de angulos de ataque: oferta vs necesidades",
        descripcion:
          "Proteger, diferenciar, explorar o neutralizar: donde juega tu marca.",
        minutos: 4,
        contenido: `## Matriz de angulos de ataque

Mapa concreto que cruza dos ejes: **lo que tu compania ofrece** y **las necesidades reales del cliente.**

> **Concepto clave - Los 4 cuadrantes**
>
> - **Proteger:** ya tienes atributo fuerte, evita que el competidor se acerque.
> - **Diferenciar:** el cliente valora algo que el competidor no ofrece — refuerza esa zona.
> - **Explorar:** necesidades que nadie cubre — ahi hay oceanos azules.
> - **Neutralizar:** el competidor tiene un atributo que te afecta — anula esa ventaja.

La experiencia de cliente vive en el **cuadrante de diferenciacion.** Si estas en paridad, compites por precio. Si estas en exploracion, innovas. La matriz te obliga a preguntarte: **en que juego estoy?**`,
      },
      {
        slug: "oceanos-azules-circo-del-sol",
        titulo: "Oceanos rojos vs Oceanos azules (caso Circo del Sol)",
        descripcion:
          "Las 4 acciones para salir del mar ensangrentado y crear tu propio oceano.",
        minutos: 8,
        contenido: `## Oceanos azules vs rojos

> **Concepto clave**
>
> **Oceano rojo:** mar ensangrentado donde todos pescan lo mismo. Muchos competidores, precios bajos, licitaciones. No decides tu precio; te lo pone el mercado.
>
> **Oceano azul:** mar donde pescas solo. Defines el precio, capturas valor, la competencia no te alcanza porque juegas un juego distinto. (Kim & Mauborgne, 2005)

### Las 4 acciones para crear un oceano azul

Sobre los atributos que definen una categoria, solo se pueden hacer 4 cosas:

1. **Reducir:** bajar intensidad de un atributo.
2. **Crear:** agregar atributos que la categoria no tiene.
3. **Incrementar:** potenciar atributos existentes pero poco desarrollados.
4. **Eliminar:** quitar atributos que la categoria asume como obligatorios.

### Caso - Circo del Sol: la reinvencion de una industria

El circo tradicional (Ringling Bros., Gasca, Dumbo) tenia: precio bajo, estrellas con nombre propio, animales, ventas en pasillos, humor de payasos, acrobatas, carpa, musica popular.

Cuando nace el Circo del Sol (Montreal, 1984) aplica las 4 acciones:

- **ELIMINO:** estrellas con nombre (todos disfrazados), animales, ventas de pasillo, humor bufonesco.
- **REDUJO:** acrobatas tradicionales.
- **INCREMENTO:** el precio (de $150 a $2,000 USD, multiplicando por 1000). La produccion. La carpa como experiencia.
- **CREO:** hilo argumental (cada show es una historia, casi opera). Musica original. Valores artisticos. Producciones tematicas.

**Resultado:** 5 anos consecutivos como el mejor circo del mundo. Salieron del oceano rojo del circo tradicional y crearon un oceano azul: **el circo como teatro artistico de alto valor.**`,
      },
      {
        slug: "piramide-atributos",
        titulo: "Piramide de atributos: excelencia, mejores, existentes",
        descripcion:
          "Una de las herramientas mas potentes. Los atributos de excelencia no los dices tu — los dicen los clientes.",
        minutos: 6,
        contenido: `## Piramide de atributos

Toda compania tiene atributos. El trabajo es clasificarlos con honestidad.

> **Concepto clave - Los 3 niveles**
>
> **Nivel 3 — Excelencia (cuspide):** atributos unicos, verdaderamente diferenciadores. **La clave: NO los dices tu. Los dicen los clientes y los reconoce la competencia.**
>
> **Nivel 2 — Mejores:** sobresales pero no eres unico. Otros los tienen en menor grado.
>
> **Nivel 1 — Existentes (base):** atributos basicos que toda compania del sector tiene (marca, capital, tecnologia, empleados, CRM). Necesarios pero no diferenciadores.

### La prueba de un atributo de excelencia

Cuando un alumno dice "nuestro recurso humano es diferenciador", pregunta: **lo dicen tus clientes? Lo reconoce tu competencia?** Casi siempre no. Partimos del error de que la competencia no capacita, no tiene buen personal, no tiene sistemas. Y no es cierto.

- Un atributo de excelencia es reconocido por clientes sin que preguntes.
- Si preguntas a 500 agencias de tu competencia si hacen lo mismo y dicen "si" — no es excelencia.
- Los atributos de excelencia son **pocos**. Si tu piramide tiene 15, algo esta mal.

> **Tip - Como llenar tu piramide sin autoengano**
>
> 1. Lista todos los atributos (cobertura, precio, equipo, tecnologia, marca, atencion).
> 2. Para cada uno: lo tiene mi competencia principal? Si "si igual o parecido" = nivel 1.
> 3. Si "un poco mejor" = nivel 2.
> 4. Solo sube a nivel 3 los que pasen prueba de clientes + competencia.
>
> Una piramide con 2-3 atributos de excelencia reales vale mas que una con 10 supuestos.`,
      },
      {
        slug: "tres-categorias-atributos",
        titulo: "Las 3 categorias de atributos: marca, producto, interaccion",
        descripcion:
          "Uno de los errores mas frecuentes: confundir que categoria tiene cada atributo.",
        minutos: 6,
        contenido: `## Las 3 categorias de atributos

Los atributos NO son todos iguales — se agrupan en tres grupos que se gestionan de forma distinta.

> **Concepto clave**
>
> **Atributos de MARCA:** lo que el cliente percibe antes de contratar o comprar. Solidez, confianza, prestigio, proposito, valores, presencia.
>
> **Atributos de PRODUCTO:** precio, portafolio, cobertura, planes, caracteristicas funcionales.
>
> **Atributos de INTERACCION:** atencion al cliente, transparencia, gestion de reclamaciones, agilidad, accesibilidad, canales, personalizacion.

### Ejemplo: compania de telecomunicaciones

| Categoria | Atributos |
|---|---|
| Marca | Solidez financiera, Reputacion, Confianza, Liderazgo |
| Producto | Precio, Portafolio (prepago/postpago/banda/TV), Cobertura, Planes familiares, Roaming |
| Interaccion | Atencion, Transparencia, Gestion de reclamos, Agilidad, Accesibilidad multicanal |

> **Alerta - Por que esta division importa**
>
> Si mides NPS bajo, es por marca, producto o interaccion? El NPS clasico revuelve los tres y no te dice donde esta el problema. Con buena marca y producto pero interaccion deficiente, vas a bajar NPS sin saber por que. Mas adelante veremos el BCX — que si distingue las tres categorias.

> **Tip - Cuidado con el "atributo-paraguas"**
>
> "Atencion al cliente" no es un atributo — es un paraguas. Debajo hay 8-10 atributos: canales, tiempo de respuesta, transparencia, flexibilidad, personalizacion, gestion de reclamos, accesibilidad, autonomia del agente. Desglosa los paraguas. Un atributo es bueno cuando puedes medirlo individualmente.`,
      },
    ],
  },
  {
    titulo: "Construccion de propuesta de valor",
    descripcion:
      "Casos reales y marcos conceptuales para entender donde se construye la verdadera diferenciacion.",
    lecciones: [
      {
        slug: "caso-pepephone-6-principios",
        titulo: "El caso Pepephone: 6 principios de cliente",
        descripcion:
          "Una telco espanola que construyo su posicionamiento haciendo lo contrario que el sector.",
        minutos: 7,
        contenido: `## El caso Pepephone: 6 principios que redefinen una industria

Pepephone es una compania espanola de telecomunicaciones que hizo lo contrario de lo que hace todo el sector. Dominado por Vodafone, Movistar y Orange (gigantes), Pepephone construyo su posicionamiento sobre 6 principios — un manual de experiencia.

> **Los 6 principios de Pepephone**
>
> **1.** Si bajamos el precio, lo bajamos primero a los clientes que ya tenemos. Promocion de captacion a 90 €? Los actuales que pagan 150 reciben el ajuste automatico.
>
> **2.** Si el servicio falla, te indemnizamos de oficio. No tramitas reclamacion, no demandas. Detectamos el error y abonamos a tu factura.
>
> **3.** Una sola persona resuelve tu problema. Quien responde tiene empoderamiento para resolver todo antes de colgar. Nada de "le transfiero al area especializada".
>
> **4.** Si te quieres ir, nadie te llamara para humillarte. No hay area de retencion que te ofrezca en privado un precio que antes no te habian ofrecido.
>
> **5.** No tenemos area de fidelizacion ni club de beneficios. Toda la compania opera bajo un principio: **te hacemos la vida facil siempre, no solo cuando estas por irte.**
>
> **6.** Partimos de un principio de confianza. Si haces reclamo, primero te devolvemos el dinero. Despues investigamos. No te tenemos 90 dias esperando.

> **Por que este caso es potente**
>
> Pepephone no invento servicios nuevos. Tomo decisiones sobre **como opera**, priorizando al cliente actual sobre la captacion. Es una inversion del modelo tradicional donde las companias invierten 80% del presupuesto en captar y desatienden al que ya pago.`,
      },
      {
        slug: "parabola-cliente-balde-con-grifo",
        titulo: "La parabola del cliente y el balde con grifo",
        descripcion:
          "Dos metaforas inolvidables sobre captacion vs retencion.",
        minutos: 6,
        contenido: `## La parabola del cliente

### Fase A y fase B

Dibuja una parabola: una curva que sube, llega a un maximo y baja.

- **Fase A:** todo hasta que el cliente compra — marketing, captacion, seduccion, SEO, ventas, firma. Aqui se concentra presupuesto, esfuerzo, glamour.
- **Punto B:** el cliente compro. La relacion marca-cliente esta en su punto mas cercano: contrato, sonrisa, factura recibida.
- **Fase B (despues):** el cliente vive la experiencia real. La curva baja. Ya no hay presupuesto de marketing ni seduccion. La cuenta esta adentro, se atiende como se pueda.

> **Concepto clave**
>
> Por que reaccionamos tarde? Porque la experiencia real ocurre en fase B, pero la organizacion solo se entera cuando el cliente esta listo para irse — y la decision ya esta tomada. El equipo de retencion llega a salvar una relacion que ya murio. **CX no es apagar incendios en fase B: es cerrar el grifo en fase A y redisenar la fase B.**

### El balde con grifo

Imagina un balde que recibe agua por un grifo (captacion) y tiene fuga por debajo (perdida de clientes).

> **Dos estrategias opuestas**
>
> **Tradicional:** abrir mas el grifo (mas marketing, mas campanas). Pero si la fuga sigue abierta, el balde nunca se llena. Quemas presupuesto infinitamente.
>
> **Experiencia:** **cerrar la fuga primero.** Entender por que los clientes se van y arreglarlo. Cuando la fuga se cierra, con el mismo grifo el balde se llena mas rapido.

Los clientes se van por:
- La promesa de marca no se cumple.
- Maltrato en algun punto del journey.
- Expectativas sobredimensionadas.
- Friccion innecesaria (procesos burocraticos, transferencias).
- Competidores con mejor propuesta.

**Si cierras esas fugas, ya no necesitas triplicar el presupuesto de marketing.**`,
      },
      {
        slug: "ceo-chief-emotional-officer",
        titulo: "CEO redefinido como Chief Emotional Officer",
        descripcion: "La experiencia se gobierna desde arriba, con el ejemplo.",
        minutos: 4,
        contenido: `## CEO = Chief Emotional Officer

La sigla CEO tradicionalmente significa Chief Executive Officer. En X Management se redefine: **Chief Emotional Officer.**

> **Por que importa**
>
> Hoy los gerentes generales no pueden trabajar aislados en el piso 18. La experiencia se gobierna desde arriba, con el ejemplo. **Un comite de experiencia sin el CEO presente es un comite decorativo.** Si el CEO no cree, la compania tampoco creera.

### Que debe hacer un CEO con enfoque emocional

- Estar en comites de experiencia **personalmente**, no delegar.
- Convocar a todas las areas que impactan experiencia: marketing, CX, tecnologia, finanzas, RRHH, operaciones, legal.
- Dar el ejemplo en como se atienden clientes (visitar tiendas, atender llamadas, leer reclamos).
- Hacer que los indicadores (NPS, CES, permanencia) entren al scorecard de **todos los gerentes**, no solo del de CX.
- Asignar presupuesto real a iniciativas de experiencia, no solo a marketing.`,
      },
      {
        slug: "tres-niveles-experiencia-cx-xm-bx",
        titulo: "Los 3 niveles de experiencia: CX, XM, BX",
        descripcion: "Madurez de CX a Business Experience, sin saltar niveles.",
        minutos: 5,
        contenido: `## Los 3 niveles de experiencia

| Nivel | Sigla | Descripcion |
|---|---|---|
| 1. Customer Experience | CX | Experiencia con vinculos emocionales. Funciona para toda la organizacion pero esta acotado. |
| 2. X Management | XM | Integra marca, producto, interaccion, accionistas, colaboradores, ecosistema. |
| 3. Business Experience | BX | Obsesion total por el cliente. El nivel mas maduro y mas poderoso. |

> **No saltarse niveles**
>
> Si tu organizacion esta en nivel cero (reactivo, apagando incendios), no pretendas saltar a BX. Construye primero CX solido: escucha, diseno, mediciones. Luego sumas actores del ecosistema para XM. BX llega cuando la cultura respira cliente sin pensarlo. **Forzar el salto es receta para desgaste.**`,
      },
      {
        slug: "fix-me-surprise-me-kano",
        titulo: "Fix me vs Surprise me: el diagrama Kano",
        descripcion:
          "Dos filosofias complementarias y las 5 categorias de atributos de Kano.",
        minutos: 7,
        contenido: `## Fix me vs Surprise me

> **Concepto clave - Las dos filosofias**
>
> **Fix me (arreglame):** cumple lo basico que prometiste. Que el avion despegue a tiempo, la web funcione, las maletas lleguen, la factura no tenga error. Higiene operativa. **Invisibles si estan bien; destruyen la relacion si fallan.**
>
> **Surprise me (sorprendeme):** disena momentos memorables, inesperados. Innovacion, wow moments. Construye vinculo emocional profundo.

**Frase resumen:** "Cumpleme lo que prometes y, si puedes, sorprendeme." Primero lo basico, despues lo memorable. Pretender sorprender sin cumplir lo basico es construir sobre arena.

### El diagrama Kano — las 5 categorias

| Tipo | Si falta | Si esta |
|---|---|---|
| Basicos (higienicos) | Insatisfaccion | Nada (asumidos) |
| Deseados (desempeno) | Insatisfaccion proporcional | Satisfaccion lineal |
| Atractivos | Neutral | Sorpresa positiva |
| Indiferentes | Neutral | Neutral |
| Inversos | Neutral | Insatisfaccion en algunos |

### El vuelo perfecto

Compras vuelo. Web funciona, sillas, maletas, pagos, voucher en 2 min, tiquete, seguimiento, factura, web check-in, llegas al aeropuerto, dejas maleta, azafata saluda, counter, despegue con 15 min de tolerancia, silla correcta, aterrizaje, maleta entregada.

Si todo es perfecto, **cuan satisfecho estas? CERO.** Era lo que esperabas. Expectativa 50, vivencia 50. Satisfaccion = 0.

Si todo eso es higienico, donde destacas? En momentos atractivos: la azafata te llama por tu nombre, te ofrecen bebida que no esperabas, resuelven antes de que lo notes. **Ahi esta el surprise me.**

> **Tip - Donde invertir**
>
> Muchas companias no cumplen el fix me consistentemente y ya invierten en surprise me. **Es un error.** Primero cierra las fugas basicas (el grifo del balde) y recien entonces invierte en experiencias memorables.`,
      },
    ],
  },
  {
    titulo: "BOC y metricas de experiencia",
    descripcion:
      "El sistema de medicion, escucha y accion. El corazon de la disciplina.",
    lecciones: [
      {
        slug: "cuatro-patas-mesa-xm",
        titulo: "Las 4 patas de la mesa de X Management",
        descripcion: "Estrategia, BOC, Economics, Gobierno — si una falla, la mesa cae.",
        minutos: 4,
        contenido: `## Las 4 patas de la mesa

Toda organizacion madura en experiencia se para sobre una mesa con 4 patas. Si una falla, la mesa cae.

> **Las 4 patas**
>
> 1. **ESTRATEGIA:** sin ella, cualquier camino te lleva a cualquier destino. Define el norte.
> 2. **BOC (Bonds of the Customer):** medicion y escucha. Toda la inteligencia del cliente vive aca.
> 3. **ECONOMICS:** la pata financiera. Sin numeros no hay inversion ni sostenibilidad.
> 4. **GOBIERNO CORPORATIVO:** quien manda, decide, responde. Sin gobierno no se sostiene.

Sobre estas 4 patas se construyen las tapas: tecnologia (pata movil), colaboradores (base) y el resto de experiencias que gobiernas (marca, producto, ecosistema).`,
      },
      {
        slug: "sindrome-pato-stanford",
        titulo: "El sindrome del pato de Stanford",
        descripcion:
          "La calma aparente y el esfuerzo oculto que agota a clientes y organizacion.",
        minutos: 4,
        contenido: `## El sindrome del pato de Stanford

Un pato nadando en un lago. Vista desde arriba: calma total. Vista bajo el agua: las patas se mueven a velocidad brutal para mantenerse a flote.

> **Concepto clave**
>
> La organizacion parece tranquila a ojos de inversionistas y directivos, pero la realidad operativa es un esfuerzo frenetico y agotador. Ese esfuerzo oculto es el **customer effort** — el costo real de mantener la experiencia aparente.

Este sindrome esta en casi toda organizacion que no mide bien. Los jefes ven el pato arriba ("tranquilo"), los ejecutivos sienten el esfuerzo abajo. Por eso hay que medir el customer effort — **cuanto le cuesta al cliente y cuanto le cuesta a la organizacion cada interaccion.**`,
      },
      {
        slug: "low-data-vs-data-experiencia",
        titulo: "Low data operacional vs data de experiencia",
        descripcion:
          "Por que estas lleno de datos pero ciego respecto al cliente.",
        minutos: 4,
        contenido: `## Low data vs data de experiencia

| Low data (operacional) | Data de experiencia |
|---|---|
| Datos de ERP, CRM, Salesforce, SAP, HubSpot | Qualtrics, Medallia, encuestas, voz del cliente |
| Que consume, cuanto compra, en que canal | Que siente, que vive, que opina |
| Ciclos, rentabilidad, edad, genero | Senales, patrones, tendencias, comportamientos |
| Interna, trazable, estructurada | Externa, voz real, a veces desestructurada |
| Toda la organizacion la tiene | Muy pocas la tienen bien |

> **El gran problema**
>
> Las companias estan llenas de low data pero tienen muy poca data de experiencia. Usan la primera para decisiones, pero esas decisiones son sobre operaciones — no sobre como vive el cliente. **Por eso el ejecutivo con mejor CRM del mundo puede seguir perdiendo clientes: mira el tablero equivocado.**`,
      },
      {
        slug: "nps-profundo-reglas-oro",
        titulo: "NPS profundo: origen, formula y 3 reglas de oro",
        descripcion: "La metrica mas conocida y probablemente la mas mal entendida.",
        minutos: 8,
        contenido: `## NPS profundo

### Origen

Fred Reichheld, consultor de Bain & Co., creo el NPS en 2003 con General Electric. Buscaba una unica metrica capaz de predecir crecimiento sostenido. **La recomendacion fue la mas correlacionada.** Nacio el NPS.

### La formula

Pregunta clasica: "En escala 0-10, que tanto recomendarias esta marca?"
- 0-6 → **Detractores** (hablan mal activamente).
- 7-8 → **Neutrales / Pasivos** (no suman ni restan).
- 9-10 → **Promotores** (recomiendan).

> **Formula**
>
> **NPS = % Promotores − % Detractores**
>
> Los neutrales se anulan. El dato puede dar negativo (mas detractores que promotores) — senal de muerte lenta de la marca.

> **Por que 7 y 8 se anulan**
>
> Reichheld probo que quienes ponen 7-8 no hablan bien ni mal. No generan movimiento. Son pasivos. **Buscamos crear promotores (recomendadores activos), no clientes "satisfechos sin mas".**

### Las 3 reglas de oro

**Regla 1 — No uses promedios.** Si 100 encuestas dan 0, 3, 4, 7, 9, 10... el promedio es 6.1. No sabes cuantos te aman ni cuantos te odian. **NPS no es promedio — es diferencia entre barriles.**

**Regla 2 — No muestres caritas ni colores.** Muchas encuestas ponen carita roja sobre 0-6, verde sobre 9-10. Ilegal en algunos paises y distorsiona: el cliente vota por la carita, no la experiencia. Todos los numeros en color neutro.

**Regla 3 — Agrupa en barriles.** Promotores (9-10), Neutrales (7-8), Detractores (0-6). Los clientes pueden moverse de barril, pero al medir deben estar claramente agrupados.

> **Tip - Puedes adaptar la escala**
>
> Prefieres escala 1-5? Hazlo. En 1-5: 5 = promotor, 3-4 = neutral, 1-2 = detractor. La esencia es la agrupacion, no la escala.

### NPS Relacional vs Transaccional

- **Relacional:** mide relacion completa. Cada 6 meses o anual, fuera de interaccion puntual.
- **Transaccional:** mide interaccion especifica (llamada, compra, reclamo). Inmediatamente despues.

Usar solo transaccional y pensar que es el NPS de la marca es error. Un cliente puede tener llamada 10 pero odiar la marca global. **Hay que medir ambos.**`,
      },
      {
        slug: "nps-1-2-3-adn-organizacional",
        titulo: "NPS 1.0 → 2.0 → 3.0 como ADN organizacional",
        descripcion: "La evolucion del NPS de metrica a sistema a cultura.",
        minutos: 5,
        contenido: `## NPS 1.0, 2.0, 3.0 — la evolucion

Fred Reichheld evoluciono el NPS en 3 grandes etapas.

| Version | Que es | Uso |
|---|---|---|
| NPS 1.0 | Metrica simple. % promotores - % detractores. | Reportar al comite de direccion. |
| NPS 2.0 | Sistema de gestion. El score dispara acciones por segmento. | Gestionar detractores, reforzar promotores, convertir neutrales. |
| NPS 3.0 | ADN organizacional. Toda la compania opera con foco en cliente. | Cultura corporativa completa, con scorecard de bonos atado. |

### NPS 3.0 — los 3 indicadores clave

> **Concepto clave**
>
> 1. **Revenue Round Trips:** ingresos de clientes que regresan por decision propia, sin esfuerzo comercial.
> 2. **Revenue por Referencias:** ingresos de clientes nuevos por recomendacion de promotores. Ventas que se ganan sin marketing.
> 3. **Crecimiento vs Calidad / Gasto de adquisicion:** ratio entre cuanto crece la empresa gracias a experiencia vs cuanto gasta en adquirir.

Si estos 3 estan en cero o muy bajos, tu NPS no es cultura — es metrica que no mueve la aguja. Si crecen, tu cultura de experiencia esta madurando.

### Ejercicio: empresa A vs empresa B

Ambas tienen NPS 10:

| | Empresa A | Empresa B |
|---|---|---|
| Promotores | 10% | 55% |
| Neutrales | 90% | 0% |
| Detractores | 0% | 45% |

> **En cual prefieres trabajar?**
>
> La mayoria elige A ("mas segura"). **Respuesta correcta: B.**
>
> B ya sabe trabajar experiencia: 55% promotores. Tiene cultura, innova, sorprende. Los detractores son sintoma de que intenta cosas grandes. Sabe el camino.
>
> A es plana, sin alma. 90% neutrales = a nadie le importa la marca. **Pasar de neutral a promotor es muchisimo mas dificil que pasar de detractor a promotor** — en A hay que crear cultura desde cero.`,
      },
      {
        slug: "bcx-ins-ces",
        titulo: "BCX, INS, CES: cuando cada uno",
        descripcion:
          "Las metricas hermanas del NPS — cuando elegir cada una.",
        minutos: 6,
        contenido: `## BCX, INS, CES: metricas hermanas del NPS

El NPS es popular pero no perfecto. Tiene detractores academicos. Metricas complementarias suman informacion.

### BCX — Best Customer Experience Index

Creada por ISO. Hace lo que el NPS no: **distingue experiencia de marca, producto e interaccion.** Cuando un cliente puntua mal, el BCX te dice donde esta el problema.

- Correlacion 0.87 con el NPS.
- Se calcula desagregando cada experiencia.
- Permite comparaciones cruzadas entre sectores economicos.

### INS — Indicador Neto de Satisfaccion (CSAT)

> **Formula**
>
> INS = % Satisfechos (8, 9, 10) − % Insatisfechos (1, 2, 3, 4)

Mide satisfaccion puntual con un producto o experiencia. No pregunta recomendacion — pregunta que tan bien cumplio la expectativa. Util para medir cumplimiento de **fix me**.

### CES — Customer Effort Score

Mide cuanto esfuerzo le tomo al cliente resolver un problema. Escala 0 a 5. **Es la metrica directa del pato de Stanford.**

### Caso - El CES del telefono movil con falla

Compras telefono en Lima. Sale con falla. Estas en Arequipa.

"Traelo a la tienda donde lo compraste." "No puedo, estoy en otra ciudad." "Llevalo a tienda local." "Bueno." "Primero linea de soporte tecnico." "No hay en Cusco." "Entonces manda el telefono." Vas a Apple: "Tu primer canal es la telco." Vuelves. Comprobante, factura, serie, formulario. 40 minutos.

CES = 5/5. Cliente absolutamente agotado. Aunque le resuelvan, la experiencia ya lo rompio. **CES alto correlaciona fuertisimo con churn.** El cliente no se queja, se va en silencio.`,
      },
      {
        slug: "comparar-fuera-del-sector",
        titulo: "Como comparar: fuera de tu sector economico",
        descripcion:
          "Por que compararte solo con tus competidores es una trampa.",
        minutos: 5,
        contenido: `## Comparar fuera del sector

Uno de los errores mas comunes: compararse solo con competidores del mismo sector. Parece correcto — "me comparo con otros bancos si soy banco" — pero es trampa.

### Ranking iberoamericano BCX (2023, 65,000 opiniones ISO)

1. Tecnologia
2. Hoteles
3. Deporte y ocio
4. Viajes
... (media tabla) ...
Seguros · Transporte · Telecomunicaciones
**Ultimos:** Utilities (luz, agua, gas) · AFPs

### Caso - BBVA: no pensar como banco

BBVA fue reconocido por ISO como mejor compania de CX en banca del Peru. Se compara solo con Interbank, BCP, Scotiabank? **No.** BBVA mira a Spotify, Amazon, Starbucks, Netflix.

Por que? Porque los clientes de BBVA tambien son clientes de Amazon. Si Amazon entrega en 24 horas, el cliente se pregunta por que BBVA tarda 5 dias en aprobar un credito.

> **Regla ejecutiva**
>
> La experiencia no se compara por sector — se compara por nivel global. "En tierra de ciegos, el tuerto es rey": si solo te comparas con bancos y los bancos estan mal, nunca creces de verdad. **Cada ano elige 3-4 companias de sectores distintos que destaquen en experiencia y analiza que hacen.** Si eres hospital, estudia Disney. Si eres banco, mira Spotify. Si eres retail, aprende de Amazon. No copies funcional — copia el pensamiento.`,
      },
    ],
  },
  {
    titulo: "Diseno y gobierno del BOC",
    descripcion:
      "Como construir el sistema de escucha que sostiene tu experiencia.",
    lecciones: [
      {
        slug: "orquestacion-canales-plataforma-unica",
        titulo: "Orquestacion de canales: la plataforma unica",
        descripcion:
          "Unificar interacciones para que toda la organizacion vea al cliente completo.",
        minutos: 5,
        contenido: `## Orquestacion de canales

### El problema: data fragmentada

En una compania mediana, las interacciones pasan por:
- Contact center, tiendas fisicas.
- Canales digitales (web, app, redes, chatbots).
- Ventas (ejecutivos, vendedores, partners).
- Soporte postventa y servicio tecnico.
- BI, reportes operativos.

**Y faltan areas que deberian tener acceso y no lo tienen:** finanzas, direccion, RRHH, legal. Cada area tiene un pedazo, nadie ve al cliente completo. Resultado: decisiones descoordinadas.

### La solucion: plataforma unificada

| Categoria | Proveedores lideres |
|---|---|
| Mensajeria / Contact center / Voz | Verint, Genesys, Cisco, NICE |
| Social listening | Chronos, Engage, Clarabridge (Qualtrics) |
| Encuestas y feedback | Qualtrics, Medallia, SurveyMonkey |
| CRM / ERP | Salesforce, SAP, HubSpot, Zendesk |

> **Lo que importa no es la marca del software**
>
> La plataforma debe cumplir tres funciones:
> 1. **Unificar** todas las interacciones en un solo lugar.
> 2. **Estructurar** la data para que sea consultable.
> 3. **Ponerla al alcance de toda la organizacion** — no solo CX.
>
> Si tu tecnologia no hace estas tres, no sirve.`,
      },
      {
        slug: "herramientas-escucha",
        titulo: "Herramientas de escucha (focus, mystery, CATI, chatbot, etc.)",
        descripcion:
          "Todas las metodologias son bienvenidas — cada una sirve para algo.",
        minutos: 5,
        contenido: `## Herramientas de escucha

No hay una unica forma correcta. El objetivo es **capilaridad** (muchos puntos) y **profundidad** (entender bien cada senal).

| Herramienta | Utilidad | Capilaridad | Observaciones |
|---|---|---|---|
| Focus groups | Profundidad cualitativa | Baja | Caro, para insights, no metrica |
| Mystery shopper | Cumplimiento operativo | Media | Prohibido en algunos paises, bueno para capacitacion |
| Entrevistas a profundidad | Motivaciones ocultas | Media | Util cuando data no arroja insights |
| Encuestas mail/CATI/CTI | Medicion masiva | Alta | Clasico del NPS |
| IVR / chatbots post-interaccion | Captura inmediata | Muy alta | Cuidar la frecuencia (saturacion) |
| QR en punto fisico | Captura contextual | Media-alta | Bueno para retail, restaurantes |
| Interceptos web / paneles | Feedback en flujos digitales | Alta | Util para UX |
| Voz del cliente no estructurada | Mineria de llamadas, reviews | Muy alta | Requiere IA |

> **Alerta**
>
> Cuando los clientes dejan de contestar encuestas, la marca tiene un problema. Metrica silenciosa: no hay engagement. Si antes respondia 30% y ahora 8%, el cliente perdio interes en la relacion. **Eso pasa antes de que el churn aparezca en retencion.**

> **Regla de oro del BOC**
>
> Escuchar → Entender → Actuar.
>
> Si escuchas pero no entiendes, pierdes tiempo. Si entiendes pero no actuas, pierdes confianza. **Si no vas a actuar, no midas** — estas desgastando clientes.`,
      },
      {
        slug: "economia-silver-arquetipos",
        titulo: "La economia silver y los nuevos arquetipos",
        descripcion:
          "El mercado que muchas areas de marketing y CX estan ignorando.",
        minutos: 4,
        contenido: `## Economia silver y nuevos arquetipos

### Economia silver

Adultos mayores con poder adquisitivo:
- Mayoria pensionados.
- Sin deudas relevantes.
- Posiciones socioeconomicas importantes.
- Poder adquisitivo y tiempo libre.
- Muchas veces los tratamos como si no entendieran — **error.**

Turismo, salud, finanzas, vivienda, entretenimiento, educacion continua pueden disenar experiencias especificas. Subestimar sus capacidades digitales o su disposicion a gastar es perder un mercado en crecimiento demografico.

> **Tip - Reflexion arquetipica**
>
> En CX no se usa mucho la segmentacion sociodemografica (edad, genero, NSE). Se usan **arquetipos:** gustos, preferencias, estilo de vida, aspiraciones. Una persona de 68 anos activa y con consumo digital intensivo es arquetipo distinto a un joven de 25 acomodado. **No asumas por la edad; construye segmentos por comportamiento.**`,
      },
      {
        slug: "kano-aplicado-economia-experiencia",
        titulo: "Diagrama Kano aplicado y la economia de experiencia",
        descripcion:
          "Del diagrama a decisiones de diseno + las 4 economias de Pine & Gilmore.",
        minutos: 7,
        contenido: `## Kano aplicado a decisiones de diseno

| Tipo | Si falta | Si esta | Inversion |
|---|---|---|---|
| Basicos | Insatisfaccion alta | Satisfaccion cero | Obligatoria — no negociable |
| Deseados | Insatisfaccion media | Satisfaccion proporcional | Medir costo-beneficio |
| Atractivos | Neutral | Satisfaccion alta inesperada | **Clave para diferenciacion** |
| Indiferentes | Neutral | Neutral | **No invertir** — malgasto |
| Inversos | Neutral | Insatisfaccion en algunos | Evitar o segmentar |

> **Aplicacion practica**
>
> Antes de lanzar nueva funcionalidad, clasificala en Kano:
> - **Basica y no la tienes:** urge invertir (no genera satisfaccion pero evita destruirla).
> - **Atractiva:** ahi tu diferenciacion y surprise me.
> - **Indiferente:** mata el proyecto — malgasto.
> - **Inversa:** segmenta a quien si la valora y a quien no se la muestres.

## La economia de experiencia (Pine & Gilmore, 1999)

4 economias progresivas, cada una con margenes superiores:

1. **Materias primas:** granos, cafe, algodon. Precio puesto en bolsa. Margen bajisimo.
2. **Industrial:** procesadas y empaquetadas (cafe molido con marca). Margen medio.
3. **Servicios:** producto + servicio alrededor (cafe servido en restaurante). Margen mayor.
4. **Experiencia:** vivencia completa alrededor del producto (Starbucks: ambiente, musica, barista por tu nombre). **Margen maximo.**

### Caso - El cafe colombiano

Vengo de Colombia, pais productor. Decadas vendiendo granos como materia prima, con precio de bolsa de NY. Campesinos ganando poco.

Despues: industrial (Juan Valdez molido empaquetado). Despues: servicios (cafeterias Juan Valdez). Hoy aprendemos experiencia.

En mi casa mezclo cafes: Nicaragua, Colombia, Etiopia, Estambul, Italia. Cuando viene alguien pregunto: "Quieres Geicha (Gaitana, 2,600 msnm, almendra y caramelo) o Caturra (2,400 msnm, chocolate y limon)?". **Eso ya no es cafe — es experiencia. Y se monetiza distinto.**

> **Pregunta de fondo**
>
> En que economia esta tu empresa hoy y hacia cual quiere moverse? Subir implica mayor margen pero tambien mayor inversion en diseno, gente y cultura. No todas deben llegar a experiencia. La decision debe ser consciente, no por omision.`,
      },
      {
        slug: "cinco-niveles-madurez-forrester",
        titulo: "5 niveles de madurez (modelo Forrester)",
        descripcion:
          "Ubicate honestamente — no te saltes niveles.",
        minutos: 3,
        contenido: `## 5 niveles de madurez (Forrester)

| Nivel | Nombre | Caracteristicas |
|---|---|---|
| 0 | Inicial / reactivo | Sin vision, sin liderazgo. Apagando incendios. CX no existe. |
| 1 | Emergente | Reactivo pero incipiente reconocimiento. Iniciativas aisladas. |
| 2 | Incipiente | Se estandarizan algunas acciones. Sin gobierno claro. |
| 3 | Sistematico | Procesos definidos, CX se alinea con estrategia. Hay metricas. |
| 4 | Integrado | Cultura en toda la organizacion. Gobierno claro, metricas conectadas al negocio. |

> **Tip - Como usar el modelo**
>
> Ubicate honestamente. **No te saltes niveles** — es tentador pero no sostenible. Si estas en 0-1, prioridad: organizar lo basico antes de montar comite con muchos KPIs. Si estas en 2-3, momento de integrar areas y definir gobierno. Nivel 4 requiere anos de construccion y liderazgo sostenido — no se llega en un trimestre.`,
      },
    ],
  },
  {
    titulo: "Economics de la experiencia",
    descripcion:
      "La respuesta a donde esta el retorno financiero, con numeros concretos.",
    lecciones: [
      {
        slug: "cinco-indicadores-financieros",
        titulo: "Los 5 indicadores financieros obligatorios",
        descripcion: "Apréndelos de memoria — son tu munición en el comité.",
        minutos: 4,
        contenido: `## Los 5 indicadores financieros obligatorios

Aprendete estos 5. Son los que debes llevar a cualquier comite donde se discuta experiencia.

> **Concepto clave**
>
> 1. **PREFERENCIA:** % de clientes que te escogen a ti por encima de la competencia, pudiendo elegir cualquier opcion.
> 2. **SHARE OF WALLET:** % del presupuesto del cliente (dentro de tu categoria) que se gasta contigo.
> 3. **PRECIO PREMIUM:** cuanto mas esta dispuesto a pagar por comprarte a ti vs alternativas.
> 4. **RECOMENDACION:** nuevos clientes adquiridos por referencia (sin gastar en marketing).
> 5. **PERMANENCIA:** tiempo que se queda el cliente antes de irse (inverso del churn).

Cuando el financiero te pregunta "cuanto voy a ganar con CX?", la respuesta no es una metrica. Es **la cadena de estos 5 indicadores que juntos explican como la experiencia genera valor.**`,
      },
      {
        slug: "preferencia-share-wallet",
        titulo: "Preferencia, Share of Wallet y precio premium",
        descripcion:
          "Los 3 primeros indicadores en detalle, con el presupuesto de ocio de 2,000 soles.",
        minutos: 6,
        contenido: `## Preferencia, Share of Wallet, precio premium

### Preferencia

Eleccion **consciente** del cliente de comprarte a ti pudiendo comprarle a otros. Reduce costo de adquisicion (viene solo), disminuye churn, ventas se mantienen sin subir presupuesto.

**La preferencia se construye con experiencia, no con publicidad.** La publicidad atrae una primera vez; la segunda es experiencia pura.

### Share of Wallet

> **Concepto clave**
>
> Todo cliente tiene un presupuesto para tu categoria. Share of Wallet es que % de ese presupuesto gasta contigo.

### Caso - El presupuesto de ocio de 2,000 soles

Imagina que tienes presupuesto mensual de ocio de 2,000 soles. En que lo gastas? Cine, comidas con pareja, bolos, playa, conciertos, viajes.

Si eres restaurante premium y un cliente gasta 400 contigo al mes, tu Share of Wallet es 20%. Si la pasa muy bien, podrias capturar 50%, 70%.

En B2B igual: tu cliente corporativo tiene presupuesto para tu categoria y no te compra todo a ti. Reparte estrategicamente. **Si tu experiencia es mejor, te dan mas share.**

**El Share of Wallet es la prueba mas honesta de la preferencia:** el cliente vota con su dinero, no con encuesta.

### Precio premium

> **La pregunta magica de elasticidad**
>
> "Si mi experiencia continua como hasta ahora, que tan dispuesto estarias a pagar...?"
> - 20% menos
> - Entre 15% y 5% menos
> - El mismo precio
> - 10% mas
> - 15% o 20% mas

Revela elasticidad y percepcion de valor.

> **Alerta**
>
> Si 75% responde "pagaria 20% menos", problema serio: la gente siente tu propuesta cara para el valor. **No bajes precio — mejora experiencia hasta que la elasticidad se invierta.** Elasticidad esta directamente conectada con experiencia.`,
      },
      {
        slug: "recomendacion-permanencia",
        titulo: "Recomendacion, permanencia y el mismo test para empleados",
        descripcion: "Los ultimos 2 indicadores, aplicables tambien a employee experience.",
        minutos: 4,
        contenido: `## Recomendacion y permanencia

### Recomendacion

Corazon del NPS. Los promotores traen clientes nuevos sin costo de marketing. "Negocio inducido": ventas que llegan solas.

- Si el NPS sube, los clientes vienen solos.
- Si recomendacion sube, costo de adquisicion baja.
- Cada promotor vale 3-5 referencias (varia por industria).

### Permanencia

Tiempo que el cliente se queda contigo. Inverso del churn. **Un cliente que dura 5 anos vale mucho mas que tres que duran 1 ano cada uno.**

> **Tip - Aplica la misma pregunta a empleados**
>
> Para medir employee experience:
>
> "Con la experiencia vivida en esta empresa hasta hoy, seguirias siendo empleado dentro de... menos de 6 meses / 6-12 meses / 1-2 anos / mas de 2?"
>
> Si 70% dice "mas de 2 anos", tu marca empleadora esta sana. Si mayoria dice "menos de 6 meses", tienes fuga inminente de talento — aunque no la veas en rotacion formal.`,
      },
      {
        slug: "probar-financieramente-cx",
        titulo: "Como probar financieramente una inversion en CX",
        descripcion:
          "Matriz de 10 vendedores + simulacion de subir apostoles del 10% al 15%.",
        minutos: 8,
        contenido: `## Probar financieramente una inversion en CX

### Matriz de 10 vendedores

| Vendedor | Ventas/mes | Conversion | Retiros tempranos | PQR | NPS |
|---|---|---|---|---|---|
| 1 | 450 | Alto | 3% | Pocos | Muy alto (aman) |
| 2 | 370 | Alto | **27%** | **Muchos** | **Bajo (odian)** |
| 3 | 240 | Medio | 10% | Pocos | Bueno |
| 4 | 220 | Medio | 12% | Pocos | Bueno |
| 5 | 180 | Medio | 8% | Pocos | Bueno |
| 6-10 | 80-170 | Bajo | ~20% | Medios | Medio-bajo |

> **Interpretacion critica**
>
> **Vendedor 1:** sueno — vende, convierte, retiene, genera promotores.
>
> **Vendedor 2:** problema real — vende mucho pero 27% se va pronto, muchos reclamos, NPS bajo. **Probablemente sobrevendiendo, prometiendo cosas que no se cumplen.** Capacitacion, revision o retiro.
>
> **Leccion:** evaluar solo ventas esconde al vendedor 2. Solo cruzando retencion, PQRs y NPS se ve la verdad.

### El costo real de adquirir un cliente

Incluye: nominas marketing y ventas, comisiones, capital de trabajo, presupuesto de campanas, capacitacion, viajes, uso proporcional de tecnologia/legal/RRHH/finanzas.

**Mercado corporativo:** traer una cuenta puede tomar 18-24 meses. Area con gerente (19k/mes) + analista (7k/mes) = 26k/mes × 12 = 312k/ano. Si traen 1 cuenta, costo de adquisicion = 312k. Si traen 10, 31k c/u. Si traen 100, 3.1k c/u.

### Simulacion: subir apostoles del 10% al 15%

Compania con 100 clientes:

| Grupo | Actual | Costo adquisicion | Reclamos | Share of Wallet |
|---|---|---|---|---|
| Apostoles | 10% | Bajo (se recomiendan) | 3 | 70% |
| Neutrales | 50% | Medio | 6 | 50% |
| Detractores | 40% | Alto (hay que reemplazar) | 10 | 20% |

Utilidad neta anual: 141,000 soles (8% sobre facturacion).

**Escenario mejorado:**
- Apostoles: 10% → 15%
- Neutrales: 50% → 60%
- Detractores: 40% → 25%

> **Resultado**
>
> Utilidad neta: 141,000 → **306,000 soles.** Se DUPLICA. Utilidad pasa de 8% a 11%.
>
> Por que duplica? Promotores traen clientes sin costo de adquisicion, recompran, gastan mas, duran mas y generan menos reclamos. **Cada punto que subes en la escalera emocional tiene efecto multiplicador en utilidad.**`,
      },
      {
        slug: "caso-el-bulli-experiencia-sin-sostenibilidad",
        titulo: "El caso El Bulli: cuando la experiencia no es rentable",
        descripcion:
          "Los limites de la experiencia cuando no se acompana de modelo sostenible.",
        minutos: 7,
        contenido: `## Caso El Bulli: experiencia sin sostenibilidad

El Bulli fue un restaurante en la Costa Brava (Espana), fundado en 1964, regentado por Ferran Adria desde los anos 80. Templo de gastronomia molecular. Cerro en 2011 tras ser 5 veces el mejor restaurante del mundo.

### El modelo

- Solo abria 6 meses al ano (los otros 6 para I+D).
- Solo 50 comensales por noche.
- Mas de 2 millones de solicitudes de reserva al ano para 8,000 cupos.
- Un solo menu: no podias elegir, Ferran decidia.
- Reserva con 1-2 anos de anticipacion.
- Cada temporada menu completamente distinto.

### Por que cerro

La experiencia era brutal. Pero el modelo **no era sostenible economicamente.** Ferran: "A mi no me importa lo que piensan los clientes. Yo cocino para la innovacion, no para el comercio." Maravilloso — y suicida financieramente.

Los 6 meses de investigacion costaban fortuna: viajes a Peru, Asia, Africa buscando sabores, especias, tierras comestibles. Laboratorio culinario que consumia recursos sin generar ingresos.

Ferran decidio: "Quiero ser libre. No soy empresario, soy chef por pasion." Cerro y creo la Fundacion El Bulli.

**Leccion:** la experiencia sin modelo de negocio sostenible no dura. Toda compania que quiera CX de alto nivel tiene que calcular si su economics lo permite. **Si no, crece duele (mas mesas, mas replicacion) o cierra.**

### Comparacion - Central vs Osaka

**Central** (Virgilio Martinez, Lima): premiado mundialmente, reservas de 6+ meses. Como El Bulli: no escala, artesanal, depende del chef.

**Osaka** (hermanos peruanos): franquicias internacionales (Lima, Tokio, NY, Madrid, Paris). Prima el nombre de la marca sobre el del chef. Platos replicados estrictamente para que sepan igual en todos los locales.

**Ambos modelos son validos y exitosos. Pero solo uno es escalable en experiencia.** Decision estrategica: Central (artesanal, exclusivo) u Osaka (sistematico, replicable).

> **McDonald's: feliz con NPS 47%**
>
> McDonald's tiene NPS global cercano al 47%. No es grande. Esta preocupado por subirlo a 84%? **No.** Su modelo no es experiencia — es masividad, velocidad, precio accesible, estandarizacion global.
>
> Subir el NPS obligaria a cambiar el modelo: atencion personalizada, productos a medida. **Destruiria su ventaja competitiva.** La experiencia no es obligacion — es decision estrategica consciente.`,
      },
    ],
  },
  {
    titulo: "Innovacion y modelos de negocio",
    descripcion:
      "La formula de innovacion, problemas heuristicos, Business Model Canvas aplicado.",
    lecciones: [
      {
        slug: "formula-innovacion",
        titulo: "La formula de la innovacion",
        descripcion:
          "Cambio × tecnologia × (estrategia + entrenamiento), segun Luis Perez-Breva del MIT.",
        minutos: 5,
        contenido: `## La formula de la innovacion

De las aulas del Dr. Luis Perez-Breva, director del Centro de Innovacion del MIT.

> **Formula**
>
> **Innovacion = Cambio Organizacional × Tecnologia × (Estrategia + Entrenamiento)**
>
> Cada elemento multiplica al siguiente. **Si alguno es cero, la innovacion es cero.**

| Elemento | Significado |
|---|---|
| Cambio organizacional | La organizacion entera dispuesta a cambiar. Si la empresa no esta dispuesta, no innova. |
| Tecnologia | En 2026, hablar de innovacion sin tecnologia es imposible. IA, robotica, IoT, medicamentos personalizados. |
| Estrategia | Cambio y tecnologia sin rumbo son caos. La estrategia define hacia donde. |
| Entrenamiento | Innovar requiere gente formada. No solo creativa — formada. Cursos, benchmarks, exposicion. |

### Creatividad ≠ Innovacion

> **Concepto clave**
>
> **Creatividad:** capacidad individual de generar ideas. Atributo personal. Se puede desarrollar.
>
> **Innovacion:** aplicacion util de una idea creativa que transforma. Requiere ejecucion, tecnologia, entrenamiento, disciplina.

Un creativo puede no ser innovador. Un innovador si es creativo. **La innovacion se puede medir; la creatividad pura no tanto.**`,
      },
      {
        slug: "problemas-heuristicos-algoritmicos",
        titulo: "Problemas heuristicos vs algoritmicos",
        descripcion:
          "Por que la escuela te entrena en los equivocados.",
        minutos: 5,
        contenido: `## Problemas heuristicos vs algoritmicos

De la filosofia de Luis Perez-Breva del MIT. Cambia la forma en que piensas sobre los problemas.

> **Concepto clave - Dos clases de problemas**
>
> **Algoritmicos:** tienen formula o procedimiento conocido. Se resuelven con metodo. Ejemplos: calcular EBITDA, arreglar una maquina, resolver ecuacion.
>
> **Heuristicos:** no tienen formula. Hay que disenarla. Todavia no existen formalmente pero existiran. Ejemplos: como sera tu vida a los 65 anos? como atenderemos clientes en 2040?

> **Por que la escuela te entrena mal**
>
> Escuela, colegio y universidades nos entrenan casi exclusivamente en problemas algoritmicos: formulas, ecuaciones, metodos. **Pero la vida real, y especialmente la innovacion, esta llena de problemas heuristicos.** Ahi esta la verdadera innovacion.

> **Tip - Un problema heuristico que deberias atacar ya**
>
> Como va a ser tu vida a los 60? Como vas a pagar salud? Quien te va a cuidar? De que vas a vivir? Son heuristicos porque todavia no te afectan — pero te afectaran. La mayoria no piensa hasta que es tarde. Los que si diseñan su vida con anticipacion: multiples fuentes de ingreso, inversion en salud, redes, habilidades que se mantengan valiosas.
>
> Lo mismo en tu empresa: como atenderas clientes en 2035? Que tecnologias dominaran? **Empieza a pensar ahora.**`,
      },
      {
        slug: "util-mas-novedoso",
        titulo: "Util + novedoso: la doble condicion",
        descripcion:
          "Regla simple para saber si algo es innovacion o solo novedad.",
        minutos: 4,
        contenido: `## Util + novedoso

> **Los dos requisitos**
>
> Para que sea innovacion, DOS condiciones simultaneamente:
> - **UTIL:** resuelve un problema o necesidad real.
> - **NOVEDOSO:** aporta algo que no existia (o existia muy distinto).

| | Novedoso | No novedoso |
|---|---|---|
| **Util** | INNOVACION | Producto tradicional (mejora incremental) |
| **No util** | Gadget sin mercado (invento) | Nada — no sirve |

> **Alerta**
>
> El mundo esta lleno de inventos no utiles — o no utiles TODAVIA. Videoconferencia existia desde los 90, nadie la adoptaba. Con pandemia se volvio utilisima de la noche a la manana. **Zoom, Teams, Meet no eran "inventos nuevos" — eran inventos con poca utilidad percibida hasta que el contexto cambio.**

### Caso - Apple como compania innovadora

Si tuviera que elegir una empresa global realmente innovadora, elegiria Apple. **No porque invente productos de la nada — porque crea categorias:** iPod, iPhone, AirPods, Apple Watch, Apple TV, Apple Music, AirTags, Vision Pro.

Hoy Apple trabaja con el Real Madrid en el Santiago Bernabeu: si caben 70,000 espectadores pero el club tiene 2 millones de socios globales, **como meto 2 millones en un estadio de 70,000?** Metiendo el estadio dentro de tu casa via lentes de realidad mixta con experiencia inmersiva 3D.

Util (permite vivir el partido sin viajar) + novedoso (nunca se habia hecho asi). Cambio organizacional (Apple en deportes) × Tecnologia (Vision Pro) × (Estrategia + Entrenamiento). **La formula completa.**`,
      },
      {
        slug: "business-model-canvas",
        titulo: "Business Model Canvas aplicado a personas y empresas",
        descripcion:
          "9 cuadrantes de Osterwalder, aplicados a tu propia carrera.",
        minutos: 7,
        contenido: `## Business Model Canvas

Alexander Osterwalder (2010). 9 cuadrantes que cubren todo el modelo.

| Cuadrante | Pregunta clave |
|---|---|
| 1. Propuesta de valor | Que ofrezco? Que problema resuelvo? |
| 2. Segmentos de clientes | A quien se lo ofrezco? |
| 3. Canales | Como llego? |
| 4. Relacion con clientes | Que tipo de relacion construyo? |
| 5. Fuentes de ingresos | Como cobro? |
| 6. Recursos clave | Que necesito para operar? |
| 7. Actividades clave | Que tengo que hacer todos los dias? |
| 8. Socios clave | Quien me ayuda? |
| 9. Estructura de costos | En que gasto? |

### Ejemplo: tu como empleado

Al hacer el Canvas de tu vida profesional, descubres cosas incomodas.

- **Propuesta:** mi tiempo, talento, conocimientos.
- **Segmentos:** corporaciones multinacionales, banca o tecnologia, B2B.
- **Canales:** LinkedIn, networking, headhunters.
- **Relacion:** contratacion directa y estable.
- **Fuentes de ingreso:** UNA sola — el salario.
- **Recursos clave:** maestria, idiomas, liderazgo, manejo emocional.
- **Actividades:** trabajar 9-18h, desarrollar ingles, estudiar.
- **Socios clave:** mi red profesional, recomendadores (alto NPS personal).
- **Costos:** hipoteca, gastos personales, prestamos, obligaciones familiares.

> **Alerta - Una sola fuente de ingreso**
>
> El empleado tipico tiene UNA sola fuente (el salario). Si eso falla, todo se cae. **Modelo de negocio fragil.** La innovacion a nivel personal es disenar multiples fuentes para que ninguna sea punto unico de falla. Eso es independencia financiera.

> **Tip - El camino de la independencia**
>
> A los 24-30 anos, normalmente tienes un modelo (salario). A los 40, deberias tener 2-3 simultaneos. A los 50, diversificacion real: salario/consultoria + alquileres + inversiones + participaciones + modelo propio. **Las pensiones en America Latina son complicadas. Disenar tu futuro financiero es un problema heuristico que no puedes postergar.**`,
      },
      {
        slug: "modelos-negocio-catalogo",
        titulo: "Catalogo de modelos de negocio",
        descripcion:
          "Salario, suscripcion, franquicia, alquiler... vocabulario para tu innovacion.",
        minutos: 6,
        contenido: `## Catalogo de modelos de negocio

| Modelo | Como monetiza | Ejemplo |
|---|---|---|
| Empleado tradicional | Tiempo por salario fijo | Cualquier contratado |
| Servicios profesionales | Proyecto u hora | Consultor, abogado, odontologo |
| Alquiler de activos | Monetiza activo que posees | Airbnb, renta de inmuebles |
| Suscripcion | Cobro recurrente por acceso | Netflix, Spotify, SaaS |
| Publicidad tradicional | Cobra a anunciantes | Medios impresos, radio, TV |
| Publicidad + datos | Usuarios gratis con anunciantes | Facebook, Google, Spotify Free |
| Software empresarial | Licencia o SaaS | Microsoft 365, Salesforce |
| B2B tradicional | Productos a empresas | Proveedores industriales |
| B2C / retail | Ventas al consumidor | Tiendas, supermercados, e-commerce |
| Intermediacion | Comisiones por conectar | Marketplace, broker |
| Franquicia (franquiciante) | Licencia tu marca | Starbucks, McDonald's, Osaka |
| Franquicia (franquiciado) | Compras modelo probado | Dueno de local Subway |
| Educacion | Cursos, certificaciones | Universidades, plataformas edtech |
| Entretenimiento | Venta de entradas | Conciertos, parques |
| Mantenimiento y soporte | Contratos postventa recurrentes | Ascensores (Schindler), HVAC, TI |
| Pago anticipado | Cobras antes de entregar | Maido, El Bulli, crowdfunding |
| Inversion financiera | Rendimiento de capital | Bancos, bolsa, bonos |

### Caso - Mantenimiento de ascensores

Schindler, Otis, Kone, Thyssenkrupp. Su negocio real **no es vender ascensores** — es venderte el **mantenimiento durante 30-50 anos** de vida util.

Un ascensor no se puede danar. En edificio de 30 pisos, que falle es crisis. Por eso cada edificio firma contrato: revisiones mensuales, atencion 24/7, repuestos originales. **Ingreso recurrente durante decadas.**

Venta inicial deja margen decente. Mantenimiento por 40 anos deja utilidad varias veces mayor. A veces venden casi a costo — para asegurar mantenimiento. Modelo **razor and blades.**

> **Ingresos controlados vs erraticos**
>
> **Recurrentes (ola estable):** flujo predecible, permite planificar. Salario, suscripcion, arriendo.
>
> **Erraticos (picos y valles):** meses buenos y secos. Consultor, comerciante, freelancer. Requiere disciplina de ahorro.
>
> Ninguno es mejor. **Conoce el patron que tienes y disena tu vida financiera en consecuencia.** Muchos fracasan porque tienen ingresos erraticos pero viven como si fueran recurrentes.`,
      },
      {
        slug: "boston-dynamics-futuro",
        titulo: "Boston Dynamics y el futuro de la experiencia",
        descripcion:
          "Las preguntas que te cuestan no hacerte.",
        minutos: 3,
        contenido: `## Boston Dynamics y el futuro

Empresa de robotica avanzada nacida de tesis del MIT. Producto emblematico: **Spot**, un perro robot cuadrupedo usado en vigilancia, inspeccion industrial en zonas peligrosas, monitoreo de plantas nucleares, militar, buceo, agricultura de precision.

> **Reflexiones sobre el futuro cercano**
>
> - Robots reemplazando labores fisicas peligrosas o repetitivas.
> - Medicamentos personalizados por genetica, peso, talla, estilo de vida.
> - Experiencias inmersivas (Vision Pro, AR, MR) que meten el evento en tu casa.
> - IA generativa redefiniendo atencion al cliente, diseno, contenido.
> - Agricultura inteligente con robots y drones decidiendo por parcela.

> **Tip - La pregunta de futuro**
>
> Como atenderas a tus clientes en 2030? 2035? 2040? La publicidad en 2040, como sera? **Tu empresa sigue existiendo solo si tus directivos se hacen estas preguntas todos los anos.**
>
> Los que no se las hacen terminan como BlackBerry o Kodak — gigantes que no vieron venir el cambio. **Innovar es hacerse estas preguntas antes de que el mercado te obligue.**`,
      },
    ],
  },
  {
    titulo: "Personas, cultura y gobierno corporativo",
    descripcion:
      "Todo lo visto se ejecuta a traves de seres humanos. Si el colaborador no esta cuidado, la experiencia es actuacion de corta duracion.",
    lecciones: [
      {
        slug: "employee-experience",
        titulo: "Employee Experience: la pata que sostiene todo",
        descripcion:
          "Cada etapa del journey del colaborador se disena como se disena la del cliente.",
        minutos: 6,
        contenido: `## Employee Experience

> **Concepto clave**
>
> Vivencia de una persona con la organizacion a lo largo de todo su ciclo de vida: desde antes de entrar (cuando mira la marca como postulante) hasta despues de salir (cuando recomienda — o no — trabajar alli). **No es bienestar ni clima laboral: es cada interaccion disenada y medida.**

### El journey del colaborador

| Etapa | Que ocurre | Donde se disena |
|---|---|---|
| Atraccion | Mira desde fuera, postula | Marca empleadora, proceso de aplicacion |
| Entrevistas | Conoce a recruiters y futuros jefes | Trato, retroalimentacion, tiempos |
| Seleccion / oferta | Recibe propuesta, negocia, decide | Claridad, respeto, oportunidad |
| Onboarding | Ingresa, conoce equipo | Primeros dias, ceremonia, soporte |
| Primeros 100 dias | Aprende el negocio | Acompanamiento, feedback temprano |
| Desempeno / desarrollo | Entrega resultados, crece | Objetivos claros, formacion, mentoring |
| Reconocimiento | Se le reconoce o promueve | Criterios transparentes |
| Ambiente diario | Vive cultura, equipo, espacios | Liderazgo, politicas |
| Retiro / salida | Renuncia, jubilacion, cese | Proceso humano, agradecimiento |

### Caso - ISO y las vacaciones sin contar dias

Una empresa (ISO) tiene politica inusual: no cuentan los dias de vacaciones. "Tomate los que necesites."

Reaccion inicial: "la gente se va a abusar, se tomaran 3 meses!". **En la practica ocurre lo contrario:** la gente se toma MENOS que en esquema de 30 fijos. La confianza genera responsabilidad, no abuso. Cuando no tienes el contador pendiente, entras a trabajar en paz.

Funciona en culturas maduras de alto compromiso. **No se puede implementar en culturas jerarquicas de baja confianza** — primero se construye la cultura, despues la politica.

> **Tip - Mide EX como mides CX**
>
> **eNPS:** "Del 0 al 10, recomendarias trabajar aqui a un familiar?" Se aplica 1-2 veces al ano, abierto por area, antiguedad, nivel. Los detractores internos son los que contaran malas historias afuera. Trabaja sobre ellos como trabajarias sobre detractores externos.`,
      },
      {
        slug: "marca-empleadora-vs-decoracion",
        titulo: "Marca empleadora vs decoracion de paredes",
        descripcion: "La marca empleadora es parte de la reputacion de marca.",
        minutos: 4,
        contenido: `## Marca empleadora vs decoracion

Una empresa puede tener producto espectacular, pero si sus ex-colaboradores dicen en redes que es un infierno trabajar alli, la marca se dana. **Glassdoor, LinkedIn y boca a boca hacen transparente lo que antes quedaba puertas adentro.**

La marca empleadora NO es:
- Pendones con valores en las paredes.
- Speech de onboarding que nadie cree.
- Frases del CEO en LinkedIn sin respaldo operativo.

La marca empleadora SI es:
- Como tratas a los candidatos que rechazas.
- Como despides cuando toca despedir.
- Como celebras los logros del equipo.
- Si los ascensos son transparentes o politicos.
- Si la gente que se va habla bien o mal de ti.

**Todo lo que haces (o no haces) en el journey del colaborador se acumula en reputacion. La marca empleadora se gana o se pierde en cada interaccion, no en una campana de LinkedIn.**`,
      },
      {
        slug: "contratar-por-actitud-zappos",
        titulo: "Contratar por actitud, no por aptitud (caso Zappos)",
        descripcion: "1 ano de garantia en zapatos y entrevistas actitudinales.",
        minutos: 6,
        contenido: `## Contratar por actitud — caso Zappos

> **Concepto clave**
>
> La **aptitud** (habilidades tecnicas, experiencia, titulos) se puede entrenar. La **actitud** (etica, empatia, curiosidad, servicio, compromiso) no se entrena, se trae de fabrica. En posiciones de contacto con cliente — y cada vez mas en cualquier posicion — **la actitud es el filtro principal.** La aptitud es complemento.

### Frase del profesor

"Contrato por actitud, no por aptitud. Y no se paga por sonrisa sincera."

La segunda parte: una sonrisa sincera es un regalo que el colaborador hace porque quiere, no porque le pagan. Se entrena (Disney lo hace). Se inspira (un lider que sonrie contagia). **Pero no se compra con bono.** Si el colaborador esta dispuesto a sonreir a un cliente, es porque la empresa le dio razones sinceras para estar contento.

### Caso - Zappos: 1 ano de garantia en zapatos

Zappos es la zapateria online que Amazon compro en 2009. Politica famosa: **1 ANO de garantia para devolver zapatos sin preguntas.** No 30 dias — un ano. Y pagan envio de retorno.

Parece locura economica. "La gente se va a abusar, usara zapatos 11 meses y devolvera." **En la practica casi nadie lo hace.** La confianza hace que los clientes compren MAS, recompren y recomienden. El costo de pocas devoluciones tardias se paga mil veces con la lealtad.

Pero lo importante no es la politica: es **como eligen a la gente que la ejecuta.** Zappos es famoso por entrevistas con minimo contenido tecnico. Casi todo es filtro actitudinal: cultura, valores, disposicion a ayudar, humor, autenticidad.

Incluso ofrecen **pagar 2,000 dolares al final del onboarding a cualquiera que quiera retirarse.** Si alguien solo esta por el sueldo, le conviene tomar el dinero. Si acepta, Zappos lo descarto a tiempo.

La cultura Zappos: **"traigamos a la gente correcta; si se equivocan, se van rapido y con dignidad."** Amazon compro la empresa pero los dejo operar con su modelo.`,
      },
      {
        slug: "cultura-bezos-lo-que-haces",
        titulo: "Cultura = lo que haces cuando nadie te ve (Bezos)",
        descripcion:
          "Enron: valores en pendones, fraude en balances. Astronomer y el concierto.",
        minutos: 7,
        contenido: `## Cultura = lo que haces cuando nadie te ve

> **Concepto clave**
>
> **Cultura NO es lo que decimos.** No es lo que esta en pendones, paredes, web corporativa, onboarding.
>
> **Cultura es lo que hacemos.** Como se contrata, como se despide, como se reconoce, como se reune, como se toman las decisiones dificiles cuando nadie esta mirando.

### La frase de Bezos

Jeff Bezos lo resumio:

**"Cultura es lo que tus colaboradores hacen cuando no los estas viendo."**

Si cuando el jefe se va la gente trabaja igual, hay cultura. Si cuando el jefe se va todos aflojan, hay disciplina jerarquica, pero no cultura. Si las decisiones eticas se toman igual con o sin supervision, hay cultura. **Si solo se hace "lo correcto" cuando hay camara, hay actuacion.**

### Caso Enron — valores en pendones, fraude en balances

Enron, una de las mayores energeticas de EE.UU., tenia pendones enormes con 4 valores: integridad, comunicacion, respeto y excelencia. En el onboarding los contaban. El CEO los citaba.

2001: exploto el escandalo. Durante anos habian falsificado estados financieros, escondido deudas en vehiculos paralelos, enganado a inversionistas. La auditora Arthur Andersen (Big 5) los avalaba. **Ambas empresas quebraron.** Miles perdieron trabajo y pensiones.

**Una empresa con "integridad" en la pared puede estar podrida por dentro. La pared no construye cultura. Los comportamientos si.**

De Enron nacio toda la normativa moderna de compliance: Sarbanes-Oxley Act (2002), Chief Compliance Officer, codigos eticos obligatorios.

### Caso Astronomer — 72 horas

CEO Chris Byron y VP de RRHH Kristin Cabot de Astronomer (empresa tecnologica). Ambos casados con otras personas.

En concierto de Coldplay, la kiss cam del estadio los enfoco abrazados. Video viral globalmente en horas. **En 72 horas el CEO renuncio. Ella salio en 35 dias.**

Por que? No por moralismo. Por **compliance:** la relacion CEO / VP RRHH es conflicto de interes estructural. RRHH aprueba contrataciones, despidos, aumentos, bonos de todo el personal incluido el CEO. Con relacion personal, el compliance se rompe.

La empresa no tuvo opcion: cualquier decision futura de RRHH seria cuestionable. **El costo reputacional fue enorme:** el nombre Astronomer se conoce hoy por esto mas que por su producto.

**Los valores y compliance no son adornos. Son la condicion de posibilidad del negocio.** La cultura real se prueba cuando alguien poderoso cruza una linea: se aplica la norma o se protege al poderoso?`,
      },
      {
        slug: "liderar-con-ejemplo-disney",
        titulo: "Liderar con el ejemplo (Disney obsesionado y deliberado)",
        descripcion:
          "Los colaboradores hacen lo que los lideres hacen, no lo que dicen.",
        minutos: 5,
        contenido: `## Liderar con el ejemplo

> **Principio fundamental**
>
> Los colaboradores hacen lo que sus lideres hacen, no lo que dicen. Si quieres puntualidad, llega puntual. Si quieres obsesion por el cliente, se el mas obsesionado. Si quieres respeto, respeta primero. **El ejemplo es la herramienta de cultura mas poderosa — y la mas barata.**

### Disney Institute: obsesionado y deliberado

Disney es la escuela mas famosa del mundo en servicio. Dos palabras resumen su filosofia:

- **Obsesionado:** la organizacion entera piensa en el huesped todo el tiempo. **Desde el CEO hasta el que barre.** No es tema del area de atencion; es tema de todos.
- **Deliberado:** nada se deja al azar. Cada angulo del parque, sonrisa, saludo, uniforme, senalizacion esta pensada, disenada y entrenada. **La magia es intencional.**

Disney ensena a sus lideres con el ejemplo. Los ejecutivos hacen turnos vestidos de personajes, barriendo, atendiendo mesas. **Cuando el CEO recoge un papel del piso, todos aprenden que recoger papel no es indigno.** Esa escena vale mas que un manual de 200 paginas.

### Las dimensiones donde el lider construye (o destruye) cultura

- **Como contrata:** prioriza actitud o solo CV? Consulta al equipo? Respeta al candidato rechazado?
- **Como remunera:** paga segun mercado? Aumentos justos? Bonos atados a comportamientos correctos?
- **Como da feedback:** honesto y constructivo, o pasivo-agresivo? Felicita en publico y corrige en privado?
- **Como desarrolla:** invierte tiempo en su gente? Pone a su equipo en presentaciones con directivos?
- **Como despide:** con respeto y transparencia? Proceso humano? Protege la dignidad del que sale?
- **Como reacciona en crisis:** mantiene la calma? Protege al equipo o lo sacrifica? Asume responsabilidad?`,
      },
      {
        slug: "framework-iso-10-modulos",
        titulo: "Framework de gobierno ISO: 10 modulos",
        descripcion: "La foto de destino de gobierno corporativo de experiencia.",
        minutos: 5,
        contenido: `## Framework ISO — 10 modulos

Todo el curso puede resumirse en un modelo. ISO organiza el gobierno corporativo de la experiencia en 10 modulos.

> **Estructura**
>
> 1 modulo de **ESTRATEGIA** (cliente en el centro).
> 3 modulos de **EXPERIENCIA:** marca, producto, interaccion.
> 6 modulos de **SOPORTE:** metricas y BOC, tecnologia, personas, finanzas, gobierno, ecosistema.

| Modulo | Que debe gobernar |
|---|---|
| 1. Estrategia | Cliente en el centro, vision, alineacion con negocio |
| 2. Experiencia de marca | Promesa, identidad, comunicacion coherente |
| 3. Experiencia de producto | Usabilidad, funcionalidad, calidad, innovacion |
| 4. Experiencia de interaccion | Journey, touchpoints, orquestacion, atencion |
| 5. Metricas y BOC | NPS, BCX, INS, CES; escucha; sistema de gestion |
| 6. Tecnologia aceleradora | Plataformas, datos, analitica, IA |
| 7. Personas | Cultura, marca empleadora, EX, formacion, liderazgo |
| 8. Finanzas | Economics, ROI, Share of Wallet, costo de servir |
| 9. Gobierno | RACI, roles, comites, oficina de transformacion |
| 10. Ecosistema | Stakeholders, proveedores, competencia, regulacion |

> **Tip - No construyas los 10 a la vez**
>
> El framework es foto de destino. Ninguna empresa lo tiene todo perfecto. Pregunta: que modulos estan maduros, cuales emergentes, cuales inexistentes? Se mapea, se prioriza y se construye por fases. **Lo peor es querer hacerlo todo a la vez** — la organizacion no lo absorbe y el proyecto se abandona.

### Matriz RACI — quien hace que

| Letra | Rol |
|---|---|
| R — Responsible | El que hace la tarea |
| A — Accountable | El que rinde cuentas (solo uno) |
| C — Consulted | Al que consultar antes |
| I — Informed | Al que informar despues |

**Quien es Accountable del NPS?** Divide opiniones. Marketing? CX? CEO?

El NPS revuelve marca, producto e interaccion. Ningun area funcional lo "posee" por si sola. **El unico rol con poder transversal es el CEO** (o Chief Experience Officer reportando al CEO). Si lo accounta marketing, fracasa: no tiene poder sobre producto ni operaciones. **El NPS es metrica de compania, y por eso es del lider de compania.**`,
      },
      {
        slug: "roadmap-final-escuchar-disenar-implementar",
        titulo: "El roadmap final: escuchar → disenar → implementar",
        descripcion:
          "El loop permanente que garantiza que la experiencia mejore.",
        minutos: 5,
        contenido: `## Roadmap de transformacion

> **El loop de la experiencia**
>
> **Escuchar → Disenar → Implementar → (volver a Escuchar)**
>
> Ninguna fase se termina. Escuchar es continuo (NPS, paneles). Disenar con cada iniciativa. Implementar permanentemente. **El loop es lo que garantiza que la experiencia mejore.**

### Fase 1 — Escuchar

- Assessment de madurez (framework ISO).
- Segmentacion de clientes por comportamiento.
- Escucha estructurada: NPS, BCX, INS, CES, focus, mystery, analitica.
- Analisis de quejas, reclamos, abandonos, churn.

### Fase 2 — Disenar

- Construccion de journeys para principales segmentos.
- Vision de experiencia deseada a 3 anos.
- Guia de experiencia: estandares por touchpoint.
- Cocreacion con colaboradores y clientes.
- Prototipos: pruebas piloto antes de escalar.

### Fase 3 — Implementar

- Taller de sensibilizacion: toda la organizacion entiende el porque.
- Gestion del cambio por area.
- **Oficina tecnica de transformacion:** equipo dedicado que orquesta, no ejecuta.
- Economics: cada iniciativa con business case, ROI esperado, metricas.
- Revision mensual / trimestral.

> **Tip - El roadmap aplica a todo**
>
> El mismo loop — Escuchar, Disenar, Implementar — se usa para cualquier transformacion: EX, analitica y big data, transformacion digital, cambio cultural. **Es el patron subyacente.** Toda iniciativa seria de cambio lo usa, aunque no lo nombre.

### Las campanas de Gauss y mover la media

Imagina tu sector con todas las empresas en distribucion normal segun calidad de experiencia. Cuando las mejores elevan su estandar, **toda la campana se desplaza a la derecha.** Las medias suben, las peores se obligan a mejorar o quedan fuera.

### Netflix elevo la categoria de TV paga

Hace 15 anos, TV paga en Peru: cable tradicional con instalaciones que tardaban semanas y atencion al cliente legendariamente mala.

Cuando Netflix entro, **no compitio por precio ni catalogo. Compitio por experiencia:** on-demand real, interfaz simple, recomendaciones, sin contratos de permanencia, cancelacion con un click.

Toda la categoria respondio. Movistar lanzo su app. DirecTV mejoro su interfaz. Claro compro derechos de streaming. **La campana del sector se movio a la derecha.** El estandar de "ver contenido" fue redefinido por Netflix. Los que no alcanzaron, como Blockbuster, desaparecieron.

> **Cuando seas lider en tu sector, piensa asi**
>
> Estoy elevando la categoria o solo ganandole a los peores que yo? **Los lideres de verdad elevan la media.**`,
      },
      {
        slug: "cierre-ceo-obsesionado-deliberado",
        titulo: "Cierre: el CEO obsesionado y deliberado",
        descripcion: "X Management en una sola frase.",
        minutos: 3,
        contenido: `## Cierre del curso

Has recorrido el modelo completo de X Management:

- Entendiste la diferencia entre marketing y CX, la X y el Chief Emotional Officer (Modulo 1).
- Estrategia y diferenciacion: FODA, oceanos azules, piramide de atributos (Modulo 2).
- Propuesta de valor: parabola del cliente, balde con grifo, Fix me vs Surprise me, Kano (Modulo 3).
- La mesa de experiencia y el BOC: NPS profundo, BCX, INS, CES, NPS 1.0 → 2.0 → 3.0 (Modulo 4).
- Diseno y gobierno del BOC: orquestacion, Kano aplicado, madurez Forrester (Modulo 5).
- Economics: los 5 indicadores, matriz de vendedores, El Bulli (Modulo 6).
- Innovacion: formula de Perez-Breva, heuristicos, BMC, modelos de negocio (Modulo 7).
- Personas, cultura, framework ISO y roadmap (Modulo 8).

> **Resumen en una frase**
>
> X Management no es un area: es una forma de entender el negocio. **El cliente en el centro, la organizacion alineada, la experiencia disenada, las metricas gobernadas, la cultura cuidada y el lider obsesionado y deliberado.** Todo lo demas es marketing sin entrega.

La experiencia no se improvisa. Se disena con disciplina, se mide con rigor, se gobierna con estructura y se vive con obsesion. Aplica estos principios con coherencia, ano tras ano, y tu empresa no solo tendra clientes: **tendra apostoles.** No solo colaboradores: gente que recomienda trabajar contigo. No solo ingresos: **valor sostenible en el tiempo.**`,
      },
    ],
  },
];

async function main() {
  console.log("Sembrando curso: Customer Experience como estrategia de negocio...\n");

  const marketing = await prisma.area.findUnique({
    where: { nombre: "Marketing" },
    select: { id: true },
  });
  if (!marketing) {
    console.error("No se encontro el area Marketing. Corre primero db:seed.");
    process.exit(1);
  }

  const existente = await prisma.curso.findUnique({
    where: { slug: CURSO_SLUG },
    select: { id: true },
  });
  if (existente) {
    await prisma.curso.delete({ where: { id: existente.id } });
    console.log("  Curso existente eliminado (idempotencia).");
  }

  const totalLecciones = MODULOS.reduce((acc, m) => acc + m.lecciones.length, 0);
  const totalMinutos = MODULOS.reduce(
    (acc, m) => acc + m.lecciones.reduce((a, l) => a + l.minutos, 0),
    0
  );

  const curso = await prisma.curso.create({
    data: {
      slug: CURSO_SLUG,
      titulo: "Customer Experience como estrategia de negocio",
      descripcionCorta:
        "X Management: de la promesa de marca a la operacion que cumple.",
      descripcion:
        "CX no es un departamento ni un conjunto de herramientas: es una estrategia de negocio que atraviesa toda la organizacion. El Marketing promete; la organizacion entera debe cumplir. Este programa te lleva del concepto de X Management al gobierno corporativo, pasando por diferenciacion, propuesta de valor, metricas (NPS, BCX, INS, CES), economics de experiencia, innovacion y cultura. Basado en casos reales: Pepephone, Circo del Sol, Alka-Seltzer, El Bulli, Disney, Zappos, BBVA, Netflix, Apple, Enron, Astronomer. Dirigido a profesionales de marketing, responsables de CX, gerentes comerciales, de producto, canal digital, contact center, RRHH y tecnologia; consultores, emprendedores y directivos.",
      thumbnailUrl: "https://picsum.photos/seed/customer-experience/800/450",
      duracionMinutos: totalMinutos,
      nivel: "AVANZADO",
      areaId: marketing.id,
      publicado: true,
      puntosRecompensa: 350,
      instructorNombre: "Juan Pablo Varela",
      instructorAvatarUrl: null,
      orden: 11,
      modulos: {
        create: MODULOS.map((m, mi) => ({
          titulo: m.titulo,
          descripcion: m.descripcion,
          orden: mi + 1,
          lecciones: {
            create: m.lecciones.map((l, li) => ({
              slug: l.slug,
              titulo: l.titulo,
              descripcion: l.descripcion,
              tipo: "LECTURA" as const,
              contenidoMarkdown: l.contenido,
              duracionSegundos: l.minutos * 60,
              orden: li + 1,
              puntosRecompensa: 10,
            })),
          },
        })),
      },
    },
  });

  console.log(`  Curso creado: ${curso.titulo} (id ${curso.id})`);
  console.log(`  Modulos: ${MODULOS.length}`);
  console.log(`  Lecciones: ${totalLecciones}`);
  console.log(`  Duracion estimada: ${Math.round(totalMinutos / 60)} h ${totalMinutos % 60} min`);
  console.log("\nListo. El curso esta publicado y disponible en /cursos.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
