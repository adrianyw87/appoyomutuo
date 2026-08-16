import { getDataBackend, isMockMode } from '@/api/mock/enabled';
import { createMockClient } from '@/api/mock/client';
import { createSupabaseAppClient } from '@/api/supabase/client';

const backend = getDataBackend();

/** Cliente unificado (mock | supabase). Se mantiene el nombre `base44` por compatibilidad con imports existentes. */
export const base44 =
  backend === 'supabase' ? createSupabaseAppClient() : createMockClient();

export const appClient = base44;
export { isMockMode, getDataBackend };
