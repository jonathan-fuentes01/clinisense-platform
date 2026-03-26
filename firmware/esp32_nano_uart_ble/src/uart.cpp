#include <string>
#include <iostream>
#include "queues.h"
#include "uart.h"


void uartTask(void *pvParameters){
    while (true){
        if (Serial1.available()){
            
            char raw[UART_MSG_SIZE];
            Serial1.readBytesUntil('\n', raw, UART_MSG_SIZE); 

            xQueueSend(phQueue, &raw, portMAX_DELAY);
        }
    }
}