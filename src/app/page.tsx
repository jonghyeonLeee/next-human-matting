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
          if (viewOption === 'recurrent1') {
            drawHidden(r1o, canvasRef.current);
          } else if (viewOption === 'recurrent2') {
            drawHidden(r2o, canvasRef.current);
          } else if (viewOption === 'recurrent3') {
            drawHidden(r3o, canvasRef.current);
          } else if (viewOption === 'recurrent4') {
            drawHidden(r4o, canvasRef.current);
          } else if (viewOption === 'white') {
            drawMatte(fgr.clone(), pha.clone(), canvasRef.current);
            context.fillStyle = 'rgb(255, 255, 255)';
          } else if (viewOption === 'green') {
            drawMatte(fgr.clone(), pha.clone(), canvasRef.current);
            context.fillStyle = 'rgb(120, 255, 155)';
            // canvasRef.current.style.background = 'rgb(120, 255, 155)';
          } else if (viewOption === 'alpha') {
            drawMatte(null, pha.clone(), canvasRef.current);
            context.fillStyle = 'rgb(0, 0, 0)';
          } else if (viewOption === 'foreground') {
            drawMatte(fgr.clone(), null, canvasRef.current);
          }
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
    const [height, width] = rgba.shape.slice(0, 2);
    const pixelData = new Uint8ClampedArray(await rgba.data());
    const imageData = new ImageData(pixelData, width, height);
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);
    rgba.dispose();
  };

  const drawHidden = async (
    r: tf.Tensor,
    canvas: HTMLCanvasElement,
  ): Promise<void> => {
    const rgba = tf.tidy(() => {
      // Ensure r is unstacked into an array of tensors.
      const layers: tf.Tensor[] = r.unstack(-1);
      // After concatenation, we're still dealing with a tensor, not an array.
      let imgTensor: tf.Tensor = tf.concat(layers, 1);
      // Splitting the tensor along a dimension returns an array of tensors.
      const splitLayers: tf.Tensor[] = imgTensor.split(4, 1);
      // Concatenating these tensors returns a single tensor.
      imgTensor = tf.concat(splitLayers, 2);
      imgTensor = imgTensor
        .squeeze([0])
        .expandDims(-1)
        .add(1)
        .mul(127.5)
        .cast('int32');
      imgTensor = imgTensor.tile([1, 1, 3]);
      const shape1 = imgTensor.shape[0];
      const shpae2 = imgTensor.shape[1] ?? 0;
      imgTensor = tf.concat(
        [imgTensor, tf.fill([shape1, shpae2, 1], 255, 'int32')],
        -1,
      );
      return imgTensor;
    });
    const [height, width] = rgba.shape.slice(0, 2);
    const pixelData = new Uint8ClampedArray(await rgba.data());
    const imageData = new ImageData(pixelData, width, height);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
    }
    rgba.dispose();
  };

  const handleButtonClick = () => {
    setPlayCam((prev) => !prev);
  };

  const inference = () => {};

  return (
    <div>
      <Navigation />

      <button onClick={handleButtonClick}>Start</button>

      <select onChange={(e) => setViewOption(e.target.value)}>
        <option value="white">White Background</option>
        <option value="green">Green Background</option>
        <option value="alpha">Alpha</option>
        <option value="foreground">Foreground</option>
        <option value="recurrent1">Recurrent State 1</option>
        <option value="recurrent2">Recurrent State 2</option>
        <option value="recurrent3">Recurrent State 3</option>
        <option value="recurrent4">Recurrent State 4</option>
      </select>
      <br />
      <video ref={videoRef} style={{ width: 640, height: 480 }}></video>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
