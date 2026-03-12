#include <ArduinoJson.h>
#include <NimBLEDevice.h>
#include "queues.h"
#include "uart.h"
#include "ble.h"
#include "data_processing.h"
#include <stdexcept>
#include <iostream>

void setup() {
    Serial.begin(115200);

    phQueue = xQueueCreate(5, sizeof(uint32_t));
    bleQueue = xQueueCreate(5, 128);

    if (bleQueue == NULL){
        throw std::runtime_error("The BLE queue has not been created.");
    }
    if (phQueue == NULL){
        throw std::runtime_error("The UART queue has not been created.");
    }

    xTaskCreate(
        bleTask,
        "Bluetooth Task",
        4096,
        NULL,
        1,
        NULL
    );

    xTaskCreate(
        uartTask,
        "UART Task",
        4096,
        NULL,
        1,
        NULL
    );

    xTaskCreate(
        processingTask,
        "Data Processing Task",
        4096,
        NULL,
        1,
        NULL
    );
}