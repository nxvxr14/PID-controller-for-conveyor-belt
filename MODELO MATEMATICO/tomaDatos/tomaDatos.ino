/*

  LABORATORIO 1 CONTROL 202360

*/


#include <Time.h>  //Incluimos la librería Time
#include "MeanFilterLib.h"


#define encoder_pin 2  //Encoder Signal Input = D2
#define inputH1 3
#define inputH2 4
#define enableA 11

// Instanciar filtro media movil con ventana tamaño 5
MeanFilter<float> meanFilterRPM(3);

float dynamoVolt, filterAVolt, radsVel;

unsigned long startTime = 0; // Variable para almacenar el tiempo de inicio
unsigned long elapsedTime = 0;

int userPWM, arduinoPWM;
float rpmGen, rpmGenAnt;
volatile byte long pulses;
unsigned long long TIME, TIMEpwm;
unsigned int pulse_per_turn = 52;  //Encoder Disc Resolution = 1 slots
bool autoincrement;
int maxPWM;
String finalData;

const float kRpm = 2 * 3.141659 / 60;
const float kRpmGen = 60 * 1000 / pulse_per_turn;
const int tMuestreo = 50;



void setup() {

  Serial.begin(9600);
  //Con entrada 1 y entrada 2 se envian dos señales al puente H para controlar el sentido de giro del motor
  pinMode(inputH1, OUTPUT);
  pinMode(inputH2, OUTPUT);
  pinMode(enableA, OUTPUT);  //Salida analoga, equivalente a %PWM
  pinMode(encoder_pin, INPUT);

  digitalWrite(inputH1, LOW);
  digitalWrite(inputH2, HIGH);

  rpmGen = 0;
  rpmGenAnt = 0;
  pulses = 0;
  TIME = 0;
  TIMEpwm = 0;
  maxPWM = 255;
  arduinoPWM = 1;


  autoincrement = false;

  attachInterrupt(digitalPinToInterrupt(encoder_pin), count, RISING);
}

void loop() {

  if (Serial.available()) {       // Verificar si hay datos disponibles en el puerto serial
    userPWM = Serial.parseInt();  // Leer el valor entero enviado por el puerto serial

    // Verificar si el valor recibido está dentro del rango válido (0-100)
    if (userPWM >= 3 && userPWM <= 101) {
      if (userPWM == 3) userPWM = 0.000000001;
      autoincrement = false;
      arduinoPWM = userPWM;

      if (userPWM == 101) {
        autoincrement = true;
        arduinoPWM = 0;
      }
    }
  }


  // CODIGO COMENTADO PARA AUMENTO PWM X20

//  if (autoincrement == true) {
//    if (startTime == 0) {
//      startTime = millis(); // Registrar el tiempo de inicio
//    }
//
//    elapsedTime = millis() - startTime; // Calcular el tiempo transcurrido
//
//    if (elapsedTime == 2000) arduinoPWM = 25; // PWMX20
//    if (elapsedTime == 10000) arduinoPWM = 50; // PWMX20
//    if (elapsedTime == 18000) arduinoPWM = 75; // PWMX20
//    if (elapsedTime == 26000) arduinoPWM = 100; // PWMX20
//    if (elapsedTime == 34000) arduinoPWM = 60; // PWMX20
//    if (elapsedTime == 42000) arduinoPWM = 30; // PWMX20
//
//
//    if (elapsedTime >= 50000) {
//      arduinoPWM = 0;
//      autoincrement = false;
//      rpmGen = 0;
//    }
//
//    if (millis() - TIME >= tMuestreo && arduinoPWM < 20) {
//
//
//      //          **PARA IMPRIMIR CON TIEMPO**
//      finalData = String(elapsedTime) + "," + String(arduinoPWM) + "," + String(meanFilterRPM.AddValue(rpmGen))  + "," + String(rpmGen); // PARA TOMAR DE DATOS
//      Serial.println(finalData);
//
//      TIME = millis();
//
//    }
//
//
//  }
//  else {
//    startTime = 0; // Reiniciar el tiempo de inicio si autoincrement es false
//  }

  // CODIGO COMENTADO PARA AUMENTO PWM X20






  //          **PWM CONSTANTE**

    if (autoincrement == true) {
      if (startTime == 0) {
        startTime = millis(); // Registrar el tiempo de inicio
      }
  
      elapsedTime = millis() - startTime; // Calcular el tiempo transcurrido
  
      if (elapsedTime == 2000) arduinoPWM = 80; // PWMX60x80
  
      if (elapsedTime >= 15000) {
        arduinoPWM = 0;
        autoincrement = false;
        rpmGen = 0;
      }
  
      if (millis() - TIME >= tMuestreo && arduinoPWM < 20) {
  
  
        //          **PARA IMPRIMIR CON TIEMPO**
        finalData = String(elapsedTime) + "," + String(arduinoPWM) + "," + String(meanFilterRPM.AddValue(rpmGen))  + "," + String(rpmGen); // PARA TOMAR DE DATOS
        Serial.println(finalData);
  
        TIME = millis();
  
      }
  
    }
    else {
      startTime = 0; // Reiniciar el tiempo de inicio si autoincrement es false
    }

  //          **PWM CONSTANTE**



  analogWrite(enableA, map(arduinoPWM, 0, 100, 0, maxPWM));
  //          **QUITAR PICOS POR CODIGO**
  //  if (rpmGen == 0) rpmGenAnt = 0;
  //          **QUITAR PICOS POR CODIGO**


}

void count() {
  pulses++;

  if (millis() - TIME >= tMuestreo) {
    rpmGen = (kRpmGen) / (millis() - TIME) * pulses;
    meanFilterRPM.AddValue(rpmGen);

    //          **PARA IMPRIMIR CON TIEMPO**
    finalData = String(elapsedTime) + "," + String(arduinoPWM) + "," + String(meanFilterRPM.AddValue(rpmGen))  + "," + String(rpmGen); // PARA TOMAR DE DATOS
    Serial.println(finalData);
    //          **PARA IMPRIMIR CON TIEMPO**



    //          **SIN FILTRAR POR CODIGO**
    //        meanFilterRPM.AddValue(rpmGen);
    //        Serial.print(rpmGen);
    //        Serial.print(',');
    //        Serial.println(meanFilterRPM.GetFiltered());
    //          **SIN FILTRAR POR CODIGO**


    //          **QUITAR PICOS POR CODIGO**
    //    if (rpmGen > 5 && rpmGen < rpmGenAnt + 8) {
    //      meanFilterRPM.AddValue(rpmGen);
    //            Serial.print(rpmGen);
    //            Serial.print(',');
    //            Serial.println(meanFilterRPM.GetFiltered());
    //      rpmGenAnt = rpmGen;
    //    }
    //    if (rpmGen < 5) {
    //      meanFilterRPM.AddValue(rpmGen);
    //
    //            Serial.print(rpmGen);
    //            Serial.print(',');
    //            Serial.println(meanFilterRPM.GetFiltered());
    //      rpmGenAnt = rpmGen;
    //    }
    //          **QUITAR PICOS POR CODIGO**

    TIME = millis();
    pulses = 0;

  }

}
