async function requestDevice() {
    const port = await navigator.serial.requestPort();

    const info = port.getInfo();

    const filters = [{
        vendorId: info.usbVendorId,
        productId: info.usbProductId
    }];

    navigator.usb.requestDevice({ filters })
    .then(device => {
      console.log(`Device product name: ${device.productName}`);
      console.log(`Device serial number: ${device.serialNumber}`);
      console.log(`Device port: ${device.deviceName}`);
    })
    .catch(error => {
      console.error(error);
    });
  
}

export default requestDevice;