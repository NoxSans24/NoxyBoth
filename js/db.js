// IndexedDB Utility Module for NoxBooth

const DB_NAME = 'NoxBoothDB';
const STORE_NAME = 'photos';
const RESULT_STORE = 'result';
const DB_VERSION = 2;

let dbInstance = null;

function initDB() {
    if (dbInstance && !dbInstance.closed) {
        return Promise.resolve(dbInstance);
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(RESULT_STORE)) {
                db.createObjectStore(RESULT_STORE, { keyPath: 'id' });
            }
        };
    });
}

async function savePhotos(blobs) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Clear previous session photos first
        store.clear();

        blobs.forEach((blob, index) => {
            const record = {
                blob: blob,
                timestamp: new Date().toISOString(),
                filename: `photo-${index + 1}.png`,
                mimeType: blob.type || 'image/png'
            };
            store.add(record);
        });

        transaction.oncomplete = () => {
            resolve(true);
        };

        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function appendPhotos(newBlobs) {
    if (!Array.isArray(newBlobs)) {
        throw new Error('appendPhotos expects an array of blobs');
    }

    let db;
    try {
        db = await initDB();
    } catch (e) {
        throw new Error('appendPhotos failed: IndexedDB is unavailable (' + e.message + ')');
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Append to existing pool — do NOT clear prior records
        newBlobs.forEach((blob, index) => {
            const record = {
                blob: blob,
                timestamp: new Date().toISOString(),
                filename: `photo-${Date.now()}-${index + 1}.png`,
                mimeType: blob.type || 'image/png'
            };
            store.add(record);
        });

        transaction.oncomplete = () => {
            resolve(true);
        };

        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function getPhotos() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function clearPhotos() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Migrate legacy localStorage data if exists
async function migrateLocalStoragePhotos() {
    try {
        const legacyData = localStorage.getItem('noxbooth_photos');
        if (legacyData) {
            const dataUrls = JSON.parse(legacyData);
            if (Array.isArray(dataUrls) && dataUrls.length > 0) {
                const blobs = await Promise.all(dataUrls.map(async (dataUrl) => {
                    const res = await fetch(dataUrl);
                    return await res.blob();
                }));
                await savePhotos(blobs);
                localStorage.removeItem('noxbooth_photos');
                console.log('Successfully migrated legacy photos to IndexedDB');
            }
        }
    } catch (e) {
        console.warn('Migration from localStorage failed:', e);
    }
}

async function saveResult(dataUrl) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(RESULT_STORE, 'readwrite');
        const store = transaction.objectStore(RESULT_STORE);
        store.clear();
        store.add({ id: 'current', dataUrl: dataUrl, timestamp: new Date().toISOString() });
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = (event) => reject(event.target.error);
    });
}

async function getResult() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(RESULT_STORE, 'readonly');
        const store = transaction.objectStore(RESULT_STORE);
        const request = store.get('current');
        request.onsuccess = () => resolve(request.result ? request.result.dataUrl : null);
        request.onerror = (event) => reject(event.target.error);
    });
}

window.noxDB = {
    initDB,
    savePhotos,
    appendPhotos,
    getPhotos,
    clearPhotos,
    migrateLocalStoragePhotos,
    saveResult,
    getResult
};
