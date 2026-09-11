/**
 * Custom hook for Web Speech API integration.
 * Continuously captures speech and converts it to text with robust error recovery,
 * interim speech preview, and smooth restart handling across Chrome and Edge.
 */
import { useState, useRef, useCallback, useEffect } from "react";

export interface SpeechRecognitionHook {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  error: string | null;
  lang: string;
  setLang: (lang: string) => void;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  injectTranscript: (text: string) => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export function useSpeechRecognition(initialLang: string = "hi-IN"): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLangState] = useState(initialLang);

  const langRef = useRef(initialLang);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");
  const shouldListenRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<any>(null);

  // Sync langRef with state
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  /** Change language and re-initialize if currently listening */
  const setLang = useCallback((newLang: string) => {
    setLangState(newLang);
    langRef.current = newLang;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = newLang;
      } catch {
        // Fallback: if browser doesn't permit hot-switching, restart
        if (shouldListenRef.current) {
          recognitionRef.current.stop();
        }
      }
    }
  }, []);

  /** Stop any existing recognition instance cleanly */
  const cleanupRecognition = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch {
        // Ignore errors during stop
      }
      recognitionRef.current = null;
    }
  }, []);

  /** Create and configure a fresh SpeechRecognition instance */
  const createAndStartRecognition = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      setIsListening(false);
      shouldListenRef.current = false;
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = langRef.current || "hi-IN";

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = "";
        let newFinal = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            newFinal += res[0].transcript + " ";
          } else {
            currentInterim += res[0].transcript;
          }
        }

        if (newFinal) {
          finalTranscriptRef.current = (finalTranscriptRef.current + " " + newFinal).trim();
        }

        setInterimTranscript(currentInterim.trim());
        const combined = (finalTranscriptRef.current + " " + currentInterim).trim();
        if (combined) {
          setTranscript(combined);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errType = event.error;

        // Normal pause in speaking or network tick - ignore and let auto-restart handle
        if (errType === "no-speech" || errType === "aborted") {
          return;
        }

        if (errType === "not-allowed" || errType === "service-not-allowed") {
          setError("Microphone access was denied. Please allow microphone permission in your browser URL bar.");
          shouldListenRef.current = false;
          setIsListening(false);
          return;
        }

        if (errType === "network") {
          // Web speech API transient network tick - don't crash UI
          return;
        }

        setError(`Speech recognition alert: ${errType}`);
      };

      recognition.onend = () => {
        setInterimTranscript("");
        // If user still wants to listen, gracefully restart recognition
        if (shouldListenRef.current) {
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (shouldListenRef.current) {
              createAndStartRecognition();
            }
          }, 180);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      if (shouldListenRef.current) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldListenRef.current) {
            createAndStartRecognition();
          }
        }, 300);
      }
    }
  }, []);

  /** Start listening for live speech */
  const startListening = useCallback(() => {
    setError(null);
    shouldListenRef.current = true;
    cleanupRecognition();
    createAndStartRecognition();
  }, [cleanupRecognition, createAndStartRecognition]);

  /** Stop listening cleanly */
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    cleanupRecognition();
    setIsListening(false);
    setInterimTranscript("");
  }, [cleanupRecognition]);

  /** Reset accumulated transcript */
  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
  }, []);

  /** Manually inject or append spoken text (e.g. for demo chips or quick buttons) */
  const injectTranscript = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    finalTranscriptRef.current = (finalTranscriptRef.current + " " + trimmed).trim();
    setTranscript(finalTranscriptRef.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      cleanupRecognition();
    };
  }, [cleanupRecognition]);

  return {
    transcript,
    interimTranscript,
    isListening,
    error,
    lang,
    setLang,
    startListening,
    stopListening,
    resetTranscript,
    injectTranscript,
  };
}
