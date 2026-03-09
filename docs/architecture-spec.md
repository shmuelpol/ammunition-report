# אפיון ארכיטקטורה — אחסון מידע, סנכרון וגישה לאפליקציה

> **סטטוס**: טרם מולא

## נושאים לכיסוי

### 1. אחסון מידע (Storage)
- IndexedDB — מודל נתונים, גרסאות סכמה, מיגרציות
- localStorage — preferences, מה נשמר ומתי
- `navigator.storage.persist()` — מתי מבקשים, fallback
- גיבוי אוטומטי — אסטרטגיה למניעת אובדן נתונים
- גודל אחסון צפוי ומגבלות דפדפן

### 2. סנכרון (Sync)
- מודל נוכחי: local-only, אין sync
- Import/Export JSON — פורמט, versioning, ולידציה
- Merge logic — טעינת דוח צוות לפלגה, פלגה לסוללה
- הכנה עתידית: storage interface מופשט, hooks ל-sync

### 3. גישה לאפליקציה (Access & Deployment)
- HTTPS — דרישה ל-PWA, hosting options
- Service Worker — אסטרטגיית cache, עדכון גרסאות, force-refresh
- PWA Install — manifest, install prompt, TWA לאנדרואיד
- Offline — מה עובד offline, מה לא

### 4. אבטחה ורגישות מידע
- הפרדה בין קטלוג לנתוני מבצע
- אין auth ב-MVP, הכנה עתידית
- צמצום תלות בשירותים חיצוניים
