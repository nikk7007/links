/* qr.js — QR temático do site via qr-code-styling (vendor/qr-code-styling.js,
   global QRCodeStyling). Pontos arredondados em gradiente accent, olhos
   arredondados e selo central com o monograma do dono.
   Continua escaneável: placa/fundo branco com zona de silêncio e correção
   de erro H (~30%), que cobre o selo no centro. */
window.QR = (function () {
  const SIZE = 240;
  const INK = "#4D7C2A"; // verde da marca
  const INK_DARK = "#3A6320"; // tom mais fechado p/ os olhos e o fim do gradiente
  const PLATE = "#ffffff";

  // monograma "N" como imagem (disco accent + letra branca) p/ o centro do QR
  function makeLogo() {
    const s = 120;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PLATE;
    ctx.font = `700 ${s * 0.6}px "Young Serif", Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", s / 2, s / 2 + s * 0.04);
    return cv.toDataURL("image/png");
  }

  function options(text) {
    return {
      width: SIZE,
      height: SIZE,
      type: "canvas",
      data: text,
      margin: 10, // zona de silêncio
      qrOptions: { errorCorrectionLevel: "H" },
      backgroundOptions: { color: PLATE },
      dotsOptions: {
        type: "rounded",
        gradient: {
          type: "linear",
          rotation: Math.PI / 4,
          colorStops: [
            { offset: 0, color: INK },
            { offset: 1, color: INK_DARK },
          ],
        },
      },
      cornersSquareOptions: { type: "extra-rounded", color: INK_DARK },
      cornersDotOptions: { type: "dot", color: INK },
      image: makeLogo(),
      imageOptions: {
        crossOrigin: "anonymous",
        imageSize: 0.32,
        margin: 6,
        hideBackgroundDots: true,
      },
    };
  }

  function render(container, text) {
    container.innerHTML = "";
    const qr = new QRCodeStyling(options(text));
    qr.append(container);
    container.__qr = qr; // guardado p/ o download reaproveitar a instância
    return qr;
  }

  function download(container, filename) {
    const qr = container.__qr;
    if (!qr) return;
    const name = (filename || "qrcode.png").replace(/\.png$/i, "");
    qr.download({ name, extension: "png" });
  }

  return { render, download };
})();
