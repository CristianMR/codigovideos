import { $, component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useSignal } from '@builder.io/qwik';

export default component$(() => {
  const inProgress = useSignal(false);

  const text = useSignal(`Escena: Una persona delante de una mesa con ingredientes para una receta rápida y deliciosa con voz en off]

Persona: "¡Hola, TikTok! Hoy les voy a enseñar a hacer una pizza de sartén en solo 10 minutos."

[Escena: Rápido montaje de ingredientes: tortilla de trigo, salsa de tomate, queso rallado, pepperoni y albahaca]

Persona: "Primero, calentamos la sartén a fuego medio. Luego, colocamos la tortilla y añadimos una capa de salsa de tomate."

[Escena: Manos extendiendo el queso rallado y colocando pepperoni]

Persona: "Extendemos queso rallado por encima y agregamos pepperoni. Tapamos y cocinamos por 5-7 minutos."

[Escena: Persona mostrando la pizza lista]

Persona: "Y listo… una pizza deliciosa en minutos. ¡Prueba y disfruta! No olvides seguirme para más recetas rápidas."`);

  const questions = useSignal([
    '¿El guion es claro y fácil de entender?',
    '¿El contenido es relevante y atractivo para la audiencia objetivo?',
    '¿Hay un gancho interesante en los primeros segundos del guion?',
    '¿El guion tiene un desarrollo coherente y lógico?',
    '¿El guion incluye un llamado a la acción (CTA) claro y efectivo?',
    '¿Hay un equilibrio adecuado entre el diálogo y la acción visual?',
    '¿El guion es sobre AI?',
  ]);

  const result = useSignal<Record<number, boolean>>({});

  const handleAskAI = $(async () => {
    inProgress.value = true;

    result.value = {};

    try {
      const response = await fetch(`http://localhost:5678/webhook-test/checklist-ai-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.value,
          questions: questions.value.map((question, index) => `${index}. ${question}`),
        }),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const data = await response.json() as [{ output: { question: number, done: boolean }[] }];

      result.value = data[0].output
        .reduce((acc, item) => ({ ...acc, [item.question]: item.done }), {});
    } catch(error) {
      alert(error);
    }

    inProgress.value = false;
  });

  return (
    <>
      <div class="container mx-auto max-w-md">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th></th>
                <th class="text-black">Preguntas Guión</th>
                <th>
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.value.map((item, index) => {
                const done = result.value[index];

                return <tr key={index}>
                  <th>{index + 1}</th>
                  <td>{item}</td>
                  <td>{done === undefined ? null : done ? '✅' : '❌'}</td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
        <div class="my-2">
          <textarea class="textarea textarea-primary w-full" placeholder="Texto" bind:value={text}></textarea>
        </div>
        <div class="flex">
          <button class="btn btn-primary ml-auto" onClick$={handleAskAI} disabled={inProgress.value}>
            {inProgress.value ? 'Revisando...' : 'Revisar'}
          </button>
        </div>
      </div>
    </>
  );
});

export const head: DocumentHead = {
  title: "Checklist AI 2024-06-06",
};
