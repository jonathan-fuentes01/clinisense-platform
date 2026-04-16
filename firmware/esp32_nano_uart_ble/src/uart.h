#ifndef UART_PH_H
#define UART_PH_H
#define MEDIAN_SAMPLES 5
#define BAUD_RATE 115200
void uartTask(void *pvParameters);
float medianFilter(float sample);
float FIRFilter(float sample);
float IIRFilter(float sample);
#endif

