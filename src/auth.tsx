
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { AppwriteException, ID, account } from '../utils/appwrite';

export type AuthUser = {
  $id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  sessionError: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isUnauthenticated(error: unknown) {
  return error instanceof AppwriteException && error.code === 401;
}

function toError(error: unknown) {
  return error instanceof Error
    ? error
    : new Error('Unable to restore the Appwrite session.');
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<Error | null>(null);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await account.get();
      setUser({
        $id: currentUser.$id,
        name: currentUser.name,
        email: currentUser.email,
      });
      setSessionError(null);
    } catch (error: unknown) {
      if (isUnauthenticated(error)) {
        setUser(null);
        setSessionError(null);
        return;
      }

      const sessionError = toError(error);
      setSessionError(sessionError);
      throw sessionError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    account
      .get()
      .then((currentUser) => {
        if (!isActive) return;
        setUser({
          $id: currentUser.$id,
          name: currentUser.name,
          email: currentUser.email,
        });
        setSessionError(null);
      })
      .catch((error: unknown) => {
        if (!isActive || isUnauthenticated(error)) return;
        setSessionError(toError(error));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await account.createEmailPasswordSession({ email, password });
    await refreshUser();
  };

  const signUp = async (name: string, email: string, password: string) => {
    await account.create({
      userId: ID.unique(),
      name,
      email,
      password,
    });

    await account.createEmailPasswordSession({ email, password });
    await refreshUser();
  };

  const signOut = async () => {
    await account.deleteSession({ sessionId: 'current' });
    setUser(null);
    setSessionError(null);
  };

  return (
    <AuthContext
      value={{
        user,
        isLoading,
        sessionError,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

