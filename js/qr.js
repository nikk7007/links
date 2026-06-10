/* qr.js — QR temático do site via qr-code-styling (vendor/qr-code-styling.js,
   global QRCodeStyling). Pontos arredondados em gradiente accent, olhos
   arredondados e selo central com o monograma do dono.
   Theme-aware: lê os tokens --qr-* (placa/tinta) no momento de renderizar, então
   acompanha o tema — no claro é tinta escura em placa branca; no escuro inverte
   p/ verde claro em placa escura, conversando com o charcoal. Correção de erro
   H (~30%) cobre o selo central e dá folga p/ o QR invertido. */
window.QR = (function () {
  const SIZE = 240;

  // o canvas não espera webfont: sem isso, o primeiro monograma sai em Georgia.
  // Pré-carrega a Young Serif no peso/tamanho usados pelo makeLogo.
  const fontReady =
    document.fonts && document.fonts.load
      ? document.fonts.load('700 72px "Young Serif"').catch(() => {})
      : Promise.resolve();

  function tok(name, fallback) {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return v || fallback;
  }
  function palette() {
    return {
      plate: tok("--qr-plate", "#FFFFFF"),
      ink: tok("--qr-ink", "#4D7C2A"),
      ink2: tok("--qr-ink-2", "#3A6320"),
    };
  }

  // monograma "N" como imagem (disco na tinta + letra na cor da placa)
  function makeLogo(pal) {
    const s = 120;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = pal.ink;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pal.plate;
    ctx.font = `700 ${s * 0.6}px "Young Serif", Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", s / 2, s / 2 + s * 0.04);
    return cv.toDataURL("image/png");
  }

  function options(text, pal) {
    return {
      width: SIZE,
      height: SIZE,
      type: "canvas",
      data: text,
      margin: 10, // zona de silêncio
      qrOptions: { errorCorrectionLevel: "H" },
      backgroundOptions: { color: pal.plate },
      dotsOptions: {
        type: "rounded",
        gradient: {
          type: "linear",
          rotation: Math.PI / 4,
          colorStops: [
            { offset: 0, color: pal.ink },
            { offset: 1, color: pal.ink2 },
          ],
        },
      },
      cornersSquareOptions: { type: "extra-rounded", color: pal.ink2 },
      cornersDotOptions: { type: "dot", color: pal.ink },
      image: makeLogo(pal),
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
    container.__qr = null;
    // token invalida renders pendentes se o modal reabrir com outro link
    const token = (container.__token = (container.__token || 0) + 1);
    fontReady.then(() => {
      if (container.__token !== token) return;
      const qr = new QRCodeStyling(options(text, palette()));
      qr.append(container);
      container.__qr = qr; // guardado p/ o download reaproveitar a instância
    });
  }

  function download(container, filename) {
    const qr = container.__qr;
    if (!qr) return;
    const name = (filename || "qrcode.png").replace(/\.png$/i, "");
    qr.download({ name, extension: "png" });
  }

  return { render, download };
})();
