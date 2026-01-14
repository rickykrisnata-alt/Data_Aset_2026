// API Integration untuk Google Apps Script Backend
// Author: AI Assistant
// Description: JavaScript API client untuk berkomunikasi dengan Google Apps Script

class AssetAPI {
    constructor() {
        // Ganti dengan URL Google Apps Script Web App Anda
        this.scriptURL = 'https://script.google.com/macros/s/AKfycbxnyJmN5WYTfP9AJBHQzhU4MmTFs4xXFWSjsLQp6FFJXPr-ylNyKLNSSsTtijukarG1/exec';
        this.isDevelopment = true; // Set ke false saat production
        
        // Development mode endpoints (mock responses)
        this.mockResponses = {
            generateNomor: {
                success: true,
                nomorItem: Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
            },
            saveAsset: {
                success: true,
                message: "Data aset berhasil disimpan",
                nomorItem: "123456",
                row: 2,
                fotoUrl: "https://drive.google.com/file/d/example/view"
            },
            uploadPhoto: {
                success: true,
                fileId: "exampleFileId",
                fileName: "asset_photo.jpg",
                fileUrl: "https://drive.google.com/file/d/example/view",
                downloadUrl: "https://drive.google.com/uc?export=download&id=example"
            },
            getRecent: {
                success: true,
                data: [
                    {
                        no: 1,
                        tanggal: "2024-01-15",
                        nomorItem: "123456",
                        namaItem: "Laptop Dell",
                        jenisItem: "komputer",
                        kondisi: "baik",
                        bahan: "metal",
                        gedung: "gedung 1",
                        ruang: "ruang 1",
                        rak: "A1",
                        pencatat: "Ludiah Liling, S.Pd",
                        keterangan: "Laptop untuk guru",
                        foto: "https://via.placeholder.com/100"
                    }
                ],
                total: 1
            }
        };
    }

    // Fungsi untuk membuat request ke Google Apps Script
    async makeRequest(action, data = null, method = 'GET') {
        if (this.isDevelopment) {
            // Development mode - return mock responses
            return this.getMockResponse(action);
        }

        try {
            let url = `${this.scriptURL}?action=${action}`;
            let options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                muteHttpExceptions: true
            };

            if (data && method === 'POST') {
                options.body = JSON.stringify(data);
            } else if (data && method === 'GET') {
                // Add data as query parameters for GET requests
                Object.keys(data).forEach(key => {
                    url += `&${key}=${encodeURIComponent(data[key])}`;
                });
            }

            const response = await fetch(url, options);
            const responseText = await response.text();
            
            if (!responseText) {
                throw new Error('Empty response from server');
            }

            const result = JSON.parse(responseText);
            
            if (!result.success) {
                throw new Error(result.message || 'Unknown error occurred');
            }

            return result;

        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Mock response handler untuk development
    getMockResponse(action) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.mockResponses[action]) {
                    resolve({ ...this.mockResponses[action] });
                } else {
                    resolve({
                        success: false,
                        message: `Mock response not available for action: ${action}`
                    });
                }
            }, 500 + Math.random() * 1000); // Simulate network delay
        });
    }

    // API Methods

    // Generate nomor item unik
    async generateNomorItem() {
        return this.makeRequest('generateNomor');
    }

    // Upload foto ke Google Drive
    async uploadPhoto(base64Data, fileName, mimeType = 'image/jpeg') {
        return this.makeRequest('uploadPhoto', {
            base64Data: base64Data,
            fileName: fileName,
            mimeType: mimeType
        }, 'POST');
    }

    // Simpan data aset
    async saveAsset(assetData) {
        return this.makeRequest('saveAsset', assetData, 'POST');
    }

    // Get data aset terbaru
    async getRecentAssets(limit = 10) {
        return this.makeRequest('getRecent', { limit: limit });
    }

    // Cari data aset
    async searchAssets(query) {
        return this.makeRequest('search', { query: query });
    }

    // Get statistik aset
    async getAssetStats() {
        return this.makeRequest('getStats');
    }

    // Export data ke CSV
    async exportToCSV() {
        return this.makeRequest('exportCSV');
    }

    // Utility Functions

    // Convert file ke base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                // Remove data URL prefix
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // Compress image sebelum upload
    async compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Validasi form data
    validateAssetData(data) {
        const errors = [];

        if (!data.tanggal) errors.push('Tanggal wajib diisi');
        if (!data.namaItem) errors.push('Nama item wajib diisi');
        if (!data.jenisItem) errors.push('Jenis item wajib dipilih');
        if (!data.kondisi) errors.push('Kondisi wajib dipilih');
        if (!data.bahan) errors.push('Bahan wajib dipilih');
        if (!data.gedung) errors.push('Gedung wajib dipilih');
        if (!data.ruang) errors.push('Ruang wajib dipilih');
        if (!data.pencatat) errors.push('Pencatat wajib dipilih');

        return errors;
    }

    // Format tanggal untuk display
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Format ukuran file
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Export untuk digunakan di main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssetAPI;
} else {
    window.AssetAPI = AssetAPI;
}
