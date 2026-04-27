import json
import os
from confluent_kafka import Producer
from dotenv import load_dotenv

load_dotenv()

KAFKA_SERVICE_URL = os.getenv("KAFKA_SERVICE_URL")

def get_producer():
    conf = {
        'bootstrap.servers': KAFKA_SERVICE_URL,
        'security.protocol': 'SSL',
        'ssl.key.location': 'service.key',
        'ssl.certificate.location': 'service.cert',
        'ssl.ca.location': 'ca.pem',
    }
    try:
        producer = Producer(conf)
        return producer
    except Exception as e:
        print(f"Error creating Kafka producer: {e}")
        return None

def delivery_report(err, msg):
    if err is not None:
        print(f'Message delivery failed: {err}')
    else:
        print(f'Message delivered to {msg.topic()} [{msg.partition()}]')

def send_attendance_event(attendance_data):
    producer = get_producer()
    if producer:
        try:
            producer.produce(
                'attendance_events', 
                value=json.dumps(attendance_data).encode('utf-8'),
                callback=delivery_report
            )
            producer.flush()
            print(f"Produced attendance event: {attendance_data}")
        except Exception as e:
            print(f"Failed to produce event to Kafka: {e}")
