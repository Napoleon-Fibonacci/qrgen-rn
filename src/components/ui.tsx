/**
 * Komponen kecil yang dipakai dua layar. Semua gaya turun dari `src/theme.ts`.
 */
import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Icon, type IconName } from './icons';
import { border, colors, minTouch, radius, shadow, space, type } from '../theme';

/** Animasi masuk sekali saat mount. Lewati kalau reduced motion aktif. */
export function useRise(distance = 14, duration = 550) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let alive = true;
    // Jaring pengaman: kalau animasi tidak pernah berjalan (misalnya di
    // pratinjau web), layar tetap muncul daripada tertinggal transparan.
    const reveal = () => {
      if (alive) {
        progress.setValue(1);
      }
    };
    const fallback = setTimeout(reveal, duration + 250);

    const run = () => {
      if (!alive) {
        return;
      }
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: Platform.OS !== 'web',
      }).start(reveal);
    };

    const motion = AccessibilityInfo.isReduceMotionEnabled;
    if (typeof motion === 'function') {
      Promise.resolve(motion())
        .then((reduce) => (reduce ? reveal() : run()))
        .catch(run);
    } else {
      run();
    }

    return () => {
      alive = false;
      clearTimeout(fallback);
    };
  }, [distance, duration, progress]);

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

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'mini' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: IconName;
  accessibilityLabel?: string;
  /** Huruf 12 px dengan padding lebih rapat, untuk tombol di dalam kartu. */
  compact?: boolean;
  /** Keadaan menyala, misalnya tombol senter. */
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  disabled,
  variant = 'secondary',
  icon,
  accessibilityLabel,
  compact,
  selected,
  style,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger' || variant === 'dangerOutline';
  const isGhost = variant === 'ghost';
  const isMini = variant === 'mini';

  const textColor = selected
    ? colors.ink
    : isPrimary
      ? '#ffffff'
      : isGhost
        ? colors.blue
        : isDanger
          ? colors.danger
          : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      android_ripple={{ color: 'rgba(26, 86, 176, 0.12)' }}
      style={({ pressed }) => [
        styles.button,
        isMini ? styles.buttonMini : null,
        compact ? styles.buttonCompact : null,
        isPrimary ? styles.buttonPrimary : null,
        variant === 'danger' ? styles.buttonDangerFilled : null,
        variant === 'dangerOutline' ? styles.buttonDangerOutline : null,
        isGhost ? styles.buttonGhost : null,
        selected ? styles.buttonSelected : null,
        pressed && !disabled ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={isMini || compact ? 16 : 18} color={textColor} /> : null}
      <Text
        style={[
          type.button,
          isMini || compact ? type.buttonMini : null,
          { color: textColor },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

interface IconButtonProps {
  name: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  size?: number;
}

/** Tombol ikon 44x44 supaya tetap nyaman disentuh. */
export function IconButton({ name, onPress, accessibilityLabel, color = colors.inkSoft, size = 20 }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: 'rgba(14, 28, 46, 0.08)', borderless: true }}
      style={({ pressed }) => [styles.iconButton, pressed ? styles.iconButtonPressed : null]}
    >
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}

export type PillTone = 'neutral' | 'outline' | 'primary' | 'signal' | 'danger';

const pillToneStyle: Record<PillTone, { backgroundColor: string; borderColor: string; color: string }> = {
  neutral: { backgroundColor: colors.band, borderColor: colors.band, color: colors.ink },
  outline: { backgroundColor: colors.card, borderColor: colors.rule, color: colors.inkSoft },
  primary: { backgroundColor: colors.blue, borderColor: colors.blue, color: '#ffffff' },
  signal: { backgroundColor: colors.signal, borderColor: colors.signal, color: colors.ink },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger, color: '#ffffff' },
};

interface PillProps {
  label: string;
  tone?: PillTone;
  icon?: IconName;
  /** `dense` untuk pil hitungan, `mini` untuk label tipe di riwayat. */
  size?: 'normal' | 'dense' | 'mini';
}

export function Pill({ label, tone = 'neutral', icon, size = 'normal' }: PillProps) {
  const palette = pillToneStyle[tone];
  return (
    <View
      style={[
        styles.pill,
        size === 'dense' ? styles.pillDense : null,
        size === 'mini' ? styles.pillMini : null,
        { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
      ]}
    >
      {icon ? <Icon name={icon} size={size === 'mini' ? 12 : 14} color={palette.color} /> : null}
      <Text style={[type.pill, size === 'mini' ? type.pillSmall : null, { color: palette.color }]}>
        {label}
      </Text>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  count?: string;
  right?: React.ReactNode;
  underline?: boolean;
}

/** Judul bagian dengan garis kuning dan isi tambahan di kanan. */
export function SectionHeader({ title, count, right, underline = true }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <View style={styles.sectionTitleRow}>
          <Text style={type.sectionTitle}>{title}</Text>
          {count ? <Pill label={count} tone="outline" size="dense" /> : null}
        </View>
        {underline ? <View style={styles.sectionUnderline} /> : null}
      </View>
      {right}
    </View>
  );
}

interface SegmentedProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  /** Warna latar wadah. Header memakai `paper`, tab tipe memakai `band`. */
  tone?: 'paper' | 'band';
  /** Tab tipe memakai huruf lebih kecil daripada navigasi utama. */
  compact?: boolean;
}

/** Segmented control dua atau empat bagian. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  tone = 'band',
  compact,
}: SegmentedProps<T>) {
  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: tone === 'paper' ? colors.paper : colors.band },
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
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
            <Text
              style={[
                compact ? type.buttonMini : type.button,
                styles.segmentText,
                active ? styles.segmentTextActive : null,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Dialog konfirmasi sederhana di atas layar. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard} accessibilityViewIsModal>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={styles.modalUnderline} />
          </View>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalActions}>
            <Button title={cancelLabel} onPress={onCancel} style={styles.modalButton} />
            <Button
              title={confirmLabel}
              variant="danger"
              onPress={onConfirm}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
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
      useNativeDriver: Platform.OS !== 'web',
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
    gap: space.s,
  },
  label: {
    ...type.label,
  },
  input: {
    ...type.input,
    backgroundColor: colors.card,
    borderWidth: border.line,
    borderColor: colors.rule,
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
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    minHeight: minTouch,
    paddingHorizontal: space.md,
    paddingVertical: 11,
    borderRadius: radius.button,
    borderWidth: border.line,
    borderColor: colors.rule,
    backgroundColor: colors.card,
  },
  buttonMini: {
    paddingVertical: space.s,
    paddingHorizontal: space.m,
  },
  buttonCompact: {
    paddingVertical: space.s,
    paddingHorizontal: space.md,
  },
  buttonSelected: {
    backgroundColor: colors.signal,
    borderColor: colors.signal,
  },
  buttonPrimary: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  buttonDangerFilled: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  buttonDangerOutline: {
    backgroundColor: colors.card,
    borderColor: colors.rule,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    paddingHorizontal: space.s,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  iconButton: {
    width: minTouch,
    height: minTouch,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: 'rgba(14, 28, 46, 0.06)',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.m,
    paddingVertical: 4,
  },
  pillDense: {
    paddingVertical: 2,
  },
  pillMini: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.md,
  },
  sectionLeft: {
    gap: space.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  sectionUnderline: {
    width: 48,
    height: border.titleUnderline,
    backgroundColor: colors.signal,
  },
  segmented: {
    flexDirection: 'row',
    gap: space.xs,
    padding: space.xs,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.button,
  },
  segment: {
    flex: 1,
    minHeight: minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
    borderRadius: radius.chip,
  },
  segmentActive: {
    backgroundColor: colors.blue,
  },
  segmentPressed: {
    backgroundColor: 'rgba(14, 28, 46, 0.06)',
  },
  segmentText: {
    color: colors.ink,
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 28, 46, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderWidth: border.line,
    borderColor: colors.rule,
    borderRadius: radius.card,
    padding: space.l,
    gap: space.l,
    ...shadow.card,
  },
  modalHead: {
    gap: space.xs,
  },
  modalTitle: {
    ...type.sectionTitle,
  },
  modalUnderline: {
    width: 48,
    height: border.titleUnderline,
    backgroundColor: colors.signal,
  },
  modalMessage: {
    ...type.body,
    color: colors.inkSoft,
  },
  modalActions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.xs,
  },
  modalButton: {
    flex: 1,
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
