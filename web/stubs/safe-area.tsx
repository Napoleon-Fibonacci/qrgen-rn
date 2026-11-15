/**
 * Stub `react-native-safe-area-context` untuk pratinjau web.
 *
 * Di browser tidak ada notch atau navigation bar, jadi semua inset bernilai 0.
 * Stub ini juga mencegah Vite membaca implementasi native yang berisi Flow.
 */
import React, { createContext, useContext, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const zero: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const fullRect: Rect = { x: 0, y: 0, width: 0, height: 0 };

const SafeAreaInsetsContext = createContext<EdgeInsets>(zero);
const SafeAreaFrameContext = createContext<Rect>(fullRect);

export function SafeAreaProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function SafeAreaConsumer({ children }: { children: (insets: EdgeInsets) => ReactNode }) {
  return <>{children(useContext(SafeAreaInsetsContext))}</>;
}

export function useSafeAreaInsets(): EdgeInsets {
  return useContext(SafeAreaInsetsContext);
}

export function useSafeAreaFrame(): Rect {
  return useContext(SafeAreaFrameContext);
}

export function SafeAreaView({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return <View style={style}>{children}</View>;
}

export function SafeAreaProviderCompat({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export const initialWindowMetrics = { insets: zero, frame: fullRect };
