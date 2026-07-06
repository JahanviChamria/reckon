"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeedState, Prediction } from "./types";
import { todayKey } from "./feed";

const STORAGE_KEY = "orbit.feedstate.v1";

function freshState(dateKey: string, daysVisited: number): FeedState {
  return {
    dateKey,
    lastCardIndex: 0,
    predictions: [],
    daysVisited,
  };
}

function load(dateKey: string): FeedState {
  if (typeof window === "undefined") return freshState(dateKey, 1);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState(dateKey, 1);
    const prev = JSON.parse(raw) as FeedState;
    if (prev.dateKey !== dateKey) {
      // New day: fresh feed, bump the visit counter.
      return freshState(dateKey, (prev.daysVisited ?? 0) + 1);
    }
    return prev;
  } catch {
    return freshState(dateKey, 1);
  }
}

/**
 * Persisted per-day feed state: resume position, prediction log, day counter.
 * Resets automatically when the calendar day changes.
 */
export function useFeedState() {
  const dateKey = todayKey();
  const [state, setState] = useState<FeedState>(() => freshState(dateKey, 1));
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    setState(load(dateKey));
    setHydrated(true);
  }, [dateKey]);

  // Persist on every change once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode) — feed still works, just no resume.
    }
  }, [state, hydrated]);

  const setLastCardIndex = useCallback((index: number) => {
    setState((s) =>
      index > s.lastCardIndex ? { ...s, lastCardIndex: index } : s
    );
  }, []);

  const recordPrediction = useCallback((p: Prediction) => {
    setState((s) => {
      if (s.predictions.some((x) => x.cardId === p.cardId)) return s;
      return { ...s, predictions: [...s.predictions, p] };
    });
  }, []);

  return {
    state,
    hydrated,
    setLastCardIndex,
    recordPrediction,
  };
}
