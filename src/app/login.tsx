import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/auth';
import { AppwriteException } from '../../utils/appwrite';

function getSignInErrorMessage(error: unknown) {
  if (
    error instanceof AppwriteException &&
    (error.code === 401 || error.type === 'user_invalid_credentials')
  ) {
    return 'Invalid email address or password.';
  }

  return error instanceof Error
    ? error.message
    : 'Unable to sign in. Please try again.';
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAndroid = Platform.OS === 'android';

  const submit = async () => {
    if (isSubmitting) return;
    if (!email.trim() || !password) {
      setError('Enter your email address and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
    } catch (signInError: unknown) {
      setError(getSignInErrorMessage(signInError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Todo App</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {isAndroid && <Text style={styles.androidLabel}>Email Address</Text>}
        <TextInput
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setError(null);
          }}
          placeholder="Email address"
          placeholderTextColor={isAndroid ? '#64748b' : undefined}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={isAndroid ? [styles.input, styles.androidInput] : styles.input}
          testID="email"
        />
        {isAndroid && <Text style={styles.androidLabel}>Password</Text>}
        <TextInput
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setError(null);
          }}
          placeholder="Password"
          placeholderTextColor={isAndroid ? '#64748b' : undefined}
          secureTextEntry
          onSubmitEditing={() => void submit()}
          style={isAndroid ? [styles.input, styles.androidInput] : styles.input}
          testID="password"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          onPress={() => void submit()}
          disabled={isSubmitting}
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>{isSubmitting ? 'Signing in...' : 'Sign in'}</Text>
        </Pressable>

        <View style={styles.signupPrompt}>
          <Text style={styles.hint}>New here? </Text>
          <Link href="/signup" style={styles.signupLink}>
            Create an account
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f1f5f9' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    gap: 12,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { color: '#64748b', marginBottom: 8 },
  androidLabel: { color: '#334155', fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  androidInput: { color: '#0f172a', backgroundColor: '#fff' },
  error: { color: '#dc2626' },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  signupPrompt: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  hint: { color: '#64748b', fontSize: 14 },
  signupLink: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});
