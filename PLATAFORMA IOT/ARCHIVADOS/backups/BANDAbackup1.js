const { Board } = require("johnny-five");
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');
// const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 5500;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const radsVelHistory = [];

const pulse_per_turn = 52;
const kRpm = 2 * Math.PI / 60;
const kRpmGen = 60 * 1000 / pulse_per_turn;
const tMuestreo = 40;

const board = new Board();

let tMuestreoControl = 40;
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
let Ad_1 = 0;
let yn_1 = 0;
let A_pi = 0;
let A_pd = 0;
let A_d = 0;
let A_p = 0;
let A_i = 0;
let Uc = 0;
let un = 0;
let U1 = 0;
let U2 = 0;

const pulsosPin = 2;
const inputH1Pin = 3;
const inputH2Pin = 4;
const enableAPin = 11;

app.use(express.static('public'));
// app.use('/styles', express.static(path.join(__dirname, 'public')));


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

    // setInterval(() => {
    //     if(velFiltered < 0.3) tMuestreoControl = 200;
    //     if(velFiltered > 0.3) tMuestreoControl = 40;


    // }, 1);

    setInterval(() => {

        // Ejecuta la función correspondiente según el tipo de control seleccionado
        if(velFiltered < 0.0000001 && autoincrement === true){
            valorPWM = (5 / 100) * 255;
            board.analogWrite(enableAPin, valorPWM);


        } else{
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
        }

    }, tMuestreoControl);

});


function controlPID() {
    resetVar();

    // let Kp = -1.604800882321478;
    // let Ki = 1.572437869822466;
    // let Kd = 11.586363012499012;
    // let Ka = 0.9;
    // let N = 0.9662;

    let Kp = -1.604800882321478;
    let Ki = 1.572437869822466;
    let Kd = 11.586363012499012;
    let Ka = 0.9;
    let N = 0.9662;


    en = sp - velFiltered;
    A_p = Kp * en;
    A_d = Kd * (en - en_1) + N*Ad_1;
    I_error = en + I_error_1 + Ka*dif_act;
    A_i = Ki * I_error;
    Uc = A_p + A_d + A_i;
    un = Uc;

    if (Uc < 0) {
        un = 0;
    }
    if (Uc > 100) {
        un = 100;
    }
    valorPWM = (un / 100) * 255;
    board.analogWrite(enableAPin, valorPWM);

    en_1 = en;
    I_error_1 = I_error;
    dif_act = un - Uc;
    Ad_1 = A_d;

}

function controlPI_D() {
    resetVar();

    let Kp = 2.900000000000000;
    let Ki = 1.990000000000000;
    let Kd = 1.143400000000000e-04;
    let Ka= 0.1; 
    
    en = sp - velFiltered;
    A_p = Kp * en;
    A_d = Kd * (velFiltered - yn_1);
    I_error = en + I_error_1 + Ka*dif_act;
    A_i = Ki * I_error;
    Uc = A_p - A_d + A_i;
    un = Uc;

    if (Uc < 0) {
        un = 0;
    }
    if (Uc > 100) {
        un = 100;
    }
    valorPWM = (un / 100) * 255;
    board.analogWrite(enableAPin, valorPWM);

    yn_1 = velFiltered;
    I_error_1 = I_error;
    dif_act = un - Uc;

}

function controlPI_PD() {
    resetVar();
 
    let Kpd = 0.557916666666666;
    let Kpi = 4.328000000000000;
    let Ki = 2.246000000000000;
    let Kd = 0.002643333333334;
    let Ka = 0.1;
    let N = 0.904;


    en = sp - velFiltered;
    A_pi = Kpi * en;
    I_error = en + I_error_1 + Ka*dif_act;
    A_i = Ki * I_error;
    U1 = A_pi + A_i;
    
    A_pd = Kpd* velFiltered;
    A_d = Kd * (velFiltered - yn_1) + N*Ad_1;
    U2 = A_pd+A_d;

    Uc = U1 -U2;
    un = Uc;

    if (Uc < 0) {
        un = 0;
    }
    if (Uc > 100) {
        un = 100;
    }
    valorPWM = (un / 100) * 255;
    board.analogWrite(enableAPin, valorPWM);

    en_1 = en;
    I_error_1 = I_error;
    dif_act = un - Uc;
    Ad_1 = A_d;

}

function openLoop(){
    resetVar();
    if(sp >100) sp = 100;
    valorPWM = (sp / 100) * 255;
    board.analogWrite(enableAPin, valorPWM);


}

function resetVar(){
    if (sp === 0) {
        velFiltered = 0;
        autoincrement = false;
        startTime = 0;
        elapsedTime;
        valorPWM = 0;
        radsVel = 0;
        pulsos = 0;
        rpmGen = 0;
        en = 0;
        en_1 = 0;
        I_error = 0;
        I_error_1 = 0;
        dif_act = 0;
        Ad_1 = 0;
        yn_1 = 0;
        A_pi = 0;
        A_pd = 0;
        A_d = 0;
        A_p = 0;
        A_i = 0;
        Uc = 0;
        un = 0;
        U1 = 0;
        U2 = 0;
        board.analogWrite(enableAPin, valorPWM);
        return;
    }
}

function filtroMediaMovil(valorActual, historial, longitud) {
    if (sp === 0) {
        // Reinicia el historial a cero si sp es igual a cero
        historial.length = 0;
        acumulador = 0;
        valor = 0;
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
        if (rpmGen < 60) radsVel = rpmGen * (kRpm);

        
        if (radsVel < 6) velFiltered = filtroMediaMovil(radsVel, radsVelHistory, 3);
        // if (velFiltered !== 0 && autoincrement == true && velFiltered < 1200) {
        // En caso de haber problemas con la impresion de datos activar esta linea, borrar
        // la de abajo y mover el print data al bloque de la interrupcion
        
        if (autoincrement == true && velFiltered < 6) {
            if (startTime == 0) {
                startTime = Date.now();
            }
            elapsedTime = Date.now() - startTime;
            console.log(elapsedTime + "," + sp + "," + velFiltered + "," + (valorPWM / 255) * 100);

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

