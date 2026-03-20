#include <string>
#include <iostream>
#include "queues.h"
#include "uart.h"


void uartTask(void *pvParameters){
    while (true){
        if (Serial1.available()){
            String raw = Serial1.readStringUntil('\n');

            xQueueSend(phQueue, &raw, portMAX_DELAY);
        }
    }
}