'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { GraphModel } from '@tensorflow/tfjs-converter/dist/executor/graph_model';
import Navigation from '../../components/Navigation';
import '@tensorflow/tfjs-backend-wasm';

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState<GraphModel | null>(null);
  const [viewOption, setViewOption] = useState('recurrent1');
  const [loading, setLoading] = useState<number>(0);

  // 비동기 처리1 - backend Loading 하기
  const setENV: (name: string) => void = async (name) => {
    await tf.setBackend(name);
    console.log(`Backend is ${tf.getBackend()}`);

    const model = await tf.loadGraphModel('model/model.json');

    setModel(model);
  };

  const getUserLocalCamera: () => void = async () => {};

  useEffect(() => {
    setENV('wasm');
    getUserLocalCamera();
  }, []);

  useEffect(() => {
    if (model === null) return;
    console.log('model loading');

    const webcam = callWebCamData();
  }, [model]);

  const callWebCamData = useCallback(async () => {
    await tf.data.webcam(videoRef.current);
  }, [model]);

  return (
    <div>
      <Navigation />

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
