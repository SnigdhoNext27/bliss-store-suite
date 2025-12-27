import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'export' 
  | 'login' 
  | 'logout';

export type EntityType = 
  | 'product' 
  | 'order' 
  | 'customer' 
  | 'coupon' 
  | 'banner' 
  | 'hero_slide' 
  | 'category' 
  | 'settings';

interface AuditLogParams {
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function logAdminAction({ 
  action, 
  entityType, 
  entityId, 
  details 
}: AuditLogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Audit log: No authenticated user');
      return;
    }

    const { error } = await supabase
      .from('admin_audit_logs')
      .insert([{
        admin_id: user.id,
        admin_email: user.email || null,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: (details as Json) || null
      }]);

    if (error) {
      console.error('Failed to log admin action:', error);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}
