import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Sparkles, CreditCard, Zap } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

export function AuthModal({ isOpen, onClose, feature }: AuthModalProps) {
  const handleLogin = () => {
    window.location.href = '/oauth/start';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Login with Deco to Use AI
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            
            <h3 className="font-semibold mb-2">This is a Deco App</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect to your deco.chat workspace to unlock AI features like {feature}.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-green-700">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">First-time users get $2 free credits!</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Perfect for testing AI features and exploring the platform.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={handleLogin} className="w-full" size="lg">
              Login with Deco
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full">
              Continue Without AI
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
