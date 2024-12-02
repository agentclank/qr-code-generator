type coord = [number, number];
type BitMatrix = Array<Array<0|1|null|undefined>>;
type ErrorCorrectionLevel = 0|1|2|3;
interface Mask { (pos: coord): boolean; }

const AlignmentPositions: {[key: number]: Array<number>} = {
  1: [],
  2: [6,18],
  3: [6,22],
  4: [6,26],
  5: [6,30],
  6: [6,34],
  7: [6,22,38],
  8: [6,24,42],
  9: [6,26,46],
  10: [6,28,50],
  11: [6,30,54],
  12: [6,32,58],
  13: [6,34,62],
  14: [6,26,46,66],
  15: [6,26,48,70],
  16: [6,26,50,74],
  17: [6,30,54,78],
  18: [6,30,56,82],
  19: [6,30,58,86],
  20: [6,34,62,90],
  21: [6,28,50,72,94],
  22: [6,26,50,74,98],
  23: [6,30,54,78,102],
  24: [6,28,54,80,106],
  25: [6,32,58,84,110],
  26: [6,30,58,86,114],
  27: [6,34,62,90,118],
  28: [6,26,50,74,98,122],
  29: [6,30,54,78,102,126],
  30: [6,26,52,78,104,130],
  31: [6,30,56,82,108,134],
  32: [6,34,60,86,112,138],
  33: [6,30,58,86,114,142],
  34: [6,34,62,90,118,146],
  35: [6,30,54,78,102,126,150],
  36: [6,24,50,76,102,128,154],
  37: [6,28,54,80,106,132,158],
  38: [6,32,58,84,110,136,162],
  39: [6,26,54,82,110,138,166],
  40: [6,30,58,86,114,142,170]
}

const ERR_LVLS: {[key: string]: ErrorCorrectionLevel} = {
  LOW: 1,
  MED: 0,
  HIGH: 2,
  QUAL: 3
}

const MaskPatterns: Array<Mask> = [
  ([x, y]: coord) => (((x + y) % 2) == 0),
  ([x, y]: coord) => ((x % 2) == 0),
  ([x, y]: coord) => ((y % 3) == 0),
  ([x, y]: coord) => (((x + y) % 3) == 0),
  ([x, y]: coord) => ((( Math.floor(x / 2) + Math.floor(y / 3) ) % 2) == 0),
  ([x, y]: coord) => (((x * y) % 2) + ((x * y) % 3) == 0),
  ([x, y]: coord) => (( (((x * y) % 2) + ((x * y) % 3) ) % 2 ) == 0),
  ([x, y]: coord) => ((( ((x + y) % 2) + ((x * y) % 3) ) % 2 ) == 0)
]

export default class QRCodeGenerator {
  bytes: Uint8Array = new Uint8Array();
  message: Uint8Array = new Uint8Array();
  canvas?: HTMLCanvasElement;
  canvasCtx?: CanvasRenderingContext2D;
  canvasSize?: number;
  version: number = 4;
  mode: 'numeric'|'alphanumeric'|'binary'|'kanji' = 'alphanumeric';
  cellSize: number = 0;
  showGrid: boolean = false;
  curPos: coord = [0,0];
  matrix: BitMatrix = [[]];
  errCorrectionLevel: ErrorCorrectionLevel = ERR_LVLS.LOW
  functionalMatrix: BitMatrix;
  
  constructor(data_to_encode: any = null) {
    if (data_to_encode) this.encode;
    this.resetMatrix();
    this.setFunctionPatterns();
    this.functionalMatrix = this.matrix;
    //TODO encode data to matrix
    //TODO score mask patterns to determine best one
    //TODO add version and format data
    // this.applyMask();
  }

  get gridSize(): number {
    return (((this.version - 1) * 4) + 21);
  }

  resetMatrix() {
    let arr: BitMatrix = [[]];
    for(let i=0;i<this.gridSize;i++) {
      arr[i] = [];
      for(let k=0;k<this.gridSize;k++) arr[i][k] = null;
    }

    this.matrix = arr;
  }

  setFunctionPatterns() {
    this.setLocators();
    this.setSeparators();
    this.setAlignmentSquares();
    this.setTimingPatterns();
    this.setDarkModule();

    if (this.version >= 7) this.setVersionModules();
  }

  applyMask() {
    //TODO score all patterns before applying one
    let mask = MaskPatterns[0];
    for (let i=0;i<this.gridSize;i++) {
      for (let k=0;k<this.gridSize;k++) {
        let pos: coord = [i,k];
        if (this.functionalMatrix[i][k] === null) {
          let val: 0|1 = this.getCell(pos) ? 1 : 0;
          if (mask(pos)) val = !val ? 1 : 0;
          this.setCell(pos, val);
        }
      }
    }
  }

  setVersionModules() {
    //TODO
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
    for(let i=0;i<this.matrix.length;i++) {
      for(let k=0;k<this.matrix[i].length;k++) {
        this.drawCell(i, k, this.matrix[i][k] as 0|1|null);
      }
    }
    if (this.showGrid) this.drawGrid();
  }

  setModeModeIndicator() {
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

  //draw a grid of lines on the canvas to make it easier to see where the squares are
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

  setLocators() {
    const locatorPositions: Array<coord> = [
      [0,0],
      [0,this.gridSize-7],
      [this.gridSize-7, 0],
    ];
    for(const locPos of locatorPositions) {
      this.square(locPos, 7, 1)
      this.square(locPos.map(c => c+1) as coord, 5, 0)
      this.square(locPos.map(c => c+2) as coord, 3, 1)
      this.setCell(locPos.map(c => c+3) as coord, 1, true);
    }
  }

  setSeparators() {
    this.square([-1,-1], 9, 0);
    this.square([this.gridSize-8,-1], 9, 0)
    this.square([-1, this.gridSize-8], 9, 0)
  }

  setTimingPatterns() {
    for(let i=8;i<this.gridSize-8;i++) {
      let val = (i+1) % 2 as 0|1
      this.setCell([i,6], val)
      this.setCell([6,i], val)
    }
  }
  
  setDarkModule() {
    this.setCell([8, ((4 * this.version) + 9)], 1)
  }

  getCell(pos: coord) {
    const [x,y] = pos;
    if (this.matrix[x] !== undefined && this.matrix[x][y] !== undefined) return this.matrix[x][y];
    return undefined;
  }

  setAlignmentSquares() {
    const positions = AlignmentPositions[this.version];

    for (const x of positions) {
      for (const y of positions) {
        let pos: coord = [x,y];
        if (this.getCell(pos) === null) {
          this.setCell(pos, 1)
          this.square(pos.map(c => c-1) as coord, 3, 0)
          this.square(pos.map(c => c-2) as coord, 5, 1)
        }
      }
    }
  }

  setCell(pos: coord, val:0|1, overwrite: boolean = false) {
    if (this.matrix[pos[0]] === undefined || this.matrix[pos[0]][pos[1]] === undefined) return;
    if (!overwrite && this.matrix[pos[0]][pos[1]] !== null) return;
    this.matrix[pos[0]][pos[1]] = val;
  }

  square(pos:coord, w:number, val: 1|0 = 1) {
    const [x,y] = pos;
    for (let i=0;i<w;i++) {
      this.setCell([x+i,y], val, true);
      this.setCell([x,y+i], val, true);
      this.setCell([x+w-1,y+i], val, true);
      this.setCell([x+i,y+w-1], val, true);
    }
  }

  drawCell(x: number, y: number, val: 0|1|null = 1) {
    if (!this.canvasCtx) throw new Error('No canvas set');
    let [l, t] = this.coordsToPos(x, y);
    let color = '#0000ff';
    if (val == 1) color = '#000000'
    if (val == 0) color = '#ffffff'
    this.canvasCtx.fillStyle = color;
    this.canvasCtx.fillRect(l, t, this.cellSize, this.cellSize);
  }

  coordsToPos(x: number, y: number): Array<number> {
    return [this.cellSize * (x), this.cellSize * (y)]
  }
}