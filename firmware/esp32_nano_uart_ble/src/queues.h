#ifndef QUEUES_H
#define QUEUES_H
#include <Arduino.h>
extern QueueHandle_t phQueue;
extern QueueHandle_t bleQueue;

#define BLE_ITEMS 5
#define BLE_MSG_SIZE 128
#define UART_ITEMS 5
#define UART_MSG_SIZE 128

#endif