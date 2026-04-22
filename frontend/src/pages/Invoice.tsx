import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Download, CheckCircle, XCircle, Clock, Loader2,
  Building, CreditCard, Calendar, User, Mail, Phone, MapPin, Receipt,
  ArrowLeft, Send
} from 'lucide-react';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
  };
  items: {
    description: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  paymentMethod: string;
  transactionId?: string;
  utrNumber?: string;
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR' 
  }).format(amount);
};

export default function Invoice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const invoiceId = searchParams.get('id');
  const paymentId = searchParams.get('paymentId');

  useEffect(() => {
    if (paymentId) {
      loadPaymentAsInvoice(paymentId);
    } else {
      setLoading(false);
    }
  }, [paymentId]);

  const loadPaymentAsInvoice = async (pid: string) => {
    try {
      setLoading(true);
      // Load from localStorage store
      const store = useChatbotStore?.getState();
      const payments = store?.payments || [];
      const payment = payments.find((p: any) => p.id === pid);
      
      if (payment) {
        const invoiceData: InvoiceData = {
          invoiceNumber: `FV-INV-${payment.id?.slice(0, 8).toUpperCase() || Date.now()}`,
          date: payment.createdAt ? new Date(payment.createdAt).toISOString() : new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          customer: {
            name: payment.userName || 'Customer',
            email: payment.userEmail || '',
            phone: payment.userPhone,
          },
          items: [{
            description: `${payment.plan?.toUpperCase()} Plan - FlowvVibe`,
            quantity: 1,
            price: payment.amount,
            total: payment.amount,
          }],
          subtotal: payment.amount,
          tax: 0,
          total: payment.amount,
          status: payment.status === 'completed' ? 'paid' : payment.status === 'failed' ? 'cancelled' : 'pending',
          paymentMethod: payment.method || 'UPI',
          transactionId: payment.transactionId,
          utrNumber: payment.utrNumber,
        };
        setInvoice(invoiceData);
      }
    } catch (e) {
      console.error('Error loading invoice:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = () => {
    if (!invoice) return;
    setGenerating(true);
    
    // Create printable invoice
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .company-name { font-size: 24px; font-weight: bold; color: #06b6d4; }
            .invoice-title { font-size: 32px; color: #333; }
            .invoice-number { font-size: 14px; color: #666; margin-top: 8px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .bill-to, .invoice-details { width: 45%; }
            .label { font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 8px; }
            .value { font-size: 14px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .totals { display: flex; justify-content: flex-end; }
            .totals-table { width: 250px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals-row.total { font-size: 18px; font-weight: bold; border-top: 2px solid #06b6d4; margin-top: 8px; padding-top: 16px; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .status.paid { background: #d1fae5; color: #065f46; }
            .status.pending { background: #fef3c7; color: #92400e; }
            .status.cancelled { background: #fee2e2; color: #991b1b; }
            .footer { margin-top: 60px; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div>
                <div class="company-name">FlowvVibe</div>
                <div style="color: #666; font-size: 14px; margin-top: 4px;">AI Chatbot Builder Platform</div>
              </div>
              <div>
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">${invoice.invoiceNumber}</div>
              </div>
            </div>
            
            <div class="details">
              <div class="bill-to">
                <div class="label">Bill To</div>
                <div class="value"><strong>${invoice.customer.name}</strong><br/>
                ${invoice.customer.email}<br/>
                ${invoice.customer.phone || ''}</div>
              </div>
              <div class="invoice-details">
                <div class="label">Invoice Details</div>
                <div class="value">
                  <strong>Date:</strong> ${formatDate(new Date(invoice.date))}<br/>
                  <strong>Due Date:</strong> ${formatDate(new Date(invoice.dueDate))}<br/>
                  <strong>Status:</strong> <span class="status ${invoice.status}">${invoice.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="totals-table">
                <div class="totals-row">
                  <span>Subtotal</span>
                  <span>${formatCurrency(invoice.subtotal)}</span>
                </div>
                <div class="totals-row">
                  <span>Tax</span>
                  <span>${formatCurrency(invoice.tax)}</span>
                </div>
                <div class="totals-row total">
                  <span>Total</span>
                  <span>${formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
            
            ${invoice.transactionId ? `
              <div style="margin-top: 30px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
                <strong>Transaction Details</strong><br/>
                <span style="color: #666;">Transaction ID: ${invoice.transactionId}</span><br/>
                ${invoice.utrNumber ? `<span style="color: #666;">UTR: ${invoice.utrNumber}</span>` : ''}
              </div>
            ` : ''}
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>FlowvVibe - flowvibe.com</p>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No invoice found</p>
          <button 
            onClick={() => navigate(-1)}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex gap-4">
            <button 
              onClick={generateInvoice}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
              <Send className="w-4 h-4" />
              Send Email
            </button>
          </div>
        </div>

        <div className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-cyan-600">FlowvVibe</h1>
              <p className="text-slate-500">AI Chatbot Builder Platform</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-slate-800">INVOICE</h2>
              <p className="text-slate-500 mt-1">{invoice.invoiceNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Bill To</h3>
              <p className="font-semibold">{invoice.customer.name}</p>
              <p className="text-slate-600">{invoice.customer.email}</p>
              {invoice.customer.phone && <p className="text-slate-600">{invoice.customer.phone}</p>}
            </div>
            <div className="text-right">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Invoice Details</h3>
              <p><span className="text-slate-500">Date:</span> {formatDate(new Date(invoice.date))}</p>
              <p><span className="text-slate-500">Due Date:</span> {formatDate(new Date(invoice.dueDate))}</p>
              <p className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {invoice.status === 'paid' ? <CheckCircle className="w-4 h-4 inline mr-1" /> : <Clock className="w-4 h-4 inline mr-1" />}
                {invoice.status.toUpperCase()}
              </p>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-3 text-xs font-semibold text-slate-500 uppercase">Description</th>
                <th className="text-right py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                <th className="text-right py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
                <th className="text-right py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">{formatCurrency(item.price)}</td>
                  <td className="py-3 text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Tax</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-cyan-500 font-bold text-lg">
                <span>Total</span>
                <span className="text-cyan-600">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.transactionId && (
            <div className="mt-8 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold mb-2">Payment Details</h4>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Transaction ID:</span> {invoice.transactionId}
              </p>
              {invoice.utrNumber && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium">UTR Number:</span> {invoice.utrNumber}
                </p>
              )}
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-slate-200 text-center text-slate-500 text-sm">
            <p>Thank you for your business!</p>
            <p className="mt-1">FlowvVibe - flowvibe.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}