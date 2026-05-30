/* qr.js — wrapper offline sobre a lib vendor/qrcode.min.js (global QRCode).
   Renderiza o QR numa placa branca (escaneável em qualquer tema) e baixa PNG. */
window.QR = (function () {
  function render(container, text) {
    container.innerHTML = "";
    // QRCode renderiza um <canvas> (+ <img>) dentro do container.
    return new QRCode(container, {
      text: text,
      width: 220,
      height: 220,
      colorDark: "#0A0E1A", // tinta escura sobre placa branca (token --qr-ink)
      colorLight: "#FFFFFF",
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  function toDataURL(container) {
    const canvas = container.querySelector("canvas");
    if (canvas) return canvas.toDataURL("image/png");
    const img = container.querySelector("img");
    return img ? img.src : null;
  }

  function download(container, filename) {
    const url = toDataURL(container);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "qrcode.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return { render, download };
})();
