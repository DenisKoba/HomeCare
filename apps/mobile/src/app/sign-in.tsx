import { Button, Host } from '@expo/ui';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/auth-context';
import { signInWithGoogle } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function SignInScreen() {
  const { session, isInitializing } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  if (!isInitializing && session) {
    return <Redirect href="/(tabs)/today" />;
  }

  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      Alert.alert(
        'Не вдалося увійти',
        error instanceof Error ? error.message : 'Спробуйте ще раз.',
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.screen}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={[styles.brandMark, { backgroundColor: colors.brandSurface }]}>
            <Text style={styles.brandLetter}>H</Text>
          </View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>HOMECARE</Text>
          <Text style={[styles.title, { color: colors.primaryText }]}>Дім, у якому легко</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Плануйте прибирання, розподіляйте справи та отримуйте нагадування саме тоді, коли вони
            потрібні.
          </Text>

          <View style={[styles.benefits, { backgroundColor: colors.secondarySurface }]}>
            <Benefit text="Усі кімнати й задачі в одному місці" colors={colors} />
            <Benefit text="Зручний план на день і календар" colors={colors} />
            <Benefit text="Дані синхронізуються між пристроями" colors={colors} />
          </View>
        </View>

        <View style={[styles.authCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.primaryText }]}>Почнімо</Text>
          <Text style={[styles.cardText, { color: colors.secondaryText }]}>
            Увійдіть, щоб зберігати свій профіль і дані дому.
          </Text>
          <Host style={styles.buttonHost}>
            <Button
              label={isSigningIn ? 'Вхід…' : 'Увійти через Google'}
              style={styles.googleButton}
              disabled={isSigningIn || !isSupabaseConfigured}
              onPress={() => void handleGoogleSignIn()}
            />
          </Host>
          <Text style={[styles.privacyText, { color: colors.tertiaryText }]}>
            Продовжуючи, ви дозволяєте HomeCare використовувати основні дані Google-профілю.
          </Text>
          {!isSupabaseConfigured ? (
            <Text style={styles.configurationError}>Supabase не налаштовано</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface Palette {
  background: string;
  card: string;
  secondarySurface: string;
  brandSurface: string;
  accent: string;
  primaryText: string;
  secondaryText: string;
  tertiaryText: string;
}

function Benefit({ text, colors }: { text: string; colors: Palette }) {
  return (
    <View style={styles.benefitRow}>
      <View style={[styles.checkmark, { backgroundColor: colors.accent }]}>
        <Text style={styles.checkmarkText}>✓</Text>
      </View>
      <Text style={[styles.benefitText, { color: colors.primaryText }]}>{text}</Text>
    </View>
  );
}

const lightColors: Palette = {
  background: '#F4F7FB',
  card: '#FFFFFF',
  secondarySurface: '#EAF3FF',
  brandSurface: '#0A84FF',
  accent: '#007AFF',
  primaryText: '#111318',
  secondaryText: '#5E6470',
  tertiaryText: '#8A9099',
};

const darkColors: Palette = {
  background: '#0D1016',
  card: '#191D25',
  secondarySurface: '#15253A',
  brandSurface: '#0A84FF',
  accent: '#0A84FF',
  primaryText: '#F7F8FA',
  secondaryText: '#B4BAC5',
  tertiaryText: '#858C98',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingTop: 48,
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  brandLetter: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 10,
  },
  title: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    marginTop: 14,
  },
  benefits: {
    borderRadius: 22,
    gap: 16,
    marginTop: 28,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  benefitText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '500',
  },
  authCard: {
    borderRadius: 26,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
  },
  buttonHost: {
    width: '100%',
    height: 54,
    marginTop: 18,
  },
  googleButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
  },
  privacyText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 12,
  },
  configurationError: {
    color: '#FF3B30',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
