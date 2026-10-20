import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { KnowledgeResource, FavoriteItem, ReportItem, ModerationLogItem, ReportReason } from '../types';

// Create a new knowledge resource
export async function createResource(
  data: Omit<KnowledgeResource, 'id' | 'viewsCount' | 'likesCount' | 'reportsCount' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
  const resourceId = 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const newResource: KnowledgeResource = {
    ...data,
    id: resourceId,
    status: 'published',
    viewsCount: 0,
    likesCount: 0,
    reportsCount: 0,
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'resources', resourceId), newResource);
    return resourceId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `resources/${resourceId}`);
  }
}

// Update an existing resource
export async function updateResource(
  id: string,
  data: Partial<KnowledgeResource>
): Promise<void> {
  const docRef = doc(db, 'resources', id);
  const updatePayload = {
    ...data,
    updatedAt: new Date().toISOString()
  };

  try {
    await updateDoc(docRef, updatePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `resources/${id}`);
  }
}

// Delete a resource
export async function deleteResource(id: string): Promise<void> {
  const docRef = doc(db, 'resources', id);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `resources/${id}`);
  }
}

// Increment view count
export async function incrementViewCount(id: string): Promise<void> {
  const docRef = doc(db, 'resources', id);
  try {
    await updateDoc(docRef, {
      viewsCount: increment(1)
    });
  } catch (err) {
    // Non-critical, ignore silent view failure
    console.debug('Failed to increment view:', err);
  }
}

// Favorites Management
export async function toggleFavorite(
  userId: string,
  resource: KnowledgeResource,
  isCurrentlyFavorite: boolean
): Promise<boolean> {
  const favoriteDocId = `${userId}_${resource.id}`;
  const favoriteRef = doc(db, 'favorites', favoriteDocId);
  const resourceRef = doc(db, 'resources', resource.id);

  if (isCurrentlyFavorite) {
    try {
      await deleteDoc(favoriteRef);
      await updateDoc(resourceRef, {
        likesCount: increment(-1)
      });
      return false;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `favorites/${favoriteDocId}`);
    }
  } else {
    const favoriteData: FavoriteItem = {
      id: favoriteDocId,
      userId,
      resourceId: resource.id,
      resourceTitle: resource.title,
      resourceCategory: resource.category,
      resourceMediaType: resource.mediaType,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(favoriteRef, favoriteData);
      await updateDoc(resourceRef, {
        likesCount: increment(1)
      });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `favorites/${favoriteDocId}`);
    }
  }
}

// Check if resource is favorited by user
export async function checkIsFavorite(userId: string, resourceId: string): Promise<boolean> {
  const favoriteDocId = `${userId}_${resourceId}`;
  try {
    const snap = await getDoc(doc(db, 'favorites', favoriteDocId));
    return snap.exists();
  } catch (err) {
    console.error('Error checking favorite:', err);
    return false;
  }
}

// Submit Report
export async function submitReport(
  resourceId: string,
  resourceTitle: string,
  reportedBy: string,
  reporterEmail: string,
  reason: ReportReason,
  details: string
): Promise<void> {
  const reportId = 'rep_' + Date.now();
  const reportData: ReportItem = {
    id: reportId,
    resourceId,
    resourceTitle,
    reportedBy,
    reporterEmail,
    reason,
    details,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'reports', reportId), reportData);
    await updateDoc(doc(db, 'resources', resourceId), {
      reportsCount: increment(1)
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `reports/${reportId}`);
  }
}

// Moderation Action (Resolve report, Hide/Delete resource, Log action)
export async function resolveReport(
  reportId: string,
  status: 'resolved' | 'dismissed',
  actionTaken: string,
  adminId: string,
  adminEmail: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      actionTaken,
      resolvedAt: new Date().toISOString(),
      resolvedBy: adminId
    });

    // Record moderation log
    const logId = 'log_' + Date.now();
    const logData: ModerationLogItem = {
      id: logId,
      adminId,
      adminEmail,
      action: `report_${status}`,
      targetType: 'report',
      targetId: reportId,
      details: `Report ${status}. Action: ${actionTaken}`,
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(db, 'moderationLogs', logId), logData);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
  }
}

// Log generic moderation action
export async function logModerationAction(
  adminId: string,
  adminEmail: string,
  action: string,
  targetType: 'resource' | 'user' | 'report' | 'settings',
  targetId: string,
  details: string
): Promise<void> {
  const logId = 'log_' + Date.now();
  const logData: ModerationLogItem = {
    id: logId,
    adminId,
    adminEmail,
    action,
    targetType,
    targetId,
    details,
    timestamp: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'moderationLogs', logId), logData);
  } catch (err) {
    console.error('Failed to write moderation log:', err);
  }
}

// Upload file to Firebase Storage
export async function uploadResourceFile(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `resources/${userId}/${Date.now()}_${safeFilename}`;
  const storageRef = ref(storage, path);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, storagePath: path });
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}
