import json
import os
from confluent_kafka import Consumer
from dotenv import load_dotenv

load_dotenv()

KAFKA_SERVICE_URL = os.getenv("KAFKA_SERVICE_URL")

def start_consumer():
    conf = {
        'bootstrap.servers': KAFKA_SERVICE_URL,
        'security.protocol': 'SSL',
        'ssl.key.location': 'service.key',
        'ssl.certificate.location': 'service.cert',
        'ssl.ca.location': 'ca.pem',
        'group.id': 'attendance-group',
        'auto.offset.reset': 'earliest'
    }

    try:
        consumer = Consumer(conf)
        consumer.subscribe(['attendance_events'])

        print("Kafka Consumer started. Waiting for messages...")
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                print(f"Consumer error: {msg.error()}")
                continue

            data = json.loads(msg.value().decode('utf-8'))
            print(f"Received message: {data}")

    except Exception as e:
        print(f"Error in Kafka consumer: {e}")
    finally:
        if 'consumer' in locals():
            consumer.close()

if __name__ == "__main__":
    start_consumer()
