import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors } from '../constants/theme';
import { Alert, Platform } from 'react-native';
import { formatDate } from '../utils/dateUtils';

export const normalizeItems = (orderData: any) => {
  if (orderData.outfits && orderData.outfits.length > 0) {
    return orderData.outfits.map((it: any) => ({
      name: it.type || 'Custom Outfit',
      qty: it.qty || 1,
      rate: it.totalCost / (it.qty || 1),
      amount: it.totalCost,
      description: it.notes || '',
      measurements: it.measurements,
      type: it.type,
      notes: it.notes,
      quantity: it.qty || 1,
      images: it.images || [],
      sketches: it.sketches || [], // Add sketches support
      audioUri: it.audioUri || it.voiceNote,
      transcription: it.transcription,
      fabricSource: it.fabricSource || it.fabric_source || ''
    }));
  }
  return (orderData.items || []).map((it: any) => ({
    ...it,
    qty: it.qty || it.quantity || 1,
    quantity: it.qty || it.quantity || 1,
    name: it.name || it.type || 'Item',
    amount: it.amount || it.totalCost || 0,
    rate: it.rate !== undefined ? it.rate : (it.totalCost ? (it.totalCost / (it.qty || it.quantity || 1)) : 0),
    images: it.images || [],
    sketches: it.sketches || [], // Add sketches support
    fabricSource: it.fabricSource || it.fabric_source || ''
  }));
};

const COMMON_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  body { font-family: 'Inter', sans-serif; padding: 25px; color: #1F2937; background-color: white; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; margin-bottom: 15px; }
  .company-logo { width: 50px; height: 50px; background-color: #0E9F8A; color: white; border-radius: 8px; display: flex; justify-content: center; align-items: center; text-align: center; vertical-align: middle; line-height: 50px; font-weight: 700; font-size: 20px; margin-bottom: 5px; overflow: hidden; }
  .company-name { font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; color: #0E9F8A; }
  .company-details { font-size: 11px; color: #6B7280; line-height: 1.3; max-width: 300px; }
  .document-label { background-color: #F3F4F6; padding: 6px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #374151; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
  .info-group { flex: 1; }
  .info-label { font-size: 10px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .info-value { font-size: 13px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background-color: #F9FAFB; text-align: left; padding: 8px; font-size: 10px; color: #6B7280; border-bottom: 1px solid #E5E7EB; text-transform: uppercase; }
  td { padding: 8px; font-size: 12px; border-bottom: 1px solid #F3F4F6; }
  .footer { display: flex; justify-content: space-between; margin-top: 20px; border-top: 1px solid #E5E7EB; padding-top: 15px; }
  .terms { font-size: 9px; color: #9CA3AF; max-width: 300px; }
  .signature-area { text-align: right; }
  .signature-text { font-size: 10px; color: #6B7280; margin-top: 8px; }
`;

const getBaseHeader = (companyData: any, label: string) => {
  const boutiqueName = companyData.name || 'My Boutique';
  const logoHtml = boutiqueName.substring(0, 2).toUpperCase();
  return `
    <div class="header">
      <div>
        <div class="company-logo">${logoHtml}</div>
        <h1 class="company-name">${boutiqueName}</h1>
        <div class="company-details">
          ${companyData.address}<br/>
          Phone: ${companyData.phone}<br/>
          ${companyData.gstin ? `GSTIN: ${companyData.gstin}` : ''}
        </div>
      </div>
      <div style="text-align: right;">
        <div class="document-label">${label}</div>
      </div>
    </div>
  `;
};

export const generateInvoicePDF = async (orderData: any, companyData: any) => {
  console.log('[PDF] Request received to generate invoice for:', orderData.billNo);

  const boutiqueName = companyData.name || 'My Boutique';

  // Always use initials (first 2 letters of business name)
  const logoHtml = boutiqueName.substring(0, 2).toUpperCase();
  const isInitials = true;

  export const getInvoiceHTML = (orderData: any, companyData: any) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          ${COMMON_STYLES}
        </style>
      </head>
      <body>
        ${getBaseHeader(companyData, 'Invoice')}

        <div class="info-row" style="background-color: #F9FAFB; padding: 10px; border-radius: 8px;">
          <div style="width: 33%;">
            <div class="info-label">Order No</div>
            <div class="info-value">#${orderData.billNo}</div>
          </div>
          <div style="width: 33%; text-align: center;">
            <div class="info-label">Order Date</div>
            <div class="info-value">${formatDate(orderData.date)}</div>
          </div>
          <div style="width: 33%; text-align: right;">
            <div class="info-label">Delivery Date</div>
            <div class="info-value">${orderData.deliveryDate ? formatDate(orderData.deliveryDate) : 'TBD'}</div>
          </div>
        </div>

        <div class="info-row" style="margin-bottom: 25px;">
          <div style="width: 40%;">
            <div class="info-label">Customer Details</div>
            <div class="info-value" style="font-size: 14px;">${orderData.customerName}</div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">ID: #${orderData.customerDisplayId || '---'}</div>
          </div>
          <div style="width: 60%; text-align: right;">
            <div class="info-label">Contact & Address</div>
            <div class="info-value">${orderData.customerMobile}</div>
            ${orderData.customerLocation ? `<div style="font-size: 11px; color: #6B7280; margin-top: 2px;">${orderData.customerLocation}</div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">S.No</th>
              <th>Description</th>
              <th style="text-align: center; width: 60px;">Qty</th>
              <th style="text-align: right; width: 100px;">Rate</th>
              <th style="text-align: right; width: 100px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${normalizeItems(orderData).map((item: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}
                ${item.description ? `<br/><span style="font-size: 10px; color: #6B7280;">${item.description}</span>` : ''}
                </td>
                <td style="text-align: center;">${item.qty}</td>
                <td style="text-align: right;">₹${(parseFloat(item.rate) || 0).toFixed(2)}</td>
                <td style="text-align: right;">₹${(parseFloat(item.amount) || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 200px;">
            <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
              <span>Subtotal</span>
              <span>₹${(parseFloat(orderData.total) || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
              <span>Advance</span>
              <span>₹${(parseFloat(orderData.advance) || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row" style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 2px solid #0E9F8A; font-weight: 700; font-size: 16px; color: #0E9F8A;">
              <span>BALANCE</span>
              <span>₹${(parseFloat(orderData.balance) || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="terms">
            <strong>TERMS & CONDITIONS</strong><br/>
            No Refund / No Exchange / No Cancellation<br/>
            E & O.E.
          </div>
          <div class="signature-area">
            <div style="height: 40px;"></div>
            <div class="signature-text">For ${companyData.name}</div>
          </div>
        </div>
      </body>
    </html>
  `;
  };

  export const generateInvoicePDF = async (orderData: any, companyData: any) => {
    console.log('[PDF] Request received to generate invoice for:', orderData.billNo);
    const htmlContent = getInvoiceHTML(orderData, companyData);

    try {
      console.log('[PDF] Generation started');
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // Construct filename
      const safeCustomerName = (orderData.customerName || 'Customer').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const safeBillNo = orderData.billNo ? orderData.billNo.replace(/[^a-z0-9]/gi, '_') : 'Draft';
      const filename = `Bill_${safeBillNo}_${safeCustomerName}.pdf`;

      // Attempt rename by using the same directory as the generated file
      // This is more robust than relying on FileSystem.cacheDirectory which returns null on some Android configs
      let finalUri = uri;

      // Extract directory from original URI
      const dir = uri.substring(0, uri.lastIndexOf('/') + 1);

      if (dir) {
        const newUri = `${dir}${filename}`;
        try {
          // Use moveAsync from modern import
          await FileSystem.moveAsync({
            from: uri,
            to: newUri
          });
          console.log('[PDF] Renamed to:', newUri);
          finalUri = newUri;
        } catch (renameErr) {
          console.warn('[PDF] Rename failed, using original:', renameErr);
          // Fallback to original URI if move fails
        }
      } else {
        console.warn('[PDF] Could not determine directory from URI:', uri);
      }

      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(finalUri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Invoice #${orderData.billNo}`
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device');
      }
    } catch (error: any) {
      console.error('[PDF] Error generating PDF:', error);
      Alert.alert('PDF Error', error.message || 'Failed to generate PDF');
      // Rethrow to let caller know
      throw error;
    }
  };

  export const generateTailorCopyPDF = async (orderData: any, companyData: any) => {
    console.log('[PDF] Generating Tailor Copy for:', orderData.billNo);

    // Pre-process items to convert images to Base64
    const rawItems = normalizeItems(orderData);
    const processedItems = await Promise.all(rawItems.map(async (item: any) => {
      if (item.images && item.images.length > 0) {
        const base64Images = await Promise.all(item.images.map(async (imgUri: string) => {
          try {
            if (imgUri.startsWith('file://')) {
              const base64 = await FileSystem.readAsStringAsync(imgUri, { encoding: FileSystem.EncodingType.Base64 });
              return `data:image/jpeg;base64,${base64}`;
            }
            return imgUri;
          } catch (e) {
            console.log('Error converting image to base64:', e);
            return null;
          }
        }));
        item.images = base64Images.filter(Boolean);
      }

      if (item.sketches && item.sketches.length > 0) {
        const base64Sketches = await Promise.all(item.sketches.map(async (sketchUri: string) => {
          try {
            if (sketchUri.startsWith('file://')) {
              const base64 = await FileSystem.readAsStringAsync(sketchUri, { encoding: FileSystem.EncodingType.Base64 });
              return `data:image/png;base64,${base64}`;
            }
            return sketchUri;
          } catch (e) {
            console.log('Error converting sketch to base64:', e);
            return null;
          }
        }));
        item.sketches = base64Sketches.filter(Boolean);
      }
      return item;
    }));

    const boutiqueName = companyData.name || 'My Boutique';
    const logoHtml = boutiqueName.substring(0, 2).toUpperCase();

    export const getTailorCopyHTML = (orderData: any, companyData: any, processedItems: any[]) => {
      return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          ${COMMON_STYLES}
          .item-card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 15px; margin-bottom: 15px; }
          .item-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F3F4F6; padding-bottom: 8px; margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid; }
          .item-title { font-size: 16px; font-weight: 700; color: #111827; }
          .item-qty { background: #E0E7FF; color: #4338CA; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
          .measurement-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid; }
          .measurement-item { border-left: 2px solid #0E9F8A; padding-left: 8px; }
          .measurement-label { font-size: 9px; color: #6B7280; text-transform: capitalize; }
          .measurement-value { font-size: 13px; font-weight: 600; }
          .notes-box { background: #FFFBEB; border: 1px solid #FEF3C7; padding: 10px; border-radius: 8px; margin-top: 10px; page-break-inside: avoid; break-inside: avoid; }
          .notes-label { font-size: 10px; font-weight: 700; color: #92400E; margin-bottom: 2px; text-transform: uppercase; }
          .notes-text { font-size: 12px; color: #78350F; line-height: 1.4; }
          .item-images { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
          .item-image { width: 45%; height: auto; object-fit: contain; border-radius: 6px; border: 1px solid #E5E7EB; background-color: #F9FAFB; }
        </style>
      </head>
      <body>
        ${getBaseHeader(companyData, 'Tailor Copy')}

        <div class="info-row">
          <div class="info-group">
            <div class="info-label">Order No</div>
            <div class="info-value">#${orderData.billNo}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Order Date</div>
            <div class="info-value">${formatDate(orderData.date || orderData.createdAt || new Date())}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Delivery Date</div>
            <div class="info-value" style="color: #DC2626;">${orderData.deliveryDate ? formatDate(orderData.deliveryDate) : 'TBD'}</div>
          </div>
        </div>

        <div class="info-row" style="margin-top: -5px;">
          <div class="info-group">
            <div class="info-label">Customer ID</div>
            <div class="info-value">#${orderData.customerDisplayId || '---'}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Customer Name</div>
            <div class="info-value">${orderData.customerName}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Phone</div>
            <div class="info-value">XXXXXXXXXX</div>
          </div>
        </div>

        ${processedItems.map((item: any, idx: number) => `
          <div class="item-card">
            <div class="item-header">
              <div class="item-title">${idx + 1}. ${item.type || item.name}</div>
              <div class="item-qty">Qty: ${item.quantity || item.qty}</div>
            </div>

            ${item.measurements && Object.keys(item.measurements).length > 0 ? `
              <div class="notes-label" style="margin-bottom: 10px; color: #0E9F8A;">Measurements</div>
              <div class="measurement-grid">
                ${Object.entries(item.measurements).map(([key, val]) => `
                  <div class="measurement-item">
                    <div class="measurement-label">${key.replace(/_/g, ' ')}</div>
                    <div class="measurement-value">${val}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${item.images && item.images.length > 0 ? `
              <div class="notes-label" style="margin-top: 15px; color: #0E9F8A;">Attachments / Photos</div>
              <div class="item-images">
                ${item.images.map((img: string) => `<img src="${img}" class="item-image" />`).join('')}
              </div>
            ` : ''}

            ${item.sketches && item.sketches.length > 0 ? `
              <div class="notes-label" style="margin-top: 15px; color: #0E9F8A;">Design Sketches</div>
              <div class="item-images">
                ${item.sketches.map((img: string) => `<img src="${img}" class="item-image" style="border: 2px dashed #0E9F8A;" />`).join('')}
              </div>
            ` : ''}

            ${item.notes || item.transcription ? `
              <div class="notes-box">
                ${item.notes ? `
                    <div class="notes-label">Customer Notes</div>
                    <div class="notes-text">${item.notes}</div>
                ` : ''}
                ${item.transcription ? `
                    <div class="notes-label" style="margin-top: 8px; color: #8B5CF6;">AI Transcription</div>
                    <div class="notes-text" style="font-style: italic; color: #4B5563;">"${item.transcription}"</div>
                ` : ''}
              </div>
            ` : ''}

            ${item.fabricSource ? `
              <div style="margin-top: 15px; font-size: 12px; color: #6B7280;">
                <strong>Fabric Source:</strong> ${item.fabricSource}
              </div>
            ` : ''}
          </div>
        `).join('')}

        <div class="footer">
          <div style="font-size: 10px; color: #9CA3AF;">
            Generated by Sewvee Mini - ${new Date().toLocaleString()}
          </div>
          <div class="signature-area">
             <div class="signature-text" style="margin-top: 0;">Authorized Work Order</div>
          </div>
        </div>
      </body>
    </html>
  `;
    };

    export const generateTailorCopyPDF = async (orderData: any, companyData: any) => {
      console.log('[PDF] Generating Tailor Copy for:', orderData.billNo);

      // Pre-process items to convert images to Base64
      const rawItems = normalizeItems(orderData);
      const processedItems = await Promise.all(rawItems.map(async (item: any) => {
        if (item.images && item.images.length > 0) {
          const base64Images = await Promise.all(item.images.map(async (imgUri: string) => {
            try {
              if (imgUri.startsWith('file://')) {
                const base64 = await FileSystem.readAsStringAsync(imgUri, { encoding: FileSystem.EncodingType.Base64 });
                return `data:image/jpeg;base64,${base64}`;
              }
              return imgUri;
            } catch (e) {
              console.log('Error converting image to base64:', e);
              return null;
            }
          }));
          item.images = base64Images.filter(Boolean);
        }

        if (item.sketches && item.sketches.length > 0) {
          const base64Sketches = await Promise.all(item.sketches.map(async (sketchUri: string) => {
            try {
              if (sketchUri.startsWith('file://')) {
                const base64 = await FileSystem.readAsStringAsync(sketchUri, { encoding: FileSystem.EncodingType.Base64 });
                return `data:image/png;base64,${base64}`;
              }
              return sketchUri;
            } catch (e) {
              console.log('Error converting sketch to base64:', e);
              return null;
            }
          }));
          item.sketches = base64Sketches.filter(Boolean);
        }
        return item;
      }));

      const htmlContent = getTailorCopyHTML(orderData, companyData, processedItems);

      const safeBillNo = (orderData.billNo || 'Draft').replace(/[^a-z0-9]/gi, '_');
      const safeCustomerName = (orderData.customerName || 'Customer').replace(/[^a-z0-9]/gi, '_');

      return await finalizeAndSharePDF(htmlContent, `Tailor_${safeBillNo}_${safeCustomerName}.pdf`, `Tailor Copy #${orderData.billNo}`);
    };

    export const getCustomerCopyHTML = (orderData: any, companyData: any) => {
      return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          ${COMMON_STYLES}
          .customer-info-box {
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 25px;
            background-color: #F9FAFB;
          }
          .grid-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .grid-item {
            flex: 1;
          }
          .grid-item.center { text-align: center; }
          .grid-item.right { text-align: right; }
          .separator {
            height: 1px;
            background-color: #E5E7EB;
            margin: 12px 0;
          }
        </style>
      </head>
      <body>
        ${getBaseHeader(companyData, 'Customer Copy')}

        <div class="customer-info-box">
          <div class="grid-row">
            <div class="grid-item">
              <div class="info-label">Order No</div>
              <div class="info-value">#${orderData.billNo}</div>
            </div>
            <div class="grid-item center">
              <div class="info-label">Order Date</div>
              <div class="info-value">${formatDate(orderData.date || orderData.createdAt || new Date())}</div>
            </div>
            <div class="grid-item right">
              <div class="info-label">Delivery Date</div>
              <div class="info-value">${orderData.deliveryDate ? formatDate(orderData.deliveryDate) : 'TBD'}</div>
            </div>
          </div>

          <div class="separator"></div>

          <div class="grid-row">
            <div class="grid-item">
              <div class="info-label">Customer ID</div>
              <div class="info-value">#${orderData.customerDisplayId || '---'}</div>
            </div>
            <div class="grid-item center">
              <div class="info-label">Customer Name</div>
              <div class="info-value">${orderData.customerName}</div>
            </div>
            <div class="grid-item right">
              <div class="info-label">Mobile</div>
              <div class="info-value">${orderData.customerMobile}</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">S.No</th>
              <th>Description</th>
              <th style="text-align: center; width: 60px;">Qty</th>
              <th style="text-align: right; width: 100px;">Rate</th>
              <th style="text-align: right; width: 100px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${normalizeItems(orderData).map((item: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.qty || item.quantity}</td>
                <td style="text-align: right;">₹${(parseFloat(item.rate) || 0).toFixed(2)}</td>
                <td style="text-align: right;">₹${(parseFloat(item.amount) || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 200px;">
            <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
              <span>Subtotal</span>
              <span>₹${(parseFloat(orderData.total) || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
              <span>Advance</span>
              <span>₹${(parseFloat(orderData.advance) || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row" style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 2px solid #0E9F8A; font-weight: 700; font-size: 16px; color: #0E9F8A;">
              <span>BALANCE</span>
              <span>₹${(parseFloat(orderData.balance) || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="terms">
            <strong>TERMS & CONDITIONS</strong><br/>
            No Refund / No Exchange / No Cancellation<br/>
            E & O.E.
          </div>
          <div class="signature-area">
            <div style="height: 40px;"></div>
            <div class="signature-text">For ${companyData.name}</div>
          </div>
        </div>
      </body>
    </html>
  `;
    };

    export const generateCustomerCopyPDF = async (orderData: any, companyData: any) => {
      console.log('[PDF] Generating Customer Copy for:', orderData.billNo);
      const htmlContent = getCustomerCopyHTML(orderData, companyData);

      const safeBillNo = (orderData.billNo || 'Draft').replace(/[^a-z0-9]/gi, '_');

      return await finalizeAndSharePDF(htmlContent, `Customer_Copy_${safeBillNo}.pdf`, `Customer Copy #${orderData.billNo}`);
    };

    const finalizeAndSharePDF = async (html: string, filename: string, shareTitle: string) => {
      try {
        const { uri } = await Print.printToFileAsync({ html });
        const dir = uri.substring(0, uri.lastIndexOf('/') + 1);
        const finalUri = `${dir}${filename}`;

        await FileSystem.moveAsync({
          from: uri,
          to: finalUri
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(finalUri, {
            UTI: '.pdf',
            mimeType: 'application/pdf',
            dialogTitle: shareTitle
          });
        }
      } catch (error: any) {
        console.error('[PDF] Error:', error);
        Alert.alert('PDF Error', error.message || 'Failed to generate PDF');
        throw error;
      }
    };
