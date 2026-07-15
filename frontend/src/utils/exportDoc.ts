import type { Submission, FormFieldValue } from '../types';

export const exportSubmissionToDoc = (submission: Submission, fieldValues: FormFieldValue[]) => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    
    // Group fields by step
    const groupedSteps: Record<number, { step_name: string; values: FormFieldValue[] }> = {};
    fieldValues.forEach(fv => {
        const stepNum = fv.form_field.step_number || 1;
        const stepName = fv.form_field.step_name || 'Dokumen Persyaratan';
        if (!groupedSteps[stepNum]) {
            groupedSteps[stepNum] = { step_name: stepName, values: [] };
        }
        groupedSteps[stepNum].values.push(fv);
    });

    const sortedSteps = Object.keys(groupedSteps)
        .map(Number)
        .sort((a, b) => a - b)
        .map(stepNum => groupedSteps[stepNum]);

    // Build HTML Content
    let htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <title>Data Pengajuan - ${submission.client?.business_name || 'Halal'}</title>
        <style>
            body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333333; }
            h1 { font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 20px; color: #0f172a; }
            h2 { font-size: 14pt; font-weight: bold; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; color: #1e3a8a; }
            h3 { font-size: 12pt; font-weight: bold; color: #0284c7; margin-top: 20px; margin-bottom: 10px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #94a3b8; padding: 8px 12px; font-size: 10pt; text-align: left; vertical-align: top; }
            th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
            .info-table td { border: none; padding: 4px 8px; }
            .info-label { font-weight: bold; width: 180px; }
            .bullet-list { margin: 0; padding-left: 20px; }
            .image-thumb { max-width: 100px; max-height: 100px; object-fit: contain; }
        </style>
    </head>
    <body>
        <h1>LAPORAN DATA PENGAJUAN SERTIFIKASI HALAL</h1>
        
        <h2>A. INFORMASI PELANGGAN</h2>
        <table class="info-table">
            <tr>
                <td class="info-label">Nama Usaha / Bisnis</td>
                <td>: ${submission.client?.business_name || '-'}</td>
            </tr>
            <tr>
                <td class="info-label">Nama Pemilik</td>
                <td>: ${submission.client?.client_name || '-'}</td>
            </tr>
            <tr>
                <td class="info-label">Nomor Induk Berusaha (NIB)</td>
                <td>: ${submission.client?.nib || '-'}</td>
            </tr>
            <tr>
                <td class="info-label">Alamat Usaha</td>
                <td>: ${submission.client?.address || '-'}</td>
            </tr>
            <tr>
                <td class="info-label">Jenis Layanan</td>
                <td>: ${submission.service_type || '-'}</td>
            </tr>
            <tr>
                <td class="info-label">Status Pengajuan</td>
                <td>: ${submission.status || '-'}</td>
            </tr>
            <tr>
                <td class="info-label">Tanggal Pengajuan</td>
                <td>: ${submission.created_at ? new Date(submission.created_at).toLocaleDateString('id-ID') : '-'}</td>
            </tr>
        </table>

        <h2>B. DOKUMEN DAN DATA PERSYARATAN</h2>
    `;

    sortedSteps.forEach((step, stepIdx) => {
        htmlContent += `<h2>Step ${stepIdx + 1}: ${step.step_name}</h2>`;
        
        step.values.forEach(fv => {
            htmlContent += `<h3>${fv.form_field.field_label}</h3>`;
            
            const type = fv.form_field.input_type;
            const textVal = fv.text_value || '';

            if (type === 'FILE_UPLOAD') {
                if (fv.file_url) {
                    const fullUrl = fv.file_url.startsWith('http') ? fv.file_url : `${apiBase}${fv.file_url}`;
                    htmlContent += `<p>File Terlampir: <a href="${fullUrl}">${fv.file_url.split('/').pop()}</a></p>`;
                    if (fv.file_url.match(/\.(jpeg|jpg|gif|png)$/i)) {
                        htmlContent += `<p><img class="image-thumb" src="${fullUrl}" alt="Attachment" /></p>`;
                    }
                } else {
                    htmlContent += '<p class="italic text-gray-400">Belum diunggah</p>';
                }
            } else if (type === 'LINK') {
                if (fv.link_value) {
                    htmlContent += `<p>Link: <a href="${fv.link_value}">${fv.link_value}</a></p>`;
                } else {
                    htmlContent += '<p class="italic text-gray-400">Belum diisi</p>';
                }
            } else if (type === 'REPEATER') {
                try {
                    const items = JSON.parse(textVal);
                    if (Array.isArray(items) && items.length > 0) {
                        htmlContent += '<ul class="bullet-list">';
                        items.forEach((item: string) => {
                            if (item) htmlContent += `<li>${item}</li>`;
                        });
                        htmlContent += '</ul>';
                    } else {
                        htmlContent += '<p class="italic text-gray-400">Belum ada data</p>';
                    }
                } catch {
                    htmlContent += `<p>${textVal || '-'}</p>`;
                }
            } else if (type === 'PRODUCT_LIST') {
                try {
                    interface ProductItem {
                        nama: string;
                        foto_url: string;
                    }
                    const products: ProductItem[] = JSON.parse(textVal);
                    if (Array.isArray(products) && products.length > 0) {
                        htmlContent += `
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 50px; text-align: center;">No</th>
                                    <th>Nama Produk</th>
                                    <th style="width: 150px;">Foto Produk</th>
                                </tr>
                            </thead>
                            <tbody>
                        `;
                        products.forEach((p, idx) => {
                            const fotoFull = p.foto_url ? (p.foto_url.startsWith('http') ? p.foto_url : `${apiBase}${p.foto_url}`) : '';
                            htmlContent += `
                                <tr>
                                    <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                                    <td><strong>${p.nama}</strong></td>
                                    <td>
                                        ${fotoFull ? `<img class="image-thumb" src="${fotoFull}" width="100" height="100" />` : '-'}
                                    </td>
                                </tr>
                            `;
                        });
                        htmlContent += `
                            </tbody>
                        </table>
                        `;
                    } else {
                        htmlContent += '<p class="italic text-gray-400">Belum ada produk</p>';
                    }
                } catch {
                    htmlContent += '<p class="italic text-gray-400">Format data salah</p>';
                }
            } else if (type === 'INGREDIENT_LIST') {
                try {
                    interface IngredientItem {
                        nama: string;
                        produsen: string;
                        penerbit: string;
                        no_id: string;
                        tanggal: string;
                    }
                    const ingredients: IngredientItem[] = JSON.parse(textVal);
                    if (Array.isArray(ingredients) && ingredients.length > 0) {
                        htmlContent += `
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 40px; text-align: center;">No</th>
                                    <th>Nama Bahan & Merk</th>
                                    <th>Produsen</th>
                                    <th>Penerbit Sertifikat</th>
                                    <th>No ID SH</th>
                                    <th>Tanggal Terbit SH</th>
                                </tr>
                            </thead>
                            <tbody>
                        `;
                        ingredients.forEach((item, idx) => {
                            htmlContent += `
                                <tr>
                                    <td style="text-align: center;">${idx + 1}</td>
                                    <td><strong>${item.nama}</strong></td>
                                    <td>${item.produsen || '-'}</td>
                                    <td>${item.penerbit || '-'}</td>
                                    <td><code>${item.no_id || '-'}</code></td>
                                    <td>${item.tanggal || '-'}</td>
                                </tr>
                            `;
                        });
                        htmlContent += `
                            </tbody>
                        </table>
                        `;
                    } else {
                        htmlContent += '<p class="italic text-gray-400">Belum ada bahan</p>';
                    }
                } catch {
                    htmlContent += '<p class="italic text-gray-400">Format data salah</p>';
                }
            } else if (type === 'INGREDIENT_MATRIX') {
                try {
                    interface MatrixItem {
                        nama_produk: string;
                        bahan: string[];
                    }
                    const items: MatrixItem[] = JSON.parse(textVal);
                    if (Array.isArray(items) && items.length > 0) {
                        htmlContent += `
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 50px; text-align: center;">No</th>
                                    <th>Nama Produk</th>
                                    <th>Bahan Yang Digunakan</th>
                                </tr>
                            </thead>
                            <tbody>
                        `;
                        items.forEach((row, idx) => {
                            htmlContent += `
                                <tr>
                                    <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                                    <td><strong>${row.nama_produk}</strong></td>
                                    <td>
                                        <ul class="bullet-list">
                                            ${(row.bahan || []).map((b: string) => `<li>${b}</li>`).join('')}
                                            ${(row.bahan || []).length === 0 ? '<li>-</li>' : ''}
                                        </ul>
                                    </td>
                                </tr>
                            `;
                        });
                        htmlContent += `
                            </tbody>
                        </table>
                        `;
                    } else {
                        htmlContent += '<p class="italic text-gray-400">Belum ada data</p>';
                    }
                } catch {
                    htmlContent += '<p class="italic text-gray-400">Format data salah</p>';
                }
            } else if (type === 'ACTIVITY_PHOTOS') {
                try {
                    interface ActivityItem {
                        nama_kegiatan: string;
                        fotos: string[];
                    }
                    const items: ActivityItem[] = JSON.parse(textVal);
                    if (Array.isArray(items) && items.length > 0) {
                        htmlContent += `
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 50px; text-align: center;">No</th>
                                    <th>Nama Kegiatan</th>
                                    <th>Foto Kegiatan</th>
                                </tr>
                            </thead>
                            <tbody>
                        `;
                        items.forEach((row, idx) => {
                            htmlContent += `
                                <tr>
                                    <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                                    <td><strong>${row.nama_kegiatan}</strong></td>
                                    <td>
                                        ${(row.fotos || []).map((fUrl: string) => {
                                            const fFull = fUrl.startsWith('http') ? fUrl : `${apiBase}${fUrl}`;
                                            return `<img class="image-thumb" src="${fFull}" width="100" height="100" style="margin-right: 5px; margin-bottom: 5px;" />`;
                                        }).join('')}
                                        ${(row.fotos || []).length === 0 ? '-' : ''}
                                    </td>
                                </tr>
                            `;
                        });
                        htmlContent += `
                            </tbody>
                        </table>
                        `;
                    } else {
                        htmlContent += '<p class="italic text-gray-400">Belum ada data</p>';
                    }
                } catch {
                    htmlContent += '<p class="italic text-gray-400">Format data salah</p>';
                }
            } else if (type === 'HALAL_TEAM') {
                try {
                    interface HalalTeamItem {
                        nama: string;
                        jabatan: string;
                        posisi_tim: string;
                        ttd_url: string;
                    }
                    const items: HalalTeamItem[] = JSON.parse(textVal);
                    if (Array.isArray(items) && items.length > 0) {
                        htmlContent += `
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 50px; text-align: center;">No</th>
                                    <th>Nama Anggota</th>
                                    <th>Jabatan</th>
                                    <th>Posisi Di Tim</th>
                                    <th style="width: 120px;">Tanda Tangan</th>
                                </tr>
                            </thead>
                            <tbody>
                        `;
                        items.forEach((row, idx) => {
                            const ttdFull = row.ttd_url ? (row.ttd_url.startsWith('http') ? row.ttd_url : `${apiBase}${row.ttd_url}`) : '';
                            htmlContent += `
                                <tr>
                                    <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                                    <td><strong>${row.nama}</strong></td>
                                    <td>${row.jabatan || '-'}</td>
                                    <td>${row.posisi_tim || '-'}</td>
                                    <td>
                                        ${ttdFull ? `<img class="image-thumb" src="${ttdFull}" width="80" height="60" style="object-fit: contain;" />` : '-'}
                                    </td>
                                </tr>
                            `;
                        });
                        htmlContent += `
                            </tbody>
                        </table>
                        `;
                    } else {
                        htmlContent += '<p class="italic text-gray-400">Belum ada data</p>';
                    }
                } catch {
                    htmlContent += '<p class="italic text-gray-400">Format data salah</p>';
                }
            } else {
                htmlContent += `<p>${textVal || '-'}</p>`;
            }
        });
    });

    htmlContent += `
    </body>
    </html>
    `;

    // Download file
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Clean filename
    const filename = `${submission.client?.business_name || 'halal_submission'}_pengajuan.doc`
        .replace(/[^a-zA-Z0-9_\.-]/g, '_');
        
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
