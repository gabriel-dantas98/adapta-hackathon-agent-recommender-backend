import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});

// Helper function to format database timestamps
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toISOString();
};

// Helper function to handle database errors
export const handleDatabaseError = (error: any, operation: string) => {
  console.error(`Database error during ${operation}:`, error);

  if (error.code === "PGRST116") {
    throw new Error(`Resource not found during ${operation}`);
  }

  if (error.code === "PGRST204") {
    throw new Error(`No content returned during ${operation}`);
  }

  if (error.code === "23505") {
    throw new Error(`Duplicate record during ${operation}`);
  }

  if (error.code === "23503") {
    throw new Error(`Foreign key constraint violation during ${operation}`);
  }

  throw new Error(`Database operation failed: ${error.message || error}`);
};

// Helper function to execute similarity search
export const executeSimilaritySearch = async (
  tableName: string,
  embedding: number[],
  threshold: number = 0.7,
  limit: number = 10
) => {
  try {
    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      table_name: tableName,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    handleDatabaseError(error, "similarity search");
  }
};

export default supabase;
