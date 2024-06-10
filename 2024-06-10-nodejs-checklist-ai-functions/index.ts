import 'dotenv/config';
import { OpenAI } from 'openai';
import fs from 'node:fs/promises';

const openai = new OpenAI();

const preguntas = `1. ¿El guion es claro y fácil de entender?
2. ¿El contenido es relevante y atractivo para la audiencia objetivo?
3. ¿Hay un gancho interesante en los primeros segundos del guion?
4. ¿El guion tiene un desarrollo coherente y lógico?
5. ¿El guion incluye un llamado a la acción (CTA) claro y efectivo?
6. ¿Hay un equilibrio adecuado entre el diálogo y la acción visual?
7. ¿El guion es sobre AI?`

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

const respuesta = await openai.chat.completions.create({
  messages: [{
    role: 'system',
    content: 'Eres un asistente de clase mundial.',
  }, {
    role: 'user',
    content: `Responde las siguientes preguntas con "SI" o "NO":
    ${ preguntas }

    ${ guion }`,
  }],
  model: 'gpt-4o',
  tools,
  tool_choice: 'required',
});

const llamadaAFuncion = respuesta.choices[0].message.tool_calls![0].function;

await fs.writeFile('./llamadaAFuncion.json', JSON.stringify(llamadaAFuncion));
