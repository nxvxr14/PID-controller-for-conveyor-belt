const { Board, Led } = require("johnny-five");


const radsVelHistory = [];

const pulse_per_turn = 52;
const kRpm = 2 * Math.PI / 60;
const kRpmGen = 60 * 1000 / pulse_per_turn;
const tMuestreo = 40;

const board = new Board();

let velFiltered = 0;
let autoincrement = true;
let startTime = 0;
let elapsedTime;
let previousValue = 0;
let valorPWM = 0; 
let radsVel = 0;
let pulsos = 0;
let rpmGen = 0;
let TIME = Date.now();
let sp = 1.175; 
let en = 0; 
let en_1 = 0; 
let I_error = 0; 
let I_error_1 = 0; 

const pulsosPin = 2;
const inputH1Pin = 3;
const inputH2Pin = 4;
const enableAPin = 11;


board.on("ready", () => {
  board.pinMode(enableAPin, board.MODES.PWM);
  board.pinMode(inputH1Pin, board.MODES.OUTPUT);
  board.pinMode(inputH2Pin, board.MODES.OUTPUT);
  board.pinMode(pulsosPin, board.MODES.INPUT);

  board.digitalWrite(inputH1Pin, 0);
  board.digitalWrite(inputH2Pin, 1);

  board.digitalRead(pulsosPin, (value) => {
    if (value === 1 &&  previousValue === 0) {
      pulsos++;
      if((Date.now() - TIME >= tMuestreo ) ){
        rpmGen = kRpmGen / (Date.now() - TIME ) * pulsos;
        radsVel = rpmGen * (kRpm);
  
        // Aplica el filtro de media móvil
        velFiltered = filtroMediaMovil(radsVel, radsVelHistory, 2); // Cambia el 5 por el tamaño de la ventana del filtro si es necesario
  
        if (velFiltered !== 0) {
          if(autoincrement == true) {
            if (startTime == 0) {
              startTime = Date.now(); // Registrar el tiempo de inicio
            }
            elapsedTime = Date.now() - startTime; // Calcular el tiempo transcurrido
          }
          console.log(elapsedTime+","+sp+","+velFiltered+","+(valorPWM/255)*100);
        }
  
        TIME = Date.now();
        pulsos = 0;
      }
    }
    previousValue = value;
  });

  setInterval(() => {
    controlPID();
}, tMuestreo);



});

function controlPID() {
    if (sp === 0) {
        valorPWM = 0;
        board.analogWrite(enableAPin, valorPWM);
        return; // Salir de la función si sp es cero
      }
  let K = 5;
  let Ti = 0.06300;
  let Td = 0; 
  let T = 0.04;
  
  let Kp = K * (1 - T / (2 * Ti));
  let Ki = K * T / Ti;
  let Kd = K * Td / T;

  en = sp - velFiltered;
  let A_p = Kp * en;
  let A_d = Kd * (en - en_1);
  I_error = en + I_error_1;
  let A_i = Ki * I_error;
  let Uc = A_p + A_d + A_i;
  let un = Uc;

  if (Uc < 0) {
    un = 0;
  }
  if (Uc > 100) {
    un = 100;
  }
  valorPWM = (un/ 100) * 255;
  board.analogWrite(enableAPin, valorPWM); 

  en_1 = en;
  I_error_1 = I_error;
}

function filtroMediaMovil(valorActual, historial, longitud) {
    historial.push(valorActual);
    if (historial.length > longitud) {
      historial.shift();
    }
    const suma = historial.reduce((acumulador, valor) => acumulador + valor, 0);
    return suma / historial.length;
  }
