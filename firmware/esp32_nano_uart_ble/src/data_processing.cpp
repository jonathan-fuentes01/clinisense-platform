#include <ArduinoJson.h>
#include "queues.h"
#include "data_processing.h"

void processingTask(void *pvParameters){
    float raw;
    
    while(1){
        if (xQueueReceive(phQueue, &raw, portMAX_DELAY)){
            float ph = voltageConversion(raw);
        }
    }
}

float voltageConversion(float voltage){
    return voltage;
}
