import 'dotenv/config';
import { OpenAI } from 'openai';

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

const respuesta = await openai.chat.completions.create({
  messages: [{
    role: 'system',
    content: 'Eres un asistente de clase mundial diseñado para responder en JSON.',
  }, {
    role: 'user',
    content: `Responde las siguientes preguntas con "SI" o "NO":
    ${ preguntas }

    ${ guion }

Ejemplo:
[{ "pregunta": 1, "resultado": "SI" }, { "pregunta": 2, "resultado": "NO" }]`,
  }],
  model: 'gpt-4o',
  response_format: { type: 'json_object' },
});

const json = respuesta.choices[0].message.content;

console.log(JSON.stringify(
  JSON.parse(json!), null, 2)
);
