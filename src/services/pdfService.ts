import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Colors } from '../constants/theme';
import { Alert, Platform } from 'react-native';
import { formatDate } from '../utils/dateUtils';

export const normalizeItems = (orderData: any, includeCancelled: boolean = true) => {
  let items = [];
  if (orderData.outfits && orderData.outfits.length > 0) {
    items = orderData.outfits.map((it: any) => ({
      name: it.type || 'Custom Outfit',
      qty: it.qty || 1,
      rate: (Number(it.totalCost) || 0) / (it.qty || 1),
      amount: Number(it.totalCost) || 0,
      description: it.notes || '',
      measurements: it.measurements,
      type: it.type,
      notes: it.notes,
      quantity: it.qty || 1,
      images: it.images || [],
      sketches: it.sketches || (it.sketchUri ? [it.sketchUri] : []),
      audioUri: it.audioUri || it.voiceNote,
      transcription: it.transcription,
      fabricSource: it.fabricSource || it.fabric_source || '',
      deliveryDate: it.deliveryDate,
      status: it.status || 'Pending'
    }));
  } else {
    items = (orderData.items || []).map((it: any) => ({
      ...it,
      qty: it.qty || it.quantity || 1,
      quantity: it.qty || it.quantity || 1,
      name: it.name || it.type || 'Item',
      amount: Number(it.amount || it.totalCost || 0),
      rate: it.rate !== undefined ? Number(it.rate) : (it.totalCost ? (Number(it.totalCost) / (it.qty || it.quantity || 1)) : 0),
      images: it.images || [],
      sketches: it.sketches || (it.sketchUri ? [it.sketchUri] : []),
      fabricSource: it.fabricSource || it.fabric_source || '',
      deliveryDate: it.deliveryDate,
      status: it.status || 'Pending'
    }));
  }

  if (!includeCancelled) {
    return items.filter((it: any) => it.status !== 'Cancelled');
  }
  return items;
};

const COMMON_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  @page { margin: 20px; }
  body { font-family: 'Inter', sans-serif; padding: 20px; color: #1F2937; background-color: white; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 12px; }
  .company-logo { width: 50px; height: 50px; background-color: #0E9F8A; color: white; border-radius: 8px; display: flex; justify-content: center; align-items: center; text-align: center; vertical-align: middle; line-height: 50px; font-weight: 700; font-size: 20px; margin-bottom: 5px; overflow: hidden; }
  .company-name { font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; color: #0E9F8A; }
  .company-details { font-size: 11px; color: #6B7280; line-height: 1.3; max-width: 300px; }
  .document-label { background-color: #F3F4F6; padding: 6px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #374151; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }
  .info-group { flex: 1 1 20%; min-width: 80px; }
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

        <div style="border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 15px; overflow: hidden;">
            <div style="display: flex; border-bottom: 1px solid #E5E7EB;">
                <div style="flex: 1; border-right: 1px solid #E5E7EB; padding: 8px 12px; background-color: #F9FAFB;">
                    <div style="font-size: 9px; color: #6B7280; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Customer Info</div>
                    <div style="font-size: 13px; font-weight: 800; color: #111827; text-transform: uppercase;">${orderData.customerName}</div>
                    <div style="font-size: 10px; color: #4B5563; margin-top: 2px;">${orderData.customerMobile}</div>
                </div>
                <div style="flex: 1; border-right: 1px solid #E5E7EB; padding: 8px 12px;">
                    <div style="font-size: 9px; color: #6B7280; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Order Details</div>
                    <div style="font-size: 11px; font-weight: 700;">#${orderData.billNo}</div>
                    <div style="font-size: 10px; color: #6B7280;">${formatDate(orderData.date)}</div>
                </div>
                <div style="flex: 1; padding: 8px 12px;">
                    <div style="font-size: 9px; color: #6B7280; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Delivery & ID</div>
                    <div style="font-size: 11px; font-weight: 700; color: #0E9F8A;">${orderData.deliveryDate ? formatDate(orderData.deliveryDate) : 'TBD'}</div>
                    <div style="font-size: 10px; color: #6B7280;">#${orderData.customerDisplayId || '---'}</div>
                </div>
            </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; border-bottom: 2px solid #E5E7EB;">S.No</th>
              <th style="border-bottom: 2px solid #E5E7EB;">Description</th>
              <th style="width: 80px; text-align: center; border-bottom: 2px solid #E5E7EB;">Delivery</th>
              <th style="text-align: center; width: 50px; border-bottom: 2px solid #E5E7EB;">Qty</th>
              <th style="text-align: right; width: 80px; border-bottom: 2px solid #E5E7EB;">Rate</th>
              <th style="text-align: right; width: 90px; border-bottom: 2px solid #E5E7EB;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${normalizeItems(orderData, false).map((item: any, index: number) => `
              <tr>
                <td style="vertical-align: top;">${index + 1}</td>
                <td style="vertical-align: top;">
                    <div style="font-weight: 600;">${item.name}</div>
                    ${item.description ? `<div style="font-size: 10px; color: #6B7280; margin-top: 2px;">${item.description}</div>` : ''}
                </td>
                <td style="text-align: center; vertical-align: top;">
                    ${item.deliveryDate ? `
                        <div style="font-size: 10px; font-weight: 600; color: #059669; background: #ECFDF5; padding: 2px 6px; border-radius: 4px; display: inline-block;">
                            ${formatDate(item.deliveryDate)}
                        </div>
                    ` : '<span style="font-size: 10px; color: #9CA3AF;">-</span>'}
                </td>
                <td style="text-align: center; vertical-align: top;">${item.qty}</td>
                <td style="text-align: right; vertical-align: top;">₹${(parseFloat(item.rate) || 0).toFixed(2)}</td>
                <td style="text-align: right; vertical-align: top; font-weight: 600;">₹${(parseFloat(item.amount) || 0).toFixed(2)}</td>
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
  const htmlContent = getInvoiceHTML(orderData, companyData);

  const safeCustomerName = (orderData.customerName || 'Customer').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const safeBillNo = orderData.billNo ? orderData.billNo.replace(/[^a-z0-9]/gi, '_') : 'Draft';

  return await finalizeAndSharePDF(htmlContent, `Bill_${safeBillNo}_${safeCustomerName}.pdf`, `Invoice #${orderData.billNo}`);
};

export const getTailorCopyHTML = (orderData: any, companyData: any, processedItems: any[]) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          ${COMMON_STYLES}
          .item-card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 15px; margin-bottom: 15px; }
          .item-block { page-break-inside: avoid; break-inside: avoid; }
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
          .item-images { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; justify-content: center; page-break-inside: avoid; break-inside: avoid; }
          .item-image { width: 45%; height: 200px; object-fit: contain; border-radius: 6px; border: 1px solid #E5E7EB; background-color: #F9FAFB; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        ${getBaseHeader(companyData, 'Tailor Copy')}

        <div class="info-row" style="border-bottom: 1px solid #E5E7EB; padding: 6px 0; margin-bottom: 10px; align-items: flex-start; flex-wrap: nowrap;">
          <div class="info-group" style="flex: 1;">
            <div class="info-label">Customer</div>
            <div class="info-value" style="font-size: 13px;">${orderData.customerName}</div>
          </div>
          <div class="info-group" style="flex: 1;">
            <div class="info-label">Mobile</div>
            <div class="info-value" style="font-size: 13px;">${orderData.customerMobile}</div>
          </div>
          <div class="info-group" style="flex: 1;">
            <div class="info-label">Order No</div>
            <div class="info-value" style="font-size: 13px;">#${orderData.billNo}</div>
          </div>
          <div class="info-group" style="flex: 1;">
            <div class="info-label">Date</div>
            <div class="info-value" style="font-size: 13px;">${orderData.date ? formatDate(orderData.date) : formatDate(new Date().toISOString())}</div>
          </div>
          <div class="info-group" style="flex: 1;">
            <div class="info-label">ID</div>
            <div class="info-value" style="font-size: 13px;">#${orderData.customerDisplayId || '---'}</div>
          </div>
        </div>

        ${processedItems.map((item: any, idx: number) => `
          <div class="item-card">
            <div class="item-header">
              <div style="display: flex; flex-direction: column;">
                <div class="item-title">${idx + 1}. ${item.type || item.name}</div>
                ${(item.deliveryDate || orderData.deliveryDate) ? `
                  <div style="font-size: 11px; margin-top: 4px; display: inline-block;">
                    <span style="background: ${(function () {
        const now = new Date();
        const target = new Date(item.deliveryDate || orderData.deliveryDate);
        const diffTime = target.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 ? '#FEE2E2' : '#E0E7FF';
      })()}; color: ${(function () {
        const now = new Date();
        const target = new Date(item.deliveryDate || orderData.deliveryDate);
        const diffTime = target.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 ? '#DC2626' : '#4338CA';
      })()}; padding: 3px 8px; border-radius: 4px; font-weight: 700;">
                      DUE: ${formatDate(item.deliveryDate || orderData.deliveryDate)}
                    </span>
                  </div>
                ` : ''}
              </div>
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
                ${item.sketches.map((img: string) => `
                    <div style="display: flex; flex-direction: column; width: 45%;">
                        <img src="${img}" class="item-image" style="width: 100%; border: 2px dashed #0E9F8A; background-color: white;" />
                        <div style="font-size: 8px; color: red; font-family: monospace; overflow: hidden; white-space: nowrap; margin-top: -5px; background: rgba(255,255,255,0.8);">
                            ${img.startsWith('data:')
          ? `B64: ${img.substring(0, 20)}...`
          : `FAIL: ${img.substring(0, 40)}...`}
                        </div>
                    </div>
                `).join('')}
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
            Generated by Sewvee - ${new Date().toLocaleString()}
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

  const rawItems = normalizeItems(orderData, false);
  const processedItems = await Promise.all(rawItems.map(async (item: any) => {
    // Helper to process any image URI into Base64
    const processImageUri = async (uri: string, mimeType = 'image/jpeg') => {
      try {
        if (!uri) return null;

        // Handle Base64 images directly
        if (uri.startsWith('data:')) return uri;

        let targetUri = uri;

        // Normalize local paths: ensure they start with file:// if they are absolute paths
        if (targetUri.startsWith('/')) {
          targetUri = 'file://' + targetUri;
        }

        // Handle Local Files (file://, content://)
        if (targetUri.startsWith('file://') || targetUri.startsWith('content://')) {
          try {
            // Some URIs might be double encoded or have special characters
            const decodedUri = targetUri.includes('%') ? decodeURIComponent(targetUri) : targetUri;

            const fileInfo = await FileSystem.getInfoAsync(decodedUri);
            if (!fileInfo.exists) {
              // Try the non-decoded version as a fallback
              const originalInfo = await FileSystem.getInfoAsync(targetUri);
              if (!originalInfo.exists) {
                return `ERR_FILE_NOT_FOUND: ${decodedUri.substring(Math.max(0, decodedUri.length - 20))}`;
              }
              // If original exists, use that
            }

            const activeUri = fileInfo.exists ? decodedUri : targetUri;

            // Copy to cache to bypass scoped storage restrictions (especially on newer Android)
            const ext = mimeType.split('/')[1] || 'img';
            const tempCopyPath = FileSystem.cacheDirectory + 'pdftemp_' + Date.now() + '_' + Math.random().toString(36).substring(7) + '.' + ext;

            try {
              await FileSystem.copyAsync({ from: activeUri, to: tempCopyPath });
              const base64 = await FileSystem.readAsStringAsync(tempCopyPath, { encoding: 'base64' });
              // Cleanup early
              await FileSystem.deleteAsync(tempCopyPath, { idempotent: true });
              return `data:${mimeType};base64,${base64}`;
            } catch (copyErr: any) {
              // Fallback direct read
              try {
                const base64 = await FileSystem.readAsStringAsync(activeUri, { encoding: 'base64' });
                return `data:${mimeType};base64,${base64}`;
              } catch (readErr: any) {
                return `ERR_READ_FAIL: ${readErr.message?.substring(0, 20)}`;
              }
            }
          } catch (e: any) {
            return `ERR_PROCESS_CATCH: ${e.message?.substring(0, 20)}`;
          }
        }

        // Handle Remote Images (HTTP/HTTPS) - Let Print handle them if possible, or convert to B64
        // For Tailor Copy, we prefer converting to B64 to ensure they show up in PDF
        if (targetUri.startsWith('http')) {
          return targetUri; // Print usually handles remote images fine if connected
        }

        return `ERR_UNSUPPORTED_SCHEME: ${targetUri.substring(0, 10)}`;

      } catch (e: any) {
        return `ERR_CRASH: ${e.message?.substring(0, 20)}`;
      }
    };

    // Process Photos
    if (item.images && item.images.length > 0) {
      const base64Images = await Promise.all(item.images.map((uri: string) => processImageUri(uri, 'image/jpeg')));
      item.images = base64Images.filter(Boolean);
    }

    // Process Sketches
    const sketchesToProcess = item.sketches || (item.sketchUri ? [item.sketchUri] : []);

    if (sketchesToProcess.length > 0) {
      const base64Sketches = await Promise.all(sketchesToProcess.map((uri: string) => processImageUri(uri, 'image/png')));
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
          .terms { font-size: 11px; color: #374151; max-width: 100%; margin-top: 10px; font-weight: 500; }
          .footer-branding { text-align: center; margin-top: 20px; border-top: 1px dashed #E5E7EB; padding-top: 10px; }
          .branding-text { font-size: 10px; color: #9CA3AF; letter-spacing: 1px; text-transform: uppercase; }
          .branding-logo { font-weight: 700; color: #0E9F8A; font-size: 12px; }
        </style>
      </head>
      <body>
        ${getBaseHeader(companyData, 'Customer Copy')}

        <!-- Single Row Data Strip Header -->
        <div class="info-row" style="border-bottom: 1px solid #E5E7EB; padding: 6px 0; margin-bottom: 10px; align-items: flex-start; flex-wrap: nowrap;">
          <div class="info-group" style="flex: 1;">
            <div class="info-label">Customer</div>
            <div class="info-value" style="font-size: 13px;">${orderData.customerName}</div>
          </div>
          <div class="info-group" style="flex: 1;">
            <div class="info-label">Mobile</div>
            <div class="info-value">${orderData.customerMobile}</div>
          </div>
          <div class="info-group" style="flex: 1;">
            <div class="info-label">Order No</div>
            <div class="info-value">#${orderData.billNo}</div>
          </div>
          <div class="info-group" style="flex: 1;">
            <div class="info-label">Date</div>
            <div class="info-value">${orderData.date ? formatDate(orderData.date) : formatDate(new Date().toISOString())}</div>
          </div>
          <div class="info-group" style="flex: 1;">
            <div class="info-label">ID</div>
            <div class="info-value">#${orderData.customerDisplayId || '---'}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
          <thead>
            <tr>
              <th style="width: 40px; border-bottom: 2px solid #E5E7EB; padding: 10px;">S.No</th>
              <th style="border-bottom: 2px solid #E5E7EB; padding: 10px;">Description</th>
              <th style="width: 100px; text-align: center; border-bottom: 2px solid #E5E7EB; padding: 10px;">Delivery</th>
              <th style="text-align: center; width: 50px; border-bottom: 2px solid #E5E7EB; padding: 10px;">Qty</th>
              <th style="text-align: right; width: 90px; border-bottom: 2px solid #E5E7EB; padding: 10px;">Rate</th>
              <th style="text-align: right; width: 100px; border-bottom: 2px solid #E5E7EB; padding: 10px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${normalizeItems(orderData, false).map((item: any, index: number) => {
    // Fallback to Order Delivery Date if Item date is missing
    const itemDeliveryDate = item.deliveryDate || orderData.deliveryDate;

    return `
              <tr>
                <td style="vertical-align: top; padding: 10px; border-bottom: 1px solid #F3F4F6;">${index + 1}</td>
                <td style="vertical-align: top; padding: 10px; border-bottom: 1px solid #F3F4F6;">
                    <div style="font-weight: 600; color: #1F2937;">${item.name}</div>
                    ${item.description ? `<div style="font-size: 11px; color: #6B7280; margin-top: 4px;">${item.description}</div>` : ''}
                </td>
                <td style="text-align: center; vertical-align: top; padding: 10px; border-bottom: 1px solid #F3F4F6;">
                    ${itemDeliveryDate ? `
                        <div style="font-size: 10px; font-weight: 600; color: ${item.deliveryDate ? '#0E9F8A' : '#4B5563'}; background: ${item.deliveryDate ? '#ECFDF5' : '#F3F4F6'}; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                            ${formatDate(itemDeliveryDate)}
                        </div>
                    ` : '<span style="font-size: 11px; color: #9CA3AF;">-</span>'}
                </td>
                <td style="text-align: center; vertical-align: top; padding: 10px; border-bottom: 1px solid #F3F4F6; font-weight: 500;">${item.qty}</td>
                <td style="text-align: right; vertical-align: top; padding: 10px; border-bottom: 1px solid #F3F4F6;">₹${(parseFloat(item.rate) || 0).toFixed(2)}</td>
                <td style="text-align: right; vertical-align: top; padding: 10px; border-bottom: 1px solid #F3F4F6; font-weight: 600; color: #111827;">₹${(parseFloat(item.amount) || 0).toFixed(2)}</td>
              </tr>
            `}).join('')}
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
        
        <div class="footer-branding">
          <div class="branding-text">Powered by <span class="branding-logo">SEWVEE</span></div>
        </div>
      </body>
    </html>
  `;
};

export const generateCustomerCopyPDF = async (orderData: any, companyData: any) => {
  const htmlContent = getCustomerCopyHTML(orderData, companyData);
  const safeBillNo = (orderData.billNo || 'Draft').replace(/[^a-z0-9]/gi, '_');

  return await finalizeAndSharePDF(htmlContent, `Customer_Copy_${safeBillNo}.pdf`, `Customer Copy #${orderData.billNo}`);
};

export const printHTML = async (html: string) => {
  try {
    await Print.printAsync({
      html
    });
  } catch (error: any) {
    console.error('[PDF] Print Error:', error);
    throw error;
  }
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
        dialogTitle: 'Back to Sewvee App'
      });
    }
  } catch (error: any) {
    console.error('[PDF] Error:', error);
    Alert.alert('PDF Error', error.message || 'Failed to generate PDF');
    throw error;
  }
};
