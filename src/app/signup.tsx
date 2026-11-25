import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/auth';
import { AppwriteException } from '../../utils/appwrite';

function getSignUpErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const type = error instanceof AppwriteException ? error.type.toLowerCase() : '';

  if (
    (error instanceof AppwriteException && error.code === 409) ||
    type.includes('already_exists') ||
    /already (registered|exists)/i.test(message)
  ) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (type.includes('invalid_email') || /invalid email/i.test(message)) {
    return 'Enter a valid email address.';
  }
  if (type.includes('password') || /password/i.test(message)) {
    return 'Your password does not meet the requirements. Use at least 8 characters and try again.';
  }
  return message || 'Unable to create your account. Please try again.';
}

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAndroid = Platform.OS === 'android';

  const clearMessages = () => setError(null);

  const submit = async () => {
    if (isSubmitting) return;

    const name = fullName.trim();
    const normalizedEmail = email.trim();

    if (!name || !normalizedEmail || !password || !confirmPassword) {
      setError('Complete all fields to create your account.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Your password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signUp(name, normalizedEmail, password);
    } catch (registrationError: unknown) {
      setError(getSignUpErrorMessage(registrationError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Sign up to get started with Todo App</Text>

          {isAndroid && <Text style={styles.androidLabel}>Full Name</Text>}
          <TextInput
            value={fullName}
            onChangeText={(value) => {
              setFullName(value);
              clearMessages();
            }}
            placeholder="Full Name"
            placeholderTextColor={isAndroid ? '#64748b' : undefined}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            style={isAndroid ? [styles.input, styles.androidInput] : styles.input}
            testID="full-name"
          />
          {isAndroid && <Text style={styles.androidLabel}>Email Address</Text>}
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              clearMessages();
            }}
            placeholder="Email Address"
            placeholderTextColor={isAndroid ? '#64748b' : undefined}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            style={isAndroid ? [styles.input, styles.androidInput] : styles.input}
            testID="signup-email"
          />
          {isAndroid && <Text style={styles.androidLabel}>Password</Text>}
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              clearMessages();
            }}
            placeholder="Password"
            placeholderTextColor={isAndroid ? '#64748b' : undefined}
            secureTextEntry={!showPasswords}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            style={isAndroid ? [styles.input, styles.androidInput] : styles.input}
            testID="signup-password"
          />
          {isAndroid && <Text style={styles.androidLabel}>Confirm Password</Text>}
          <TextInput
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              clearMessages();
            }}
            placeholder="Confirm Password"
            placeholderTextColor={isAndroid ? '#64748b' : undefined}
            secureTextEntry={!showPasswords}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={() => void submit()}
            style={isAndroid ? [styles.input, styles.androidInput] : styles.input}
            testID="confirm-password"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPasswords ? 'Hide passwords' : 'Show passwords'}
            onPress={() => setShowPasswords((visible) => !visible)}
            style={styles.visibilityButton}
          >
            <Text style={styles.visibilityText}>{showPasswords ? 'Hide password' : 'Show password'}</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => void submit()}
            disabled={isSubmitting}
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Text>
          </Pressable>

          <View style={styles.signinPrompt}>
            <Text style={styles.promptText}>Already have an account? </Text>
            <Link href="/login" style={styles.signinLink}>
              Sign in
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
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
  visibilityButton: { alignSelf: 'flex-end', paddingVertical: 2 },
  visibilityText: { color: '#2563eb', fontWeight: '600' },
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
  signinPrompt: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  promptText: { color: '#64748b', fontSize: 14 },
  signinLink: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});
