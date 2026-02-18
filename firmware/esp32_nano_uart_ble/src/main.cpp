#include <Arduino.h>

#define RX

#define TX

void setup() { // initialize UART connection
  Serial.begin(115200);

  while (!Serial){
    delay(10); // busy waiting delay until connected
  }

  Serial.println("Hello World!");
}

void loop() {
  Serial.println("Hello (inside of the loop)!");
}