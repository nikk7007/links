/* qr.js — QR temático do site, desenhado à mão sobre canvas.
   Usa a lib vendor (vendor/qrcode.min.js) só para calcular a matriz
   (instância._oQRCode → getModuleCount/isDark) e redesenha com estilo:
     • módulos arredondados na cor accent (verde musgo da marca);
     • os 3 "olhos" (finder patterns) com cantos arredondados;
     • selo central com o monograma do dono.
   Continua escaneável: placa sempre branca (zona de silêncio embutida) e
   correção de erro em H (~30%), que cobre o selo no centro. */
window.QR = (function () {
  const SIZE = 240; // lado do canvas (px lógicos), zona de silêncio incluída
  const QUIET = 4; // margem em módulos (zona de silêncio padrão do QR)
  const INK = "#4D7C2A"; // verde da marca; fixo p/ contraste na placa branca
  const PLATE = "#FFFFFF";
  const MONOGRAM = "N"; // Nikolas

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // desenha um "olho" arredondado (anel externo 7×7 + miolo 3×3) num canto
  function drawFinder(ctx, ox, oy, m) {
    ctx.fillStyle = INK;
    roundRect(ctx, ox, oy, 7 * m, 7 * m, 1.9 * m);
    ctx.fill();
    ctx.fillStyle = PLATE;
    roundRect(ctx, ox + m, oy + m, 5 * m, 5 * m, 1.3 * m);
    ctx.fill();
    ctx.fillStyle = INK;
    roundRect(ctx, ox + 2 * m, oy + 2 * m, 3 * m, 3 * m, 0.8 * m);
    ctx.fill();
  }

  function isFinder(r, c, count) {
    return (
      (r < 7 && c < 7) ||
      (r < 7 && c >= count - 7) ||
      (r >= count - 7 && c < 7)
    );
  }

  function render(container, text) {
    container.innerHTML = "";

    // 1) matriz via lib (instância descartável, fora do DOM)
    const tmp = document.createElement("div");
    const qr = new QRCode(tmp, {
      text: text,
      width: SIZE,
      height: SIZE,
      correctLevel: QRCode.CorrectLevel.H,
    });
    const model = qr._oQRCode;
    const count = model.getModuleCount();

    // 2) canvas próprio (nítido em telas retina)
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const canvas = document.createElement("canvas");
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = SIZE + "px";
    canvas.style.height = SIZE + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // fundo branco (garante PNG escaneável mesmo fora da placa)
    ctx.fillStyle = PLATE;
    ctx.fillRect(0, 0, SIZE, SIZE);

    const m = SIZE / (count + QUIET * 2); // lado de 1 módulo
    const off = QUIET * m; // deslocamento da zona de silêncio

    // 3) módulos de dados como "squircles"
    ctx.fillStyle = INK;
    const rad = m * 0.32;
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (!model.isDark(r, c)) continue;
        if (isFinder(r, c, count)) continue; // olhos vão à parte
        roundRect(ctx, off + c * m, off + r * m, m, m, rad);
        ctx.fill();
      }
    }

    // 4) olhos arredondados nos 3 cantos
    drawFinder(ctx, off, off, m);
    drawFinder(ctx, off + (count - 7) * m, off, m);
    drawFinder(ctx, off, off + (count - 7) * m, m);

    // 5) selo central com o monograma (H cobre o buraco que ele abre)
    const badge = SIZE * 0.26;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    ctx.fillStyle = PLATE; // recorte branco atrás do selo
    roundRect(ctx, cx - badge / 2, cy - badge / 2, badge, badge, badge * 0.28);
    ctx.fill();
    ctx.fillStyle = INK; // disco accent
    const disc = badge * 0.74;
    ctx.beginPath();
    ctx.arc(cx, cy, disc / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PLATE; // letra
    ctx.font = `700 ${disc * 0.62}px "Young Serif", Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(MONOGRAM, cx, cy + disc * 0.04);

    container.appendChild(canvas);
    return canvas;
  }

  function toDataURL(container) {
    const canvas = container.querySelector("canvas");
    return canvas ? canvas.toDataURL("image/png") : null;
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
