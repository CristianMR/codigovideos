import 'dotenv/config';
import { OpenAI } from 'openai';
import fs from 'node:fs/promises';

const openai = new OpenAI();

/**
 * Calculates the result of a mathematical operation based on the given values and operation.
 *
 * @param {Object} options - The options object.
 * @param {number} options.valor1 - The first value.
 * @param {number} options.valor2 - The second value.
 * @param {('suma'|'resta')} options.operacion - The mathematical operation to perform.
 * @return {number} The result of the mathematical operation.
 */
const calcular = ({ valor1, valor2, operacion }) => {
  return operacion === 'suma' ?
    valor1 + valor2 :
    valor1 - valor2;
};

/**
 * @type {OpenAI.Chat.Completions.ChatCompletionMessageParam[]}
 */
const messages = [
  {
    role: 'system',
    content: 'Eres un asistente de clase mundial.',
  },
  {
    role: 'user',
    content: `Resuelve el siguiente problema:

    El papá de Luis le regaló diez caramelos, y su mamá le regalo dos.
    ¿Cuántos caramelos puede comer Luis?`,
  },
];

/**
 * @type {OpenAI.Chat.Completions.ChatCompletionTool[]}
 */
const tools = [
  {
    type: "function",
    function: {
      name: "calcula_dos_numeros",
      description: "Realiza una operacion matematica entre dos numeros",
      parameters: {
        type: "object",
        properties: {
          valor1: {
            type: "number"
          },
          valor2: {
            type: "number"
          },
          operacion: {
            type: "string",
            enum: ["suma", "resta"]
          }
        },
        required: ["valor1", "valor2", "operacion"]
      },
    },
  },
];

let respuesta = await openai.chat.completions.create({
  messages,
  model: 'gpt-4o',
  tools,
  tool_choice: 'required',
});

messages.push(respuesta.choices[0].message);

const llamadaAHerramienta = respuesta.choices[0].message.tool_calls[0];
const llamadaAFuncion = llamadaAHerramienta.function;

await fs.writeFile('./respuesta1.json', JSON.stringify(llamadaAFuncion, null, 2));

const resultado = calcular(JSON.parse(llamadaAFuncion.arguments));

messages.push({
  tool_call_id: llamadaAHerramienta.id,
  role: "tool",
  content: JSON.stringify({ resultado }),
});

respuesta = await openai.chat.completions.create({
  messages,
  model: 'gpt-4o',
});

const mensajeFinal = JSON.stringify(respuesta.choices[0].message.content, null, 2);

await fs.writeFile('./respuesta2.txt', mensajeFinal, 'utf-8');
