import React, { useState, forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, TextInputProps, Pressable, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { Ionicons } from '@expo/vector-icons';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  type?: 'default' | 'password';
  error?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(({ label, type = 'default', error, ...inputProps }, ref) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const [showPassword, setShowPassword] = useState(false);

  const hasError = error && error.length > 0;

  return (
    <View> 
      {label ? (
        <Text style={[typography.h3, styles.label, { color: hasError ? colors.error : colors.text }]}>
          {label}
        </Text>
      ) : null}
      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor: colors.card, 
          borderColor: hasError ? colors.error : colors.border,
          borderWidth: hasError ? 2 : 1,
          paddingVertical: Platform.OS === 'android' ? 6 : 14,
        }
      ]}>
        <TextInput
          ref={ref}
          {...inputProps}
          placeholderTextColor={colors.secondaryText}
          style={[
            typography.bodyInput,
            styles.input,
            {
              color: colors.text,
              paddingVertical: 0,
            },
          ]}
          autoCapitalize='none'
          autoCorrect={false}
          secureTextEntry={type === 'password' && !showPassword}
          clearTextOnFocus={false}
          {...(Platform.OS === 'android' && { includeFontPadding: false })}
        />
        {type === 'password' && (
          <Pressable onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: 16 }}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.text} />
          </Pressable>
        )}
      </View>
      {hasError && (
        <Text style={[typography.body, styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default TextField;


