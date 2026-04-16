#include <string>
#include <iostream>
#include "queues.h"
#include "uart.h"



void uartTask(void *pvParameters){
    while (true){
        if (Serial1.available()){
            char raw[UART_MSG_SIZE];
            Serial1.readBytesUntil('\n', raw, UART_MSG_SIZE);  
            float sample = atof(raw); // read raw UART byte data
            float filteredValue = IIRFilter(sample);
            xQueueSend(phQueue, &filteredValue, portMAX_DELAY);
        }
    }
}

float IIRFilter(float sample){
    static float previous; // hold previous sample (y(n-1))
    
    // reading first sample w/ flag
    static bool init = false;
    if (!init){
        previous = sample;
        init = true;
    }

    // IIR filter: y(n) = (x(n) + y(n-1))/2
    float output = (sample + previous) / 2.0;

    previous = output; // store past outputs
    return output;
}  

float FIRFilter(float sample){
    static float previous = 0;
    static bool init = false;
    if(!init){
        previous = sample;
        init = true;
    } 

    // FIR filter: y(n) = (x(n) + x(n-1))/2
    float output = (sample + previous) / 2.0;
    
    previous = sample; // store past inputs
    return output;
}