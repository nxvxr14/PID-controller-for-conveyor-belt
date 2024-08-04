const { Board, Led } = require("johnny-five");

const board = new Board();

const enableAPin = 5;
const inputH1Pin = 3;
const inputH2Pin = 4;
const velocidadDeseada = 60; // Define la velocidad deseada (puedes ajustar este valor)

board.on("ready", () => {
  // Configura los pines como salida
  board.pinMode(enableAPin, board.MODES.PWM);
  board.pinMode(inputH1Pin, board.MODES.OUTPUT);
  board.pinMode(inputH2Pin, board.MODES.OUTPUT);

  // Establece la dirección del motor
  board.digitalWrite(inputH1Pin, 0);
  board.digitalWrite(inputH2Pin, 1);

  // Envía el PWM de 120
  board.analogWrite(enableAPin, velocidadDeseada);

  // Detener el motor después de 5 segundos
  board.wait(5000, () => {
    // Apaga el PWM y los pines de dirección
    board.analogWrite(enableAPin, 0);
    board.digitalWrite(inputH1Pin, 0);
    board.digitalWrite(inputH2Pin, 0);
  });
});
