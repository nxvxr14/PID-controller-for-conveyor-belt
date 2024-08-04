const { Board } = require("johnny-five");
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 5500;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const radsVelHistory = [];

const pulse_per_turn = 2;
const kRpm = 2 * Math.PI / 60;
const kRpmGen = 60 * 1000 / pulse_per_turn;
const tMuestreo = 50;

const board = new Board();

let selectedControlType = 'PID'; // Valor predeterminado, puedes ajustarlo según tu necesidad
let velFiltered = 0;
let autoincrement = false;
let startTime = 0;
let elapsedTime;
let previousValue = 0;
let valorPWM = 0;
let radsVel = 0;
let pulsos = 0;
let rpmGen = 0;
let TIME = Date.now();
let sp = 0;
let en = 0;
let en_1 = 0;
let I_error = 0;
let I_error_1 = 0;
let dif_act = 0;

const pulsosPin = 2;
const inputH1Pin = 3;
const inputH2Pin = 4;
const enableAPin = 5;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

app.post('/actualizar-sp', (req, res) => {
    const { sp: newSP, autoincrement: newAutoincrement, controlType } = req.body;

    sp = newSP;
    autoincrement = newAutoincrement;

    // Actualiza el tipo de control seleccionado
    selectedControlType = controlType || 'PID';

    res.send('SP, autoincrement y tipo de control actualizados exitosamente');
});

board.on("ready", () => {
    board.pinMode(enableAPin, board.MODES.PWM);
    board.pinMode(inputH1Pin, board.MODES.OUTPUT);
    board.pinMode(inputH2Pin, board.MODES.OUTPUT);
    board.pinMode(pulsosPin, board.MODES.INPUT);

    board.digitalWrite(inputH1Pin, 0);
    board.digitalWrite(inputH2Pin, 1);

    board.digitalRead(pulsosPin, (value) => {
        if (value === 1 && previousValue === 0) {
            pulsos++;
            printData();
        }
        previousValue = value;
    });

    setInterval(() => {
        // Ejecuta la función correspondiente según el tipo de control seleccionado
        switch (selectedControlType) {
            case 'PID':
                controlPID();
                break;
            case 'PI-D':
                controlPI_D();
                break;
            case 'PI-PD':
                controlPI_PD();
                break;
            case 'LA':
                openLoop();
                break;
            // Puedes agregar más casos según sea necesario

            default:
                // Si el tipo de control no coincide con ninguno de los anteriores, no hace nada
                break;
        }
    }, tMuestreo);
});
function controlPID() {
    if (sp === 0) {
        elapsedTime = 0;  
        startTime = 0;
        rpmGen = 0;
        radsVel = 0;
        velFiltered = 0;
        valorPWM = 0;
        board.analogWrite(enableAPin, valorPWM);
        return;
    }

    let Kp = 0.006150;
    let Ki = 0.0054170;
    let Kd = 0;
    let Ka = 0.0054170;

    en = sp - velFiltered;
    let A_p = Kp * en;
    let A_d = Kd * (en - en_1);
    I_error = en + I_error_1 + Ka*dif_act;
    let A_i = Ki * I_error;
    let Uc = A_p + A_d + A_i;
    let un = Uc;

    if (Uc < 0) {
        un = 0;
    }
    if (Uc > 100) {
        un = 100;
    }
    valorPWM = (un / 100) * 125;
    board.analogWrite(enableAPin, valorPWM);

    en_1 = en;
    I_error_1 = I_error;
    dif_act = un - Uc;

}

function controlPI_D() {
    if (sp === 0) {
        elapsedTime = 0;  
        startTime = 0;
        rpmGen = 0;
        radsVel = 0;
        velFiltered = 0;
        valorPWM = 0;
        board.analogWrite(enableAPin, valorPWM);
        return;
    }


 
    let Kp = 0.001150;
    let Ki = 0.0054170;
    let Kd = 0;
    let Ka = 0.0054170;

    en = sp - velFiltered;
    let A_p = Kp * en;
    let A_d = Kd * (en - en_1);
    I_error = en + I_error_1 + Ka*dif_act;
    let A_i = Ki * I_error;
    let Uc = A_p + A_d + A_i;
    let un = Uc;

    if (Uc < 0) {
        un = 0;
    }
    if (Uc > 100) {
        un = 100;
    }
    valorPWM = (un / 100) * 125;
    board.analogWrite(enableAPin, valorPWM);

    en_1 = en;
    I_error_1 = I_error;
    dif_act = un - Uc;

}

function controlPI_PD() {
    if (sp === 0) {
        elapsedTime = 0;  
        startTime = 0;
        rpmGen = 0;
        radsVel = 0;
        velFiltered = 0;
        valorPWM = 0;
        board.analogWrite(enableAPin, valorPWM);
        return;
    }

 
    let Kp = 0.006150;
    let Ki = 0.14170;
    let Kd = 0;
    let Ka = 0.0054170;

    en = sp - velFiltered;
    let A_p = Kp * en;
    let A_d = Kd * (en - en_1);
    I_error = en + I_error_1 + Ka*dif_act;
    let A_i = Ki * I_error;
    let Uc = A_p + A_d + A_i;
    let un = Uc;

    if (Uc < 0) {
        un = 0;
    }
    if (Uc > 100) {
        un = 100;
    }
    valorPWM = (un / 100) * 125;
    board.analogWrite(enableAPin, valorPWM);

    en_1 = en;
    I_error_1 = I_error;
    dif_act = un - Uc;

}

function openLoop(){
    if (sp === 0) {
        elapsedTime = 0;  
        startTime = 0;
        rpmGen = 0;
        radsVel = 0;
        velFiltered = 0;
        valorPWM = 0;
        board.analogWrite(enableAPin, valorPWM);
        return;
    }
    if(sp >100) sp = 100;
    valorPWM = (sp / 100) * 125;
    board.analogWrite(enableAPin, valorPWM);


}

function filtroMediaMovil(valorActual, historial, longitud) {
    if (sp === 0) {
        // Reinicia el historial a cero si sp es igual a cero
        historial.length = 0;
        return 0;
    }
    historial.push(valorActual);
    if (historial.length > longitud) {
        historial.shift();
    }
    const suma = historial.reduce((acumulador, valor) => acumulador + valor, 0);
    return suma / historial.length;
}

server.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

io.on('connection', (socket) => {
    console.log('Cliente conectado');
});

function printData() {
    if ((Date.now() - TIME >= tMuestreo)) {
        rpmGen = kRpmGen / (Date.now() - TIME) * pulsos;
        if (rpmGen < 12000) radsVel = rpmGen * (kRpm);

        if (radsVel < 1200) velFiltered = filtroMediaMovil(radsVel, radsVelHistory, 4);

        if (velFiltered !== 0 && autoincrement == true && velFiltered < 1200) {
            if (startTime == 0) {
                startTime = Date.now();
            }
            elapsedTime = Date.now() - startTime;
            console.log(elapsedTime + "," + sp + "," + velFiltered + "," + (valorPWM / 125) * 100);

            // Enviar datos al cliente a través de sockets
            io.emit('updateData', {
                elapsedTime,
                velFiltered,
                valorPWM,
                sp // Agrega la información de valorPWM al objeto enviado al cliente
            });
        }

        TIME = Date.now();
        pulsos = 0;
    }
}
