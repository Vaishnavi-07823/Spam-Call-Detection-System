/**
 * Custom hook for Web Speech API integration.
 * Continuously captures speech and converts it to text.
 */
import { useState, useRef, useCallback, useEffect } from "react";

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  error: string | null;
  lang: string;
  setLang: (lang: string) => void;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

export function useSpeechRecognition(initialLang: string = "en-IN"): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLangState] = useState(initialLang);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");

  /** Change language and restart recognition if currently listening */
  const setLang = useCallback((newLang: string) => {
    setLangState(newLang);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = newLang;
      } catch {
        // Ignore
      }
    }
  }, []);

  /** Initialize the speech recognition instance */
  const getRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = lang;

    return recognition;
  }, [lang]);

  /** Start continuous speech recognition */
  const startListening = useCallback(async () => {
    setError(null);

    // Prompt for microphone permission if needed
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Microphone permission denied. Please allow microphone access in your browser bar.");
          return;
        }
      }
    }

    const recognition = getRecognition();
    if (!recognition) return;

    // Clean up previous instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }

    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res.isFinal) {
          final += res[0].transcript + " ";
        } else {
          interim += res[0].transcript + " ";
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
      }

      const combined = (finalTranscriptRef.current + interim).trim();
      if (combined) {
        setTranscript(combined);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        return; // Normal pause in speaking
      }
      if (event.error === "not-allowed") {
        setError("Microphone permission was denied. Please allow microphone in your browser URL bar.");
        setIsListening(false);
        return;
      }
      setError(`Speech error: ${event.error}`);
    };

    recognition.onend = () => {
      // Auto-restart if we are supposed to still be listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Already active
        }
      }
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      // Might already be active
      setIsListening(true);
    }
  }, [getRecognition]);

  /** Stop speech recognition */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  /** Reset accumulated transcript */
  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    setTranscript("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return {
    transcript,
    isListening,
    error,
    lang,
    setLang,
    startListening,
    stopListening,
    resetTranscript,
  };
}
