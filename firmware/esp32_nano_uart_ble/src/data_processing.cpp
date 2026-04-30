#include <ArduinoJson.h>
#include "queues.h"
#include "data_processing.h"

void processingTask(void *pvParameters){
    float raw;
    
    while(1){
        if (xQueueReceive(phQueue, &raw, portMAX_DELAY)){
            float ph = voltageConversion(raw);

            JsonDocument doc;

            doc["Voltage"] = raw;
            doc["pH Value"] = ph;

            char buffer[BLE_MSG_SIZE];
            serializeJson(doc, buffer);
           
            xQueueSend(bleQueue, buffer, portMAX_DELAY);
        }
    }
}

float voltageConversion(float voltage){
    return voltage;
}
