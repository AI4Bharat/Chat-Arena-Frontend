import { ArrowLeft, Shield, Eye, Users, Server, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDocumentTitle from '../../../shared/hooks/useDocumentTitle';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  useDocumentTitle('Indic Arena - Privacy Policy');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            {/* <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back</span>
            </button> */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="text-orange-600" size={24} />
              Privacy Policy
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 sm:p-8">
            {/* Last Updated */}
            <div className="text-sm text-gray-500 mb-8">
              Last updated: November 28, 2025
            </div>

            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to Indic LLM Arena, an AI model comparison platform. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our service. By using Indic LLM Arena, you agree 
                to the collection and use of information in accordance with this policy.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Eye className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-orange-800 text-sm">
                    <strong>Important:</strong> Your conversations may be used to improve our AI models. 
                    Please don't share personal, sensitive, or confidential information.
                  </p>
                </div>
              </div>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Server className="text-blue-600" size={24} />
                Information We Collect
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Conversation Data</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Messages you send to AI models</li>
                    <li>AI model responses</li>
                    <li>Your feedback and preferences</li>
                    <li>Conversation metadata (timestamps, model selections)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Account Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Email address (if you create an account)</li>
                    <li>Authentication tokens</li>
                    <li>User preferences and settings</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>IP address and browser information</li>
                    <li>Device type and operating system</li>
                    <li>Usage patterns and performance metrics</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="text-green-600" size={24} />
                How We Use Your Information
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Service Improvement</h3>
                  <p className="text-sm text-gray-700">
                    Training and improving AI models, enhancing user experience, and developing new features.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Platform Operations</h3>
                  <p className="text-sm text-gray-700">
                    Providing core services, maintaining security, and ensuring platform reliability.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Research & Analytics</h3>
                  <p className="text-sm text-gray-700">
                    Understanding usage patterns, conducting research, and generating insights about AI performance.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Communication</h3>
                  <p className="text-sm text-gray-700">
                    Sending important updates, responding to inquiries, and providing customer support.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="text-purple-600" size={24} />
                Data Sharing and Disclosure
              </h2>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Data Sharing Transparency</h3>
                  <p className="text-gray-700 text-sm">
                    As user prompts and conversations may be shared with third-party AI model providers 
                    (such as OpenAI, Google, and others), such data may be processed or stored on servers 
                    located outside India.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">AI Model Providers</h3>
                  <p className="text-gray-700 text-sm">
                    Your conversations are shared with third-party AI model providers (OpenAI, Google, Anthropic, Meta, etc.) 
                    to generate responses. Each provider has their own privacy policies.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Anonymized Data</h3>
                  <p className="text-gray-700 text-sm">
                    We may share anonymized, aggregated data for research purposes or with academic institutions 
                    to advance AI research.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Legal Requirements</h3>
                  <p className="text-gray-700 text-sm">
                    We may disclose information when required by law or to protect our rights, users, 
                    or others from harm.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                  <h3 className="font-medium text-gray-900 mb-2">Open Source Data Release</h3>
                  <p className="text-gray-700 text-sm">
                    We will be releasing chat conversations as open source datasets with fully permissible licenses 
                    to advance AI research and development. All personal information will be anonymized before release.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your data against 
                unauthorized access, alteration, disclosure, or destruction. However, no internet transmission 
                is completely secure, and we cannot guarantee absolute security.
              </p>

              <p className="text-gray-700 leading-relaxed bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <strong>Data Retention & Security:</strong>
                Data will not be retained longer than necessary for the stated purposes and till the time it is stored, appropriate security measures will be taken to avoid the misuse of data.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Guest Sessions:</strong> Expire after 30 days</li>
                <li><strong>Account Data:</strong> Retained until account deletion</li>
                <li><strong>Conversation Data:</strong> May be retained for AI model improvement</li>
                <li><strong>Analytics Data:</strong> Typically retained for 2 years</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Minors</h2>
              <p className="text-gray-700 leading-relaxed bg-red-50 border border-red-200 rounded-lg p-4">
                This service is not intended for users below 18 years of age.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Access & Export</h3>
                  <p className="text-sm text-blue-800">
                    Request a copy of your data or export your conversations.
                  </p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 mb-2">Deletion</h3>
                  <p className="text-sm text-red-800">
                    Request deletion of your account and associated data.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="text-orange-600" size={24} />
                Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-medium">Email: <a href="mailto:arena@ai4bharat.org" className="text-orange-600 hover:text-orange-700 hover:underline">arena@ai4bharat.org</a></p>
                <p className="text-gray-700 font-medium">Subject: Privacy Policy Inquiry</p>
              </div>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date. 
                Your continued use of the service after changes become effective constitutes acceptance of the new policy.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}