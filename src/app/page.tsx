'use client'
import { VStack, Center, Container, Input, Box } from "@chakra-ui/react"
import { FormEvent, useEffect, useRef, useState } from "react"

type QRCodeProps = {
  stringData: string,
  width: string,
  height: string
}

function textToBinary(str: string): string {
  let output = '';
  for(var i = 0; i < str.length; i++) {
    output += str[i].charCodeAt(0).toString(2);
  }

  return output;
}

function QRCode(props: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { stringData } = props;

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas && context) {
      const codeBits = textToBinary(stringData)
      const ch = context.canvas.height;
      const cw = context.canvas.width;

      const [grid_w, grid_h] = [33,33];
      const [cell_w, cell_h] = [cw / grid_w, ch / grid_h];

      function coordsToPos(x: number, y: number): Array<number> {
        return [cell_w * (x-1), cell_h * (y-1)]
      }

      function drawCell(ctx: CanvasRenderingContext2D,x: number, y: number, color: string = "#000000"): void {
        ctx.fillStyle=color;
        const [cx, cy] = coordsToPos(x,y)
        ctx.fillRect(cx, cy, cell_w, cell_h);
      }
      
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.fillStyle="#ffffff";
      context.fillRect(0,0,context.canvas.width, context.canvas.height);
      context.fillStyle="#000000";
      let pos = 0;
      for (let y = 1;y <= grid_w; y++) {
        for(let x = 1;x <= grid_h;x++) {
          if (codeBits[pos] == '1') drawCell(context, x, y)
          pos++;
        }
      }
    }

    return () => {
      context?.reset();
    }
  }, [canvasRef, stringData])

  return (
    <>
      <canvas ref={canvasRef} {...props}></canvas>
    </>
  )
}

export default function Home() {

  const [myString, setMyString] = useState('hello');
  const size = "200px"

  function handleInput(event: FormEvent<HTMLInputElement>): void {
    setMyString(event.currentTarget.value)
  }
  
  return (
    <Container fluid>
      <Center h="dvh" w="dvw">
        <VStack>
          <Box rounded="md" borderWidth="1px" h={size} w={size} mb="40px">
            <QRCode stringData={myString} width={size} height={size}/>
          </Box>
          <Center>
            <Input
              name="to-encode"
              variant="flushed"
              placeholder="Enter some text..."
              w="500px"
              value={myString}
              onInput={handleInput}
            />
          </Center>
        </VStack>
      </Center>
    </Container>
  )
}