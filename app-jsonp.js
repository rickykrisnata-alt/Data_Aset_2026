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
            console.log('App initialized');
            this.loadAssets();
            this.generateNomorItem();
        },

        // Generate nomor item unik 6 digit
        generateNomorItem() {
            const timestamp = Date.now().toString().slice(-6);
            this.form.nomorItem = timestamp;
            console.log('Generated nomor item:', this.form.nomorItem);
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
                console.log('File selected:', file.name);
                
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

        // Load all assets dengan JSONP dan debugging
        loadAssets() {
            console.log('Loading assets...');
            this.loading = true;
            
            // Create unique callback name
            const callbackName = 'callback_' + Date.now();
            
            // Create script element for JSONP
            const script = document.createElement('script');
            script.src = `${SCRIPT_URL}?action=getAssets&callback=${callbackName}`;
            console.log('Loading from URL:', script.src);
            
            // Define callback function
            window[callbackName] = (data) => {
                console.log('Received data:', data);
                try {
                    if (data.success) {
                        this.assets = data.assets || [];
                        this.totalAssets = this.assets.length;
                        console.log('Assets loaded successfully:', this.assets.length);
                    } else {
                        console.error('Server error:', data.message);
                        this.showNotification(data.message || 'Gagal memuat data', 'error');
                    }
                } catch (error) {
                    console.error('Error processing data:', error);
                    this.showNotification('Terjadi kesalahan saat memproses data', 'error');
                } finally {
                    this.loading = false;
                    // Clean up
                    delete window[callbackName];
                    document.head.removeChild(script);
                }
            };
            
            // Handle error
            script.onerror = (error) => {
                console.error('JSONP request failed:', error);
                this.showNotification('Gagal terhubung ke server', 'error');
                this.loading = false;
                delete window[callbackName];
                document.head.removeChild(script);
            };
            
            // Add to DOM
            document.head.appendChild(script);
        },

        // Submit new asset dengan JSONP dan debugging
        submitAsset() {
            console.log('Submitting asset...');
            console.log('Form data:', this.form);
            
            if (!this.validateForm()) {
                return;
            }

            this.loading = true;
            
            // Skip image upload for now - focus on text data first
            this.submitAssetData();
        },

        // Submit asset data dengan JSONP dan proper parameter handling
        submitAssetData() {
            console.log('Submitting asset data...');
            
            const callbackName = 'callback_submit_' + Date.now();
            
            // Build URL with parameters properly
            const params = new URLSearchParams();
            params.append('action', 'addAsset');
            params.append('callback', callbackName);
            
            // Add form data
            Object.keys(this.form).forEach(key => {
                if (this.form[key]) {
                    params.append(key, this.form[key]);
                    console.log(`Adding parameter: ${key} = ${this.form[key]}`);
                }
            });
            
            const url = `${SCRIPT_URL}?${params.toString()}`;
            console.log('Submit URL:', url);
            
            // Create script element
            const script = document.createElement('script');
            script.src = url;
            
            // Define callback function
            window[callbackName] = (data) => {
                console.log('Submit response:', data);
                try {
                    if (data.success) {
                        this.showNotification('Aset berhasil disimpan!', 'success');
                        this.resetForm();
                        this.loadAssets();
                    } else {
                        console.error('Submit error:', data.message);
                        this.showNotification(data.message || 'Gagal menyimpan aset', 'error');
                    }
                } catch (error) {
                    console.error('Error processing submit:', error);
                    this.showNotification('Terjadi kesalahan saat menyimpan', 'error');
                } finally {
                    this.loading = false;
                    delete window[callbackName];
                    document.head.removeChild(script);
                }
            };
            
            // Handle error
            script.onerror = (error) => {
                console.error('JSONP submit failed:', error);
                this.showNotification('Gagal terhubung ke server', 'error');
                this.loading = false;
                delete window[callbackName];
                document.head.removeChild(script);
            };
            
            // Add to DOM
            document.head.appendChild(script);
        },

        // Validate form
        validateForm() {
            console.log('Validating form...');
            const required = ['tanggal', 'nomorItem', 'namaItem', 'jenisItem', 'kondisi', 'bahan', 'gedung', 'ruang', 'pencatat'];
            
            for (let field of required) {
                if (!this.form[field]) {
                    console.error('Missing required field:', field);
                    this.showNotification(`Field ${field} harus diisi`, 'error');
                    return false;
                }
            }
            
            console.log('Form validation passed');
            return true;
        },

        // Reset form
        resetForm() {
            console.log('Resetting form...');
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
            console.log('Notification:', message, type);
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

// Prevent zoom on input focus (mobile)
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
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
