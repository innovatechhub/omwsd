import { getErrorMessage } from "@/lib/error";

interface MutationResult<T> {
  data: T;
  error: unknown;
}

export async function resolveMutation<T>(operation: PromiseLike<MutationResult<T>>) {
  const { data, error } = await operation;

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to complete this action."));
  }

  return data;
}
