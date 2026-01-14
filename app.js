function assetApp() {
    return {
        assets: [],
        loading: false,
        searchTerm: '',
        totalAssets: 0,
        selectedFile: null,
        imagePreview: null,
        notification: {
            show: false,
            type: 'info',
            message: ''
        },
        
        form: {
            tanggal: new Date().toISOString().split('T')[0],
            nomorItem: '',
            namaItem: '',
            jenisItem: '',
            kondisi: '',
            bahan: '',
            gedung: '',
            ruang: '',
            rak: '',
            pencatat: '',
            keterangan: '',
            foto: ''
        },

        init() {
            this.loadAssets();
            this.generateNomorItem();
        },

        // Generate nomor item unik 6 digit
        generateNomorItem() {
            const timestamp = Date.now().toString().slice(-6);
            this.form.nomorItem = timestamp;
        },

        // Handle file selection
        handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                // Check file size (max 3MB)
                if (file.size > 3 * 1024 * 1024) {
                    this.showNotification('Ukuran file maksimal 3MB', 'error');
                    event.target.value = '';
                    return;
                }

                // Check file type
                if (!file.type.startsWith('image/')) {
                    this.showNotification('File harus berupa gambar', 'error');
                    event.target.value = '';
                    return;
                }

                this.selectedFile = file;
                
                // Create preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.imagePreview = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        },

        // Computed property for filtered assets
        get filteredAssets() {
            if (!this.searchTerm) return this.assets;
            
            const search = this.searchTerm.toLowerCase();
            return this.assets.filter(asset => 
                asset.namaItem?.toLowerCase().includes(search) ||
                asset.nomorItem?.toLowerCase().includes(search) ||
                asset.jenisItem?.toLowerCase().includes(search) ||
                asset.gedung?.toLowerCase().includes(search) ||
                asset.ruang?.toLowerCase().includes(search) ||
                asset.pencatat?.toLowerCase().includes(search)
            );
        },

        // Load all assets
        async loadAssets() {
            this.loading = true;
            try {
                const response = await fetch(`${SCRIPT_URL}?action=getAssets`);
                const data = await response.json();
                
                if (data.success) {
                    this.assets = data.assets || [];
                    this.totalAssets = this.assets.length;
                } else {
                    this.showNotification(data.message || 'Gagal memuat data', 'error');
                }
            } catch (error) {
                console.error('Error loading assets:', error);
                this.showNotification('Terjadi kesalahan saat memuat data', 'error');
            } finally {
                this.loading = false;
            }
        },

        // Submit new asset
        async submitAsset() {
            if (!this.validateForm()) {
                return;
            }

            this.loading = true;
            
            try {
                // Upload image first if exists
                if (this.selectedFile) {
                    const imageUrl = await this.uploadImage(this.selectedFile);
                    if (imageUrl) {
                        this.form.foto = imageUrl;
                    }
                }

                // Submit asset data
                const formData = new FormData();
                Object.keys(this.form).forEach(key => {
                    formData.append(key, this.form[key]);
                });

                const response = await fetch(`${SCRIPT_URL}?action=addAsset`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                
                if (data.success) {
                    this.showNotification('Aset berhasil disimpan!', 'success');
                    this.resetForm();
                    this.loadAssets();
                } else {
                    this.showNotification(data.message || 'Gagal menyimpan aset', 'error');
                }
            } catch (error) {
                console.error('Error submitting asset:', error);
                this.showNotification('Terjadi kesalahan saat menyimpan', 'error');
            } finally {
                this.loading = false;
            }
        },

        // Upload image to Google Drive via Apps Script
        async uploadImage(file) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('action', 'uploadImage');

                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                return data.success ? data.imageUrl : null;
            } catch (error) {
                console.error('Error uploading image:', error);
                return null;
            }
        },

        // Validate form
        validateForm() {
            const required = ['tanggal', 'nomorItem', 'namaItem', 'jenisItem', 'kondisi', 'bahan', 'gedung', 'ruang', 'pencatat'];
            
            for (let field of required) {
                if (!this.form[field]) {
                    this.showNotification(`Field ${field} harus diisi`, 'error');
                    return false;
                }
            }
            
            return true;
        },

        // Reset form
        resetForm() {
            this.form = {
                tanggal: new Date().toISOString().split('T')[0],
                nomorItem: '',
                namaItem: '',
                jenisItem: '',
                kondisi: '',
                bahan: '',
                gedung: '',
                ruang: '',
                rak: '',
                pencatat: '',
                keterangan: '',
                foto: ''
            };
            
            this.selectedFile = null;
            this.imagePreview = null;
            
            // Reset file input
            const fileInput = this.$refs.fileInput;
            if (fileInput) {
                fileInput.value = '';
            }
            
            this.generateNomorItem();
        },

        // Show notification
        showNotification(message, type = 'info') {
            this.notification = {
                show: true,
                type: type,
                message: message
            };
            
            // Auto hide after 3 seconds
            setTimeout(() => {
                this.notification.show = false;
            }, 3000);
        }
    };
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Mobile camera optimization
if ('serviceWorker' in navigator) {
    // Register service worker for PWA capabilities
    navigator.serviceWorker.register('/sw.js').catch(console.error);
}

// Prevent zoom on input focus (mobile)
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
        });
        
        input.addEventListener('blur', function() {
            document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
        });
    });
});
