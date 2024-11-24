export default class QRCodeGenerator {
  bytes: Uint8Array = new Uint8Array();
  message: Uint8Array = new Uint8Array();
  gridSize: number = 33;
  canvas?: HTMLCanvasElement;
  canvasCtx?: CanvasRenderingContext2D;
  canvasSize?: number;
  version: number = 4;
  mode: 'numeric'|'alphanumeric'|'binary'|'kanji' = 'alphanumeric';
  cellSize: number = 0;
  showGrid: boolean = false;
  
  constructor(data_to_encode: any = null) {
    if (data_to_encode) this.encode;
  }

  useCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d') || undefined;
    if (this.canvas && this.canvasCtx) {
      this.canvasSize = this.canvasCtx.canvas.width <= this.canvasCtx.canvas.height ? this.canvasCtx.canvas.width : this.canvasCtx.canvas.height
      this.cellSize = this.canvasSize / this.gridSize;
    }
  }

  encode(data_to_encode: any) {
    switch(typeof data_to_encode) {
      case 'string':
        this.mode = 'alphanumeric';
        this.bytes = Uint8Array.from(data_to_encode.split('').map(letter => letter.charCodeAt(0)));
        break;
      default:
        throw new Error('Not yet implemented!');
    }
  }

  encodeMessage() {
    let encoded = new Uint8Array();

    //implement encoding
    this.message = encoded;
  }

  render() {
    if (!this.canvasCtx) return;
    this.canvasCtx.fillStyle = '#ffffff';
    this.canvasCtx.fillRect(0,0,this.canvasCtx.canvas.width, this.canvasCtx.canvas.height);
    this.drawLocators();
    this.drawAlignment();
    this.drawTimingStrips();
    if (this.showGrid) this.drawGrid();
  }
  
  drawGrid() {
    if (!this.canvasCtx) throw new Error('No canvas set');
    this.canvasCtx.lineWidth = 1;
    this.canvasCtx.strokeStyle = "red";
    for (let i = 0; i <= this.gridSize;i++) {
      let pos = i * this.cellSize;
      this.canvasCtx.moveTo(pos, 0);
      this.canvasCtx.lineTo(pos, this.canvasCtx.canvas.height)
      this.canvasCtx.stroke();

      this.canvasCtx.moveTo(0, pos);
      this.canvasCtx.lineTo(this.canvasCtx.canvas.width, pos);
      this.canvasCtx.stroke();
    }
  }

  drawLocators() {
    if (!this.canvasCtx) throw new Error('No canvas set');
    const locSize = 7;
    const locatorPositions = [ [0,0], [0,this.gridSize - locSize], [this.gridSize - locSize, 0] ];
    for(const locPos of locatorPositions) {
      //draw outer ring
      let [x, y] = this.coordsToPos(locPos[0], locPos[1]);
      let w = locSize * this.cellSize;
      this.canvasCtx.fillStyle = '#000000';
      this.canvasCtx.fillRect(x, y, w, w);

      //draw white inner ring
      [x, y] = this.coordsToPos(locPos[0] + 1, locPos[1] + 1);
      w = (locSize - 2) * this.cellSize;
      this.canvasCtx.fillStyle = '#ffffff';
      this.canvasCtx.fillRect(x, y, w, w);

      //draw center black box
      [x, y] = this.coordsToPos(locPos[0] + 2, locPos[1] + 2);
      w = (locSize - 4) * this.cellSize;
      this.canvasCtx.fillStyle = '#000000';
      this.canvasCtx.fillRect(x, y, w, w);
    }
  }

  drawAlignment() {
    if (!this.canvasCtx) throw new Error('No canvas set');
    const algnSize = 5;
    const algnPositions = [ [24,24] ];
    for(const algnPos of algnPositions) {
      //draw outer ring
      let [x, y] = this.coordsToPos(algnPos[0], algnPos[1]);
      let w = algnSize * this.cellSize;
      this.canvasCtx.fillStyle = '#000000';
      this.canvasCtx.fillRect(x, y, w, w);

      //draw white inner ring
      [x, y] = this.coordsToPos(algnPos[0] + 1, algnPos[1] + 1);
      w = (algnSize - 2) * this.cellSize;
      this.canvasCtx.fillStyle = '#ffffff';
      this.canvasCtx.fillRect(x, y, w, w);

      //draw center black box
      [x, y] = this.coordsToPos(algnPos[0] + 2, algnPos[1] + 2);
      w = (algnSize - 4) * this.cellSize;
      this.canvasCtx.fillStyle = '#000000';
      this.canvasCtx.fillRect(x, y, w, w);
    }
  }

  drawTimingStrips() {
    for(let k = 8; k <= 25; k+=2) {
      this.drawCell(6, k);
      this.drawCell(k, 6);
    }
  }

  drawCell(x: number, y: number) {
    if (!this.canvasCtx) throw new Error('No canvas set');
    let [l, t] = this.coordsToPos(x, y);
    this.canvasCtx.fillRect(l, t, this.cellSize, this.cellSize);
  }

  coordsToPos(x: number, y: number): Array<number> {
    return [this.cellSize * (x), this.cellSize * (y)]
  }
}