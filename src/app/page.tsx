'use client'
import { VStack, Center, Container, Input, Box } from "@chakra-ui/react"
import { FormEvent, useEffect, useRef, useState } from "react"
import QRCodeGenerator from '@/qrcode';

type QRCodeProps = {
  input: string,
  width: string,
  height: string
}

function QRCode(props: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputData = props.input;
  const formatString = useRef<string>('');

  useEffect(() => {
    const canvas = canvasRef.current;
    const qrcode = new QRCodeGenerator(inputData, canvas);
    if (canvas) {
      // qrcode.showGrid = true;
      // qrcode.highlight = true;
      qrcode.render();
      formatString.current = qrcode.formatString;
    }
  }, [canvasRef, inputData]);

  return (
    <>
      <canvas ref={canvasRef} {...props}></canvas>
    </>
  )
}

export default function Home() {

  const [myString, setMyString] = useState('HELLO WORLD');
  const size = "400px"

  function handleInput(event: FormEvent<HTMLInputElement>): void {
    setMyString(event.currentTarget.value)
  }
  
  return (
    <Container fluid>
      <Center h="dvh" w="dvw">
        <VStack>
          <Box rounded="md" borderWidth="1px" h={size} w={size} mb="40px">
            <QRCode width={size} height={size} input={myString}/>
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