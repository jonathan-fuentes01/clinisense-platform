#include <stdexcept>
#include <iostream>
#include "queues.h"
#include "uart.h"
#include "ble.h"
#include "data_processing.h"

QueueHandle_t bleQueue = NULL;
QueueHandle_t phQueue = NULL;
NimBLECharacteristic* pCharacteristic = nullptr;

void setup() {
    Serial.begin(BAUD_RATE);

    phQueue = xQueueCreate(UART_ITEMS, UART_MSG_SIZE);
    bleQueue = xQueueCreate(BLE_ITEMS, BLE_MSG_SIZE);

    if (bleQueue == NULL){
        throw std::runtime_error("The BLE queue has not been created.");
    }
    if (phQueue == NULL){
        throw std::runtime_error("The UART queue has not been created.");
    }

    xTaskCreate(
        bleTask,
        "Bluetooth Task",
        10000,
        NULL,
        2,
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
        3,
        NULL
    );
}

void loop(){

}