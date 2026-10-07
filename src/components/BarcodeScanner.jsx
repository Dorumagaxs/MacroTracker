import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScanner({ onScan }) {
  const [errorMsg, setErrorMsg] = useState('');
  let html5QrCode;

  useEffect(() => {
    let isScanning = false;

    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        // Encontra a câmera traseira (geralmente contém "back" ou "traseira" no label)
        // Se não encontrar especificamente, pega a última da lista (frequentemente a traseira principal no Android)
        /*
        let backCameraId = devices[0].id;
        for (let i = devices.length - 1; i >= 0; i--) {
            const label = devices[i].label.toLowerCase();
            if (label.includes('back') || label.includes('traseira') || label.includes('environment')) {
                backCameraId = devices[i].id;
                break;
            }
        } */
        
        // Em vez de usar facingMode (que causa o bug de múltiplas lentes em alguns Xiaomis/Samsungs), 
        // forçamos o uso do ID exato de uma única câmera física.
        html5QrCode = new Html5Qrcode("reader");
        html5QrCode.start(
          //backCameraId,
          {facingMode: "environment"},
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            if (isScanning) {
                isScanning = false;
                html5QrCode.stop().then(() => {
                    onScan(decodedText);
                }).catch(() => {
                    onScan(decodedText);
                });
            }
          },
          (errorMessage) => {
              // ignora erros de leitura de frame vazio
          }
        ).then(() => {
            isScanning = true;
        }).catch((err) => {
          //setErrorMsg("Erro ao acessar a câmera traseira.");
          console.error(err);
        });

      } else {
         setErrorMsg("Nenhuma câmera encontrada.");
      }
    }).catch(err => {
      setErrorMsg("Permissão de câmera negada ou dispositivo não suportado.");
      console.error(err);
    });

    return () => {
      if (html5QrCode && isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
      <div className="w-full flex flex-col items-center">
          {errorMsg && <p className="text-red-500 text-sm mb-2 font-medium">{errorMsg}</p>}
          <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-black flex items-center justify-center min-h-[250px]"></div>
      </div>
  );
}
