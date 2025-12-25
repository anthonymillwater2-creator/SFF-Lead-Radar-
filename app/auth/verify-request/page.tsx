import { Mail } from "lucide-react";

export default function VerifyRequest() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <Mail className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Check your email
          </h1>
          <p className="text-gray-600">
            A sign in link has been sent to your email address.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              Click the link in the email to sign in to your account.
            </p>
            <p>
              If you don't see the email, check your spam folder.
            </p>
            <p className="font-medium text-gray-900">
              You can close this window once you've clicked the link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
