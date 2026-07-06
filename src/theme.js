import { MD3LightTheme } from "react-native-paper";

export const appColors = {
  primary: "#2563EB",
  dark: "#1E40AF",
  light: "#DBEAFE",
  accent: "#3B82F6",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#1F2937",
  secondaryText: "#6B7280",
  white: "#FFFFFF",
};

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: appColors.primary,
    secondary: appColors.accent,
    background: appColors.background,
    surface: appColors.surface,
    onSurface: appColors.text,
    onBackground: appColors.text,
    text: appColors.text,
    placeholder: appColors.secondaryText,
    outline: appColors.light,
    surfaceVariant: appColors.light,
    primaryContainer: appColors.light,
    secondaryContainer: appColors.light,
    onPrimary: appColors.white,
  },
};
