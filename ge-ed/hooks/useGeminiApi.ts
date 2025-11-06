import { useState, useCallback, useRef, useEffect } from 'react';

type ApiFunction<T extends any[], R> = (...args: T) => Promise<R>;

interface UseGeminiApiReturn<T extends any[], R> {
  execute: (...args: T) => Promise<R | undefined>;
  loading: boolean;
  error: string | null;
  data: R | null;
  setError: (error: string | null) => void;
  setData: (data: R | null) => void;
}

export const useGeminiApi = <T extends any[], R>(
  apiFunction: ApiFunction<T, R>
): UseGeminiApiReturn<T, R> => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<R | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args: T): Promise<R | undefined> => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await apiFunction(...args);
      if (isMountedRef.current) {
        setData(result);
      }
      return result;
    } catch (e) {
      console.error(e);
      if (isMountedRef.current) {
        const errorMessage = e instanceof Error ? e.message : 'API呼び出し中に不明なエラーが発生しました。';
        setError(`画像の生成に失敗しました: ${errorMessage}`);
      }
      return undefined;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFunction]);

  return { execute, loading, error, data, setError, setData };
};
