class AssetAPI {
    constructor() {
        // Ganti dengan Web App URL BARU Anda
        this.scriptURL = 'https://script.google.com/macros/s/AKfycbxTqNj5X8s9X7w6vYk2Jm3n1oP7qR9sT2uV4wX6yZ8cF0dEg/exec';
        
        // PASTIKAN INI FALSE
        this.isDevelopment = false;
        
        // Tambahkan ini untuk CORS fix
        this.timeout = 30000; // 30 seconds timeout
    }

    // Fungsi request dengan CORS handling
    async makeRequest(action, data = null, method = 'GET') {
        if (this.isDevelopment) {
            return this.getMockResponse(action);
        }

        try {
            let url = `${this.scriptURL}?action=${action}`;
            let options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                muteHttpExceptions: true,
                timeout: this.timeout
            };

            if (data && method === 'POST') {
                options.body = JSON.stringify(data);
            } else if (data && method === 'GET') {
                Object.keys(data).forEach(key => {
                    url += `&${key}=${encodeURIComponent(data[key])}`;
                });
            }

            console.log('Making request to:', url);
            console.log('Request options:', options);

            // Add timestamp untuk cache busting
            url += `&_t=${Date.now()}`;

            const response = await fetch(url, {
                method: options.method,
                headers: options.headers,
                body: options.body
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('Response text:', responseText);
            
            if (!responseText) {
                throw new Error('Empty response from server');
            }

            const result = JSON.parse(responseText);
            console.log('Parsed result:', result);
            
            if (!result.success) {
                throw new Error(result.message || 'Server returned error');
            }

            return result;

        } catch (error) {
            console.error('API Request Error:', error);
            console.error('Error details:', {
                action: action,
                method: method,
                url: this.scriptURL,
                errorMessage: error.message
            });
            throw error;
        }
    }

    // Mock response handler
    getMockResponse(action) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const responses = {
                    generateNomor: {
                        success: true,
                        nomorItem: Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
                    },
                    saveAsset: {
                        success: true,
                        message: "Data aset berhasil disimpan (Demo Mode)",
                        nomorItem: "123456",
                        row: 2,
                        fotoUrl: ""
                    },
                    uploadPhoto: {
                        success: true,
                        fileId: "demo",
                        fileName: "demo.jpg",
                        fileUrl: "https://via.placeholder.com/300",
                        downloadUrl: "https://via.placeholder.com/300"
                    },
                    getRecent: {
                        success: true,
                        data: [],
                        total: 0
                    }
                };
                
                resolve(responses[action] || { success: false, message: "Mock not available" });
            }, 1000);
        });
    }

    // API Methods tetap sama...
    async generateNomorItem() {
        return this.makeRequest('generateNomor');
    }

    async uploadPhoto(base64Data, fileName, mimeType = 'image/jpeg') {
        return this.makeRequest('uploadPhoto', {
            base64Data: base64Data,
            fileName: fileName,
            mimeType: mimeType
        }, 'POST');
    }

    async saveAsset(assetData) {
        return this.makeRequest('saveAsset', assetData, 'POST');
    }

    async getRecentAssets(limit = 10) {
        return this.makeRequest('getRecent', { limit: limit });
    }

    // Utility functions tetap sama...
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

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
}

// Export
window.AssetAPI = AssetAPI;
