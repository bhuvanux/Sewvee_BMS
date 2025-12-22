import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
const FileSystem = require('expo-file-system');
import { Colors } from '../constants/theme';
import { Alert, Platform } from 'react-native';
import { formatDate } from '../utils/dateUtils';

export const generateInvoicePDF = async (orderData: any, companyData: any) => {
  console.log('[PDF] Request received to generate invoice for:', orderData.billNo);

  const boutiqueName = companyData.name || 'My Boutique';

  // Always use initials (first 2 letters of business name)
  const logoHtml = boutiqueName.substring(0, 2).toUpperCase();
  const isInitials = true;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1F2937; background-color: white; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 30px; }
          .company-logo { width: 60px; height: 60px; ${isInitials ? 'background-color: #0E9F8A;' : ''} color: white; border-radius: 8px; display: flex; justify-content: center; align-items: center; text-align: center; vertical-align: middle; line-height: 60px; font-weight: 700; font-size: 24px; margin-bottom: 10px; overflow: hidden; }
          .company-name { font-size: 24px; font-weight: 700; margin: 0; text-transform: uppercase; color: #0E9F8A; }
          .company-details { font-size: 12px; color: #6B7280; line-height: 1.4; max-width: 300px; }
          .invoice-label { background-color: #F3F4F6; padding: 8px 16px; border-radius: 4px; font-weight: 600; font-size: 14px; text-transform: uppercase; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-group { flex: 1; }
          .info-label { font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .info-value { font-size: 14px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #F9FAFB; text-align: left; padding: 12px; font-size: 11px; color: #6B7280; border-bottom: 1px solid #E5E7EB; text-transform: uppercase; }
          td { padding: 12px; font-size: 13px; border-bottom: 1px solid #F3F4F6; }
          .footer { display: flex; justify-content: space-between; }
          .terms { font-size: 10px; color: #9CA3AF; max-width: 300px; }
          .summary { width: 200px; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .total-row { margin-top: 12px; padding-top: 12px; border-top: 2px solid #0E9F8A; font-weight: 700; font-size: 16px; color: #0E9F8A; }
          .signature-area { margin-top: 50px; text-align: right; }
          .signature-line { display: inline-block; width: 150px; border-top: 1px solid #E5E7EB; margin-top: 40px; }
          .signature-text { font-size: 11px; color: #6B7280; }
        </style>
      </head>
      <body>
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
            <div class="invoice-label">Cash Bill</div>
          </div>
        </div>

        <div class="info-row">
          <div class="info-group">
            <div class="info-label">Bill No</div>
            <div class="info-value">#${orderData.billNo}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Date</div>
            <div class="info-value">${formatDate(orderData.date)}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Customer</div>
            <div class="info-value">${orderData.customerName}</div>
          </div>
          <div class="info-group" style="text-align: right;">
            <div class="info-label">Mobile</div>
            <div class="info-value">${orderData.customerMobile}</div>
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
            ${orderData.items.map((item: any, index: number) => `
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

        <div class="footer">
          <div class="terms">
            <strong>TERMS & CONDITIONS</strong><br/>
            No Refund / No Exchange / No Cancellation<br/>
            E & O.E.
          </div>
          <div class="summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>₹${(parseFloat(orderData.subtotal) || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Advance</span>
              <span>₹${(parseFloat(orderData.advance) || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row total-row">
              <span>BALANCE</span>
              <span>₹${(parseFloat(orderData.balance) || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="signature-area">
          ${companyData.billSignature ? `
            <div class="signature-image">
              <img src="${companyData.billSignature}" style="max-height: 60px; max-width: 150px;" />
            </div>
          ` : `
            <div class="signature-line"></div>
          `}
          <div class="signature-text">For ${companyData.name}</div>
        </div>
      </body>
    </html>
  `;

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
