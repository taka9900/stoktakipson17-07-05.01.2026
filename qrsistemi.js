// ============================================
// QR KOD SİSTEMİ - AVANTAJ TEKNİK HIRDAVAT
// Bu dosyayı index.html ile aynı klasöre koyun
// ============================================

// Türkçe karakter dönüştürme
function toAsciiQR(text) {
    if (!text) return '';
    return text
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
}

// QR Kod URL'i oluştur
function generateQRUrl(product) {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
        pid: product.id,
        pn: product.name,
        pp: product.priceTL,
        pc: product.category || 'Genel'
    });
    return baseUrl + '?qr=' + btoa(unescape(encodeURIComponent(params.toString())));
}

// QR Parametresini Kontrol Et
function checkQRParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const qrParam = urlParams.get('qr');
    
    if (qrParam) {
        try {
            const decoded = decodeURIComponent(escape(atob(qrParam)));
            const params = new URLSearchParams(decoded);
            return {
                id: params.get('pid'),
                name: params.get('pn'),
                price: parseFloat(params.get('pp')),
                category: params.get('pc'),
                salePrice: parseFloat(params.get('pp')) * 1.5
            };
        } catch (e) {
            console.error('QR decode hatası:', e);
            return null;
        }
    }
    return null;
}

// QR Kod Oluştur (Container'a)
function renderQRCode(containerId, product) {
    setTimeout(() => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
            new QRCode(container, {
                text: generateQRUrl(product),
                width: 180,
                height: 180,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    }, 100);
}

// Tek Etiket Yazdır (60x40mm) - SADECE QR + ÜRÜN ADI
function printSingleLabel(product) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [60, 40] });
    
    const qrContainer = document.createElement('div');
    qrContainer.style.position = 'absolute';
    qrContainer.style.left = '-9999px';
    document.body.appendChild(qrContainer);
    
    new QRCode(qrContainer, {
        text: generateQRUrl(product),
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });
    
    setTimeout(() => {
        const canvas = qrContainer.querySelector('canvas');
        if (canvas) {
            const qrDataUrl = canvas.toDataURL('image/png');
            
            // QR kod sol tarafta büyük
            doc.addImage(qrDataUrl, 'PNG', 3, 3, 34, 34);
            
            // Ürün adı sağ tarafta
            const name = toAsciiQR(product.name);
            let fontSize = 9;
            if (name.length > 30) fontSize = 6;
            else if (name.length > 20) fontSize = 7;
            else if (name.length > 15) fontSize = 8;
            
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', 'bold');
            
            // Metni satırlara böl
            const lines = splitTextToLines(doc, name, 20);
            let y = 10;
            lines.slice(0, 4).forEach(line => {
                doc.text(line, 39, y);
                y += fontSize * 0.5;
            });
            
            // Ürün kodu
            doc.setFontSize(5);
            doc.setFont('helvetica', 'normal');
            doc.text('Kod: ' + product.id, 39, 36);
            
            doc.save('etiket_' + toAsciiQR(product.name).replace(/\s+/g, '_').substring(0, 20) + '.pdf');
        }
        document.body.removeChild(qrContainer);
    }, 200);
}

// Çoklu Etiket Yazdır (A4) - SADECE QR + ÜRÜN ADI
function printMultipleLabels(product, count) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    const cols = count > 30 ? 5 : 3;
    const rows = count > 30 ? 13 : 7;
    const labelWidth = count > 30 ? 38 : 63;
    const labelHeight = count > 30 ? 21 : 38;
    const marginX = count > 30 ? 5 : 7;
    const marginY = count > 30 ? 5 : 7;
    const qrSize = count > 30 ? 17 : 30;
    const maxWidth = count > 30 ? 16 : 28;
    const maxLines = count > 30 ? 3 : 5;
    let fontSize = count > 30 ? 5 : 7;
    
    const qrContainer = document.createElement('div');
    qrContainer.style.position = 'absolute';
    qrContainer.style.left = '-9999px';
    document.body.appendChild(qrContainer);
    
    new QRCode(qrContainer, {
        text: generateQRUrl(product),
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });
    
    setTimeout(() => {
        const canvas = qrContainer.querySelector('canvas');
        if (canvas) {
            const qrDataUrl = canvas.toDataURL('image/png');
            let labelNum = 0;
            
            for (let row = 0; row < rows && labelNum < count; row++) {
                for (let col = 0; col < cols && labelNum < count; col++) {
                    const x = marginX + (col * labelWidth);
                    const y = marginY + (row * labelHeight);
                    
                    // Kesim çizgisi
                    doc.setDrawColor(220);
                    doc.setLineWidth(0.1);
                    doc.rect(x, y, labelWidth, labelHeight);
                    
                    // QR kod
                    doc.addImage(qrDataUrl, 'PNG', x + 1, y + 1, qrSize, qrSize);
                    
                    // Ürün adı
                    const textX = x + qrSize + 2;
                    const name = toAsciiQR(product.name);
                    
                    if (name.length > 25) fontSize = count > 30 ? 4 : 6;
                    
                    doc.setFontSize(fontSize);
                    doc.setFont('helvetica', 'bold');
                    
                    const lines = splitTextToLines(doc, name, maxWidth);
                    let textY = y + 4;
                    lines.slice(0, maxLines).forEach(line => {
                        doc.text(line, textX, textY);
                        textY += fontSize * 0.6;
                    });
                    
                    labelNum++;
                }
            }
            doc.save('etiketler_' + toAsciiQR(product.name).replace(/\s+/g, '_').substring(0, 15) + '_' + count + 'adet.pdf');
        }
        document.body.removeChild(qrContainer);
    }, 200);
}

// Toplu Etiket Yazdır - Birden fazla ürün için
function printBulkLabels(products, countPerProduct) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    const cols = 3;
    const rows = 7;
    const labelWidth = 63;
    const labelHeight = 38;
    const marginX = 7;
    const marginY = 7;
    const labelsPerPage = cols * rows;
    
    let currentLabel = 0;
    
    // Her ürün için QR kod oluştur
    const qrPromises = products.map(product => {
        return new Promise((resolve) => {
            const qrContainer = document.createElement('div');
            qrContainer.style.position = 'absolute';
            qrContainer.style.left = '-9999px';
            document.body.appendChild(qrContainer);
            
            new QRCode(qrContainer, {
                text: generateQRUrl(product),
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
            
            setTimeout(() => {
                const canvas = qrContainer.querySelector('canvas');
                const qrDataUrl = canvas ? canvas.toDataURL('image/png') : null;
                document.body.removeChild(qrContainer);
                resolve({ product, qrDataUrl });
            }, 100);
        });
    });
    
    Promise.all(qrPromises).then(results => {
        results.forEach(({ product, qrDataUrl }) => {
            if (!qrDataUrl) return;
            
            for (let i = 0; i < countPerProduct; i++) {
                // Yeni sayfa
                if (currentLabel > 0 && currentLabel % labelsPerPage === 0) {
                    doc.addPage();
                }
                
                const labelOnPage = currentLabel % labelsPerPage;
                const row = Math.floor(labelOnPage / cols);
                const col = labelOnPage % cols;
                
                const x = marginX + (col * labelWidth);
                const y = marginY + (row * labelHeight);
                
                // Kesim çizgisi
                doc.setDrawColor(220);
                doc.setLineWidth(0.1);
                doc.rect(x, y, labelWidth, labelHeight);
                
                // QR kod
                doc.addImage(qrDataUrl, 'PNG', x + 1, y + 1, 30, 30);
                
                // Ürün adı
                const textX = x + 33;
                const name = toAsciiQR(product.name);
                let fontSize = name.length > 25 ? 6 : 7;
                
                doc.setFontSize(fontSize);
                doc.setFont('helvetica', 'bold');
                
                const lines = splitTextToLines(doc, name, 28);
                let textY = y + 6;
                lines.slice(0, 5).forEach(line => {
                    doc.text(line, textX, textY);
                    textY += fontSize * 0.6;
                });
                
                currentLabel++;
            }
        });
        
        const totalLabels = products.length * countPerProduct;
        doc.save('toplu_etiketler_' + products.length + 'urun_' + totalLabels + 'adet.pdf');
        alert('✅ ' + products.length + ' ürün için toplam ' + totalLabels + ' etiket oluşturuldu!');
    });
}

// Yardımcı: Metni satırlara böl
function splitTextToLines(doc, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (doc.getTextWidth(testLine) > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    if (currentLine) lines.push(currentLine);
    
    return lines;
}

// Export for use
window.QRSystem = {
    toAscii: toAsciiQR,
    generateUrl: generateQRUrl,
    checkParameter: checkQRParameter,
    renderCode: renderQRCode,
    printSingle: printSingleLabel,
    printMultiple: printMultipleLabels,
    printBulk: printBulkLabels
};

console.log('✅ QR Sistem yüklendi');
