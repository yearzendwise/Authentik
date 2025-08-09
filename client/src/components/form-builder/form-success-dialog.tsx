import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormQRCode } from './form-qr-code';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface FormSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
  isEditMode?: boolean;
}

export function FormSuccessDialog({ 
  isOpen, 
  onClose, 
  formId, 
  formTitle, 
  isEditMode = false 
}: FormSuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold">
            {isEditMode ? 'Form Updated Successfully!' : 'Form Created Successfully!'}
          </DialogTitle>
          
          <DialogDescription className="text-base text-muted-foreground">
            {isEditMode 
              ? `Your form "${formTitle}" has been updated and is ready to receive responses.`
              : `Your form "${formTitle}" is now live and ready to receive responses.`
            }
          </DialogDescription>
        </DialogHeader>

        {/* QR Code Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold mb-2">Share Your Form</h3>
            <p className="text-sm text-muted-foreground">
              Use the QR code below or share the direct URL to collect responses
            </p>
          </div>
          
          <FormQRCode formId={formId} formTitle={formTitle} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 order-2 sm:order-1"
          >
            Continue Editing
          </Button>
          
          <Button
            onClick={onClose}
            className="flex-1 order-1 sm:order-2 flex items-center justify-center space-x-2"
          >
            <span>Go to Forms</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}