import { ArrowLeft, FileText, Users, Shield, AlertTriangle, Scale, Mail, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDocumentTitle from '../../../shared/hooks/useDocumentTitle';

export function TermsOfServicePage() {
  const navigate = useNavigate();

  useDocumentTitle('Indic Arena - Terms of Service');

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
              <FileText className="text-orange-600" size={24} />
              Terms of Service
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing and using Indic LLM Arena, you accept and agree to be bound by the terms and provision 
                of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-blue-800 text-sm">
                    <strong>Quick Summary:</strong> Indic LLM Arena is an AI comparison platform. Use it responsibly, 
                    don't share sensitive information, and respect our community guidelines.
                  </p>
                </div>
              </div>
            </section>

            {/* Service Description */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="text-blue-600" size={24} />
                Service Description
              </h2>
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Indic LLM Arena is a platform that allows users to interact with and compare various AI language models. 
                  Our service includes:
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Direct Chat</h3>
                    <p className="text-sm text-gray-700">
                      Conversations with individual AI models from various providers.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Model Comparison</h3>
                    <p className="text-sm text-gray-700">
                      Side-by-side comparisons of responses from different AI models.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Leaderboards</h3>
                    <p className="text-sm text-gray-700">
                      Community-driven rankings based on user preferences and feedback.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Anonymous Access</h3>
                    <p className="text-sm text-gray-700">
                      Guest sessions with 30-day expiration for privacy-conscious users.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Acceptable Use */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="text-green-600" size={24} />
                Acceptable Use Policy
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-2">✅ You May:</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Use the service for educational, research, and creative purposes</li>
                    <li>Compare AI model responses for legitimate evaluation</li>
                    <li>Provide feedback to help improve the platform</li>
                    <li>Export your own conversations and data</li>
                    <li>Share public conversation links responsibly</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-red-700 mb-2">❌ You May Not:</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Share personal, sensitive, or confidential information</li>
                    <li>Attempt to generate harmful, illegal, or inappropriate content</li>
                    <li>Reverse engineer or attempt to extract model weights</li>
                    <li>Use the service for automated scraping or API abuse</li>
                    <li>Violate any applicable laws or regulations</li>
                    <li>Impersonate others or create fake accounts</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Content and Data */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content and Data Usage</h2>
              
              <div className="space-y-4">
                <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <h3 className="font-medium text-orange-900 mb-1">Important Disclaimer</h3>
                      <p className="text-orange-800 text-sm">
                        Your conversations may be used to improve AI models. By using this service, 
                        you grant us a license to use your inputs for training and research purposes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Your Content</h3>
                    <p className="text-gray-700 text-sm">
                      You retain ownership of your inputs but grant us permission to process, store, 
                      and use them for service improvement.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">AI Responses</h3>
                    <p className="text-gray-700 text-sm">
                      AI-generated responses are provided by third-party models. We don't claim ownership 
                      but may use them for platform analytics.
                    </p>
                  </div>
                </div>

                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <h3 className="font-medium text-green-900 mb-1">Open Source Data Release</h3>
                      <p className="text-green-800 text-sm">
                        We will be releasing chat conversations as open source datasets with fully permissible licenses 
                        to advance AI research and development. All conversations will be anonymized to protect user privacy 
                        before being included in these datasets.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-1">Privacy Policy Reference</h3>
                  <p className="text-blue-800 text-sm">
                    You may refer to the
                    <a href="/#/privacy" className="text-orange-600 hover:underline ml-1">
                      Privacy Policy&nbsp;
                    </a>
                    for matters related to personal data, processing, and user rights.
                  </p>
                </div>

              </div>
            </section>

            {/* Account Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Terms</h2>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Guest Users</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Sessions expire after 30 days</li>
                  <li>Limited conversation history</li>
                  <li>No data export capabilities</li>
                  <li>Conversations may be used for AI training</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-900">Registered Users</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Persistent conversation history</li>
                  <li>Data export and account management</li>
                  <li>Enhanced privacy controls</li>
                  <li>Priority access to new features</li>
                </ul>
              </div>
            </section>

            {/* Disclaimers */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-yellow-600" size={24} />
                Disclaimers and Limitations
              </h2>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-900 mb-2">AI Content Disclaimer</h3>
                  <p className="text-yellow-800 text-sm">
                    AI responses may contain inaccuracies, biases, or inappropriate content. 
                    We don't guarantee the accuracy or reliability of AI-generated responses.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 mb-2">No Warranties</h3>
                  <p className="text-red-800 text-sm">
                    The service is provided "as is" without warranties of any kind. 
                    We don't guarantee uninterrupted availability or error-free operation.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">No Professional Advice</h3>
                  <p className="text-blue-800 text-sm">
                    As users may rely on AI-generated outputs, the platform does not provide medical, legal, financial, or professional advice.
                  </p>
                </div>

                <div className="bg-red-50 border border-gray-300 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 mb-2">Security Disclaimer</h3>
                  <p className="text-red-800 text-sm">
                    While reasonable security measures are followed, no online system can guarantee absolute security.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Limitation of Liability</h3>
                  <p className="text-gray-700 text-sm">
                    Our liability is limited to the maximum extent permitted by law. 
                    We're not responsible for any indirect, incidental, or consequential damages.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                The users will indemnify the platform for any misuse or violations of the Terms.
              </p>
            </section>

            {/* Modifications */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Modifications</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to modify, suspend, or discontinue the service at any time. 
                We may also update these terms, and continued use constitutes acceptance of changes.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Notification Policy</h3>
                <p className="text-blue-800 text-sm">
                  Significant changes will be announced through the platform or via email for registered users. 
                  Check this page regularly for updates.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">By You</h3>
                  <p className="text-gray-700 text-sm">
                    You may stop using the service at any time. Registered users can delete their accounts 
                    through account settings.
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">By Us</h3>
                  <p className="text-gray-700 text-sm">
                    We may terminate access for violations of these terms, illegal activity, 
                    or abuse of the service.
                  </p>
                </div>
              </div>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Scale className="text-purple-600" size={24} />
                Governing Law & Jurisdiction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                The Terms are governed by Indian law and that disputes will fall under the jurisdiction of Chennai courts.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="text-orange-600" size={24} />
                Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 font-medium">General Inquiries</p>
                  <p className="text-gray-700">Email: <a href="mailto:arena@ai4bharat.org" className="text-orange-600 hover:text-orange-700 hover:underline">arena@ai4bharat.org</a></p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 font-medium">Legal Matters</p>
                  <p className="text-gray-700">Email: <a href="mailto:arena@ai4bharat.org" className="text-orange-600 hover:text-orange-700 hover:underline">arena@ai4bharat.org</a></p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}