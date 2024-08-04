%% CONTROLADORES DISCRETA PROYECTO 
clear all
clc 
close all

s = tf('s');

% FUNCION MAS RAPIDA
% Gv1 = ((2.846e-10)*s^3 + 5387*s^2 + (1.011e06)*s + 3.151e06)/(s^5 + 373.3*s^4 + (5.731e04)*s^3 + (4.31e06)*s^2 + (3.225e07)*s + 6.687e07);

G = (1.279e-07*s^3 + 1.293e05*s^2 + 1.881e07*s + 2.186e08)/(s^5 + 520.6*s^4 + 4.58e05*s^3 + 1.043e08*s^2 + 1.308e09*s + 4.64e09);
step(G) 
hold
%% DISCRETIZAR Funciones
Tm = 40e-3; %tiempo muestreo
Gz = c2d(G,Tm,'zoh'); %wmec/PWM

% Graficar
figure(1)
step(Gz)

%% PID IDEAL
z = tf('z',Tm);
    
%1 SEGUNDO
Cz = (9.8905*(z-0.7293)*(z-0.1286))/(z*(z-1));

%2 SEGUNDO
% Cz = (23.225*(z-0.7801)*(z-0.6703))/(z*(z-1));

format long
[nz,dz] = tfdata(Cz,'v')

% SE SACAN LAS K DE CZ (DATOS POSITIVOS)

%1 SEGUNDO
K1 = 9.890499999999999;
K2 = 8.485059949999998;
K3 = 0.927610016190000;

%2 SEGUNDO
% K1 = 23.225000000000001;
% K2 = 33.685540000000003;
% K3 = 12.144376421750001;

% DESPEJES PARA PDI sin seudo
Kd = K3;
Kp = K2 - 2*Kd;
Ki = K1 - Kp - Kd;

Cpid = Kp + Ki*z/(z-1) + Kd*(z-1)/(z)

Tz = feedback(Cpid*Gz,1);
Uz = feedback(Cpid,Gz);
figure(1)
subplot(2,1,1)
step(Tz)
grid
subplot(2,1,2)
step(Uz)
grid

%% PID CON PSEUDO

z = tf('z',Tm);

%1 SEGUNDO
% Cz = (13.144*(z-0.9793)*(z-0.7952))/((z-0.98)*(z-1));

%2 SEGUNDO
Cz = (22.214*(z-0.9013)*(z-0.9675))/((z-1)*(z-0.9662));

format long
[nz,dz] = tfdata(Cz,'v')

% PARA CONFIRMAR LOS ARGUMENTOS DE LA MATRIZ
% syms Kp Ki Kd N z
% Cpids = Kp + Ki*z/(z-1) + Kd*(z-1)/(z-N);
% collect(Cpids)

K1 = 22.213999999999999;
K2 = 41.513523199999995;
K3 = 19.370780158499997;
N = 0.9662;
A = [1, 1, 1; 
     N+1, N, 2; 
     N, 0, 1];

B = [K1; K2; K3];
X = linsolve(A, B);
disp(X);

% 1 SEGUNDOS
% Kp = 6.107123008000580;
% Ki = 2.786107391999990;
% Kd = 4.250769599999430;
% N = 0.98;
% Kaw=0.1; 

% 2 SEGUNDOS
Kp = 21.746325533681762;
Ki = 2.108194038461562;
Kd = -1.640519572143324;
N = 0.9662;
Kaw=0.1; 

Cpids = Kp + Ki*z/(z-1) + Kd*(z-1)/(z-N)

Tz = feedback(Cpids*Gz,1);
Uz = feedback(Cpids,Gz);
figure(1)
subplot(2,1,1)
step(Tz)
grid
subplot(2,1,2)
step(Uz)
grid


%% PI-D IDEAL

z = tf('z',Tm);

%1 SEGUNDOS
% C1 = (13.929*(z-0.8))/(z-1);
% C2 = ((z-1))/(z);

%1 SEGUNDOS
C1 = (25.596*(z-0.9081))/(z-1);
C2 = ((z-1))/(z);

format long
[nz,dz] = tfdata(C1,'v')

% PARA HALLAR CONSTANTES PI-D (DATOS POSITIVOS)
K1 = 25.596000000000000;
K2 = 23.243727600000000;
K3 = 1;
Kp = K2;
Ki = K1-Kp;
Kd = K3;

% PROBAR CONTROLADOR CON KP,KI,KD
Cpi = Kp + Ki*z/(z-1)
Cd = Kd*(z-1)/z

Tz = feedback(Cpi*Gz,1+Cd/Cpi);
Uz = feedback(Cpi,Gz*(1+Cd/Cpi));
figure(1)
subplot(2,1,1)
step(Tz)
grid
subplot(2,1,2)
step(Uz)
grid

%% I-PD IDEAL
z = tf('z',Tm);

%1 SEGUNDO
% Ci = 1.9784*z/(z-1)
% Cpd = (13.675*(z-0.8163))/(z)

%2 SEGUNDO
C1 = 5*z/(z-1)
C2 = (117.7*(z-0.5409))/(z)

format long
[nz,dz] = tfdata(Cpd,'v')

%1 SEGUNDO
% k1 = 1.978400000000000;
% k2 = 13.675000000000001;
% k3 = 11.162902500000001;

%2 SEGUNDO
k1 = 5;
k2 = 1.0e+02*1.177000000000000;
k3 = 1.0e+02*0.636639300000000;

ki = k1
kd=k3
kp=k2-kd
Ci = ki*z/(z-1)
Cpd = kp + kd*(z-1)/z

T1 = feedback(Gz,Cpd);
T2 = feedback(Ci*T1,1);
U2 = feedback(Ci,Gz);
figure(1)
subplot(2,1,1)
step(T2)
grid
subplot(2,1,2) 
step(U2)
grid
%% I-PD SEUDO

z = tf('z',Tm);
C1 = (4*z)/(z-1);
C2 = (34.702*(z-0.5835))/(z-0.2);

% PARA HALLAR CONSTANTES PDseudo
syms Kp Ki Kd N z
Cpds = Kp + Kd*(z-1)/(z-N);
collect(Cpds)

K1 = 4;
K2 = 34.7;
K3 = 20.35;
N = 0.2;
A = [1, 1; 
     N, 1];
B = [K2; K3];
X = linsolve(A, B);
disp(X);

% PROBAR CONTROLADOR CON KP,KI,KD
Kp = 17.937500000000004;
Ki = 4;
Kd = 16.762499999999999;
N = 0.2;

Ci = (Ki*z)/(z-1)
Cpds = Kp + Kd*(z-1)/(z-N)

Tz = feedback(Ci*Gz,1+Cpds/Ci);
Uz = feedback(Ci,Gz*(1+Cpds/Ci));
figure(1)
subplot(2,1,1)
step(Tz)
grid
subplot(2,1,2)
step(Uz)
grid

%% PI-PD IDEAL
z = tf('z',Tm)

%1 SEGUNDOS 
C1 = (10.796*(z-0.7617))/(z-1)
C2 = 1*(z-0.5686)/z

format long
[nz,dz] = tfdata(C1,'v')

k1 = 10.795999999999999;
k2 = 8.223313200000000;
k3 = 1;
k4 = 0.568600000000000;

% PROBAR CONTROLADOR CON KP,KI,KD
kp1 = k2
ki = k1-kp1
kd = k4
kp2 = k3-kd

Cpi = kp1 + ki*z/(z-1) 
Cpd = kp2 + kd*(z-1)/z
format long

T1 = feedback(Gz,Cpd);
T2 = feedback(Cpi*T1,1);
U2 = feedback(Cpi,Gz);
figure(1)
subplot(2,1,1)
step(T2)
grid
subplot(2,1,2) 
step(U2)
grid


%% PI-PD SEUDO

z = tf('z',Tm);
C1 = (6.5739*(z-0.6583))/(z-1);
C2 = (0.56056*(-0.9044))/(z-0.904);

% PARA HALLAR CONSTANTES PI
syms Kpi Ki N z
Cpiz = Kpi + Ki*(z)/(z-1)
collect(Cpiz)

K1 = 6.574;
K2 = 4.328;
A = [1, 1; 
     1, 0];
B = [K1; K2];
X = linsolve(A, B);
disp(X);

% PARA HALLAR CONSTANTES PDseudo
syms Kpd Kd N z
Cpdsz = Kpd + Kd*(z-1)/(z-N)
collect(Cpdsz)

K1 = 0.56056;
K2 = 0.50700;
N = 0.904;
A = [1, 1; 
     N, 1];
B = [K1; K2];
X = linsolve(A, B);
disp(X);

% PROBAR CONTROLADOR CON KP,KI,KD
Kpi = 4.328000000000000;
Kpd = 0.557916666666666;
Ki = 2.246000000000000;
Kd = 0.002643333333334;
N = 0.904;

Cpi = Kpi + Ki*(z)/(z-1)
Cpds = Kpd + Kd*(z-1)/(z-N)

Tz = feedback(Cpi*Gz,1+Cpds/Cpi);
Uz = feedback(Cpi,Gz*(1+Cpds/Cpi));
figure(1)
subplot(2,1,1)
step(Tz)
grid
subplot(2,1,2)
step(Uz)
grid