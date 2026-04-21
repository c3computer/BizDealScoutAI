import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { AuditLog } from '../types';

export const auditService = {
  logAction: async (
    teamId: string, 
    action: AuditLog['action'], 
    dealId?: string, 
    dealName?: string, 
    metadata?: Record<string, any>
  ) => {
    if (!auth.currentUser) return;
    
    try {
      const logsRef = collection(db, 'audit_logs');
      await addDoc(logsRef, {
        teamId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email || 'Unknown User',
        action,
        dealId: dealId || null,
        dealName: dealName || null,
        timestamp: serverTimestamp(),
        metadata: metadata || null
      });
    } catch (e) {
      console.error('Failed to write audit log', e);
    }
  },

  getTeamLogs: async (teamId: string): Promise<AuditLog[]> => {
    try {
      const logsRef = collection(db, 'audit_logs');
      const q = query(
        logsRef, 
        where('teamId', '==', teamId), 
        orderBy('timestamp', 'desc')
      );
      
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
    } catch (e) {
      console.error('Failed to get team audit logs', e);
      return [];
    }
  }
};
