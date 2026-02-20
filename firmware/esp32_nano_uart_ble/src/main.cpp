#include <Arduino.h>
#include <ArduinoJson.h>
#include <NimBLEDevice.h>
#include "uart.h"
#include "ble.cpp"
#include "data_processing.h"

// initialize queue handles
QueueHandle_t uartQueue;
QueueHandle_t bleQueue;

void setup() {
    Serial.begin(115200);
}

void loop() {

}