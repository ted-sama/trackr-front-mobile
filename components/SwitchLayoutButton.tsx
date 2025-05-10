import { View, Text, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { LucideLayoutGrid, LucideList } from 'lucide-react-native';

interface SwitchLayoutButtonProps {
  onPress: () => void;
  currentView: 'grid' | 'list';
}

export default function SwitchLayoutButton({ onPress, currentView }: SwitchLayoutButtonProps) {
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();

  return (
    <Pressable onPress={onPress}>
      {currentView === 'list' ? (
        <LucideLayoutGrid size={22} color={colors.text} />
      ) : (
        <LucideList size={22} color={colors.text} />
      )}
    </Pressable>
  );
}
