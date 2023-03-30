import { SerialPort } from 'serialport';

export default class Device {
    deviceName: string;
    baudRate: number;
    listener = new Map();
    serialPort: any;
    foundDevice = false;

    constructor(deviceName: string, baudRate: number) {
        this.deviceName = deviceName;
        this.baudRate = baudRate;

        this.findDevice();
    }

    findDevice = () => {
        SerialPort.list().then(function(ports){
            ports.forEach(function(port){
                console.log("Port: ", port);
            })
        });
    }

    on = (type: any, _cb: any) => {
        if (!this.listener.has(type)) {
            this.listener.set(type, _cb);
        }
    }

    emit = (type: any, data: any) => {
        const message = JSON.stringify({ type, data });

        this.serialPort.write(message, (err: { message: any; }) => {
            if (err) {
                return console.log('Error on write: ', err.message);
            }

            console.log('Message written',  message); 
        });
    }

    dispatchEvent = (event: { type: any; data: string; }) => {
        if (!this.listener.has(event.type))
            return;

        if (event.data) {
            const ev = this.listener.get(event.type);

            try {
                const message = JSON.parse(event.data);
                ev(message);
            } catch (error) {
                ev();
            }
        }
    }
}