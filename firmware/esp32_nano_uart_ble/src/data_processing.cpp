#include <ArduinoJson.h>
#include "queues.h"
#include "data_processing.h"

void processingTask(void *pvParameters){
    float filteredValue;
    
    while(1){
        if (xQueueReceive(phQueue, &filteredValue, portMAX_DELAY)){
            float ph = voltageConversion(filteredValue);

            JsonDocument doc;

            doc["Voltage"] = filteredValue;
            doc["pH Value"] = ph;

            char buffer[BLE_MSG_SIZE];
            serializeJson(doc, buffer);
           
            xQueueSend(bleQueue, buffer, portMAX_DELAY);
        }
    }
}

float voltageConversion(float voltage){
    if (voltage > 3.3 || voltage < 0){
        return -1; // Invalid voltage
    }

    return (0.207 * voltage) + 6.8;
}