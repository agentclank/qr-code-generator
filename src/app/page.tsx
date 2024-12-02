'use client'
import { VStack, Center, Container, Input, Box } from "@chakra-ui/react"
import { FormEvent, useEffect, useRef, useState } from "react"
import QRCodeGenerator from '@/qrcode';

type QRCodeProps = {
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

  useEffect(() => {
    const qrcode = new QRCodeGenerator();
    const canvas = canvasRef.current;
    if (canvas) {
      qrcode.useCanvas(canvas);
      qrcode.showGrid = true;
      qrcode.render();
    }
  }, [canvasRef])

  return (
    <>
      <canvas ref={canvasRef} {...props}></canvas>
    </>
  )
}

export default function Home() {

  const [myString, setMyString] = useState('hello');
  const size = "400px"

  function handleInput(event: FormEvent<HTMLInputElement>): void {
    setMyString(event.currentTarget.value)
  }
  
  return (
    <Container fluid>
      <Center h="dvh" w="dvw">
        <VStack>
          <Box rounded="md" borderWidth="1px" h={size} w={size} mb="40px">
            <QRCode width={size} height={size}/>
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