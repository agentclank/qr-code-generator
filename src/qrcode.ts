type coord = [number, number];

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
  curPos: coord = [0,0];
  
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
    this.drawModeIndicator();
    if (this.showGrid) this.drawGrid();
  }

  drawModeIndicator() {
    let mode = 0;
    switch(this.mode) {
      case 'kanji':
        mode = 8;
        break;
      case 'binary':
        mode = 4;
        break;
      case 'numeric':
        mode = 1;
        break;
      case 'alphanumeric':
        mode = 2;
        break;
    }

    let modeBits = [0,0,0,0].map((v,i) => mode>>i&1).reverse() as Array<0|1>;
    console.log(modeBits);
    this.drawData(modeBits);
  }

  drawData(bits: Array<0|1>) {
    if (!this.canvasCtx) throw new Error('No canvas set');
    this.canvasCtx.fillStyle = '#000000';
    this.curPos = [32,32];
    for(const bit of bits) {
      console.log(this.curPos);
      if (!!bit) {
        console.log('draw');
        this.drawCell(...this.curPos);
      }
      this.nextPos();
    }
  }

  nextPos() {
    let v: 1|0|-1 = 1; //vertical movement
    let h: 1|-1 = 1 //are we going left or right 1=right -1=left
    switch (this.curPos[0] % 4) {
      case 0: //we're on the right going up
        v = 0;
        h = -1;
        break;
      case 1: //we're on the left going down
        v = 0;
        h = 1;
        break;
      case 2: //we're on the right going down
        v = 1;
        h = -1;
        break;
      case 3: //we're on the left going up
        v = -1;
        h = 1;
        break;
    }

    let nextPos: coord = [this.curPos[0] + h, this.curPos[1] + v];

    //TODO check if nextPos collides with functional cell, and if so, do we go around or skip past
    //TODO check if we need to turn around

    this.curPos = nextPos;
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
    const locatorPositions: Array<coord> = [ [0,0], [0,this.gridSize - locSize], [this.gridSize - locSize, 0] ];
    for(const locPos of locatorPositions) {
      //draw outer ring
      let [x, y] = this.coordsToPos(...locPos);
      let w = locSize * this.cellSize;
      this.canvasCtx.fillStyle = '#000000';
      this.canvasCtx.fillRect(x, y, w, w);

      //draw white inner ring
      [x, y] = this.coordsToPos(...locPos.map(k => k+1) as coord);
      w = (locSize - 2) * this.cellSize;
      this.canvasCtx.fillStyle = '#ffffff';
      this.canvasCtx.fillRect(x, y, w, w);

      //draw center black box
      [x, y] = this.coordsToPos(...locPos.map(k => k+2) as coord);
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