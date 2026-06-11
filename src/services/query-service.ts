import { getErrorMessage } from "@/lib/error";

interface QueryResult<T> {
  data: T;
  error: unknown;
}

interface NullableQueryResult<T> {
  data: T | null;
  error: unknown;
}

export async function resolveQuery<T>(operation: PromiseLike<QueryResult<T>>) {
  const { data, error } = await operation;

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to load this data."));
  }

  return data;
}

export async function resolveNullableQuery<T>(operation: PromiseLike<NullableQueryResult<T>>) {
  const { data, error } = await operation;

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to load this data."));
  }

  return data;
}
