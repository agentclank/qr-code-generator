import { format } from "path";

type Coord = [number, number];
type BitMatrix = Array<Array<0|1|null|undefined>>;
type ErrorCorrectionLevel = 0|1|2|3;
interface Mask { (pos: Coord): boolean; }
type Mode = 'n'|'a'|'b'|'k'; //numeric, alphanumeric, binary, kanji
type Version = 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40;
type WordCounts = {
  total_words: number|null,
  ec_words_per_block: number|null,
  first_group_blocks: number|null,
  first_group_block_words: number|null,
  second_group_blocks: number|null,
  second_group_block_words: number|null
}

const Modes = {
  n: {
    indicator: '0001',
  },
  a: {
    indicator: '0010',
  },
  b: {
    indicator: '0100',
  },
  k: {
    indicator: '1000',
  }
}
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
  ([x, y]: Coord) => (((x + y) % 2) == 0),
  ([x, y]: Coord) => ((x % 2) == 0),
  ([x, y]: Coord) => ((y % 3) == 0),
  ([x, y]: Coord) => (((x + y) % 3) == 0),
  ([x, y]: Coord) => ((( Math.floor(x / 2) + Math.floor(y / 3) ) % 2) == 0),
  ([x, y]: Coord) => (((x * y) % 2) + ((x * y) % 3) == 0),
  ([x, y]: Coord) => (( (((x * y) % 2) + ((x * y) % 3) ) % 2 ) == 0),
  ([x, y]: Coord) => ((( ((x + y) % 2) + ((x * y) % 3) ) % 2 ) == 0)
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

const WORD_COUNTS: {[key: number]: {[key: string]: WordCounts}} = {
  1: {
      1: { total_words: 19, ec_words_per_block: 7, first_group_blocks: 1, first_group_block_words: 19, second_group_blocks: 0, second_group_block_words: 0 },
      0: { total_words: 16, ec_words_per_block: 10, first_group_blocks: 1, first_group_block_words: 16, second_group_blocks: 0, second_group_block_words: 0 },
      3: { total_words: 13, ec_words_per_block: 13, first_group_blocks: 1, first_group_block_words: 13, second_group_blocks: 0, second_group_block_words: 0 },
      2: { total_words: 9, ec_words_per_block: 17, first_group_blocks: 1, first_group_block_words: 9, second_group_blocks: 0, second_group_block_words: 0 }
  },
  2: {
      1: { total_words: 34, ec_words_per_block: 10, first_group_blocks: 1, first_group_block_words: 34, second_group_blocks: 0, second_group_block_words: 0 },
      0: { total_words: 28, ec_words_per_block: 16, first_group_blocks: 1, first_group_block_words: 28, second_group_blocks: 0, second_group_block_words: 0 },
      3: { total_words: 22, ec_words_per_block: 22, first_group_blocks: 1, first_group_block_words: 22, second_group_blocks: 0, second_group_block_words: 0 },
      2: { total_words: 16, ec_words_per_block: 28, first_group_blocks: 1, first_group_block_words: 16, second_group_blocks: 0, second_group_block_words: 0 }
  },
  3: {
      1: { total_words: 55, ec_words_per_block: 15, first_group_blocks: 1, first_group_block_words: 55, second_group_blocks: 0, second_group_block_words: 0 },
      0: { total_words: 44, ec_words_per_block: 26, first_group_blocks: 1, first_group_block_words: 44, second_group_blocks: 0, second_group_block_words: 0 },
      3: { total_words: 34, ec_words_per_block: 18, first_group_blocks: 2, first_group_block_words: 17, second_group_blocks: 0, second_group_block_words: 0 },
      2: { total_words: 26, ec_words_per_block: 22, first_group_blocks: 2, first_group_block_words: 13, second_group_blocks: 0, second_group_block_words: 0 }
  },
  4: {
      1: { total_words: 80, ec_words_per_block: 20, first_group_blocks: 1, first_group_block_words: 80, second_group_blocks: 0, second_group_block_words: 0 },
      0: { total_words: 64, ec_words_per_block: 18, first_group_blocks: 2, first_group_block_words: 32, second_group_blocks: 0, second_group_block_words: 0 },
      3: { total_words: 48, ec_words_per_block: 26, first_group_blocks: 2, first_group_block_words: 24, second_group_blocks: 0, second_group_block_words: 0 },
      2: { total_words: 36, ec_words_per_block: 16, first_group_blocks: 4, first_group_block_words: 9, second_group_blocks: 0, second_group_block_words: 0 }
  },
  5: {
      1: { total_words: 108, ec_words_per_block: 26, first_group_blocks: 1, first_group_block_words: 108, second_group_blocks: 0, second_group_block_words: 0 },
      0: { total_words: 86, ec_words_per_block: 24, first_group_blocks: 2, first_group_block_words: 43, second_group_blocks: 0, second_group_block_words: 0 },
      3: { total_words: 62, ec_words_per_block: 18, first_group_blocks: 2, first_group_block_words: 15, second_group_blocks: 2, second_group_block_words: 1 },
      2: { total_words: 46, ec_words_per_block: 22, first_group_blocks: 2, first_group_block_words: 11, second_group_blocks: 2, second_group_block_words: 1 }
  },
  6: {
      1: { total_words: 136, ec_words_per_block: 18, first_group_blocks: 2, first_group_block_words: 68, second_group_blocks: 0, second_group_block_words: 0 },
      0: { total_words: 108, ec_words_per_block: 16, first_group_blocks: 4, first_group_block_words: 27, second_group_blocks: 0, second_group_block_words: 0 },
      3: { total_words: 76, ec_words_per_block: 24, first_group_blocks: 4, first_group_block_words: 19, second_group_blocks: 0, second_group_block_words: 0 },
      2: { total_words: 60, ec_words_per_block: 28, first_group_blocks: 4, first_group_block_words: 15, second_group_blocks: 0, second_group_block_words: 0 }
  },
  7: {
      1: { total_words: 156, ec_words_per_block: 20, first_group_blocks: 2, first_group_block_words: 78, second_group_blocks: 0, second_group_block_words: 0 },
      0: { total_words: 124, ec_words_per_block: 18, first_group_blocks: 4, first_group_block_words: 31, second_group_blocks: 0, second_group_block_words: 0 },
      3: { total_words: 88, ec_words_per_block: 18, first_group_blocks: 2, first_group_block_words: 14, second_group_blocks: 4, second_group_block_words: 1 },
      2: { total_words: 66, ec_words_per_block: 26, first_group_blocks: 4, first_group_block_words: 13, second_group_blocks: 1, second_group_block_words: 1 }
  },
  8: {
      1: { total_words: 194, ec_words_per_block: 24, first_group_blocks: 2, first_group_block_words: 97, second_group_blocks: 0, second_group_block_words: 0 },
      0: { total_words: 154, ec_words_per_block: 22, first_group_blocks: 2, first_group_block_words: 38, second_group_blocks: 2, second_group_block_words: 3 },
      3: { total_words: 110, ec_words_per_block: 22, first_group_blocks: 4, first_group_block_words: 18, second_group_blocks: 2, second_group_block_words: 1 },
      2: { total_words: 86, ec_words_per_block: 26, first_group_blocks: 4, first_group_block_words: 14, second_group_blocks: 2, second_group_block_words: 1 }
  },
  9: {
      1: { total_words: 232, ec_words_per_block: 30, first_group_blocks: 2, first_group_block_words: 116, second_group_blocks: 0, second_group_block_words: 0 },
      0: { total_words: 182, ec_words_per_block: 22, first_group_blocks: 3, first_group_block_words: 36, second_group_blocks: 2, second_group_block_words: 3 },
      3: { total_words: 132, ec_words_per_block: 20, first_group_blocks: 4, first_group_block_words: 16, second_group_blocks: 4, second_group_block_words: 1 },
      2: { total_words: 100, ec_words_per_block: 24, first_group_blocks: 4, first_group_block_words: 12, second_group_blocks: 4, second_group_block_words: 1 }
  },
  10: {
      1: { total_words: 274, ec_words_per_block: 18, first_group_blocks: 2, first_group_block_words: 68, second_group_blocks: 2, second_group_block_words: 6 },
      0: { total_words: 216, ec_words_per_block: 26, first_group_blocks: 4, first_group_block_words: 43, second_group_blocks: 1, second_group_block_words: 4 },
      3: { total_words: 154, ec_words_per_block: 24, first_group_blocks: 6, first_group_block_words: 19, second_group_blocks: 2, second_group_block_words: 2 },
      2: { total_words: 122, ec_words_per_block: 28, first_group_blocks: 6, first_group_block_words: 15, second_group_blocks: 2, second_group_block_words: 1 }
  },
  11: {
      1: { total_words: 324, ec_words_per_block: 20, first_group_blocks: 4, first_group_block_words: 81, second_group_blocks: 0, second_group_block_words: 0 },
      0: { total_words: 254, ec_words_per_block: 30, first_group_blocks: 1, first_group_block_words: 50, second_group_blocks: 4, second_group_block_words: 5 },
      3: { total_words: 180, ec_words_per_block: 28, first_group_blocks: 4, first_group_block_words: 22, second_group_blocks: 4, second_group_block_words: 2 },
      2: { total_words: 140, ec_words_per_block: 24, first_group_blocks: 3, first_group_block_words: 12, second_group_blocks: 8, second_group_block_words: 1 }
  },
  12: {
      1: { total_words: 370, ec_words_per_block: 24, first_group_blocks: 2, first_group_block_words: 92, second_group_blocks: 2, second_group_block_words: 9 },
      0: { total_words: 290, ec_words_per_block: 22, first_group_blocks: 6, first_group_block_words: 36, second_group_blocks: 2, second_group_block_words: 3 },
      3: { total_words: 206, ec_words_per_block: 26, first_group_blocks: 4, first_group_block_words: 20, second_group_blocks: 6, second_group_block_words: 2 },
      2: { total_words: 158, ec_words_per_block: 28, first_group_blocks: 7, first_group_block_words: 14, second_group_blocks: 4, second_group_block_words: 1 }
  },
  13: {
      1: { total_words: 428, ec_words_per_block: 26, first_group_blocks: 4, first_group_block_words: 107, second_group_blocks: 0, second_group_block_words: 0 },
      0: { total_words: 334, ec_words_per_block: 22, first_group_blocks: 8, first_group_block_words: 37, second_group_blocks: 1, second_group_block_words: 3 },
      3: { total_words: 244, ec_words_per_block: 24, first_group_blocks: 8, first_group_block_words: 20, second_group_blocks: 4, second_group_block_words: 2 },
      2: { total_words: 180, ec_words_per_block: 22, first_group_blocks: 12, first_group_block_words: 11, second_group_blocks: 4, second_group_block_words: 1 }
  },
  14: {
      1: { total_words: 461, ec_words_per_block: 30, first_group_blocks: 3, first_group_block_words: 115, second_group_blocks: 1, second_group_block_words: 1 },
      0: { total_words: 365, ec_words_per_block: 24, first_group_blocks: 4, first_group_block_words: 40, second_group_blocks: 5, second_group_block_words: 4 },
      3: { total_words: 261, ec_words_per_block: 20, first_group_blocks: 11, first_group_block_words: 16, second_group_blocks: 5, second_group_block_words: 1 },
      2: { total_words: 197, ec_words_per_block: 24, first_group_blocks: 11, first_group_block_words: 12, second_group_blocks: 5, second_group_block_words: 1 }
  },
  15: {
      1: { total_words: 523, ec_words_per_block: 22, first_group_blocks: 5, first_group_block_words: 87, second_group_blocks: 1, second_group_block_words: 8 },
      0: { total_words: 415, ec_words_per_block: 24, first_group_blocks: 5, first_group_block_words: 41, second_group_blocks: 5, second_group_block_words: 4 },
      3: { total_words: 295, ec_words_per_block: 30, first_group_blocks: 5, first_group_block_words: 24, second_group_blocks: 7, second_group_block_words: 2 },
      2: { total_words: 223, ec_words_per_block: 24, first_group_blocks: 11, first_group_block_words: 12, second_group_blocks: 7, second_group_block_words: 1 }
  },
  16: {
      1: { total_words: 589, ec_words_per_block: 24, first_group_blocks: 5, first_group_block_words: 98, second_group_blocks: 1, second_group_block_words: 9 },
      0: { total_words: 453, ec_words_per_block: 28, first_group_blocks: 7, first_group_block_words: 45, second_group_blocks: 3, second_group_block_words: 4 },
      3: { total_words: 325, ec_words_per_block: 24, first_group_blocks: 15, first_group_block_words: 19, second_group_blocks: 2, second_group_block_words: 2 },
      2: { total_words: 253, ec_words_per_block: 30, first_group_blocks: 3, first_group_block_words: 15, second_group_blocks: 1, second_group_block_words: null}
  },
  17: {
      1: { total_words: 647, ec_words_per_block: 28, first_group_blocks: 1, first_group_block_words: 107, second_group_blocks: 5, second_group_block_words: 1 },
      0: { total_words: 507, ec_words_per_block: 28, first_group_blocks: 10, first_group_block_words: 46, second_group_blocks: 1, second_group_block_words: 4 },
      3: { total_words: 367, ec_words_per_block: 28, first_group_blocks: 1, first_group_block_words: 22, second_group_blocks: 1, second_group_block_words: null},
      2: { total_words: 283, ec_words_per_block: 28, first_group_blocks: 2, first_group_block_words: 14, second_group_blocks: 1, second_group_block_words: null}
  },
  18: {
      1: { total_words: 721, ec_words_per_block: 30, first_group_blocks: 5, first_group_block_words: 120, second_group_blocks: 1, second_group_block_words: 1 },
      0: { total_words: 563, ec_words_per_block: 26, first_group_blocks: 9, first_group_block_words: 43, second_group_blocks: 4, second_group_block_words: 4 },
      3: { total_words: 397, ec_words_per_block: 28, first_group_blocks: 17, first_group_block_words: 22, second_group_blocks: 1, second_group_block_words: 2 },
      2: { total_words: 313, ec_words_per_block: 28, first_group_blocks: 2, first_group_block_words: 14, second_group_blocks: 1, second_group_block_words: null}
  },
  19: {
      1: { total_words: 795, ec_words_per_block: 28, first_group_blocks: 3, first_group_block_words: 113, second_group_blocks: 4, second_group_block_words: 1 },
      0: { total_words: 627, ec_words_per_block: 26, first_group_blocks: 3, first_group_block_words: 44, second_group_blocks: 1, second_group_block_words: null},
      3: { total_words: 445, ec_words_per_block: 26, first_group_blocks: 17, first_group_block_words: 21, second_group_blocks: 4, second_group_block_words: 2 },
      2: { total_words: 341, ec_words_per_block: 26, first_group_blocks: 9, first_group_block_words: 13, second_group_blocks: 1, second_group_block_words: null}
  },
  20: {
      1: { total_words: 861, ec_words_per_block: 28, first_group_blocks: 3, first_group_block_words: 107, second_group_blocks: 5, second_group_block_words: 1 },
      0: { total_words: 669, ec_words_per_block: 26, first_group_blocks: 3, first_group_block_words: 41, second_group_blocks: 1, second_group_block_words: null},
      3: { total_words: 485, ec_words_per_block: 30, first_group_blocks: 15, first_group_block_words: 24, second_group_blocks: 5, second_group_block_words: 2 },
      2: { total_words: 385, ec_words_per_block: 28, first_group_blocks: 15, first_group_block_words: 15, second_group_blocks: 1, second_group_block_words: null}
  },
  21: {
      1: { total_words: 932, ec_words_per_block: 28, first_group_blocks: 4, first_group_block_words: 116, second_group_blocks: 4, second_group_block_words: 1 },
      0: { total_words: 714, ec_words_per_block: 26, first_group_blocks: 17, first_group_block_words: 42, second_group_blocks: 0, second_group_block_words: 0 },
      3: { total_words: 512, ec_words_per_block: 28, first_group_blocks: 17, first_group_block_words: 22, second_group_blocks: 6, second_group_block_words: 2 },
      2: { total_words: 406, ec_words_per_block: 30, first_group_blocks: 19, first_group_block_words: 16, second_group_blocks: 6, second_group_block_words: 1 }
  },
  22: {
      1: { total_words: 1006, ec_words_per_block: 28, first_group_blocks: 2, first_group_block_words: 111, second_group_blocks: 7, second_group_block_words: 1 },
      0: { total_words: 782, ec_words_per_block: 28, first_group_blocks: 17, first_group_block_words: 46, second_group_blocks: 0, second_group_block_words: 0 },
      3: { total_words: 568, ec_words_per_block: 30, first_group_blocks: 7, first_group_block_words: 24, second_group_blocks: 1, second_group_block_words: null},
      2: { total_words: 442, ec_words_per_block: 24, first_group_blocks: 34, first_group_block_words: 13, second_group_blocks: 0, second_group_block_words: 0 }
  },
  23: {
      1: { total_words: 1094, ec_words_per_block: 30, first_group_blocks: 4, first_group_block_words: 121, second_group_blocks: 5, second_group_block_words: 1 },
      0: { total_words: 860, ec_words_per_block: 28, first_group_blocks: 4, first_group_block_words: 47, second_group_blocks: 1, second_group_block_words: null},
      3: { total_words: 614, ec_words_per_block: 30, first_group_blocks: 11, first_group_block_words: 24, second_group_blocks: 1, second_group_block_words: null},
      2: { total_words: 464, ec_words_per_block: 30, first_group_blocks: 16, first_group_block_words: 15, second_group_blocks: 1, second_group_block_words: null}
  },
  24: {
      1: { total_words: 1174, ec_words_per_block: 30, first_group_blocks: 6, first_group_block_words: 117, second_group_blocks: 4, second_group_block_words: 1 },
      0: { total_words: 914, ec_words_per_block: 28, first_group_blocks: 6, first_group_block_words: 45, second_group_blocks: 1, second_group_block_words: null},
      3: { total_words: 664, ec_words_per_block: 30, first_group_blocks: 11, first_group_block_words: 24, second_group_blocks: 1, second_group_block_words: null},
      2: { total_words: 514, ec_words_per_block: 30, first_group_blocks: 30, first_group_block_words: 16, second_group_blocks: 2, second_group_block_words: 1 }
  },
  25: {
      1: { total_words: 1276, ec_words_per_block: 26, first_group_blocks: 8, first_group_block_words: 106, second_group_blocks: 4, second_group_block_words: 1 },
      0: { total_words: 1000, ec_words_per_block: 28, first_group_blocks: 8, first_group_block_words: 47, second_group_blocks: 1, second_group_block_words: null},
      3: { total_words: 718, ec_words_per_block: 30, first_group_blocks: 7, first_group_block_words: 24, second_group_blocks: 2, second_group_block_words: null},
      2: { total_words: 538, ec_words_per_block: 30, first_group_blocks: 22, first_group_block_words: 15, second_group_blocks: 1, second_group_block_words: null}
  },
  26: {
      1: { total_words: 1370, ec_words_per_block: 28, first_group_blocks: 10, first_group_block_words: 114, second_group_blocks: 2, second_group_block_words: 1 },
      0: { total_words: 1062, ec_words_per_block: 28, first_group_blocks: 19, first_group_block_words: 46, second_group_blocks: 4, second_group_block_words: 4 },
      3: { total_words: 754, ec_words_per_block: 28, first_group_blocks: 28, first_group_block_words: 22, second_group_blocks: 6, second_group_block_words: 2 },
      2: { total_words: 596, ec_words_per_block: 30, first_group_blocks: 33, first_group_block_words: 16, second_group_blocks: 4, second_group_block_words: 1 }
  },
  27: {
      1: { total_words: 1468, ec_words_per_block: 30, first_group_blocks: 8, first_group_block_words: 122, second_group_blocks: 4, second_group_block_words: 1 },
      0: { total_words: 1128, ec_words_per_block: 28, first_group_blocks: 22, first_group_block_words: 45, second_group_blocks: 3, second_group_block_words: 4 },
      3: { total_words: 808, ec_words_per_block: 30, first_group_blocks: 8, first_group_block_words: 23, second_group_blocks: 2, second_group_block_words: null},
      2: { total_words: 628, ec_words_per_block: 30, first_group_blocks: 12, first_group_block_words: 15, second_group_blocks: 2, second_group_block_words: null}
  },
  28: {
      1: { total_words: 1531, ec_words_per_block: 30, first_group_blocks: 3, first_group_block_words: 117, second_group_blocks: 1, second_group_block_words: null},
      0: { total_words: 1193, ec_words_per_block: 28, first_group_blocks: 3, first_group_block_words: 45, second_group_blocks: 2, second_group_block_words: null},
      3: { total_words: 871, ec_words_per_block: 30, first_group_blocks: 4, first_group_block_words: 24, second_group_blocks: 3, second_group_block_words: null},
      2: { total_words: 661, ec_words_per_block: 30, first_group_blocks: 11, first_group_block_words: 15, second_group_blocks: 3, second_group_block_words: null}
  },
  29: {
      1: { total_words: 1631, ec_words_per_block: 30, first_group_blocks: 7, first_group_block_words: 116, second_group_blocks: 7, second_group_block_words: 1 },
      0: { total_words: 1267, ec_words_per_block: 28, first_group_blocks: 21, first_group_block_words: 45, second_group_blocks: 7, second_group_block_words: 4 },
      3: { total_words: 911, ec_words_per_block: 30, first_group_blocks: 1, first_group_block_words: 23, second_group_blocks: 3, second_group_block_words: null},
      2: { total_words: 701, ec_words_per_block: 30, first_group_blocks: 19, first_group_block_words: 15, second_group_blocks: 2, second_group_block_words: null}
  },
  30: {
      1: { total_words: 1735, ec_words_per_block: 30, first_group_blocks: 5, first_group_block_words: 115, second_group_blocks: 1, second_group_block_words: null},
      0: { total_words: 1373, ec_words_per_block: 28, first_group_blocks: 19, first_group_block_words: 47, second_group_blocks: 1, second_group_block_words: null},
      3: { total_words: 985, ec_words_per_block: 30, first_group_blocks: 15, first_group_block_words: 24, second_group_blocks: 2, second_group_block_words: null},
      2: { total_words: 745, ec_words_per_block: 30, first_group_blocks: 23, first_group_block_words: 15, second_group_blocks: 2, second_group_block_words: null}
  },
  31: {
      1: { total_words: 1843, ec_words_per_block: 30, first_group_blocks: 13, first_group_block_words: 115, second_group_blocks: 3, second_group_block_words: 1 },
      0: { total_words: 1455, ec_words_per_block: 28, first_group_blocks: 2, first_group_block_words: 46, second_group_blocks: 2, second_group_block_words: null},
      3: { total_words: 1033, ec_words_per_block: 30, first_group_blocks: 42, first_group_block_words: 24, second_group_blocks: 1, second_group_block_words: 2 },
      2: { total_words: 793, ec_words_per_block: 30, first_group_blocks: 23, first_group_block_words: 15, second_group_blocks: 2, second_group_block_words: null}
  },
  32: {
      1: { total_words: 1955, ec_words_per_block: 30, first_group_blocks: 17, first_group_block_words: 115, second_group_blocks: 0, second_group_block_words: 0 },
      0: { total_words: 1541, ec_words_per_block: 28, first_group_blocks: 10, first_group_block_words: 46, second_group_blocks: 2, second_group_block_words: null},
      3: { total_words: 1115, ec_words_per_block: 30, first_group_blocks: 10, first_group_block_words: 24, second_group_blocks: 3, second_group_block_words: null},
      2: { total_words: 845, ec_words_per_block: 30, first_group_blocks: 19, first_group_block_words: 15, second_group_blocks: 3, second_group_block_words: null}
  },
  33: {
      1: { total_words: 2071, ec_words_per_block: 30, first_group_blocks: 17, first_group_block_words: 115, second_group_blocks: 1, second_group_block_words: 1 },
      0: { total_words: 1631, ec_words_per_block: 28, first_group_blocks: 14, first_group_block_words: 46, second_group_blocks: 2, second_group_block_words: null},
      3: { total_words: 1171, ec_words_per_block: 30, first_group_blocks: 29, first_group_block_words: 24, second_group_blocks: 1, second_group_block_words: null},
      2: { total_words: 901, ec_words_per_block: 30, first_group_blocks: 11, first_group_block_words: 15, second_group_blocks: 4, second_group_block_words: null}
  },
  34: {
      1: { total_words: 2191, ec_words_per_block: 30, first_group_blocks: 13, first_group_block_words: 115, second_group_blocks: 6, second_group_block_words: 1 },
      0: { total_words: 1725, ec_words_per_block: 28, first_group_blocks: 14, first_group_block_words: 46, second_group_blocks: 2, second_group_block_words: null},
      3: { total_words: 1231, ec_words_per_block: 30, first_group_blocks: 44, first_group_block_words: 24, second_group_blocks: 7, second_group_block_words: 2 },
      2: { total_words: 961, ec_words_per_block: 30, first_group_blocks: 59, first_group_block_words: 16, second_group_blocks: 1, second_group_block_words: 1 }
  },
  35: {
      1: { total_words: 2306, ec_words_per_block: 30, first_group_blocks: 12, first_group_block_words: 121, second_group_blocks: 7, second_group_block_words: 1 },
      0: { total_words: 1812, ec_words_per_block: 28, first_group_blocks: 12, first_group_block_words: 47, second_group_blocks: 2, second_group_block_words: null},
      3: { total_words: 1286, ec_words_per_block: 30, first_group_blocks: 39, first_group_block_words: 24, second_group_blocks: 1, second_group_block_words: null},
      2: { total_words: 986, ec_words_per_block: 30, first_group_blocks: 22, first_group_block_words: 15, second_group_blocks: 4, second_group_block_words: null}
  },
  36: {
      1: { total_words: 2434, ec_words_per_block: 30, first_group_blocks: 6, first_group_block_words: 121, second_group_blocks: 1, second_group_block_words: null},
      0: { total_words: 1914, ec_words_per_block: 28, first_group_blocks: 6, first_group_block_words: 47, second_group_blocks: 3, second_group_block_words: null},
      3: { total_words: 1354, ec_words_per_block: 30, first_group_blocks: 46, first_group_block_words: 24, second_group_blocks: 1, second_group_block_words: null},
      2: { total_words: 1054, ec_words_per_block: 30, first_group_blocks: 2, first_group_block_words: 15, second_group_blocks: 6, second_group_block_words: null}
  },
  37: {
      1: { total_words: 2566, ec_words_per_block: 30, first_group_blocks: 17, first_group_block_words: 122, second_group_blocks: 4, second_group_block_words: 1 },
      0: { total_words: 1992, ec_words_per_block: 28, first_group_blocks: 29, first_group_block_words: 46, second_group_blocks: 1, second_group_block_words: null},
      3: { total_words: 1426, ec_words_per_block: 30, first_group_blocks: 49, first_group_block_words: 24, second_group_blocks: 1, second_group_block_words: null},
      2: { total_words: 1096, ec_words_per_block: 30, first_group_blocks: 24, first_group_block_words: 15, second_group_blocks: 4, second_group_block_words: null}
  },
  38: {
      1: { total_words: 2702, ec_words_per_block: 30, first_group_blocks: 4, first_group_block_words: 122, second_group_blocks: 1, second_group_block_words: null},
      0: { total_words: 2102, ec_words_per_block: 28, first_group_blocks: 13, first_group_block_words: 46, second_group_blocks: 3, second_group_block_words: null},
      3: { total_words: 1502, ec_words_per_block: 30, first_group_blocks: 48, first_group_block_words: 24, second_group_blocks: 1, second_group_block_words: null},
      2: { total_words: 1142, ec_words_per_block: 30, first_group_blocks: 42, first_group_block_words: 15, second_group_blocks: 3, second_group_block_words: null}
  },
  39: {
      1: { total_words: 2812, ec_words_per_block: 30, first_group_blocks: 20, first_group_block_words: 117, second_group_blocks: 4, second_group_block_words: 1 },
      0: { total_words: 2216, ec_words_per_block: 28, first_group_blocks: 40, first_group_block_words: 47, second_group_blocks: 7, second_group_block_words: 4 },
      3: { total_words: 1582, ec_words_per_block: 30, first_group_blocks: 43, first_group_block_words: 24, second_group_blocks: 2, second_group_block_words: null},
      2: { total_words: 1222, ec_words_per_block: 30, first_group_blocks: 10, first_group_block_words: 15, second_group_blocks: 6, second_group_block_words: null}
  },
  40: {
      1: { total_words: 2956, ec_words_per_block: 30, first_group_blocks: 19, first_group_block_words: 118, second_group_blocks: 6, second_group_block_words: 1 },
      0: { total_words: 2334, ec_words_per_block: 28, first_group_blocks: 18, first_group_block_words: 47, second_group_blocks: 3, second_group_block_words: null},
      3: { total_words: 1666, ec_words_per_block: 30, first_group_blocks: 34, first_group_block_words: 24, second_group_blocks: 3, second_group_block_words: null},
      2: { total_words: 1276, ec_words_per_block: 30, first_group_blocks: 20, first_group_block_words: 15, second_group_blocks: 6, second_group_block_words: null}
  }
};

function decToBin(dec: number): string {
  return (dec >>> 0).toString(2);
}

export default class QRCodeGenerator {
  bytes: Uint8Array = new Uint8Array();
  message: Uint8Array = new Uint8Array();
  canvas?: HTMLCanvasElement;
  canvasCtx?: CanvasRenderingContext2D;
  canvasSize?: number;
  version: Version;
  mode: Mode = 'a';
  cellSize: number = 0;
  showGrid: boolean = false;
  curPos: Coord = [0,0];
  matrix: BitMatrix = [[]];
  errCorrectionLevel: ErrorCorrectionLevel = ERR_LVLS.QUAL
  functionalMatrix: BitMatrix;
  maskPattern: number = 0;
  countIndicator: string = '';
  inputData: any;
  
  constructor(data_to_encode: any = '') {
    this.inputData = data_to_encode;
    this.mode = this.determineMode(data_to_encode);
    this.version = this.determineVersion(data_to_encode);
    this.countIndicator = this.generateCountIndicator();
    this.resetMatrix();
    this.setFunctionPatterns();
    this.functionalMatrix = this.matrix;
    this.bytes = this.encode(data_to_encode);
    // this.determineMaskPattern();
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

  generateCountIndicator() {
    if (this.version <= 9) {
      switch (this.mode) {
        case 'n': return this.inputData.length.toString(2).padStart(10, '0');
        case 'a': return this.inputData.length.toString(2).padStart(9, '0');
        case 'b': return this.inputData.length.toString(2).padStart(8, '0');
        case 'k': return this.inputData.length.toString(2).padStart(8, '0');
      }
    } else if (this.version <= 26) {
      switch (this.mode) {
        case 'n': return this.inputData.length.toString(2).padStart(12, '0');
        case 'a': return this.inputData.length.toString(2).padStart(11, '0');
        case 'b': return this.inputData.length.toString(2).padStart(16, '0');
        case 'k': return this.inputData.length.toString(2).padStart(10, '0');
      }
    } else {
      switch (this.mode) {
        case 'n': return this.inputData.length.toString(2).padStart(14, '0');
        case 'a': return this.inputData.length.toString(2).padStart(13, '0');
        case 'b': return this.inputData.length.toString(2).padStart(16, '0');
        case 'k': return this.inputData.length.toString(2).padStart(12, '0');
      }
    }

    throw new Error('Invalid mode or version');
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
    let formatPositions: Array<Array<Coord>> = [
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
        let pos: Coord = [i,k];
        if (this.functionalMatrix[i][k] === null) {
          let val: 0|1 = this.getCell(pos) ? 1 : 0;
          if (mask(pos)) val = !val ? 1 : 0;
          this.setCell(pos, val);
        }
      }
    }
  }

  determineMode(data_to_encode: any): Mode {
    let numeric_regex = /^[0-9]+$/;
    let alphanumeric_regex = /^[A-Z0-9 $%*+-./:]+$/;
    let kanji_regex = /[^\x00-\x7F]/;

    if (numeric_regex.test(data_to_encode)) return 'n';
    if (alphanumeric_regex.test(data_to_encode)) return 'a';
    if (kanji_regex.test(data_to_encode)) return 'k';
    return 'b';
  }

  determineVersion(data_to_encode: string): Version {
    let version = 0, capacity = 0;
    do {
      version++;
      capacity = CAPACITIES[version][this.errCorrectionLevel][this.mode];
    } while (capacity < data_to_encode.length && version < 40);

    return version as Version;
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

  encode(data_to_encode: any): Array<string> {
const modeBits = Modes[this.mode].indicator;
    const countBits = this.countIndicator;
    const total_bits = (WORD_COUNTS[this.version][this.errCorrectionLevel].total_words || 0) * 8;
    if (total_bits == 0) throw new Error('Invalid version or error correction level');
    
    let encoded = [modeBits, countBits];
    switch(this.mode) {
      case 'n':
console.log("Encoding numeric data")
        encoded = [...encoded, ...this.encodeNumeric(data_to_encode)];
        break;
      case 'a':
console.log("Encoding alphanumeric data")
        encoded = [...encoded, ...this.encodeAlphaNumeric(data_to_encode)];
        break;
      case 'b':
console.log("Encoding byte data")
        encoded = [...encoded, ...this.encodeByte(data_to_encode)];
        break;
      case 'k':
console.log("Encoding kanji data")
        encoded = [...encoded, ...this.encodeKanji(data_to_encode)];
        break;
    }

    let bit_string = encoded.join('');
    let terminator = '';
    //add up to 4 terminator bits
    for (let i=0;i<4 && (bit_string+terminator).length < total_bits;i++) {
      terminator += '0';
    }

    //make sure bit string is a multiple of 8
    while ((bit_string+terminator).length % 8 !== 0) {
      terminator += '0';
    }

    let remaining_bytes = (total_bits - (bit_string+terminator).length) / 8;
    let pad_bytes = [];
    for (let i=0;i<remaining_bytes;i++) {
      pad_bytes.push(i%2 ? '00010001' : '11101100');
    }
encoded.push(terminator, ...pad_bytes);
    
//split into 8-bit chunks
    let encoded_bytes = encoded.join('').match(/.{1,8}/g);

    return encoded;
  }

  encodeNumeric(data_to_encode: string): Array<string> {
    let encoded = [];
    let i = 0;
    while (i < data_to_encode.length) {
      let chunk = data_to_encode.slice(i, i+3);

      let val = parseInt(chunk);
      let length = 10;
      if (val.toString.length == 2) length = 7;
      if (val.toString.length == 1) length = 4;
      let bin = val.toString(2).padStart(length, '0');
      encoded.push(bin);
      i += 3;
    }

    return encoded;
  }

  encodeAlphaNumeric(data_to_encode: string): Array<string> {
    let encoded = [];
    let alpha_map = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

    for (let i=0;i<data_to_encode.length;i+=2) {
      let val1 = alpha_map.indexOf(data_to_encode[i]);
      if (data_to_encode[i+1] === undefined) {
        encoded.push(decToBin(val1).padStart(6, '0'));
      } else {
        let val2 = alpha_map.indexOf(data_to_encode[i+1]);
        encoded.push(decToBin((val1 * 45) + val2).padStart(11, '0'));
      }
    }
    return encoded;
  }

  encodeByte(data_to_encode: string): Array<string> {
    let encoded = [];
    for (let i=0;i<data_to_encode.length;i++) {
      encoded.push(data_to_encode.charCodeAt(i).toString(2).padStart(8, '0'));
    }

    return encoded;
  }

  encodeKanji(data_to_encode: string): Array<string> {
    //TODO kanji encoding
    
    return [];
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
      case 'k':
        mode = 8;
        break;
      case 'b':
        mode = 4;
        break;
      case 'n':
        mode = 1;
        break;
      case 'a':
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

    let nextPos: Coord = [this.curPos[0] + h, this.curPos[1] + v];

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
    const locatorPositions: Array<Coord> = [
      [0,0],
      [0,this.gridSize-7],
      [this.gridSize-7, 0],
    ];
    for(const locPos of locatorPositions) {
      this.square(locPos, 7, 1)
      this.square(locPos.map(c => c+1) as Coord, 5, 0)
      this.square(locPos.map(c => c+2) as Coord, 3, 1)
      this.setCell(locPos.map(c => c+3) as Coord, 1, true);
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

  getCell(pos: Coord) {
    const [x,y] = pos;
    if (this.matrix[x] !== undefined && this.matrix[x][y] !== undefined) return this.matrix[x][y];
    return undefined;
  }

  setAlignmentSquares() {
    const positions = AlignmentPositions[this.version];

    for (const x of positions) {
      for (const y of positions) {
        let pos: Coord = [x,y];
        if (this.getCell(pos) === null) {
          this.setCell(pos, 1)
          this.square(pos.map(c => c-1) as Coord, 3, 0)
          this.square(pos.map(c => c-2) as Coord, 5, 1)
        }
      }
    }
  }

  setCell(pos: Coord, val:0|1, overwrite: boolean = false) {
    if (this.matrix[pos[0]] === undefined || this.matrix[pos[0]][pos[1]] === undefined) return;
    if (!overwrite && this.matrix[pos[0]][pos[1]] !== null) return;
    this.matrix[pos[0]][pos[1]] = val;
  }

  square(pos:Coord, w:number, val: 1|0 = 1) {
    const [x,y] = pos;
    for (let i=0;i<w;i++) {
      this.setCell([x+i,y], val, true);
      this.setCell([x,y+i], val, true);
      this.setCell([x+w-1,y+i], val, true);
      this.setCell([x+i,y+w-1], val, true);
    }
  }

  drawCell(pos: Coord, val: 0|1|null = 1) {
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