const { BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

const printReceipt = (data) => {
  let win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const { items, total, method, storeName, storeAddress, storeContact, taxAmount, discount, isTaxIncluded = true, currencySymbol = 'Rs.' } = data;
  const dateStr = new Date().toLocaleString();
  const subtotal = items.reduce((acc, item) => acc + (item.sale_price * item.qty), 0);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 72mm; 
            margin: 0; 
            padding: 4mm; 
            font-size: 11px;
            color: #000;
            line-height: 1.4;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .header { margin-bottom: 4mm; border-bottom: 1px double #000; padding-bottom: 2mm; }
          .store-name { font-size: 18px; letter-spacing: 1px; display: block; }
          .store-info { font-size: 9px; display: block; }
          
          .divider { border-top: 1px dashed #000; margin: 2mm 0; }
          
          .item-table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
          .item-table th { border-bottom: 1px solid #000; text-align: left; font-size: 10px; }
          .item-table td { padding: 1mm 0; vertical-align: top; }
          
          .summary { margin-top: 2mm; width: 100%; }
          .summary-row { display: flex; justify-content: space-between; font-size: 11px; }
          
          .grand-total { 
            font-size: 15px; 
            border-top: 1px solid #000; 
            border-bottom: 1px double #000;
            padding: 1.5mm 0;
            margin: 2mm 0;
          }
          .tax-note { font-size: 8px; font-style: italic; margin-top: 1mm; display: block; }
          .footer { margin-top: 6mm; border-top: 1px dashed #000; padding-top: 2mm; }
          * { -webkit-print-color-adjust: exact; }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <span class="store-name bold">${(storeName || 'Saad Mirza').toUpperCase()}</span>
          <span class="store-info">${storeAddress || 'Main Street, City'}</span>
          <span class="store-info">Ph: ${storeContact || '000-0000000'}</span>
          <div style="margin-top: 2mm;">
             <span class="store-info">Date: ${dateStr}</span>
             <span class="store-info">Payment Method: ${method}</span>
          </div>
        </div>

        <table class="item-table">
          <thead>
            <tr>
              <th style="width: 50%;">ITEM</th>
              <th style="width: 15%; text-align: center;">QTY</th>
              <th style="width: 35%; text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name.toUpperCase()}</td>
                <td style="text-align: center;">${item.qty}</td>
                <td style="text-align: right;">${(item.sale_price * item.qty).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>${currencySymbol} ${subtotal.toLocaleString()}</span>
          </div>
          
          ${taxAmount > 0 ? `
          <div class="summary-row">
            <span>Tax (${isTaxIncluded ? 'Included' : 'Excluded'}):</span>
            <span>${isTaxIncluded ? '' : '+'} ${currencySymbol} ${taxAmount.toLocaleString()}</span>
          </div>
          ` : `
          <div class="summary-row">
            <span>Tax:</span>
            <span>${currencySymbol} 0.00</span>
          </div>
          `}
          
          ${discount > 0 ? `
          <div class="summary-row">
            <span>Discount:</span>
            <span>- ${currencySymbol} ${discount.toLocaleString()}</span>
          </div>
          ` : ''}
          
          <div class="summary-row grand-total bold">
            <span>NET TOTAL:</span>
            <span>${currencySymbol} ${total.toLocaleString()}</span>
          </div>
          
          <span class="tax-note text-right">
            ${taxAmount > 0 && isTaxIncluded ? '*Tax included in Total' : taxAmount > 0 ? '*Tax added to subtotal' : '*Tax is not included'}
          </span>
        </div>

        <div class="footer text-center">
          <p class="bold" style="margin: 0;">THANK YOU !!</p>
          <p style="margin: 0; font-size: 9px;">Software By Saad Mirza</p>
        </div>
      </body>
    </html>
  `;

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  win.webContents.on('did-finish-load', () => {
    setTimeout(async () => {
      // --- PRINTER LOGIC (Keep for later) ---
      /*
      win.webContents.print({ 
        silent: true, 
        printBackground: true,
        deviceName: data.selectedPrinter || '' 
      }, (success, failureReason) => {
        if (!success) console.error('Print failed:', failureReason);
        win.close();
      });
      */

      // --- SAVE AS PDF LOGIC ---
      try {
        const pdfData = await win.webContents.printToPDF({
          marginsType: 1, 
          pageSize: { width: 72000, height: 150000 }, 
          printBackground: true
        });

        const { filePath } = await dialog.showSaveDialog({
          title: 'Save Receipt',
          defaultPath: `INV-${Date.now()}.pdf`,
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
        });

        if (filePath) {
          fs.writeFileSync(filePath, pdfData);
          console.log('✅ PDF Generated');
        }
      } catch (err) {
        console.error('❌ PDF Error:', err);
      } finally {
        win.close();
      }
    }, 500);
  });
};

module.exports = { printReceipt };
