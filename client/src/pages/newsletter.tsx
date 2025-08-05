import { Construction, Newspaper, Clock, Wrench } from "lucide-react";

export default function NewsletterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="relative inline-block">
            <Construction className="h-24 w-24 text-orange-500 mx-auto mb-4 animate-bounce" />
            <Newspaper className="h-8 w-8 text-blue-600 absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Newsletter Feature
        </h1>
        
        <h2 className="text-2xl font-semibold text-orange-600 dark:text-orange-400 mb-6">
          Under Construction
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          We're working hard to bring you an amazing newsletter experience. 
          Our team is crafting something special that will help you create, 
          manage, and send beautiful newsletters to your audience.
        </p>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
            <Wrench className="h-5 w-5 mr-2 text-blue-600" />
            Coming Soon Features
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Drag & drop newsletter builder
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Beautiful email templates
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Subscriber management
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Analytics & reporting
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Automated campaigns
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                A/B testing tools
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
          <Clock className="h-5 w-5 mr-2" />
          <span>Expected launch: Coming Soon</span>
        </div>
      </div>
    </div>
  );
}