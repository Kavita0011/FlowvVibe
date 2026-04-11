import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content: `By accessing and using FlowvVibe (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.`
  },
  {
    id: 'service',
    title: 'Description of Service',
    content: `FlowvVibe provides an AI-powered chatbot builder platform that allows users to create, configure, and deploy custom chatbots for their websites and messaging channels. The service includes:
• Visual flow builder
• AI/NLP training capabilities
• Multi-channel integration (WhatsApp, Slack, Telegram, etc.)
• Analytics and reporting
• Premium add-ons (booking, voice, email, CRM)

We reserve the right to modify or discontinue the service at any time without prior notice.`
  },
  {
    id: 'accounts',
    title: 'User Accounts',
    content: `When you create an account, you agree to:
• Provide accurate and complete registration information
• Maintain the security of your account and password
• Accept responsibility for all activities under your account
• Notify us immediately of any unauthorized use
• Be at least 18 years of age

We reserve the right to terminate accounts that violate these terms.`
  },
  {
    id: 'payment',
    title: 'Payment & Billing',
    content: `Pricing:
• All prices are in Indian Rupees (INR)
• Payments are one-time (not monthly/recurring)
• Prices include GST as applicable
• Premium add-ons are one-time purchases

Refunds:
• 7-day money-back guarantee on all plans
• Refund requests must be made via email to devappkavita@gmail.com
• Refunds are processed within 14 business days
• Add-ons are not refundable once activated

Payment Processing:
• All payments are processed securely via Razorpay
• UPI and card payments accepted`
  },
  {
    id: 'acceptableuse',
    title: 'Acceptable Use',
    content: `You agree NOT to use the service to:
• Violate any applicable laws or regulations
• Infringe on intellectual property rights
• Transmit harmful, threatening, or abusive content
• Attempt to gain unauthorized access to systems
• Use the service for spam or malicious purposes
• Resell or redistribute the service without authorization
• Copy, reverse engineer, or modify the service

We reserve the right to suspend or terminate accounts that violate acceptable use.`
  },
  {
    id: 'intellectual',
    title: 'Intellectual Property',
    content: `Your Content:
• You retain ownership of all content you create (chatbots, flows, responses)
• You grant us license to use your content to provide the service
• You represent that you have all rights to content you upload

Our Property:
• The service, software, and all intellectual property are owned by FlowvVibe
• You may not copy, modify, or distribute our proprietary materials
• "FlowvVibe" name and logo are trademarks of FlowvVibe`
  },
  {
    id: 'thirdparty',
    title: 'Third-Party Services',
    content: `Our service integrates with third-party services you connect:
• WhatsApp, Telegram, Slack (your account connections)
• Calendar services
• Payment gateways
• Email services
• CRM platforms

You acknowledge that:
• Third-party services have their own terms and policies
• We are not responsible for third-party services
• You are responsible for understanding and complying with third-party terms`
  },
  {
    id: 'limitation',
    title: 'Limitation of Liability',
    content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT THAT:
• THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE
• THE SERVICE WILL MEET YOUR REQUIREMENTS
• DEFECTS WILL BE CORRECTED

TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
• INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES
• LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES
• DAMAGES RESULTING FROM USE OR INABILITY TO USE THE SERVICE

YOUR SOLE REMEDY IS TO TERMINATE YOUR ACCOUNT.`
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    content: `You agree to indemnify, defend, and hold harmless FlowvVibe and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, or expenses arising from:
• Your use of the service
• Your violation of these terms
• Your violation of any third-party rights
• Your content or chatbot configurations`
  },
  {
    id: 'termination',
    title: 'Termination',
    content: `You may terminate your account at any time by contacting us or using account deletion features.

We may terminate or suspend your account:
• For violation of these terms
• For non-payment (if applicable)
• For illegal or harmful activities
• At our sole discretion with notice

Upon termination:
• Your data will be deleted within 30 days
• You will lose access to the service
• Your payment is non-refundable except as specified`
  },
  {
    id: 'changes',
    title: 'Changes to Terms',
    content: `We may modify these terms at any time. We will provide notice of material changes by:
• Posting updated terms on this page
• Notifying you via email (for significant changes)

Your continued use after changes constitutes acceptance of new terms. The current version always supersedes previous versions.`
  },
  {
    id: 'governing',
    title: 'Governing Law',
    content: `These terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law provisions.

Any disputes arising from these terms shall be subject to the exclusive jurisdiction of courts in Delhi, India.`
  }
];

export default function Terms() {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>('acceptance');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-5 h-5" />Back to Home
      </button>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <FileText className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Terms & Conditions</h1>
          <p className="text-slate-400">Last Updated: April 2026</p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Agreement</h2>
          <p className="text-slate-300 leading-relaxed">
            Welcome to FlowvVibe. These Terms & Conditions ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and FlowvVibe ("Company", "we", "our", or "us").
          </p>
          <div className="mt-6 p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-sm">
                <strong>Important:</strong> Please read these terms carefully. By using our service, you acknowledge that you have read, understood, and agree to be bound by these terms.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-700/30 transition-colors"
              >
                <span className="text-lg font-medium text-white">{section.title}</span>
                {openSection === section.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {openSection === section.id && (
                <div className="px-5 pb-5">
                  <pre className="text-slate-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {section.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">Agreement Confirmation</h3>
          <p className="text-slate-300 mb-4">
            By using FlowvVibe, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
          </p>
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span>Agreed and Accepted</span>
          </div>
        </div>
      </div>
    </div>
  );
}