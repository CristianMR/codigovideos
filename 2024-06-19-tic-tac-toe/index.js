import 'dotenv/config';
import { OpenAI } from 'openai';
import readline from 'readline';
import chalk from 'chalk';

// Crear una matriz para el tablero
const tablero = [
  [' ', ' ', ' '],
  [' ', ' ', ' '],
  [' ', ' ', ' '],
];

/**
 * Converts the given row and column indices to a position in a 3x3 matrix.
 *
 * @param {number} row - The row index.
 * @param {number} col - The column index.
 * @return {number} The position in the matrix.
 */
function filasColumnasAPosicion(row, col) {
  return row * 3 + col;
}

// Función para mostrar el tablero
function mostrarTablero() {
  console.log('---------');
  for (let row = 0; row < tablero.length; row++) {
    const texto = [0, 1, 2].map((col) => {
      const valor = tablero[row][col];
      // Si la celda esta libre mostrar la posicion
      if (valor === ' ') return filasColumnasAPosicion(row, col);
      // Darle color rojo a X y azul a O
      return valor === 'X' ? chalk.red('X') : chalk.blue('O');
    }).join(' | ');
    console.log(`| ${texto} |`);
  }
}

// Función para verificar si hay un ganador
function revisarGanador() {
  // Verificar filas
  for (let i = 0; i < tablero.length; i++) {
    if (tablero[i][0] === tablero[i][1] && tablero[i][1] === tablero[i][2] && tablero[i][0] !== ' ') {
      return tablero[i][0];
    }
  }
  // Verificar columnas
  for (let j = 0; j < tablero.length; j++) {
    if (tablero[0][j] === tablero[1][j] && tablero[1][j] === tablero[2][j] && tablero[0][j] !== ' ') {
      return tablero[0][j];
    }
  }
  // Verificar diagonales
  if (tablero[0][0] === tablero[1][1] && tablero[1][1] === tablero[2][2] && tablero[0][0] !== ' ') {
    return tablero[0][0];
  }
  if (tablero[0][2] === tablero[1][1] && tablero[1][1] === tablero[2][0] && tablero[0][2] !== ' ') {
    return tablero[0][2];
  }
  // Verificar si el tablero está lleno
  for (let i = 0; i < tablero.length; i++) {
    for (let j = 0; j < tablero[i].length; j++) {
      if (tablero[i][j] === ' ') {
        return null;
      }
    }
  }
  return 'Empate';
}

// Función para jugar
function jugar() {
  // Definir los jugadores
  const jugadorHumano = /** @type {'X' | 'O'} */ (['X', 'O'][Math.floor(Math.random() * 2)]);
  const jugadorIA = jugadorHumano === 'X' ? 'O' : 'X';

  // Definir el turno
  let jugadorActual = 'X';
  let ganador = null;

  // Crear un objeto readline para recibir entradas del usuario
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  /**
   * Converts a numeric position to row and column indices.
   *
   * @param {number} posicion - The numeric position to convert.
   * @return {Array<number>} An array containing the row and column indices.
   */
  function posicionNumericaAFilasColumnas(posicion) {
    const [row, col] = [Math.floor((posicion) / 3), (posicion) % 3];
    return [row, col];
  }

  function pedirMovimiento() {
    rl.question('Ingrese la posición (0-8): ', (posicion) => {
      // transformar posicion a filas y columnas
      const [row, col] = posicionNumericaAFilasColumnas(+posicion);

      realizarMovimiento(row, col);
    });
  }

  // Función para manejar la entrada de GPT
  async function pedirMovimientoGPT() {
    const openai = new OpenAI();

    // coordenadas de posibles movimientos
    const movimientosPosibles = Array
      .from({ length: 9 }, (_, i) => posicionNumericaAFilasColumnas(i))
      // ignorar posiciones donde ya hay una ficha
      .filter(([row, col]) => tablero[row][col] === ' ')
      .map(([row, col]) => /** @type {`${number}-${number}`} */ (`${row}-${col}`));

    /**
     * @type {OpenAI.Chat.Completions.ChatCompletionTool[]}
     */
    const tools = [
      {
        type: "function",
        function: {
          name: "realizar_movimiento",
          description: "Realiza un movimiento en el tablero",
          parameters: {
            type: "object",
            properties: {
              movimiento: {
                type: "string",
                enum: movimientosPosibles
              }
            },
            required: ["movimiento"]
          },
        },
      },
    ];

    let respuesta = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Eres un jugador de tic-tac-toe de clase mundial.',
        },
        {
          role: 'user',
          content: `En base al siguiente tablero escoge una de las posiciones, tu eres ${jugadorIA}.

          Ten en cuenta que la primer posicion mostrada es 0-0

          Tablero:

          ${ tablero.map((row) => row.map((value) => value === ' ' ? '-' : value).join(' | ')).join('\n') }`
        }
      ],
      model: 'gpt-4o',
      tools,
      tool_choice: 'required',
    });

    const llamadaAHerramienta = respuesta.choices[0].message.tool_calls[0].function;

    const movimientoGPT = /** @type {`${number}-${number}`} */ (
      JSON.parse(llamadaAHerramienta.arguments).movimiento
    );

    // transformar posicion a filas y columnas
    const [row, col] = /** @type {Array<number>} */ (movimientoGPT.split('-').map(Number));

    console.log(`Movimiento GPT: ${filasColumnasAPosicion(row, col)}`);

    realizarMovimiento(row, col);
  }

  /**
   * Función para manejar la entrada del usuario
   *
   * @param {number} row - The row of the input.
   * @param {number} col - The column of the input.
   * @return {void}
   */
  function realizarMovimiento(row, col) {
    if (tablero[row][col] === ' ') {
      tablero[row][col] = jugadorActual;
      mostrarTablero();
      ganador = revisarGanador();
      if (ganador) {
        console.log(`El ganador es: ${ganador}`);
        rl.close();
      } else {
        // Cambiar el turno
        jugadorActual = jugadorActual === 'X' ? 'O' : 'X';

        if (jugadorActual === jugadorHumano) {
          pedirMovimiento();
        } else {
          pedirMovimientoGPT();
        }
      }
    } else {
      console.log('Posición ocupada. Ingrese otra posición.');
      pedirMovimiento();
    }
  }

  // Iniciar el juego
  console.log('Bienvenido al juego de tic-tac-toe.');

  mostrarTablero();

  if (jugadorActual === jugadorHumano) {
    pedirMovimiento();
  } else {
    pedirMovimientoGPT();
  }
};

jugar();
