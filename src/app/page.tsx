'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { GraphModel } from '@tensorflow/tfjs-converter/dist/executor/graph_model';
import Navigation from '../../components/Navigation';
import '@tensorflow/tfjs-backend-wasm';
import { WebcamIterator } from '@tensorflow/tfjs-data/dist/iterators/webcam_iterator';

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<GraphModel | null>(null);
  const [playCam, setPlayCam] = useState<boolean>(false);
  const [viewOption, setViewOption] = useState<string>('white');
  const [loading, setLoading] = useState<number>(0);

  // 비동기 처리1 - backend Loading 하기
  const setENV: (name: string) => void = async (name) => {
    await tf.setBackend(name);
    console.log(`Backend is ${tf.getBackend()}`);

    const model = await tf.loadGraphModel('model/model.json');

    setModel(model);
  };

  useEffect(() => {
    setENV('wasm');
  }, []);

  useEffect(() => {
    console.log('model loading');

    if (model === null) return;
    if (playCam === false) return;
    if (videoRef.current === null || videoRef.current === undefined) return;

    const runInference = async () => {
      console.log(model, playCam, videoRef);

      if (videoRef.current === undefined || videoRef.current === null) return;

      let [r1i, r2i, r3i, r4i] = [
        tf.tensor(0),
        tf.tensor(0),
        tf.tensor(0),
        tf.tensor(0),
      ];
      // Set downsample ratio
      const downsample_ratio = tf.tensor(0.5);

      const webcam = await tf.data.webcam(videoRef.current, {
        resizeWidth: 640,
        resizeHeight: 480,
      });

      while (true) {
        await tf.nextFrame();
        const img = await webcam.capture();
        const src = tf.tidy(() => img.expandDims(0).div(255));

        const [fgr, pha, r1o, r2o, r3o, r4o] = (await model.executeAsync(
          { src, r1i, r2i, r3i, r4i, downsample_ratio }, // Example downsample_ratio
          ['fgr', 'pha', 'r1o', 'r2o', 'r3o', 'r4o'],
        )) as tf.Tensor[];

        // Example drawing logic; adjust according to your needs
        const context = canvasRef?.current?.getContext('2d');
        if (
          canvasRef.current !== undefined &&
          canvasRef.current !== null &&
          context !== null &&
          context !== undefined
        ) {
          drawMatte(fgr.clone(), pha.clone(), canvasRef.current);
          context.fillStyle = 'rgb(0, 0, 0)';
        }

        // Dispose of old tensors
        tf.dispose([img, src, fgr, pha, r1i, r2i, r3i, r4i]);

        // Update recurrent states with the outputs for the next iteration
        r1i = r1o;
        r2i = r2o;
        r3i = r3o;
        r4i = r4o;
      }
    };

    runInference()
      .then((o) => console.log(o))
      .catch((e) => console.error(e));
  }, [model, playCam, viewOption]);

  const drawMatte = async (
    fgr: tf.Tensor | null,
    pha: tf.Tensor | null,
    canvas: HTMLCanvasElement,
  ): Promise<void> => {
    const rgba = tf.tidy(() => {
      const phaShape1: number = pha!.shape[1] ?? 0;
      const phaShape2: number = pha!.shape[2] ?? 0;
      const fgrShape1 = fgr!.shape[1] ?? 0;
      const fgrShape2 = fgr!.shape[2] ?? 0;

      const rgb =
        fgr !== null
          ? fgr.squeeze([0]).mul(255).cast('int32')
          : tf.fill([phaShape1, phaShape2, 3], 255, 'int32');
      const a =
        pha !== null
          ? pha.squeeze([0]).mul(255).cast('int32')
          : tf.fill([fgrShape1, fgrShape2, 1], 255, 'int32');
      return tf.concat([rgb, a], -1);
    });

    const ctx = canvas.getContext('2d');

    if (ctx === null) {
      rgba.dispose();
      return;
    }

    // 배경 이미지의 imageData를 가져옴
    const backgroundImageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const [height, width] = rgba.shape.slice(0, 2);
    const pixelData = new Uint8ClampedArray(await rgba.data());
    const imageData = new ImageData(pixelData, width, height);

    // 임시 canvas를 생성하여 ImageData를 그리고, 이를 메인 canvas에 그림
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d')!.putImageData(imageData, 0, 0);

    // 임시 canvas에서 메인 canvas로 이미지를 그림
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);
    rgba.dispose();
  };

  const handleButtonClick = () => {
    setPlayCam((prev) => !prev);
  };

  const inference = () => {};

  return (
    <div>
      {/*<Navigation />*/}
      <h1>Jonghyeon Humanmatting TensorFlowjs test</h1>

      <button onClick={handleButtonClick}>Start</button>
      <br />
      <video ref={videoRef} style={{ width: 640, height: 480 }}></video>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
