import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { FontFamilies, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = TextInputProps;

/** Styled text input on the ElevenLabs surface (hairline border, 16px radius). */
export function TextField(props: TextFieldProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textTertiary}
      {...props}
      style={[
        styles.base,
        {
          backgroundColor: theme.surface,
          color: theme.text,
          borderColor: theme.border,
          fontFamily: FontFamilies.regular,
        },
        props.multiline && styles.multiline,
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
