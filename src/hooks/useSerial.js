import { useEffect } from "react";

const useSerial = (onData) => {
  useEffect(() => {
    let port;
    let reader;

    const connectSerial = async () => {
      try {
        port = await navigator.serial.requestPort(); // hanya dipanggil saat benar2 ingin connect
        await port.open({ baudRate: 9600 });

        const decoder = new TextDecoderStream();
        const inputDone = port.readable.pipeTo(decoder.writable);
        reader = decoder.readable.getReader();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) onData(value.trim());
        }
      } catch (err) {
        console.error("Serial connection error:", err);
      }
    };

    // HANYA connect saat user klik tombol Connect, bukan otomatis!
    const button = document.getElementById("connectSerial");
    if (button) {
      button.addEventListener("click", connectSerial);
    }

    return () => {
      if (button) {
        button.removeEventListener("click", connectSerial);
      }
      if (reader) reader.cancel();
      if (port && port.close) port.close();
    };
  }, [onData]);
};

export default useSerial;
