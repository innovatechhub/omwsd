interface MutationResult<T> {
  data: T;
  error: Error | null;
}

export async function resolveMutation<T>(operation: PromiseLike<MutationResult<T>>) {
  const { data, error } = await operation;

  if (error) {
    throw error;
  }

  return data;
}
