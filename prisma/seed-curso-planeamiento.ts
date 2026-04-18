import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const CURSO_SLUG = "planeamiento-estrategico-marketing";

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
    titulo: "Fundamentos: la generacion de valor",
    descripcion:
      "La brujula de cualquier ejecutivo de primera linea. Si no la tienes clara, todo lo demas es ruido.",
    lecciones: [
      {
        slug: "rol-ejecutivo",
        titulo: "El verdadero rol del ejecutivo",
        descripcion:
          "Por que tu trabajo no es vender ni hacer campanas bonitas, sino contribuir a la generacion de valor.",
        minutos: 8,
        contenido: `## El verdadero rol del ejecutivo

Muchos ejecutivos creen que su trabajo es vender, hacer campanas bonitas, ganar market share o construir una marca reconocida. Todo eso importa, pero ninguna de esas cosas es el objetivo final. **Tu gestion tiene que contribuir a que la compania genere valor, no que pierda valor.**

La generacion de valor no se ve en la venta, no se ve en el market share, no se ve en la experiencia del cliente. Se ve en la ultima linea del estado financiero y en la liquidez de la compania.

> **Concepto clave - La ultima linea**
>
> Es la utilidad neta del estado de perdidas y ganancias, o en su defecto el EBITDA / margen operativo. Es donde se ve si la compania realmente gano plata despues de descontar costos, gastos, depreciaciones e impuestos. Todo lo que hagas como ejecutivo termina impactando esta linea.

### Caso real: la promocion que "si funcionaba"

Como gerente general de una cadena de lavanderias, le pedi al analista evaluar una promocion recurrente de los martes. La respuesta: "Si funciona, crece 16% versus el periodo no promocional".

Mi respuesta: el descuento es 15%. El crecimiento real es 1%. Y si le metes la inflacion del 3%, estas cayendo -2%. No es un exito, es un auto-engano.

Esto les va a pasar todo el tiempo: gente que te "vende" exitos que en realidad estan destruyendo valor. Tu trabajo es verlo.

> **Tip - Rentabilidad vs flujo de caja**
>
> Las empresas no quiebran por falta de rentabilidad: quiebran por falta de liquidez. Una empresa puede ser rentable en el papel y morirse por iliquidez si cobra a 90 dias y paga a 30. Pregunta siempre por la caja cuando te hablen de utilidad.`,
      },
      {
        slug: "que-significa-generar-valor",
        titulo: "Que significa generar valor (y que NO)",
        descripcion:
          "Acciones que generan valor vs acciones que lo destruyen aunque la venta suba.",
        minutos: 7,
        contenido: `## Que significa generar valor (y que NO)

Algunas decisiones suben la venta pero destruyen valor. Otras parecen neutras pero generan valor real. Tu trabajo es distinguirlas.

| Accion | Impacto en venta | Impacto en valor |
|---|---|---|
| Descuento 50% los fines de semana | Sube | Destruye (erosiona pricing y margen) |
| Ajuste de precio +2% en core | Neutral/leve baja | Genera (no lineal, alto impacto) |
| Campana masiva sin propuesta de valor | Sube temporal | Destruye |
| Renegociar condiciones con cliente malo | Puede caer al inicio | Genera en el mediano plazo |
| Cerrar un local que pierde hace 2 anos | Cae venta total | Genera (SSS sube) |
| Reducir gramaje sin que se note | Mantiene venta | Genera (margen sube) |
| Lanzar innovacion premium | Aporta valor | Genera (sube precio promedio) |

> **Concepto clave - El precio y el market share que enganan**
>
> "Creci en venta": si creciste regalando, destruiste margen. Revisa P y Q por separado (Venta = P x Q).
>
> "Gane market share": si el mercado cayo 20% y tu 10%, ganaste share pero perdiste plata. El share solo no dice nada sin el tamano del mercado.

### El mercado que se desinfla

Si tu categoria es de 100 millones y tienes 20% de share, metes 20 millones. Si la industria entra en guerra de precios, en 2 anos el mercado cae a 80. Mantienes el 20% pero metes 16 millones — perdiste 4 sin perder share. Y para recuperarlo, el directorio te va a pedir subir a 25%: ganar 5 puntos es durisimo.

**Por eso es responsabilidad del lider de mercado hacer que la categoria gane valor, no que lo pierda.**`,
      },
      {
        slug: "tres-culturas-lider",
        titulo: "Las 3 culturas que todo lider debe construir",
        descripcion:
          "Rentabilidad, numero compartido y marca compartida: las culturas que un ejecutivo de primera linea irradia.",
        minutos: 6,
        contenido: `## Las 3 culturas que todo lider debe construir

Un ejecutivo de primera linea no es solo el que toma decisiones tecnicas correctas. Es el que irradia cultura. Hay tres culturas fundamentales:

### 1) Cultura de la rentabilidad

No es responsabilidad exclusiva del gerente general y financiero. Todos deben tener foco de rentabilidad:

- Gerente de ventas: si tiene autorizado 10% de descuento, que presione para cerrar con 8%.
- Gerente de marketing: maximizar precio al lanzar, no minimizar por miedo.
- Compras/logistica: proactivamente buscar ahorros, no esperar que se los pidan.
- RRHH: cuestionar bandas salariales y estructura.

### 2) Cultura del numero

"El numero" es el compromiso presupuestal del ano. No es solo de ventas: es de toda la compania. Marketing, ventas, operaciones, finanzas, RRHH, logistica — todos dueños del numero. Una forma de construir esta cultura es que todas las areas participen en el presupuesto y que los bonos variables esten atados a KPIs consistentes.

### 3) Cultura de marca compartida

> **Caso real - El mall y los 70 mensajes al mes**
>
> Un gerente de operaciones en Cony Park lo dijo perfecto: "El 70% de ustedes va a un mall al menos una vez al mes. Yo deberia recibir 70 mensajes al mes: 'Luis, estuve en el local tal, lo vi bien'; 'Luis, en el local X hay cola'".
>
> Esa es cultura de marca compartida. Todos somos ojos y oidos de la marca.

Si el viernes se activa una campana digital y tu empresa tiene 70 empleados, el lunes deberias tener minimo 70 likes. Si no los tienes, tu cultura de marca es debil.`,
      },
      {
        slug: "modelo-integrum-8-pasos",
        titulo: "El modelo Integrum de planeamiento en 8 pasos",
        descripcion:
          "El framework que atravesara todo el curso, modelado en multinacionales y refinado en gerencias generales.",
        minutos: 6,
        contenido: `## El modelo Integrum en 8 pasos

Este framework se ejecuta en secuencia. Cada paso se apoya en el anterior.

| Paso | Etapa | Pregunta que responde |
|---|---|---|
| 1 | Aspiracion / Proposito | Cual es el proposito de la empresa? |
| 2 | Entendimiento de marca | Que estoy gerenciando? Hay propuesta de valor? |
| 3 | Analisis de situacion | Donde estoy parado hoy? |
| 4 | Objetivos | A donde quiero llegar? (venta y EBITDA) |
| 5 | Pilares estrategicos | Por que rutas voy a lograrlo? (4-5 max) |
| 6 | Planes | Que tareas concretas por pilar? |
| 7 | KPIs | Como voy a medir cada plan? |
| 8 | Control y ejecucion | Como superviso la ejecucion? |

> **Concepto clave - Logica del modelo**
>
> Imagina que presentas a un directorio:
> 1. Les explicas la marca y su propuesta de valor.
> 2. Les presentas la situacion actual.
> 3. Te preguntaran "cuanto me vas a traer el proximo ano?" — entras al objetivo.
> 4. Con el objetivo validado, explicas las rutas (pilares).
> 5. Cada pilar se baja a planes con KPIs medibles.

> **Tip - Pasar de mucho a poco**
>
> El trabajo de un lider es pasar de mucha informacion a poca informacion accionable. En una presentacion ejecutiva, todo debe ser algo que pueda cambiar el negocio. Lo demas va a "otros" o se omite.`,
      },
    ],
  },
  {
    titulo: "Entendimiento de marca",
    descripcion:
      "Antes de asignar un solo Sol de presupuesto, audita si hay propuesta de valor solida.",
    lecciones: [
      {
        slug: "auditar-marca-antes-invertir",
        titulo: "Por que auditar la marca antes de invertir",
        descripcion:
          "El error mas comun en gerentes recien llegados y como detectarlo.",
        minutos: 7,
        contenido: `## Por que auditar la marca antes de invertir

De cada diez companias, al menos tres gerencian sin entender la propuesta de valor de su propia marca. Daban presupuesto, cada gerente invertia distinto, y en 5 anos nunca construyeron nada solido.

> **Concepto clave - Tu primera tarea como gerente**
>
> Audita si hay una propuesta de valor solida, diferenciadora y decodificada por el target.
> - Si la hay: invierte en construir sobre ella.
> - Si no la hay: congela la inversion y trabaja primero la propuesta de valor.

### 8 senales de que tu marca tiene problema

1. Los vendedores cuentan propuestas distintas en campo.
2. En un after-office cada area define la marca distinto.
3. Tus ventas caen sin razon clara.
4. Un competidor te saca tajada facilmente.
5. Lo que el marketero dice y lo que el consumidor decodifica son cosas distintas.
6. El consumidor no tiene claras las ventajas de tu marca.
7. Alta rotacion de marketeros cambia el eje de comunicacion.
8. Inviertes y no ves retorno ni construccion.

### Volvo vs Cony Park

La vendedora de Volvo monto todo su speech sobre una palabra: **seguridad**. Eso es marca que la tiene clara.

Al llegar a Cony Park pregunte la propuesta: al dueno "somos felicidad"; a otro "diversion"; a otro "momentos". **No habia propuesta unica de valor.** En una semana de preguntas te das cuenta.`,
      },
      {
        slug: "cuatro-fundamentos-marca",
        titulo: "Los 4 fundamentos de marca",
        descripcion:
          "Brand equity, posicionamiento, esencia y escalera de beneficios.",
        minutos: 10,
        contenido: `## Los 4 fundamentos de marca

### 1) Brand equity

KPIs que indican si tu marca construye valor:

- Venta (asumiendo rentabilidad).
- Participacion de mercado (asumiendo rentabilidad).
- Distribucion y rentabilidad.
- Recordacion (awareness) y tope de mente (top-of-mind).
- NPS y calidad percibida.
- Relacion precio-calidad.

> **Concepto clave - Tope de mente: el KPI adelantado**
>
> Si el tope de mente crece, probablemente la venta y la rentabilidad crezcan en los proximos meses. Es un indicador adelantado, no retrospectivo. La primera mencion tiene mayor probabilidad de compra.

### 2) Posicionamiento

Como te decodifica el target. Formula de redaccion:

**[MARCA]** es la **[CATEGORIA]** que provee a **[TARGET]** de **[BENEFICIO CLAVE]**, debido a **[REASON WHY]**.

**Toblerone:** "Toblerone es la barra de chocolate que provee a los verdaderos amantes del chocolate de una gratificante, distintiva y envolvente experiencia, debido a su chocolate suizo, miel y nougat en una no convencional forma triangular."

### 3) Esencia de marca

Destilado a 1-2 palabras. Bath & Body Works: "relajate y desconectate". Nike: "Just Do It". Volvo: "seguridad".

### 4) Escalera de beneficios

| Escalon | Que es | Ejemplo |
|---|---|---|
| 1. Atributo de producto | Que es el producto | Marca premium con cremas y jabones |
| 2. Beneficio de producto | Que hace | Aromas que cautivan y perduran |
| 3. Beneficio del consumidor | Que te da | Fragancias que evocan momentos |
| 4. Beneficio emocional | Como te hace sentir | Relajarte y desconectarte |

> **Caso real - Burger King y el 4%**
>
> En Peru Burger King recibia campanas globales comunicando en escalon 4 (emocional). Pero solo el 4% del target sabia que la marca era 100% carne a la parrilla. Estabamos comunicando emocional sin la base construida.
>
> Tuvimos que pelear: primero comunicar carne y parrilla, carne y parrilla. Cuando ese 4% llego al 25%, recien metimos emocion.

> **Tip - Cuestiona las campanas emocionales prematuras**
>
> Una agencia prefiere emocional porque gana premios. Si tu marca no esta madura, estas quemando dinero.`,
      },
      {
        slug: "construccion-propuesta-valor",
        titulo: "Construccion de propuesta de valor (4 pasos)",
        descripcion:
          "Metodo practico para construir una propuesta diferenciada cuando no existe.",
        minutos: 8,
        contenido: `## Construccion de propuesta de valor (4 pasos)

### Paso 1 - Atributos de la categoria

Preguntale al target: por que vas a un fast food y no haces la hamburguesa en casa? Por que usas lavanderia? Obtienes atributos funcionales (variedad, rapidez, precio, innovacion, limpieza) y emocionales (momentos inolvidables, sentirme buen padre, disfrutar con familia).

### Paso 2 - Mapeo de marcas vs atributos (la "arana")

Encuesta al target: "del 1 al 10, que tanto asocias la marca A con variedad / rapidez / buen precio / momentos inolvidables". Construyes un grafico de arana. Detectas:
- Donde esta fuerte cada competidor.
- Atributos virgenes que nadie capturo y el target valora. **Esa es tu oportunidad.**

### Paso 3 - Diseno del posicionamiento

Eliges un atributo emocional no capturado, validas relevancia y capacidad de tu marca para sostenerlo creiblemente. Redactas con la formula.

> **Caso real - Cony Park y "Lo divertido es estar juntos"**
>
> Toda la categoria comunicaba lo mismo: "soy el mas divertido, tengo juegos, soy seguro". La agencia exploro: para que realmente llevas a tu hijo? No a divertirse: a conectar. Nace la idea disruptiva:
>
> *"Cony Park es el centro de entretenimiento familiar que provee a familias y amigos que valoran el tiempo juntos, momentos de union y diversion..."*
>
> Eslogan: **"Lo divertido es estar juntos"**.

### Paso 4 - Construccion en todos los puntos de contacto

Baja la propuesta a:
- Comunicacion (TV, redes, via publica, digital).
- Punto de venta: tiendas, packaging.
- Uniformes y ambiente.
- Speech de ventas del equipo comercial.
- Cultura interna y comunicaciones de RRHH.
- Servicio al cliente.

> **Tip - Refresca el speech**
>
> Haz workshops periodicos con ventas. La rotacion y el desgaste dicen que el mensaje se diluye. Sin homogeneidad, la propuesta se desvirtua en la calle.`,
      },
      {
        slug: "definicion-target-estrategico",
        titulo: "Definicion del target estrategico",
        descripcion:
          "Target no es demografia. Es una creencia o comportamiento que evita la compra.",
        minutos: 6,
        contenido: `## Definicion del target estrategico

"Hombres y mujeres de 25 a 45 anos NSE B y C" **NO** es un target. Eso es demografia basica.

> **Concepto clave - Target estrategico**
>
> Grupo de consumidores homogeneos con un comportamiento o creencia especifica que esta evitando la compra. Ellos creen algo de tu marca que evita que te compren — y esa es la traba mental que tu plan debe romper.

El target se redacta en terminos de:
- Miedos y deseos.
- Comportamientos y habitos.
- Creencias y motivaciones.

> **Caso - Rey Carlos vs Ozzy Osbourne**
>
> Ambos nacidos en 1948, educados en Reino Unido, casados dos veces, viven en un castillo, ricos y famosos. Demograficamente identicos. Le dirigirias el mismo mensaje? Obviamente no. Sus aspiraciones, comportamientos y motivaciones son distintas. El target se define por comportamientos, no por demografia.

### Caso Philadelphia

| Segmento | Comportamiento | % del volumen |
|---|---|---|
| Desayuno / lonche | Amas de casa que engrien a la familia | 10% |
| Reposteria | Preparan cheesecake y postres | 30% |
| Ocasiones especiales | Solo afters, reuniones, eventos | 60% |

El 60% solo compraba para ocasiones especiales. Creencia: "Philadelphia es queso de fiesta". Plan: llevarlas al desayuno.

**Reto:** "Ellas no piensan en Philadelphia para uso diario, solo para ocasiones especiales."

**Objetivo de comunicacion:** inspirarlas a amanecer diariamente con el cremoso sabor.

Con el reto claro, el plan se diseno casi solo: TV en la manana con familia desayunando, degustacion en pasillo de panaderia con pan frances, exhibicion cruzada, regalos (pan, panera, cuchillo). **Esa es la magia: la claridad del reto guia la ejecucion.**`,
      },
    ],
  },
  {
    titulo: "Analisis de situacion",
    descripcion:
      "De lo macro a lo micro: entorno, mercado, empresa. Con numeros y conclusion clara.",
    lecciones: [
      {
        slug: "analisis-macroentorno",
        titulo: "Analisis del macroentorno",
        descripcion:
          "Variables externas sin control que deben considerarse en cualquier plan.",
        minutos: 5,
        contenido: `## Analisis del macroentorno

Variables externas que afectan cualquier negocio y sobre las que no tienes control:

- Crecimiento del PBI y proyeccion.
- Inflacion historica y proyectada.
- Tipo de cambio (critico si importas/exportas).
- Tasas de interes (costo del dinero).
- Indicadores sectoriales especificos.
- Riesgo politico y social (manifestaciones, conflictos, elecciones).

> **Concepto clave - La inflacion es tu piso de pricing**
>
> Mandato: tus incrementos de precio deberian ser como minimo la inflacion. Si la inflacion es 4% y no subiste precio, perdiste 4% de margen real en el ano. Para proteger el negocio, tu pricing debe al menos igualar la inflacion, y subir un poco mas si tu propuesta de valor lo permite.`,
      },
      {
        slug: "estructura-mercado-volumen-valor",
        titulo: "Estructura y mercado: volumen vs valor",
        descripcion:
          "Por que lo que entra a tu cuenta bancaria es plata, no kilos.",
        minutos: 7,
        contenido: `## Estructura del mercado: volumen vs valor

Dos dimensiones criticas del mercado donde compites:

- **Volumen:** unidades, kilos, litros, transacciones, metros cuadrados.
- **Valor:** la plata que se genera en la categoria.

> **Alerta - Cuidado cuando volumen crece mas que valor**
>
> Si el mercado en volumen crece 6% y en valor solo 3%, hay exceso de descuentos o bajaron los precios. La categoria se desvaloriza.
>
> Lo que se mete a la cuenta bancaria es plata (valor), no kilos. Si tu categoria pierde valor, tu empresa pierde valor aunque mantengas share.

### Papa John's y la caida del ticket

El mercado de pizzas en Peru crecio mucho, pero mas por transacciones que por ticket. El ticket de hecho bajo por el ingreso agresivo de Little Caesars, Dominos y Pizza Hut. Cada uno bajando precio.

La categoria se desvalorizo. **Es funcion del lider hacer que la categoria gane valor, no que pierda.** Si el primero o segundo se pone nervioso, el tercero, cuarto y quinto le siguen y desinflan todo.

Como se logra? Pricing activo, innovacion premium, nuevos formatos, educacion al consumidor.

> **Caso real - Estimacion de share sin data**
>
> Tecnica del ticket: en retail formalizado, los tickets llevan numero correlativo. Temprano en la manana vas al competidor y consumes: transaccion N 1. Al cierre vuelves: transaccion N 100. Ese dia hicieron 100 transacciones. Repites en 2 dias de la semana, estimas venta semanal y mensual. Tu venta / mercado total = tu share de zona. Funciona en hamburguesas, lavanderias, entretenimiento.`,
      },
      {
        slug: "las-7-ps",
        titulo: "Las 7 P's: diagnostico integral",
        descripcion:
          "Producto, precio, plaza, promocion, procesos, personas, evidencia fisica.",
        minutos: 11,
        contenido: `## Las 7 P's: diagnostico integral

Para cada P, lleva diagnostico con data y conclusion clara.

### P1 - Producto

Portafolio: para cada SKU relevante mide venta, precio, market share, tope de mente, participacion del mix, margen.

> **Tip - No lleves todo el portafolio al directorio**
>
> Si tienes 5 productos y uno no mueve la aguja aunque lo incrementes 20%, no lo presentes. Va a "otros".

> **Caso - La lechuga y la hamburguesa**
>
> En Delosi un ejecutivo presento que el proveedor de lechuga subio costo 25%. Lo molieron a palos: cuando abrias el PNL, ese 25% en lechuga ni se notaba. Lo que mueve en una hamburguesa es carne, papa, gaseosa y pan.

### P2 - Precio

> **Concepto clave - Primer cuestionamiento del precio**
>
> Cual es la estrategia correcta para tu marca? Premium, paridad o economica — **independientemente de donde estes hoy**.

Lo comun es comparar: "yo cuesto 10, competidor 10, otro 12". Eso es lo segundo. Lo primero es saber donde DEBERIA estar tu marca segun equity y rentabilidad.

### P3 - Plaza (Distribucion)

- Distribucion objetivo vs actual.
- Zonas con oportunidad (competencia esta, tu no).
- Costo de distribucion (mas vendedores no siempre = mas ganancia).

### P4 - Promocion

Que campanas se hicieron, cuanto costaron, que resultados (cruza picos de venta con activacion), como movieron recordacion y tope de mente, mix de medios, objetivos claros (captar nuevos, subir ticket, frecuencia).

### P5 - Procesos

Solo si hay cambios operativos que demanden CAPEX. Presenta si hay planta obsoleta u oportunidad de eficiencia.

### P6 - People

**Mandatoria.** Siempre hay algo que tocar:
- Tengo la gente correcta?
- Tengo la cantidad correcta (headcount)?
- Clima, rotacion, capacitaciones.
- Voy a necesitar desvinculaciones? Presupuestalas.

> **Tip - Se pro-gente**
>
> A directores les gustan los lideres people-oriented. Una lamina al final con foto del campeonato de fulbito, la canasta del Dia de la Madre, la presentacion de un nuevo jefe. Rebote enorme.

### P7 - Evidencia fisica

Para retail y servicios: estado de locales, uniformes, decoracion, musica, packaging, POP. Si detectas locales viejos, preselos — demandan inversion.`,
      },
      {
        slug: "cierre-que-funciona-que-no",
        titulo: "El cierre: resumen que funciona / que no funciona",
        descripcion:
          "Formato ejecutivo superior al FODA clasico.",
        minutos: 4,
        contenido: `## El cierre: que funciona / que no funciona

Muchos usan FODA, pero es preferible un formato mas directo. Siempre con numeros.

| Que funciona (con numeros) | Que no funciona (con numeros) |
|---|---|
| Rentabilidad crecio 1 punto vs AA | No tuvimos innovaciones en el ano |
| Venta del core crece 4% vs AA | Precio cayendo 3% en el mix |
| Tope de mente: 18% a 22% | Planilla encarecida de 25% a 26% de venta |
| Posicionamiento solido | Problema de distribucion en moderno |
| Experiencia cliente NPS 45 a 58 | Locales X e Y perdiendo hace 2 anos |
| Clima laboral +6 puntos | |

> **Concepto clave - Por que este formato es mejor que FODA**
>
> - Lo que funciona: preservarlo, apalancarse.
> - Lo que no funciona: atacarlo con los pilares del proximo ano.
> - Siempre con numeros, no adjetivos vacios.

> **Tip - Numeros dan autoridad**
>
> No digas "la rentabilidad funciona". Di "la rentabilidad crecio 1 punto contra el ano anterior". No digas "la planilla esta cara". Di "la planilla paso del 25% al 26% de la venta". Sin numeros no hay credibilidad.`,
      },
    ],
  },
  {
    titulo: "Objetivos y pilares estrategicos",
    descripcion:
      "Como proponer numeros retadores pero logrables y bajarlos a pilares, planes y KPIs.",
    lecciones: [
      {
        slug: "plantear-objetivos-directorio",
        titulo: "Como plantear objetivos ante el directorio",
        descripcion: "Los unicos 2 objetivos que van al directorio.",
        minutos: 5,
        contenido: `## Plantear objetivos ante el directorio

> **Concepto clave - Los unicos 2 objetivos que van al directorio**
>
> **Venta y EBITDA (o utilidad).** Punto.
>
> Olvidate del market share, tope de mente, experiencia de cliente como objetivos principales. Esos son KPIs del gerente de marketing. El directorio te pregunta cuanta plata vas a traer y cuanta vas a ganar.

Error recurrente: gerentes de marketing que llegan al directorio con una lamina llena de KPIs de equity y dejan al final un numero de venta casi como corolario. El directorio quiere el camino inverso: **primero el numero, despues me cuentas como lo vas a lograr.**`,
      },
      {
        slug: "perfil-ejecutivo-no-juega-seguro",
        titulo: "El perfil del ejecutivo que no juega a seguro",
        descripcion: "Retador con sustento vs play safe vs ambicioso sin argumento.",
        minutos: 5,
        contenido: `## El perfil del ejecutivo que no juega a seguro

Tentacion comun: hacer "play safe", esconder el numero, dar poquito. Un directorio con experiencia lo detecta.

> **Tres perfiles ante un objetivo**
>
> - **Play safe:** da numero bajo para sentirse seguro. Cuando el negocio se complica, queda mal porque no tiene argumentos.
> - **Ambicioso sin sustento:** numero alto sin analisis detras. Asumes, no llegas, te destrozan.
> - **Retador con sustento:** numero retador pero lograble, con analisis detras (situacion + pilares + planes + presupuesto). **El perfil ganador.**

Si das un numero retador, el ano se vuelve apretado pero entregas mas valor y construyes carrera. Si das poquito, aunque logres, no construyes reputacion.

> **Tip - Ano excepcional vs normal**
>
> Un ano excepcional no es plataforma solida para proyectar. Si cerraste 30% de crecimiento, no es sano proyectar otro 30%. Probablemente vengan pidiendote 15% sobre la base inflada. Argumenta: "tuvimos un one-timer que elevo la base, normalicemos primero".`,
      },
      {
        slug: "definicion-pilares-estrategicos",
        titulo: "Definicion de pilares estrategicos",
        descripcion: "Las 4-5 rutas que tu equipo debe transitar para lograr el numero.",
        minutos: 8,
        contenido: `## Definicion de pilares estrategicos

> **Concepto clave - Que son los pilares**
>
> Las 4-5 rutas estrategicas maximas sobre las que concentras los recursos. Son la cancha delimitada: aqui si jugamos, aqui no. Evitan que el equipo disperse recursos.

### Por que los pilares son imprescindibles

En los equipos encuentras perfiles que los pilares ayudan a controlar:
- **El "todista":** hace de todo, cualquier idea nueva le encuentra sentido.
- **El "micro-manager":** se mete en detalle de lo irrelevante.
- **El "desenfocado":** asigna mismo peso a cualquier actividad.

Con pilares claros, incluso la gente menos estrategica sabe donde concentrar.

### Como se construyen

1. Lista 10+ caminos posibles (si hicieramos A, B, C...).
2. Para cada camino estima aporte a venta y EBITDA.
3. Considera recursos: que podemos ejecutar BIEN.
4. Selecciona 4-5 que maximicen retorno y sean ejecutables con excelencia.
5. Los demas se descartan explicitamente ("este ano no hacemos innovacion").

### Principios para elegir

- Aprovecha oportunidades (lo que funciona y puede crecer mas).
- Evita amenazas.
- Manten puntos fuertes.
- Corrige puntos debiles.

### Ejemplo: matriz de pilares

Analisis revela: rentabilidad +1 pt, core +4%, sin innovaciones, precio -3%, planilla encarecida, problema de distribucion. Propuesta: crecer 10% venta, 5% EBITDA.

| Pilar | Descripcion |
|---|---|
| 1. Foco en core business | Explotar producto estrella que tiene aire |
| 2. Rentabilizar via precio y planilla | Ajustar precio, reducir planilla encarecida |
| 3. Fortalecer marca | Continuar construyendo equity |
| 4. Clima y talento | Retencion y desarrollo |

**Fuera explicitamente:** innovacion, expansion de distribucion, nuevos canales. El equipo lo sabe desde el dia uno.

> **Caso - El pilar unico en pandemia: caja**
>
> En una crisis donde la venta es cero, el unico pilar es CAJA. Cuidar liquidez, costos fijos, obligaciones. Los pilares dependen del momento del negocio.`,
      },
      {
        slug: "pilares-a-planes-y-kpis",
        titulo: "De pilares a planes y KPIs",
        descripcion: "Los pilares son genericos. Bajalos a tareas concretas con KPIs.",
        minutos: 7,
        contenido: `## De pilares a planes y KPIs

> **Caracteristicas de buenos planes**
>
> - Redactados en lenguaje consumidor.
> - En orden de prioridad.
> - Maximo 3 planes por pilar.
> - Alineados con presupuesto disponible y responsables asignados.

### Ejemplo - Philadelphia

| Pilar | Planes |
|---|---|
| Volverlo parte del ritual del desayuno | Comunicacion enfocada en desayuno / Promocion anual / Exhibicion cruzada con pan |
| Mejorar accesibilidad | Lanzamiento de menor gramaje para canal tradicional |

### Ejemplo - Cony Park

| Pilar | Planes |
|---|---|
| Recuperar el SSS | Construir marca sobre "Lo divertido es estar juntos" / Elevar presupuesto / Modernizar juegos / Mejorar look & feel / Innovacion potente |
| Rentabilizar la operacion | Renegociar rentas / Ajustar planilla / Cerrar 3 locales con EBITDA negativo |
| Fortalecer la cultura | Plan de ambiente laboral / Comunicacion del nuevo posicionamiento |

### KPIs por tipo de pilar

| Tipo | KPIs |
|---|---|
| Venta / crecimiento | Venta total, SSS, precio, volumen |
| Marca y posicionamiento | Recordacion, tope de mente, NPS |
| Rentabilidad | Margen bruto, EBITDA, planilla/venta |
| Distribucion | Puntos de venta, distribucion ponderada |
| Personas | Clima, rotacion, headcount vs plan |

> **Tip - Hazlo por partes con tu equipo**
>
> Sesion 1: analisis. Sesion 2: pilares. Sesion 3: planes. Sesion 4: KPIs y presupuesto. Mantienes foco y evitas que un equipo poco estrategico se disperse.`,
      },
    ],
  },
  {
    titulo: "Precio: la variable mas rentable",
    descripcion:
      "La palanca mas poderosa con el menor esfuerzo, y tambien la mas incomprendida.",
    lecciones: [
      {
        slug: "por-que-precio-palanca-mas-poderosa",
        titulo: "Por que el precio es la palanca mas poderosa",
        descripcion:
          "El impacto no es lineal: 1% de precio puede traer 5-8% de utilidad adicional.",
        minutos: 6,
        contenido: `## Por que el precio es la palanca mas poderosa

> **Concepto clave - El precio no es lineal**
>
> Un incremento de 1% o 2% no genera 1-2% de mejora en utilidad. El impacto es mayor: el precio pasa directo a la ultima linea sin que se incrementen costos fijos. 1% de precio puede traer 5-8% de utilidad adicional.

El precio impacta por cuatro vias:
1. Subir precio nominal.
2. Cambiar mix hacia productos de mayor ticket.
3. Agregar servicios anexos que el cliente valora.
4. Reducir descuentos, promociones y rebates.

### Caso real - El B2B a 90 dias al 5% de margen

Empresa de seguridad B2B con margenes muy bajos. Para conseguir clientes grandes habian aceptado 5% de margen, pero pagaban a 90 dias. El margen real era menor por costo del dinero.

Mande carta: "o renegociamos o dejo de atender". 85% acepto. **Subi 8-9 puntos de margen a la compania.**

Muchos ejecutivos no renegocian por miedo a perder el cliente. Si el cliente te hace perder plata, cual es tu trabajo? Vender perdiendo no es ganar dinero.

> **Tip - Cuando NO puedes usar precio como palanca**
>
> Si estas en B2B comoditizado o en categoria donde solo compites por precio bajo, tu estructura de costos debe ser muy plana. No puedes tener 85% fijos y competir por precio bajo. Es un error conceptual grave.`,
      },
      {
        slug: "cultura-rentabilidad",
        titulo: "La cultura de la rentabilidad",
        descripcion: "Senales de que tu organizacion no la tiene y como construirla.",
        minutos: 5,
        contenido: `## La cultura de la rentabilidad

> **Concepto clave**
>
> Ambiente organizacional donde todos (no solo gerencia general y finanzas) piensan en maximizar rentabilidad y precio. No se da sola: hay que construirla desde el liderazgo.

### Senales de que NO tienes cultura de rentabilidad

- El gerente de ventas siempre usa el maximo descuento autorizado.
- Marketing lanza al precio mas bajo "por si acaso no vende".
- Compras solo busca ahorros cuando se los piden.
- Ventas mide su exito solo por volumen, sin mirar margen.
- Promociones todas las semanas "porque la competencia tambien".
- Mucha gente cree que vender es el objetivo, no generar valor.

> **Caso - La ironia del precio**
>
> Es la variable menos conocida por la gente, y a la vez la que mas gente toca. Marketing pone precios y promociones. Ventas da descuentos y rebates. Gerencia autoriza ajustes. Finanzas opina sobre margenes. **Todos le meten la mano a una variable que casi nadie domina.**

Tarea del ejecutivo: educar al equipo y establecer politicas claras. Quien toca que, con que autorizacion, bajo que criterios.`,
      },
      {
        slug: "errores-calculo-estrategia-precios",
        titulo: "Errores comunes en calculo y estrategia de precios",
        descripcion: "Desde el mal calculo del margen hasta las promociones mal calibradas.",
        minutos: 7,
        contenido: `## Errores comunes en calculo y estrategia de precios

### Error 1 - Margen sobre costo vs sobre precio

Producto cuesta 100, marginas 25%. Alguien te dice: "ponle 25% encima, precio 125".

**Si pones precio 125, marginaste 20%, no 25%.**

- Margen = (Precio - Costo) / Precio = (125-100)/125 = 20%
- Formula correcta: Precio = Costo / (1 - margen deseado) = 100/0.75 = **133.33**

Esa diferencia de 5 puntos por miles de unidades por meses es mucho dinero perdido por aritmetica.

### Error 2 - Precio basado solo en competidor

"Yo cuesto 10, competidor 10, otro 12, otro 9." Informacion util, pero es lo segundo. Lo primero: que estrategia DEBERIA tener tu marca? Si solo te copias y ellos tampoco saben, asumes el error de todos.

### Error 3 - Promociones indiscriminadas

Mas de una promocion al mes destruye tu precio percibido. La marca se vuelve "promocional". El cliente deja de comprar a precio regular y espera la promo.

> **Caso - La lavanderia con 5-6 promociones al mes**
>
> Al llegar a la cadena de lavanderias: 5-6 promociones al mes. Excusa: "el competidor tambien". Corte todo en el primer mes. Deje UNA sola: tercer jueves, 30% de descuento.
>
> Resultado: ticket promedio subio, la marca dejo de ser promocional, rentabilidad mejoro. **Que no les tiemble la mano: cuiden su precio.** Si el equipo argumenta "el competidor hace lo mismo", entonces imitan su error.

### Error 4 - Promociones mal calibradas al ticket

Apuesta Total iba a lanzar una promo "por cada Sol apostado". La moda de apuesta era 10 Soles. La promo estaba **bajando** el ticket minimo.

**Regla:** cualquier promocion vinculada a ticket debe estar calibrada POR ENCIMA del ticket promedio o moda. Nunca por debajo — entrenas a la gente a bajar.`,
      },
      {
        slug: "tres-estrategias-pricing",
        titulo: "Las 3 estrategias de pricing y la escalera de precios",
        descripcion: "Premium, paridad, economica: evaluar por valor y por rentabilidad.",
        minutos: 8,
        contenido: `## Las 3 estrategias de pricing

Se evalua en dos dimensiones: **valor de tu marca** y **rentabilidad**.

### Paso 1 - Evaluar por valor

Si tu equity es fuerte: tienes 3 opciones (premium, paridad, debajo). Si es debil, probablemente paridad o debajo.

### Paso 2 - Evaluar por rentabilidad

| Situacion | Estrategia |
|---|---|
| Margen en paridad > margen de compania | Premium o paridad |
| Margen en paridad < margen de compania | **Forzosamente premium** (paridad erosiona) |
| Equity debil y margen bajo | Refuerza propuesta ANTES de pricing |

### Caso - Productos de control de cultivos

Producto premium costaba 50 soles/litro, competidor con mismo ingrediente 40. Equipo dijo "bajemos precio". Pero el premium daba **22 dias de control** vs 5-7 dias del competidor.

Al pasar al costo por dia-protegido, el premium salia muchisimo mas barato. El cliente no pagaba 50/litro: pagaba por 22 dias sin preocupacion. Redefinicion del precio por valor. Cambio todo el speech comercial.

### Herramientas adicionales

**Reduccion de gramaje (shrinkflation):** subir precio sin tocarlo. El paneton de 1kg que paso a 950g, 900g, 850g. Palanca con fecha de caducidad: cuando duele, pasa a innovacion premium.

**Cambio del mix:** mover venta hacia productos de mayor margen sube el precio promedio sin tocar precios individuales.

**Escalera de precios del portafolio:**

> **Caso Chili's vs Burger King**
>
> En Delosi: Kentucky y McDonald's S/14.90, Burger King S/15.90, Bembos S/16.90. Chili's (casual dining) lanzo menu del dia a S/15.90 — paridad con BK. En food courts, BK y KFC se desplomaron: por el mismo precio tenias mozo. Chili's debio estar a S/16.90 o S/17.90. **La escalera de precios es estrategica. Ponerse en paridad con tu hermana es canibalizacion.**

> **Regla: cuando bajar precio (y cuando NO)**
>
> Casos validos: lanzamiento nuevo, entrar a nuevo segmento, reaccion puntual competitiva, liquidacion de stock. Fuera de eso, bajar precio es casi siempre destruir valor.`,
      },
    ],
  },
  {
    titulo: "Publicidad, comunicacion e insights",
    descripcion:
      "Exigir resultados a campanas, agencias y al equipo sin perder creatividad.",
    lecciones: [
      {
        slug: "buena-campana-medios",
        titulo: "Que hace una buena campana de medios",
        descripcion: "El atributo no negociable: dar resultados.",
        minutos: 6,
        contenido: `## Que hace una buena campana de medios

> **Concepto clave - El atributo #1**
>
> **Tiene que dar resultados.** Condicion no negociable. No importa cuan creativa, emotiva o premiada sea: si no da resultados, es mala campana.

Mas alla de resultados, debe tener:
- Refleja fundamentos de marca (posicionamiento, esencia, escalon correcto).
- Idea unica poderosa.
- Simple (no hay que explicar).
- Campanable (misma idea puede tener muchas ejecuciones).
- Basada en un insight real del consumidor.
- Apoyada en el mix de medios adecuado.
- Consistente en todos los puntos de contacto.

### Caso - El simio de Cadbury

En reunion regional de Mondelez, director creativo de FCB proyecto una campana: un simio tocando bateria al ritmo de Phil Collins. La idea supuestamente vendia "un chocolate de leche que se derrite". Silencio en la sala.

Le dije: "Un momento, no estamos aca para que ganes premios. Estamos para vender y dar resultados. Si de paso ganas premios, genial. Pero tu prioridad debe ser vender."

**Los duenos de la marca son ustedes, no la agencia.** Si sale algo creativo que no vende, la responsabilidad es suya por haberlo aprobado.

> **Tip - Presiona por creatividad que venda**
>
> No te conformes con creatividad que no vende. No te conformes con vender sin creatividad. La combinacion correcta es: idea creativa poderosa que mueve numeros. Si consistentemente solo te traen premios sin resultados, cambia de agencia.`,
      },
      {
        slug: "reto-marketing-objetivo-comunicacion",
        titulo: "Reto de marketing y objetivo de comunicacion",
        descripcion:
          "Los 2 puntos que debes exigir antes de entrar al creativo.",
        minutos: 5,
        contenido: `## Reto de marketing y objetivo de comunicacion

> **Concepto clave - Reto de marketing**
>
> Descripcion en tercera persona de la actitud, creencia o comportamiento del target que debes cambiar para que te compren. Empieza con "ellos/ellas consideran que..."

### Ejemplos

| Marca | Reto de marketing |
|---|---|
| Philadelphia | Ellas no piensan en Philadelphia para uso diario, solo para ocasiones especiales |
| lan.com | Ellos consideran poco seguras las compras por internet |
| Burger King (Peru) | Solo el 4% del target reconoce que somos 100% carne a la parrilla |

### Objetivo de comunicacion

Lo que tu campana debe lograr en la mente del target. Responde al reto.

| Marca | Objetivo de comunicacion |
|---|---|
| Philadelphia | Inspiralas a amanecer diariamente con el cremoso sabor |
| lan.com | Demuestrales la total seguridad y facilidad de comprar en lan.com |
| Burger King | Comunica de forma clara y repetida que somos 100% carne a la parrilla |

> **Tip - Pidele esto a tu equipo**
>
> No aceptes entrar al creativo sin antes tener definido: (1) reto de marketing y (2) objetivo de comunicacion. Ambos en una linea. Si el equipo no los puede decir claro, la campana no esta lista.`,
      },
      {
        slug: "insights-corazon-campana",
        titulo: "Insights: el corazon de toda campana",
        descripcion: "Verdades del consumidor que generan identificacion instantanea.",
        minutos: 6,
        contenido: `## Insights: el corazon de toda campana

> **Concepto clave**
>
> Un insight es una verdad del consumidor — creencia, habito o emocion real — que al reflejarse en la comunicacion genera identificacion instantanea. El consumidor piensa: "ese soy yo". Esa identificacion hace la campana memorable.

### Ejemplos de insights poderosos

- **Despecho y empoderamiento:** "cuando te dejan, te arreglas, sales mas linda y lo haces sufrir". Varias campanas de cuidado personal.
- **Stalkeo al ex:** "todos en algun momento vigilamos redes del ex". Central en Chips Ahoy con la galletita que pone like.
- **Seguir en casa de los padres:** "tener 30 y seguir viviendo con los papas es incomodo pero real". Productos financieros.
- **Primero en tu categoria:** "ser primero en tomar un atributo emocional protege tu marca por anos". Inca Kola con peruanidad.

### Caso - Cony Park

Analisis: toda la categoria comunicaba lo mismo — diversion, variedad, seguridad. Puro atributo funcional.

Insight real: los padres no llevan a sus hijos a un parque por diversion. Los llevan para **conectar** con ellos. Entre escuela, trabajo y celular, el tiempo compartido es escaso.

Ese insight "uno no se da cuenta de lo ocurrente que es un hijo hasta que pasa tiempo con el" construyo la plataforma "Lo divertido es estar juntos". El target se identifico.

> **Tip - Segmentacion salva campanas**
>
> Una campana con el mejor insight y creativo, si se dispara al target incorrecto, se va a la basura. Lavanderia premium con 30% de descuento masivo atrae "golondrinos" que vienen una vez y no vuelven. Segmentar por distritos, comportamientos, marcas que consumen — ahi construyes base.`,
      },
      {
        slug: "kpis-medios-alcance-frecuencia-sov",
        titulo: "KPIs de medios: alcance, frecuencia, share of voice",
        descripcion: "Como medir tu presencia mediatica y cuando jugar de tactico.",
        minutos: 7,
        contenido: `## KPIs de medios

### Alcance (reach)

Total de personas expuestas al mensaje en un periodo, como % del target. Radio con 60k oyentes, 20k escucharon tu comercial = reach 33%.

**Regla:** el reach de tu campana deberia ser consistente o ligeramente superior a tu market share. Por encima, quemas dinero. Si tu share es 2% y reach 25%, estas sobre-invirtiendo.

### Frecuencia

Numero promedio de veces que una persona ve el mensaje. **3-5 impactos al mes** es rango eficaz. Menos no se recuerda; mas satura.

### Share of Voice (SoV)

Tu participacion en la inversion publicitaria total de la categoria. Industria invirtio 20M, tu 3M = SoV 15%.

> **Caso - Burger King entre McDonald's y KFC**
>
> 2010: mercado publicitario fast food Peru = 15M. BK tenia 17% SoV (2.5M).
>
> 2011: McDonald's lanzo pollo con mas presupuesto, subio a 23%. KFC reacciono, subio a 35%. A BK no le aprobaron mas: cayo a 14%.
>
> 2012 proyectado: mercado llegaria a 20M. Para volver al 17%, necesitaba 3.4M. Tenia 2.5. Necesitaba 36% mas. Improbable.
>
> **Conclusion:** migrar a marca tactica. En lugar de TV y via publica (saturado por los dos grandes), fui a trade marketing, punto de venta, redes, activaciones, CRM y promociones. No se puede ganar la guerra de bulla, pero si la de ejecucion en piso.

> **Regla del SoV**
>
> Lideres (top 2) mantienen SoV cerca o superior a su market share. Desafiantes (3-4) eligen: mantienen SoV (presupuesto enorme) o se vuelven tacticos (trade, CRM, promocion). Jugar en medio es quemar dinero.`,
      },
    ],
  },
  {
    titulo: "Ventas, distribucion y KPIs comerciales",
    descripcion:
      "Planear el equipo comercial, KPIs criticos y scorecard que alinea incentivos con estrategia.",
    lecciones: [
      {
        slug: "planeamiento-ventas-tipos-cliente",
        titulo: "Planeamiento de ventas: tipos de cliente y canales",
        descripcion: "Segmentacion por tiers y mix de portafolio por canal.",
        minutos: 7,
        contenido: `## Planeamiento de ventas: tipos de cliente y canales

Antes de hablar de como vender, define a **quien** vender. Error clasico: equipos que persiguen cualquier cliente sin segmentacion.

### Caso - La empresa de seguridad con clientes de 2 vigilantes

Tamano promedio de cliente: 10 vigilantes. Muy poco. Vendedores pasaban medio dia con alguien que al final solo pedia 2.

Segmentacion en tiers:
- **Tier 1:** grandes mineras (impensables).
- **Tier 2:** medianas, 20+ vigilantes (interesantes).
- **Tier 3:** normales, 10-20 vigilantes.
- **Tier 4:** 2-5 vigilantes (cancelados, solo si vienen solos).

Industrias objetivo: educacion, logistica, financiero, salud. Tamano y estabilidad que justifiquen esfuerzo.

**Excepcion:** si Mall Plaza pedia 2 vigilantes como prueba, tomabamos — por acceso al sector retail, no por tamano.

### Mix de portafolio por canal: Johnny Walker

| Producto | Canales |
|---|---|
| Etiqueta Roja | Todos — bodegas, super, licorerias, horeca |
| Etiqueta Negra | Bodegas A y B, super, licorerias, horeca |
| Double Black / Verde / Dorado | Super, licorerias premium, horeca premium |
| Etiqueta Azul | Solo licorerias premium y super selectos |

Si un vendedor palabrero coloca Azul en bodega C, esa bodega no la puede vender, no te la paga, y se te devuelve. La disciplina en mix por canal protege el negocio.

> **Tip - Renegocia margenes de canal**
>
> Si tu producto da 40% al super y tu competidor 35%, pregunta: ese 5% extra es fuente de ventaja competitiva? O el canal te compra porque el consumidor te pide? Si es lo segundo, ese 5% es pricing que regalas.`,
      },
      {
        slug: "sell-in-sell-out-enron",
        titulo: "Sell-in vs Sell-out: cuidado con el caso Enron",
        descripcion: "Por que medir ambos protege tu negocio y tu carrera.",
        minutos: 6,
        contenido: `## Sell-in vs Sell-out

> **Concepto clave**
>
> - **Sell-in:** lo que TU empresa le vende al canal.
> - **Sell-out:** lo que el canal le vende al consumidor final.
>
> Lo que va al PNL es el sell-in. Pero lo que indica la salud real del negocio es el sell-out.

### El caso Enron

Enron y Arthur Andersen inflaron estados financieros durante anos. Exploto en 2001, destruyo a ambas empresas. De ahi nacieron las politicas de compliance que hoy usan todas las multinacionales.

Una de esas politicas: medicion obligatoria sell-in vs sell-out.

### Ejemplo del ciclo perverso

- Mes 1: vendes 1,000 al canal (sell-in), canal vende 500 al consumidor (sell-out). Quedan 500 de inventario. Reportaste 1,000 al PNL — venta "ficticia".
- Mes 2: repites 1,000 sell-in, 500 sell-out. Ya hay 1,000 de inventario. Puedes dejar de vender un mes y aun tiene stock. La gente cobra bonos por venta que no existe.
- Eventualmente: canal no te paga (no pudo vender), morosidad explota, perecibles vencen, devoluciones masivas, ajuste enorme en PNL, desastre.

> **Regla ejecutiva**
>
> **Nunca premies solo por sell-in.** El scorecard debe incluir sell-out o ratio sell-in/sell-out. Si no, incentivas llenar el canal de producto que no se mueve — ciclo Enron.`,
      },
      {
        slug: "participacion-mercado-rolling-12",
        titulo: "Participacion de mercado: volumen, valor y promedio movil",
        descripcion: "Como leer el market share sin enganarte.",
        minutos: 7,
        contenido: `## Participacion de mercado

### Volumen vs Valor

Market share se puede medir en volumen (litros, kilos, unidades) o valor (plata). **Elige valor siempre que puedas.**

### Caso - Red Bull vs Volt

Un alumno: "Volt tiene 50% de share y Red Bull 20%, Volt esta matando a Red Bull".

Pregunta: en volumen o en valor? Red Bull cuesta S/9, Volt S/3. Si ese 50%-20% es en volumen, al pasarlo a valor Red Bull triplica su contribucion: **60% valor vs 10% valor para Volt. Se invierte completamente.**

### Interpretacion con tendencia

Un share de 34% no dice nada solo. Mira con tendencia:

| Situacion | Interpretacion |
|---|---|
| Mercado cae 10%, tu caes 8% | Ganas share (caes menos) |
| Mercado crece 10%, tu creces 8% | Pierdes share (creces menos) |
| Mercado cae 10%, tu creces 2% | **Ganas share en contracorriente** (excelente) |
| Mercado crece 5%, tu caes 3% | **Grave:** pierdes share en mercado creciente |

### Promedio movil de 12 meses (rolling 12)

> **Concepto clave**
>
> Tecnica que suaviza volatilidad y compara siempre 12 meses contra 12 meses. Evita cantar victoria prematuramente por comparar 2 meses contra 2 cuando lo que viene atras puede tener picos atipicos.

Cada mes, tu ventana es "mes actual hacia atras 12 meses". Al siguiente mes, ventana se mueve. Es el KPI mas sano para decisiones.`,
      },
      {
        slug: "same-store-sales-retail",
        titulo: "Same Store Sales y KPIs de retail",
        descripcion: "El KPI rey del retail y como calcularlo bien.",
        minutos: 7,
        contenido: `## Same Store Sales (SSS)

> **Concepto clave**
>
> Venta de tiendas que han estado abiertas los 12 meses de ambos periodos consecutivos. Tiendas estrictamente comparables. Tu venta total = SSS + aperturas nuevas - cierres.

Retail maduro se sostiene si SSS esta sano. Cadena con 100 locales, 85 son SSS. Expansion debe estar financiada por SSS sano — si el core decae, abrir es apilar problemas. SSS sano crece ~5% anual. Por debajo, investiga.

### Caso - La presentacion del -5%

Finanzas presentaba: "La venta cayo -5%". Intervine: "El ano pasado tenia 12 locales, este ano tengo 10 (cerre dos que perdian 2 anos). Si comparas los mismos 10 contra los mismos 10, estoy **creciendo +2%**."

### Caso opuesto - El +10% que escondia desastre

Apuesta Total: "venimos creciendo +10%". Cuantos locales? 800 ahora, 700 antes. Venta por local hoy = 1,000. Ano pasado = 100. **Las tiendas venden menos; estan destruyendo valor.** La apertura de 100 locales tapaba el problema.

### Reglas del calculo

- Entra al SSS cuando estuvo abierta 12 meses completos de ambos anos.
- Si cerro a mitad del ano A, no entra.
- Si abres en julio del ano A, entra recien al ano C.
- Si hay ampliacion / cambio mayor, sale hasta que haya 2 anos comparables con el nuevo formato.

> **Caso - El Chili's del Ovalo Gutierrez**
>
> Vendia tanto que construyeron segundo piso. Ya no era el mismo local. Lo sacamos del SSS el dia de la ampliacion. Volvio recien cuando tuvo 2 anos completos con los 2 pisos.

### P x Q: por que la venta no se mira sola

**Venta = Precio x Cantidad.** Siempre pide el desagregado: si venta crece 5% con +7% Q y -2% P, estas perdiendo precio. En negocio de altos fijos, -2% en precio puede castigar utilidad 10-15 puntos. La campana que necesitas es de ticket, no de volumen.`,
      },
      {
        slug: "frecuencia-crm-tercer-camino",
        titulo: "Frecuencia y CRM: el tercer camino al crecimiento",
        descripcion: "Nuevos, precio, frecuencia: cuando aplica cada uno.",
        minutos: 6,
        contenido: `## Frecuencia y CRM

Tres caminos para crecer, cada uno aplica en distinta etapa:

| Camino | Cuando aplica | Como se activa |
|---|---|---|
| 1. Nuevos consumidores | Share bajo (<15%) | Captacion, distribucion, muestreo |
| 2. Precio | Marca madura con equity solido | Incremento, mix premium, menos descuentos |
| 3. Frecuencia | Marca madura con base amplia | CRM, que los actuales consuman mas veces |

### Caso - Sodafil y el desayuno

Alta participacion en almuerzo y lonche, casi nula en desayuno. En lugar de pelear share o subir precio, la estrategia fue **frecuencia:** "hagamos que la misma ama de casa tambien nos consuma en desayuno". Campana "Desayuna con Sodafil".

Resultado: no solo crecio Sodafil, crecio toda la categoria de crackers. Se expandio la ocasion de consumo para todas. Sodafil, como lider, revalorizo la categoria entera.

### Segmentacion de frecuencia

| Segmento | Frecuencia | Estrategia |
|---|---|---|
| Light | 1x mes | Descuento 20-25% para segunda visita |
| Medium | 2-3x mes | Premio o combo para pasar a 3-4 |
| Heavy | 4+ x mes | Fidelizacion y premio (no descuento) |
| Abandoners | 3+ meses sin visitar | No persigas; si recuperas, no a cualquier costo |

> **Tip - Donde invertir en CRM**
>
> Tentacion: "reactivar abandoners por nostalgia". **No es rentable** — se fueron por razones estructurales. Es mas rentable subir a los light al medium, y medium al heavy. Ahi el CRM da retorno.

### El scorecard de ventas

No pagues bono solo por venta — incentivas descuento maximo, sell-in sin sell-out, productos de bajo margen. Scorecard balanceado con 3-4 variables:

- Venta total (40-50%).
- Rentabilidad del mix (20-30%).
- Ratio sell-in/sell-out o morosidad (10-20%).
- KPIs especificos (distribucion, nuevos clientes, ticket) (10-20%).

Escalonado: <90% paga 0%. 90-95% paga 50%. 96-99% paga 80%. 100% paga 100%. Comunicado desde enero. Sin credibilidad, nadie se esfuerza el siguiente ano.`,
      },
    ],
  },
  {
    titulo: "Finanzas, presupuesto y presentacion al directorio",
    descripcion:
      "Todo decanta aqui: leer KPIs, armar presupuesto, presentar con impacto.",
    lecciones: [
      {
        slug: "estado-financiero-para-no-financieros",
        titulo: "El estado financiero para no financieros",
        descripcion: "Como leer un PNL por partes y detectar desviaciones rapido.",
        minutos: 5,
        contenido: `## El estado financiero para no financieros

Como ejecutivo comercial, de marketing o producto, eres responsable **hasta la utilidad operativa.**

> **Concepto clave**
>
> - Manejas precio y cantidad: defines la venta (P x Q).
> - Tu producto tiene costo: venta - costo = utilidad bruta.
> - Gastos comerciales, marketing, planilla de tu area: gastos operativos.
> - **Utilidad bruta - gastos operativos = utilidad operativa.** Hasta aqui tu responsabilidad directa.

### Como leer el estado financiero

No de arriba hacia abajo de corrido. Lee por partes:

1. Analiza margen bruto. Mejoro vs AA? Causa: precio, cantidad o costo de ventas. Aisla cada factor.
2. Analiza margen operativo. Que gastos crecieron mas que la venta? Esos son los culpables.
3. Mira ratios sobre venta. Todo gasto que crezca por encima de la tasa de crecimiento de ventas es punto rojo.

> **Tip - Los porcentajes hablan primero**
>
> No empieces por cifras absolutas. Empieza por % de crecimiento linea por linea. Si venta crece 4% y costo de ventas crece 5.7%, ahi hay dolor. Si gasto administrativo crece 11% cuando venta crece 4%, otro problema. Los % revelan desviaciones mas rapido.`,
      },
      {
        slug: "kpis-financieros-clave",
        titulo: "KPIs financieros: ROI, TIR, VAN, payback, punto de equilibrio",
        descripcion: "Los 5 numeros que debes saber interpretar sin ser financiero.",
        minutos: 10,
        contenido: `## KPIs financieros clave

### Punto de equilibrio (break-even)

Venta minima para no perder ni ganar. Ideal para evaluar si cerrar.

> **Tip**
>
> Local perdiendo plata: calcula equilibrio. Si necesitas subir venta 120% para no perder, es imposible — cierra rapido. Si la brecha es pequena, remas un poco mas.

### Valor Presente Neto (VPN / VAN)

Traer dinero del futuro al presente a una tasa. Si un negocio genera 100 al ano por 5 anos, cuanto vale hoy? VPN lo calcula. Se usa mucho para valuation.

### Tasa Interna de Retorno (TIR)

Rentabilidad anual de una inversion. Se compara contra costo de oportunidad del accionista:
- TIR > costo de oportunidad: inviertes. Genera valor.
- TIR < costo de oportunidad: no. Accionista pone su plata en otro lado.

Ejemplo: accionista tiene inversiones al 20% anual. Proyecto con TIR 18% es malo. Con TIR 48% es excelente.

### Caso - Proyectos de seguridad con TIR 6%

Director comercial traia nuevos clientes, modelo economico con inversion en tecnologia salia TIR 6%. Accionista tenia su plata colocada al 20%. "No se lo puedes presentar al directorio asi." Cualquier proyecto que no supere el costo de oportunidad destruye valor. Nosotros filtramos antes de proponer.

### Payback (periodo de recuperacion)

Tiempo para recuperar la inversion inicial via flujo. Invertiste 1M, genera 250k/ano = payback 4 anos.

Aplicacion: en retail con contratos de 10 anos, payback debe ser menor a la mitad del contrato. Chili's tenia payback 2 anos. Burger King 3.5. Si tu payback es 8 sobre contrato de 10, solo ganas 2 de 10 — mal negocio.

### ROI de marketing

**ROI = (Ganancia incremental - Inversion) / Inversion**

Ojo: la "ganancia" NO es la venta. Es la utilidad que la campana trajo. Generaste 2,000 venta extra, campana costo 500, costos adicionales 1,300: ganancia incremental = 200, no 2,000.

Pregunta clave: **que hubiera pasado sin la campana?** Compara periodo con campana vs comparable sin campana. La diferencia es la ganancia incremental — siempre descontando costos asociados.`,
      },
      {
        slug: "one-timers-proteger-gestion",
        titulo: "One-timers y como proteger tu gestion",
        descripcion: "Separar gastos atipicos del resultado comparable.",
        minutos: 5,
        contenido: `## One-timers

> **Concepto clave**
>
> Gastos atipicos que ocurren una sola vez y no son recurrentes. No deben ensuciar la evaluacion de tu gestion — no se van a repetir el siguiente ano.

### Ejemplos tipicos

- Head hunter contratado para busqueda puntual.
- Liquidaciones por desvinculaciones masivas fuera de plan.
- Viajes al extranjero por proyectos autorizados fuera del plan.
- Estudios de mercado o consultorias puntuales pedidas por directorio.
- Auditorias especiales.
- Contingencias legales cerradas.

### Como presentarlos

Al cierre del ano, 2 columnas:

| Columna | Contiene |
|---|---|
| Resultado reportado | PNL tal como salio |
| Resultado comparable | Excluyendo one-timers identificados |

**Tu conversacion:** "En el reportado ganamos menos que el ano pasado. De eso, 650k fueron gastos autorizados fuera de mi plan: head hunter, contrataciones para proyecto que no arranco, liquidaciones. Si miramos el comparable, mi gestion trajo +X%. Esos gastos no se repiten el proximo ano."

> **Tip - Astucia gerencial**
>
> Esto no es manipular: es darle al directorio la foto correcta. Lo que tu gestionaste vs lo que el propio directorio decidio adicional. Los one-timers tienen que estar claramente identificados, documentados y verificables. No se inventan ni maquillan.`,
      },
      {
        slug: "kpis-personas-planilla-clima",
        titulo: "KPIs de personas: headcount, planilla/venta, clima, rotacion",
        descripcion: "Los numeros de gente que todo directorio quiere ver.",
        minutos: 7,
        contenido: `## KPIs de personas

### 1) Headcount

Cuantas personas tiene tu compania y cuanto cuesta la planilla.

> **Caso - La "palomillada" de los reemplazos baratos**
>
> Candado: "100 personas, 1M de costo". Gerente de ventas: "dejame despedir 2 y contratar 4 mas baratos, te mantengo el costo". Si aceptas: 102 personas al mismo millon, 2 mas baratas (menos experimentadas).
>
> Ano siguiente: "lo mismo con 2 mas". En 2 anos: 110 personas mal pagadas, sub-preparadas. Abriste el candado.
>
> **Lesson:** define bandas salariales de mercado y respetalas.

### 2) Planilla / Venta (ratio de eficiencia)

Planilla total / venta total. Pasaste de 25% a 26%: te encareciste 1 punto. En millones de venta, es mucho dinero.

### Caso - Mantenimiento Cony Park Peru vs Colombia

Peru: 16 personas en mantenimiento, facturando 90M con 32,000 m2. Parecia alto pero "no es mi area". Llame a mi par de Colombia: 80M, 30,000 m2, **9 personas**.

"O reduces tu, o reduces yo". Al mes bajamos a 10. Nunca paso nada operativo. Era pura sobredimension.

**Al llegar a una empresa, probabilidad de sobredimension es alta. No te creas los "no se puede" del primer momento. Audita con benchmarks externos.**

### 3) Clima laboral

Midelo cada 2 meses en retail, anual en corporativo. Clima malo en local = mal servicio = perdida de venta.

> **Tip - Empleados = reflejo de lideres**
>
> - Lideres toxicos: gente toxica, puro "si senor".
> - Lideres que promueven pensar fuera de la caja: gente creativa.
> - Lideres que maltratan: alta rotacion y ejecucion por miedo.

### 4) Rotacion

Mide total y por area. Si un area rota mucho, muchas veces es el jefe. "Uno no renuncia a la compania, uno renuncia al jefe."

Retail tiene rotacion alta estructural por contratos de campana. Distingue natural vs problematica.`,
      },
      {
        slug: "armado-presupuesto-etapas",
        titulo: "Armado del presupuesto por etapas",
        descripcion: "Por que armarlo de una vez es un pan con mango.",
        minutos: 6,
        contenido: `## Armado del presupuesto por etapas

> **Error comun**
>
> Lo peor: que todas las areas carguen sus numeros al mismo tiempo, lo metas al horno y finanzas escupa un estado financiero final. Pan con mango: no cuadra venta, calendario ni gastos, y corriges desordenadamente.

### Metodo correcto: por etapas

| Etapa | Que se hace | Quien |
|---|---|---|
| 1. Top line | Venta total y por producto, calendarizada por mes | Ventas + marketing + GG |
| 2. Validacion top line | Presentar al directorio y ajustar | GG + directorio |
| 3. Costos y gastos por area | Cada area carga su presupuesto | Todas las areas |
| 4. Revision area por area | Sesiones individuales para cuestionar y ajustar | GG con cada gerente |
| 5. Consolidacion final | Finanzas arma el PNL integrado | Finanzas |
| 6. Ajuste final | Revision global, meses con utilidades raras | GG + finanzas |

> **Termometro de cada area**
>
> Si tu venta crece 10% y un area trae crecimiento 15%, ese area se encarece. A menos que tenga argumento solido (proyecto nuevo, contratacion necesaria), ajusta. Todo gasto por encima del crecimiento de ventas erosiona margen.

> **Tip - Guarda "platita"**
>
> Despues de presentar, el directorio suele pedir "mas utilidad" de lo que trajiste. Ten listo que actividades puedes cortar rapidamente. El buen marketero siempre mete "actividades bonitas" (influencer tal, activacion cual) que no mueven la aguja — esas son las primeras en irse. Tambien es sano guardar reserva si el ano viene incierto.`,
      },
      {
        slug: "tips-presentacion-ejecutiva",
        titulo: "Tips de presentacion ejecutiva",
        descripcion: "Checklist para presentar al directorio con impacto.",
        minutos: 6,
        contenido: `## Tips de presentacion ejecutiva

### 1) Pasa de mucho a poco

Pocas laminas y mucho impacto. Cada lamina con una idea clara, respaldada por numero o grafico. 50 laminas = no has decantado lo esencial.

### 2) Lleva lo que mueve la aguja

- Portafolio: solo productos que cambian el negocio. Resto a "otros".
- Costos: solo los 3-4 insumos que mueven el numero. Nunca la lechuga.
- KPIs: los 5-6 que el directorio necesita para decidir. No 30.

### 3) Se retador pero sustentado

Numero retador con analisis, pilares y planes. Un directorio experimentado ve de lejos al "play safe" y al "ambicioso sin argumento". Sweet spot: retador con sustento.

### 4) Se pro-gente

> **Tip - 1 lamina final con foto de equipo**
>
> Campeonato de fulbito, actividad del Dia de la Madre, presentacion de nuevo colaborador. Te pones en la foto. Te pintas como lider pro-gente. A los directores les encanta.
>
> Otra tactica: pide que un miembro del equipo entre 10 minutos a presentar una parte (ensayado antes). Le das exposure, te ven como lider que desarrolla talento.

### 5) Domina tus numeros

Conoce tu gasto linea por linea. Si el directorio te pregunta por una linea, debes explicar que es, por que esta, impacto. Si pasa gato por liebre porque no lo viste, perdiste credibilidad.

> **Caso - Los practicantes**
>
> 40 minutos discutiendo el gasto de 6 practicantes. Dije: "Voto a los 6 manana y la compania sigue ganando lo mismo, se los demuestro?". Silencio. Avanzamos.
>
> Tu tienes autoridad para decir "esto no mueve el numero, avancemos". Pero para decirlo tienes que conocer tus numeros.

### 6) Domina el storytelling del flujo

A veces no podras arreglar el numero en un ano. Vende un flujo: "ano 1 perdemos un poco mas corrigiendo fundamentos; ano 2 breakeven; ano 3 empieza ganancia; ano 5 plenamente en generacion de valor". Sustenta con analisis.

> **Cierre**
>
> Tu trabajo no es un ano espectacular. Es **consistencia en el largo plazo.** La compania vale mas cuando la gestion es prolija ano tras ano, los KPIs se mantienen sanos, equipos performan y marca construye. Esa es la diferencia entre un ejecutivo con trayectoria y uno de un solo golpe.`,
      },
    ],
  },
];

async function main() {
  console.log("Sembrando curso: Planeamiento Estrategico de Marketing...\n");

  const marketing = await prisma.area.findUnique({
    where: { nombre: "Marketing" },
    select: { id: true },
  });
  if (!marketing) {
    console.error("No se encontro el area Marketing. Corre primero db:seed.");
    process.exit(1);
  }

  // Idempotencia
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
      titulo: "Planeamiento Estrategico de Marketing",
      descripcionCorta:
        "De la estrategia a la generacion de valor. 8 modulos, casos reales, criterio ejecutivo.",
      descripcion:
        "Programa de capacitacion interna disenado para que desarrolles la capacidad estrategica de analizar, planear y ejecutar el manejo de una marca, categoria o unidad de negocio con criterio gerencial y foco en la generacion de valor. Basado en anos de experiencia real en gerencia de marketing y gerencia general en Colgate-Palmolive, Mondelez, Burger King, Cony Park, Quimica Suiza, Apuesta Total y mas. Dirigido a ejecutivos de primera linea, gerentes de marketing, de producto, jefes de categoria, gerentes comerciales y generales en formacion, jefes de trade marketing y analistas senior con responsabilidad sobre una marca, categoria o presupuesto comercial.",
      thumbnailUrl: "https://picsum.photos/seed/planeamiento-estrategico/800/450",
      duracionMinutos: totalMinutos,
      nivel: "AVANZADO",
      areaId: marketing.id,
      publicado: true,
      puntosRecompensa: 300,
      instructorNombre: "Carlos Mendoza",
      instructorAvatarUrl: null,
      orden: 10,
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
