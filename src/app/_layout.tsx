import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthProvider, useAuth } from '@/auth';
import { TodoProvider, useTodos } from '@/todos';

export default function RootLayout() {
  return (
    <AuthProvider>
      <TodoProvider>
        <RootNavigator />
        <StatusBar style="dark" />
      </TodoProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const {
    user,
    isLoading: authLoading,
    sessionError,
    refreshUser,
  } = useAuth();
  const { isLoading: todosLoading } = useTodos();

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (sessionError && !user) {
    return (
      <View style={styles.sessionError}>
        <Text style={styles.sessionErrorTitle}>Unable to restore your session</Text>
        <Text style={styles.sessionErrorMessage}>{sessionError.message}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void refreshUser().catch(() => undefined);
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (todosLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isLoggedIn = user !== null;

  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: '#f1f5f9' } }}>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={isLoggedIn} redirectTo="/login">
        <Stack.Screen name="index" options={{ title: 'Todos' }} />
        <Stack.Screen name="todo/new" options={{ title: 'New todo', presentation: 'modal' }} />
        <Stack.Screen name="todo/[id]/index" options={{ title: 'Todo' }} />
        <Stack.Screen name="todo/[id]/edit" options={{ title: 'Edit todo' }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  sessionError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  sessionErrorTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  sessionErrorMessage: { color: '#64748b', textAlign: 'center' },
  retryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: { color: '#fff', fontWeight: '700' },
});
