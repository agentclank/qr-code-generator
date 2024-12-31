import { format } from "path";

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

const CAPACITIES: {[key: number]: {[key: number]: {[key: string]: number}}} = {
  1: {
      1: { n: 41, a: 25, b: 17, k: 10 },
      0: { n: 34, a: 20, b: 14, k: 8 },
      3: { n: 27, a: 16, b: 11, k: 7 },
      2: { n: 17, a: 10, b: 7, k: 4 }
  },
  2: {
      1: { n: 77, a: 47, b: 32, k: 20 },
      0: { n: 63, a: 38, b: 26, k: 16 },
      3: { n: 48, a: 29, b: 20, k: 12 },
      2: { n: 34, a: 20, b: 14, k: 8 }
  },
  3: {
      1: { n: 127, a: 77, b: 53, k: 32 },
      0: { n: 101, a: 61, b: 42, k: 26 },
      3: { n: 77, a: 47, b: 32, k: 20 },
      2: { n: 58, a: 35, b: 24, k: 15 }
  },
  4: {
      1: { n: 187, a: 114, b: 78, k: 48 },
      0: { n: 149, a: 90, b: 62, k: 38 },
      3: { n: 111, a: 67, b: 46, k: 28 },
      2: { n: 82, a: 50, b: 34, k: 21 }
  },
  5: {
      1: { n: 255, a: 154, b: 106, k: 65 },
      0: { n: 202, a: 122, b: 84, k: 52 },
      3: { n: 144, a: 87, b: 60, k: 37 },
      2: { n: 106, a: 64, b: 44, k: 27 }
  },
  6: {
      1: { n: 322, a: 195, b: 134, k: 82 },
      0: { n: 255, a: 154, b: 106, k: 65 },
      3: { n: 178, a: 108, b: 74, k: 45 },
      2: { n: 139, a: 84, b: 58, k: 36 }
  },
  7: {
      1: { n: 370, a: 224, b: 154, k: 95 },
      0: { n: 293, a: 178, b: 122, k: 75 },
      3: { n: 207, a: 125, b: 86, k: 53 },
      2: { n: 154, a: 93, b: 64, k: 39 }
  },
  8: {
      1: { n: 461, a: 279, b: 192, k: 118 },
      0: { n: 365, a: 221, b: 152, k: 93 },
      3: { n: 259, a: 157, b: 108, k: 66 },
      2: { n: 202, a: 122, b: 84, k: 52 }
  },
  9: {
      1: { n: 552, a: 335, b: 230, k: 141 },
      0: { n: 432, a: 262, b: 180, k: 111 },
      3: { n: 312, a: 189, b: 130, k: 80 },
      2: { n: 235, a: 143, b: 98, k: 60 }
  },
  10: {
      1: { n: 652, a: 395, b: 271, k: 167 },
      0: { n: 513, a: 311, b: 213, k: 131 },
      3: { n: 364, a: 221, b: 151, k: 93 },
      2: { n: 288, a: 174, b: 119, k: 74 }
  },
  11: {
      1: { n: 772, a: 468, b: 321, k: 198 },
      0: { n: 604, a: 366, b: 251, k: 155 },
      3: { n: 427, a: 259, b: 177, k: 109 },
      2: { n: 331, a: 200, b: 137, k: 85 }
  },
  12: {
      1: { n: 883, a: 535, b: 367, k: 226 },
      0: { n: 691, a: 419, b: 287, k: 177 },
      3: { n: 489, a: 296, b: 203, k: 125 },
      2: { n: 374, a: 227, b: 155, k: 96 }
  },
  13: {
      1: { n: 1022, a: 619, b: 425, k: 262 },
      0: { n: 796, a: 483, b: 331, k: 204 },
      3: { n: 580, a: 352, b: 241, k: 149 },
      2: { n: 427, a: 259, b: 177, k: 109 }
  },
  14: {
      1: { n: 1101, a: 667, b: 458, k: 282 },
      0: { n: 871, a: 528, b: 362, k: 223 },
      3: { n: 621, a: 376, b: 258, k: 159 },
      2: { n: 468, a: 283, b: 194, k: 120 }
  },
  15: {
      1: { n: 1250, a: 758, b: 520, k: 320 },
      0: { n: 991, a: 600, b: 412, k: 254 },
      3: { n: 703, a: 426, b: 292, k: 180 },
      2: { n: 530, a: 321, b: 220, k: 136 }
  },
  16: {
      1: { n: 1408, a: 854, b: 586, k: 361 },
      0: { n: 1082, a: 656, b: 450, k: 277 },
      3: { n: 775, a: 470, b: 322, k: 198 },
      2: { n: 602, a: 365, b: 250, k: 154 }
  },
  17: {
      1: { n: 1548, a: 938, b: 644, k: 397 },
      0: { n: 1212, a: 734, b: 504, k: 310 },
      3: { n: 876, a: 531, b: 364, k: 224 },
      2: { n: 674, a: 408, b: 280, k: 173 }
  },
  18: {
      1: { n: 1725, a: 1046, b: 718, k: 442 },
      0: { n: 1346, a: 816, b: 560, k: 345 },
      3: { n: 948, a: 574, b: 394, k: 243 },
      2: { n: 746, a: 452, b: 310, k: 191 }
  },
  19: {
      1: { n: 1903, a: 1153, b: 792, k: 488 },
      0: { n: 1500, a: 909, b: 624, k: 384 },
      3: { n: 1063, a: 644, b: 442, k: 272 },
      2: { n: 813, a: 493, b: 338, k: 208 }
  },
  20: {
      1: { n: 2061, a: 1249, b: 858, k: 528 },
      0: { n: 1600, a: 970, b: 666, k: 410 },
      3: { n: 1159, a: 702, b: 482, k: 297 },
      2: { n: 919, a: 557, b: 382, k: 235 }
  },
  21: {
      1: { n: 2232, a: 1352, b: 929, k: 572 },
      0: { n: 1708, a: 1035, b: 711, k: 438 },
      3: { n: 1224, a: 742, b: 509, k: 314 },
      2: { n: 969, a: 587, b: 403, k: 248 }
  },
  22: {
      1: { n: 2409, a: 1460, b: 1003, k: 618 },
      0: { n: 1872, a: 1134, b: 779, k: 480 },
      3: { n: 1358, a: 823, b: 565, k: 348 },
      2: { n: 1056, a: 640, b: 439, k: 270 }
  },
  23: {
      1: { n: 2620, a: 1588, b: 1091, k: 672 },
      0: { n: 2059, a: 1248, b: 857, k: 528 },
      3: { n: 1468, a: 890, b: 611, k: 376 },
      2: { n: 1108, a: 672, b: 461, k: 284 }
  },
  24: {
      1: { n: 2812, a: 1704, b: 1171, k: 721 },
      0: { n: 2188, a: 1326, b: 911, k: 561 },
      3: { n: 1588, a: 963, b: 661, k: 407 },
      2: { n: 1228, a: 744, b: 511, k: 315 }
  },
  25: {
      1: { n: 3057, a: 1853, b: 1273, k: 784 },
      0: { n: 2395, a: 1451, b: 997, k: 614 },
      3: { n: 1718, a: 1041, b: 715, k: 440 },
      2: { n: 1286, a: 779, b: 535, k: 330 }
  },
  26: {
      1: { n: 3283, a: 1990, b: 1367, k: 842 },
      0: { n: 2544, a: 1542, b: 1059, k: 652 },
      3: { n: 1804, a: 1094, b: 751, k: 462 },
      2: { n: 1425, a: 864, b: 593, k: 365 }
  },
  27: {
      1: { n: 3517, a: 2132, b: 1465, k: 902 },
      0: { n: 2701, a: 1637, b: 1125, k: 692 },
      3: { n: 1933, a: 1172, b: 805, k: 496 },
      2: { n: 1501, a: 910, b: 625, k: 385 }
  },
  28: {
      1: { n: 3669, a: 2223, b: 1528, k: 940 },
      0: { n: 2857, a: 1732, b: 1190, k: 732 },
      3: { n: 2085, a: 1263, b: 868, k: 534 },
      2: { n: 1581, a: 958, b: 658, k: 405 }
  },
  29: {
      1: { n: 3909, a: 2369, b: 1628, k: 1002 },
      0: { n: 3035, a: 1839, b: 1264, k: 778 },
      3: { n: 2181, a: 1322, b: 908, k: 559 },
      2: { n: 1677, a: 1016, b: 698, k: 430 }
  },
  30: {
      1: { n: 4158, a: 2520, b: 1732, k: 1066 },
      0: { n: 3289, a: 1994, b: 1370, k: 843 },
      3: { n: 2358, a: 1429, b: 982, k: 604 },
      2: { n: 1782, a: 1080, b: 742, k: 457 }
  },
  31: {
      1: { n: 4417, a: 2677, b: 1840, k: 1132 },
      0: { n: 3486, a: 2113, b: 1452, k: 894 },
      3: { n: 2473, a: 1499, b: 1030, k: 634 },
      2: { n: 1897, a: 1150, b: 790, k: 486 }
  },
  32: {
      1: { n: 4686, a: 2840, b: 1952, k: 1201 },
      0: { n: 3693, a: 2238, b: 1538, k: 947 },
      3: { n: 2670, a: 1618, b: 1112, k: 684 },
      2: { n: 2022, a: 1226, b: 842, k: 518 }
  },
  33: {
      1: { n: 4965, a: 3009, b: 2068, k: 1273 },
      0: { n: 3909, a: 2369, b: 1628, k: 1002 },
      3: { n: 2805, a: 1700, b: 1168, k: 719 },
      2: { n: 2157, a: 1307, b: 898, k: 553 }
  },
  34: {
      1: { n: 5253, a: 3183, b: 2188, k: 1347 },
      0: { n: 4134, a: 2506, b: 1722, k: 1060 },
      3: { n: 2949, a: 1787, b: 1228, k: 756 },
      2: { n: 2301, a: 1394, b: 958, k: 590 }
  },
  35: {
      1: { n: 5529, a: 3351, b: 2303, k: 1417 },
      0: { n: 4343, a: 2632, b: 1809, k: 1113 },
      3: { n: 3081, a: 1867, b: 1283, k: 790 },
      2: { n: 2361, a: 1431, b: 983, k: 605 }
  },
  36: {
      1: { n: 5836, a: 3537, b: 2431, k: 1496 },
      0: { n: 4588, a: 2780, b: 1911, k: 1176 },
      3: { n: 3244, a: 1966, b: 1351, k: 832 },
      2: { n: 2524, a: 1530, b: 1051, k: 647 }
  },
  37: {
      1: { n: 6153, a: 3729, b: 2563, k: 1577 },
      0: { n: 4775, a: 2894, b: 1989, k: 1224 },
      3: { n: 3417, a: 2071, b: 1423, k: 876 },
      2: { n: 2625, a: 1591, b: 1093, k: 673 }
  },
  38: {
      1: { n: 6479, a: 3927, b: 2699, k: 1661 },
      0: { n: 5039, a: 3054, b: 2099, k: 1292 },
      3: { n: 3599, a: 2181, b: 1499, k: 923 },
      2: { n: 2735, a: 1658, b: 1139, k: 701 }
  },
  39: {
      1: { n: 6743, a: 4087, b: 2809, k: 1729 },
      0: { n: 5313, a: 3220, b: 2213, k: 1362 },
      3: { n: 3791, a: 2298, b: 1579, k: 972 },
      2: { n: 2927, a: 1774, b: 1219, k: 750 }
  },
  40: {
      1: { n: 7089, a: 4296, b: 2953, k: 1817 },
      0: { n: 5596, a: 3391, b: 2331, k: 1435 },
      3: { n: 3993, a: 2420, b: 1663, k: 1024 },
      2: { n: 3057, a: 1852, b: 1273, k: 784 }
  }
}

function getMinCapacityVersion(mode: 'n'|'a'|'b'|'k', errLevel: ErrorCorrectionLevel): number {
  let minVersion = 1;
  let capacity = CAPACITIES[minVersion][errLevel][mode];
  while (capacity < 0) {
    minVersion++;
    capacity = CAPACITIES[minVersion][errLevel][mode];
  }

  return minVersion;
}

function decToBin(dec: number): string {
  return (dec >>> 0).toString(2);
}

export default class QRCodeGenerator {
  bytes: Uint8Array = new Uint8Array();
  message: Uint8Array = new Uint8Array();
  canvas?: HTMLCanvasElement;
  canvasCtx?: CanvasRenderingContext2D;
  canvasSize?: number;
  version: number = 7;
  mode: 'numeric'|'alphanumeric'|'binary'|'kanji' = 'alphanumeric';
  cellSize: number = 0;
  showGrid: boolean = false;
  curPos: coord = [0,0];
  matrix: BitMatrix = [[]];
  errCorrectionLevel: ErrorCorrectionLevel = ERR_LVLS.HIGH
  functionalMatrix: BitMatrix;
  maskPattern: number = 0;
  
  constructor(data_to_encode: any = null) {
    if (data_to_encode) this.encode;
    this.resetMatrix();
    // this.determineMaskPattern();
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

  generateFormatString() {
    //TODO: convert this to actual binary operations instead of string manipulation
    let errLevel = this.errCorrectionLevel.toString(2).padStart(2, '0'); //convert error correction level to 2-bit binary
    let maskPattern = this.maskPattern.toString(2).padStart(3, '0'); //convert mask pattern to 3-bit binary
    let formatString = errLevel + maskPattern; //concatenate error correction level and mask pattern
    const generator = '10100110111'; //generator polynomial for error correction x^10 + x^8 + x^5 + x^4 + x^2 + x^1 + x^0 

    formatString = this.generateErrorCorrection(formatString, generator, 15);
    let maskString = '101010000010010';
    let format = (parseInt(formatString, 2) ^ parseInt(maskString, 2)).toString(2).padStart(15, '0'); //xor with mask string
    return format;
  }

  setFormatInfo() {
    let formatString = this.generateFormatString();
    let formatPositions: Array<Array<coord>> = [
      [
        [0,8],
        [1,8],
        [2,8],
        [3,8],
        [4,8],
        [5,8],
        [7,8],
        [8,8],
        [8,7],
        [8,5],
        [8,4],
        [8,3],
        [8,2],
        [8,1],
        [8,0],
      ],[
        [8,this.gridSize-1],
        [8,this.gridSize-2],
        [8,this.gridSize-3],
        [8,this.gridSize-4],
        [8,this.gridSize-5],
        [8,this.gridSize-6],
        [8,this.gridSize-7],
        [this.gridSize-8,8],
        [this.gridSize-7,8],
        [this.gridSize-6,8],
        [this.gridSize-5,8],
        [this.gridSize-4,8],
        [this.gridSize-3,8],
        [this.gridSize-2,8],
        [this.gridSize-1,8],
      ]
    ];

    for (let i=0;i<formatString.length;i++) {
      this.setCell(formatPositions[0][i], parseInt(formatString[i]) as 0|1);
      this.setCell(formatPositions[1][i], parseInt(formatString[i]) as 0|1);
    }
  }

  setFunctionPatterns() {
    this.setLocators();
    this.setSeparators();
    this.setAlignmentSquares();
    this.setTimingPatterns();
    this.setDarkModule();
    this.setFormatInfo();

    if (this.version >= 7) this.setVersionModules();
  }

  determineMaskPattern() {
    //score and apply best one
    this.maskPattern = 0;
  }

  applyMask() {
    let mask = MaskPatterns[this.maskPattern]
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

  generateVersionString() {
    let versionString = this.version.toString(2).padStart(6, '0'); //convert version to 6-bit binary
    let generator = '1111100100101'; //generator for version info x^12 + x^11 + x^10 + x^9 + x^8 + x^5 + x^2 + x^0     

    return this.generateErrorCorrection(versionString, generator, 18);
  }

  generateErrorCorrection(data: string, generator:string, len: number) {
    let errBits = data.padEnd(len, '0').replace(/^0+/, ''); //pad right with zeroes until length=18
    do {
      let gen = generator.padEnd(errBits.length, '0');
      let xor = (parseInt(errBits, 2) ^ parseInt(gen.padEnd(errBits.length, '0'), 2)).toString(2); //xor with generator
      errBits = xor.replace(/^0+/, ''); //remove leading zeroes
    } while (errBits.length > (len - data.length)); //repeat until length <= 12

    let result = data + errBits.padStart((len - data.length), '0'); //add error correction bits to version string
    return result;
  }

  setVersionModules() {
    let versionString = this.generateVersionString().split('').reverse().join('');

    for (let i=0; i<18; i++) {
      let y = Math.floor(i / 3);
      let x = this.gridSize - 11 + i % 3;
      this.setCell([y, x], parseInt(versionString[i]) as 0|1);
      this.setCell([x, y], parseInt(versionString[i]) as 0|1);
    }
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
        this.drawCell([i, k], this.matrix[i][k] as 0|1|null);
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

  drawCell(pos: coord, val: 0|1|null = 1) {
    if (!this.canvasCtx) throw new Error('No canvas set');
    const [x, y] = pos;
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