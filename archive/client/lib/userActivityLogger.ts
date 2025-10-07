import { apiRequest } from "@/lib/queryClient";

// Utility for automatic user activity logging
export const logUserActivity = async (
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any
) => {
  try {
    await apiRequest("POST", "/api/user-activity-logs", {
      action,
      resourceType,
      resourceId,
      details
    });
  } catch (error) {
    console.warn("Failed to log user activity:", error);
    // Don't throw error to prevent breaking main functionality
  }
};

// Automatic CRUD logging helpers
export const logCRUDOperation = {
  created: (resourceType: string, resourceId: string, resourceName?: string, additionalDetails?: any) => 
    logUserActivity(`created_${resourceType}`, resourceType, resourceId, { 
      name: resourceName, 
      ...additionalDetails 
    }),
    
  updated: (resourceType: string, resourceId: string, changedFields?: string[], oldValues?: any, newValues?: any) => 
    logUserActivity(`updated_${resourceType}`, resourceType, resourceId, { 
      changedFields, 
      oldValues, 
      newValues 
    }),
    
  deleted: (resourceType: string, resourceId: string, resourceName?: string) => 
    logUserActivity(`deleted_${resourceType}`, resourceType, resourceId, { 
      name: resourceName 
    }),
    
  viewed: (resourceType: string, resourceId?: string, additionalDetails?: any) => 
    logUserActivity(`viewed_${resourceType}`, resourceType, resourceId, additionalDetails),
    
  exported: (resourceType: string, format: string, filters?: any) => 
    logUserActivity(`exported_${resourceType}`, resourceType, undefined, { 
      format, 
      filters 
    })
};

// Hook for enhanced mutation logging
export const useLoggedMutation = (originalMutation: any, resourceType: string) => {
  return {
    ...originalMutation,
    mutate: (data: any, options?: any) => {
      const originalOnSuccess = options?.onSuccess;
      
      return originalMutation.mutate(data, {
        ...options,
        onSuccess: (result: any, variables: any, context: any) => {
          // Auto-log successful CRUD operations
          if (result?.id) {
            logCRUDOperation.created(resourceType, result.id.toString(), result.name || result.title);
          }
          
          // Call original onSuccess if provided
          if (originalOnSuccess) {
            originalOnSuccess(result, variables, context);
          }
        }
      });
    }
  };
};