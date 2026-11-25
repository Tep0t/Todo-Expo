
import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from '@/auth';
import {
  DATABASE_ID,
  ID,
  Permission,
  Query,
  Role,
  TABLE_ID,
  tablesDB,
} from '../utils/appwrite';

export const STATUSES = ['todo', 'in_progress', 'done'] as const;
export type TodoStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<TodoStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const STATUS_COLORS: Record<TodoStatus, string> = {
  todo: '#64748b',
  in_progress: '#d97706',
  done: '#16a34a',
};

export type Todo = {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  createdAt: number;
};

export type TodoInput = Pick<Todo, 'title' | 'description' | 'status'>;

type TodoRow = {
  $id: string;
  $createdAt: string;
  title: string;
  description?: string | null;
  status: string;
  author: string;
};

function isTodoStatus(status: string): status is TodoStatus {
  return STATUSES.some((knownStatus) => knownStatus === status);
}

type TodoContextValue = {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  getTodo: (id: string) => Todo | undefined;
  createTodo: (input: TodoInput) => Promise<Todo>;
  updateTodo: (id: string, patch: Partial<TodoInput>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
};

const TodoContext = createContext<TodoContextValue | null>(null);

function toTodo(row: TodoRow): Todo {
  const status = row.status || 'todo';

  if (!isTodoStatus(status)) {
    throw new Error(`Unsupported todo status "${row.status}" in Appwrite.`);
  }

  return {
    id: row.$id,
    title: row.title ?? '',
    description: row.description ?? '',
    status,
    createdAt: Date.parse(row.$createdAt),
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Unable to load todos from Appwrite.';
}

export function TodoProvider({ children }: PropsWithChildren) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const userId = user?.$id ?? null;

  const [loadedData, setLoadedData] = useState<{
    userId: string;
    todos: Todo[];
    error: string | null;
  } | null>(null);

  const loadRequestId = useRef(0);

  useEffect(() => {
    if (isAuthLoading || !userId) return;

    const requestId = ++loadRequestId.current;

    const loadTodos = async () => {
      try {
        const result = await tablesDB.listRows({
          databaseId: DATABASE_ID,
          tableId: TABLE_ID,
          queries: [
            Query.equal('author', [userId]),
            Query.orderDesc('$createdAt'),
          ],
        });

        const loadedTodos = (result.rows as unknown as TodoRow[]).map(toTodo);

        if (requestId === loadRequestId.current) {
          setLoadedData({ userId, todos: loadedTodos, error: null });
        }
      } catch (loadError: unknown) {
        if (requestId === loadRequestId.current) {
          setLoadedData({
            userId,
            todos: [],
            error: getErrorMessage(loadError),
          });
        }
      }
    };

    void loadTodos();

    return () => {
      loadRequestId.current += 1;
    };
  }, [isAuthLoading, userId]);

  const currentData =
    userId && loadedData?.userId === userId ? loadedData : null;

  const todos = currentData?.todos ?? [];
  const error = currentData?.error ?? null;
  const isLoading =
    isAuthLoading || (userId !== null && currentData === null);

  const getTodo = (id: string) => todos.find((todo) => todo.id === id);

  const createTodo = async (input: TodoInput) => {
    if (!userId) throw new Error('Sign in before creating a todo.');

    const result = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      rowId: ID.unique(),
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        author: userId,
      },
      permissions: [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ],
    });

    const todo = toTodo(result as unknown as TodoRow);

    setLoadedData((previous) =>
      previous?.userId === userId
        ? { ...previous, todos: [todo, ...previous.todos] }
        : previous,
    );

    return todo;
  };

  const updateTodo = async (id: string, patch: Partial<TodoInput>) => {
    if (!userId) throw new Error('Sign in before updating a todo.');

    const result = await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      rowId: id,
      data: patch,
    });

    const updatedTodo = toTodo(result as unknown as TodoRow);

    setLoadedData((previous) =>
      previous?.userId === userId
        ? {
            ...previous,
            todos: previous.todos.map((todo) =>
              todo.id === id ? updatedTodo : todo,
            ),
          }
        : previous,
    );
  };

  const deleteTodo = async (id: string) => {
    if (!userId) throw new Error('Sign in before deleting a todo.');

    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      rowId: id,
    });

    setLoadedData((previous) =>
      previous?.userId === userId
        ? {
            ...previous,
            todos: previous.todos.filter((todo) => todo.id !== id),
          }
        : previous,
    );
  };

  return (
    <TodoContext
      value={{
        todos,
        isLoading,
        error,
        getTodo,
        createTodo,
        updateTodo,
        deleteTodo,
      }}
    >
      {children}
    </TodoContext>
  );
}

export function useTodos() {
  const ctx = use(TodoContext);
  if (!ctx) throw new Error('useTodos must be used inside <TodoProvider>');
  return ctx;
}
