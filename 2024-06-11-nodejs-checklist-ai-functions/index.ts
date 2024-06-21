import 'dotenv/config';
import { OpenAI } from 'openai';
import fs from 'node:fs/promises';

const openai = new OpenAI();

const preguntas = [
  '¿El guion es claro y fácil de entender?',
  '¿El contenido es relevante y atractivo para la audiencia objetivo?',
  '¿Hay un gancho interesante en los primeros segundos del guion?',
  '¿El guion tiene un desarrollo coherente y lógico?',
  '¿El guion incluye un llamado a la acción (CTA) claro y efectivo?',
  '¿Hay un equilibrio adecuado entre el diálogo y la acción visual?',
  '¿El guion es sobre AI?',
];

const guion = `Escena: Una persona delante de una mesa con ingredientes para una receta rápida y deliciosa con voz en off]
Persona: "¡Hola, TikTok! Hoy les voy a enseñar a hacer una pizza de sartén en solo 10 minutos."

[Escena: Rápido montaje de ingredientes: tortilla de trigo, salsa de tomate, queso rallado, pepperoni y albahaca]

Persona: "Primero, calentamos la sartén a fuego medio. Luego, colocamos la tortilla y añadimos una capa de salsa de tomate."

[Escena: Manos extendiendo el queso rallado y colocando pepperoni]

Persona: "Extendemos queso rallado por encima y agregamos pepperoni. Tapamos y cocinamos por 5-7 minutos."

[Escena: Persona mostrando la pizza lista]

Persona: "Y listo… una pizza deliciosa en minutos. ¡Prueba y disfruta! No olvides seguirme para más recetas rápidas."`;

const tools = [
  {
    type: "function" as const,
    function: {
      name: "respuestas_a_preguntas",
      description: "Obtiene la respuesta a las preguntas",
      parameters: {
        type: "object",
        properties: {
          respuestas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                pregunta: {
                  type: "number"
                },
                respuesta: {
                  type: "boolean"
                }
              },
              required: ["pregunta", "respuesta"]
            }
          }
        },
        required: ["respuestas"]
      },
    },
  },
];

let respuesta = await openai.chat.completions.create({
  messages: [{
    role: 'system',
    content: 'Eres un asistente de clase mundial.',
  }, {
    role: 'user',
    content: `Responde las siguientes preguntas con "SI" o "NO":
    ${ preguntas.map((p, indice) => `${indice}. ${p}`).join('\n') }

    ${ guion }`,
  }],
  model: 'gpt-4o',
  tools,
  tool_choice: 'required',
});

let llamadaAFuncion = respuesta.choices[0].message.tool_calls![0].function;

if (llamadaAFuncion.name === 'respuestas_a_preguntas') {
  const argumentos: { respuestas: { pregunta: number, respuesta: boolean }[] } = JSON.parse(llamadaAFuncion.arguments!);

  const preguntasSinSatisfacer = argumentos.respuestas
    .filter(r => r.respuesta === false)
    .map(r => preguntas[r.pregunta])

  const tools = [
    {
      type: "function" as const,
      function: {
        name: "guion_mejorado",
        description: "Obtiene la respuesta a las preguntas",
        parameters: {
          type: "object",
          properties: {
            texto_mejorado: {
              type: "string",
            },
            required: ["texto_mejorado"],
          },
        },
      },
    },
  ];

  respuesta = await openai.chat.completions.create({
    messages: [{
      role: 'system',
      content: 'Eres un asistente de clase mundial.',
    }, {
      role: 'user',
      content: `Mejora el texto para que las respuestas a las siguientes preguntas sean "SI"
      ${ preguntasSinSatisfacer }

      ${ guion }`,
    }],
    model: 'gpt-4o',
    tools,
    tool_choice: 'required',
  });

  llamadaAFuncion = respuesta.choices[0].message.tool_calls![0].function;

  await fs.writeFile('./llamadaAFuncion.json', JSON.stringify(llamadaAFuncion));
}
