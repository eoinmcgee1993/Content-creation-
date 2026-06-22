import { useState, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as FileSystem from 'expo-file-system';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';

type ClassifierState = {
  ready: boolean;
  loading: boolean;
  error: string | null;
};

type ClassifyResult = {
  isDog: boolean;
  confidence: number;
  topLabel: string;
};

// MobileNet class names that correspond to dogs
const DOG_CLASS_PREFIXES = [
  'dog',
  'puppy',
  'hound',
  'terrier',
  'retriever',
  'poodle',
  'labrador',
  'shepherd',
  'spaniel',
  'beagle',
  'bulldog',
  'boxer',
  'collie',
  'dachshund',
  'dalmatian',
  'husky',
  'pug',
  'canine',
];

export function useClassifier() {
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [state, setState] = useState<ClassifierState>({
    ready: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function loadModel() {
      try {
        await tf.ready();
        const loaded = await mobilenet.load({ version: 2, alpha: 0.5 });
        setModel(loaded);
        setState({ ready: true, loading: false, error: null });
      } catch (err) {
        setState({
          ready: false,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load AI model',
        });
      }
    }
    loadModel();
  }, []);

  const classifyImage = useCallback(
    async (imageUri: string): Promise<ClassifyResult> => {
      if (!model) throw new Error('Model not ready');

      // Read image bytes from URI
      const imgB64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
      const rawImage = new Uint8Array(imgBuffer);
      const imageTensor = decodeJpeg(rawImage);

      const predictions = await model.classify(imageTensor);
      imageTensor.dispose();

      if (!predictions.length) {
        return { isDog: false, confidence: 0, topLabel: 'unknown' };
      }

      const top = predictions[0];
      const topLabel = top.className.toLowerCase();
      const isDog = DOG_CLASS_PREFIXES.some((prefix) => topLabel.includes(prefix));

      return {
        isDog,
        confidence: top.probability,
        topLabel: top.className,
      };
    },
    [model]
  );

  return { ...state, classifyImage };
}
