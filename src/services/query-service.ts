interface QueryResult<T> {
  data: T;
  error: Error | null;
}

interface NullableQueryResult<T> {
  data: T | null;
  error: Error | null;
}

export async function resolveQuery<T>(operation: PromiseLike<QueryResult<T>>) {
  const { data, error } = await operation;

  if (error) {
    throw error;
  }

  return data;
}

export async function resolveNullableQuery<T>(operation: PromiseLike<NullableQueryResult<T>>) {
  const { data, error } = await operation;

  if (error) {
    throw error;
  }

  return data;
}
