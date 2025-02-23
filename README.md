# plcserver
Used to create a homebrewed SCADA system

A JS app listens to MQTT/TCP and CIP ommunication from multiple PLC devices across the plant. It process the topics and messages
and stores the info in a PostgreSQL.
An internal dashboard is supposed to run on NODE-red or custom HTML/CSS/JS web-based application.
