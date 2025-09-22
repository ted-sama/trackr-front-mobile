import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function TextField({ label, containerStyle, inputStyle, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View style={[styles.container, containerStyle]}> 
      {label ? (
        <Text style={[typography.h3, styles.label, { color: colors.text }]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.secondaryText}
        style={[
          styles.input,
          typography.body,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          },
          inputStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});

export default TextField;


