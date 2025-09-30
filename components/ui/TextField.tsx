import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, TextInputProps, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { Ionicons } from '@expo/vector-icons';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  type?: 'default' | 'password';
}

export function TextField({ label, type = 'default', ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View> 
      {label ? (
        <Text style={[typography.h3, styles.label, { color: colors.text }]}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          {...inputProps}
          placeholderTextColor={colors.secondaryText}
          style={[
            typography.bodyInput,
            styles.input,
            {
              color: colors.text,
            },
          ]}
          autoCapitalize='none'
          autoCorrect={false}
          secureTextEntry={type === 'password' && !showPassword}
          clearTextOnFocus={false}
        />
        {type === 'password' && (
          <Pressable onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: 16 }}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.text} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
  },
});

export default TextField;


