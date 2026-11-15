/**
 * Komponen kecil yang dipakai dua layar. Semua gaya turun dari `src/theme.ts`.
 */
import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { border, colors, minTouch, radius, shadow, space, type } from '../theme';

/** Animasi masuk sekali saat mount. Lewati kalau reduced motion aktif. */
export function useRise(distance = 14, duration = 550) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (!alive) {
          return;
        }
        if (reduce) {
          progress.setValue(1);
          return;
        }
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }).start();
      })
      .catch(() => progress.setValue(1));

    return () => {
      alive = false;
    };
  }, [duration, progress]);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  };
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  warn?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Label + input + hint. Fokus input mengubah border jadi biru. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  warn,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'sentences',
  autoCorrect,
  multiline,
  numberOfLines,
  maxLength,
  trailing,
  style,
}: FieldProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkSoft}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          style={[
            styles.input,
            multiline ? styles.inputMultiline : null,
            focused ? styles.inputFocused : null,
            trailing ? styles.inputWithTrailing : null,
          ]}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {warn ? <Text style={styles.warn}>{warn}</Text> : null}
    </View>
  );
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'mini';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  disabled,
  variant = 'secondary',
  accessibilityLabel,
  style,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      android_ripple={{ color: 'rgba(26, 86, 176, 0.12)' }}
      style={({ pressed }) => [
        styles.button,
        variant === 'mini' ? styles.buttonMini : null,
        isPrimary ? styles.buttonPrimary : null,
        isDanger ? styles.buttonDanger : null,
        pressed && !disabled ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
        style,
      ]}
    >
      <Text
        style={[
          type.button,
          variant === 'mini' ? type.buttonMini : null,
          isDanger ? styles.buttonDangerText : null,
          !isPrimary && !isDanger && variant !== 'mini' ? styles.buttonTextOnCard : null,
          disabled ? styles.buttonDisabledText : null,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

interface SegmentedProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** Tab bar bergaya `.topnav` / `.tabs` web. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            android_ripple={{ color: 'rgba(26, 86, 176, 0.12)' }}
            style={({ pressed }) => [
              styles.segment,
              active ? styles.segmentActive : null,
              pressed && !active ? styles.segmentPressed : null,
            ]}
          >
            <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ToastProps {
  message: string | null;
}

/** Toast bawah, gaya `.toast` web. Hilang sendiri setelah 2.4 detik. */
export function Toast({ message }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: message ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [message, opacity]);

  if (!message) {
    return null;
  }

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: space.l,
  },
  label: {
    ...type.label,
    marginBottom: space.s,
  },
  input: {
    ...type.input,
    backgroundColor: colors.card,
    borderWidth: border.line,
    borderColor: colors.ruleStrong,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.m,
    minHeight: minTouch,
  },
  inputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 25,
  },
  inputFocused: {
    borderColor: colors.blue,
  },
  inputWithTrailing: {
    paddingRight: 108,
  },
  trailing: {
    position: 'absolute',
    right: space.s,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  hint: {
    ...type.hint,
    marginTop: space.s,
  },
  warn: {
    ...type.hint,
    fontSize: 13.5,
    color: colors.ink,
    backgroundColor: 'rgba(255, 210, 63, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(14, 28, 46, 0.18)',
    borderRadius: 7,
    paddingHorizontal: space.m,
    paddingVertical: space.sm,
    marginTop: space.sm,
    overflow: 'hidden',
  },
  button: {
    minHeight: minTouch,
    paddingHorizontal: space.md,
    paddingVertical: 11,
    borderRadius: radius.button,
    borderWidth: border.line,
    borderColor: colors.rule,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonMini: {
    minHeight: minTouch,
    paddingVertical: space.s,
    paddingHorizontal: space.m,
  },
  buttonPrimary: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  buttonDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonTextOnCard: {
    color: colors.ink,
  },
  buttonDangerText: {
    color: colors.danger,
  },
  buttonDisabledText: {
    opacity: 0.9,
  },
  segmented: {
    flexDirection: 'row',
    gap: space.xs,
    padding: space.xs,
    backgroundColor: colors.band,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.tabBar,
  },
  segment: {
    flex: 1,
    minHeight: minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.s,
    borderRadius: radius.chip,
  },
  segmentActive: {
    backgroundColor: colors.blue,
  },
  segmentPressed: {
    backgroundColor: 'rgba(14, 28, 46, 0.06)',
  },
  segmentText: {
    ...type.buttonMini,
    fontSize: 13,
    color: colors.inkSoft,
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    bottom: space.xxl,
    left: space.l,
    right: space.l,
    maxWidth: '90%',
    alignSelf: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.button,
    paddingHorizontal: space.ml,
    paddingVertical: space.md,
    ...shadow.card,
  },
  toastText: {
    fontFamily: type.body.fontFamily,
    fontSize: 14,
    color: '#ffffff',
  },
});
