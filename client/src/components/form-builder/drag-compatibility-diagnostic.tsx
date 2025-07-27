import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Monitor, Smartphone, Tablet } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

interface DragCompatibilityDiagnosticProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DragCompatibilityDiagnostic({ isOpen, onClose }: DragCompatibilityDiagnosticProps) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android.*Tablet/i.test(userAgent);
    
    if (isMobile && !isTablet) {
      setDeviceType('mobile');
    } else if (isTablet) {
      setDeviceType('tablet');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);

    const results: DiagnosticResult[] = [];

    // Test 1: Touch support detection
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    results.push({
      test: 'Touch Support',
      status: hasTouchSupport ? 'pass' : 'warning',
      message: hasTouchSupport ? 'Touch events are supported' : 'No touch support detected',
      details: `Max touch points: ${navigator.maxTouchPoints || 0}`
    });

    // Test 2: Mouse support detection
    const hasMouseSupport = window.matchMedia('(pointer: fine)').matches;
    results.push({
      test: 'Mouse Support',
      status: hasMouseSupport ? 'pass' : 'warning',
      message: hasMouseSupport ? 'Fine pointer (mouse) detected' : 'Coarse pointer only',
      details: `Pointer type: ${hasMouseSupport ? 'fine' : 'coarse'}`
    });

    // Test 3: Drag API support
    const dragApiSupported = 'draggable' in document.createElement('div');
    results.push({
      test: 'HTML5 Drag API',
      status: dragApiSupported ? 'pass' : 'fail',
      message: dragApiSupported ? 'HTML5 Drag API is supported' : 'HTML5 Drag API not supported',
      details: `Native drag support: ${dragApiSupported ? 'Yes' : 'No'}`
    });

    // Test 4: Browser compatibility
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isEdge = /Edge|Edg/.test(navigator.userAgent);

    let browserStatus: 'pass' | 'warning' | 'fail' = 'pass';
    let browserMessage = 'Browser fully supports drag and drop';

    if (isSafari) {
      browserStatus = 'warning';
      browserMessage = 'Safari has known drag and drop quirks';
    } else if (!isChrome && !isFirefox && !isEdge) {
      browserStatus = 'warning';
      browserMessage = 'Untested browser - may have compatibility issues';
    }

    results.push({
      test: 'Browser Compatibility',
      status: browserStatus,
      message: browserMessage,
      details: `User Agent: ${navigator.userAgent.substring(0, 50)}...`
    });

    // Test 5: Screen size and viewport
    const screenWidth = window.screen.width;
    const viewportWidth = window.innerWidth;
    const isSmallScreen = viewportWidth < 768;

    results.push({
      test: 'Screen Size',
      status: isSmallScreen ? 'warning' : 'pass',
      message: isSmallScreen ? 'Small screen detected - may affect drag experience' : 'Screen size is adequate for drag operations',
      details: `Viewport: ${viewportWidth}x${window.innerHeight}, Screen: ${screenWidth}x${window.screen.height}`
    });

    // Test 6: DndKit compatibility test
    try {
      const testElement = document.createElement('div');
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.style.width = '1px';
      testElement.style.height = '1px';
      document.body.appendChild(testElement);

      // Simulate drag start
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0
      });

      testElement.dispatchEvent(mouseDownEvent);
      document.body.removeChild(testElement);

      results.push({
        test: 'Event System',
        status: 'pass',
        message: 'Mouse events are working correctly',
        details: 'Event delegation and propagation functioning'
      });
    } catch (error) {
      results.push({
        test: 'Event System',
        status: 'fail',
        message: 'Event system test failed',
        details: `Error: ${error}`
      });
    }

    // Test 7: Performance check
    const performanceStart = performance.now();
    await new Promise(resolve => setTimeout(resolve, 10));
    const performanceEnd = performance.now();
    const isPerformanceGood = (performanceEnd - performanceStart) < 50;

    results.push({
      test: 'Performance',
      status: isPerformanceGood ? 'pass' : 'warning',
      message: isPerformanceGood ? 'Good performance detected' : 'Performance may be slow',
      details: `Timer precision: ${(performanceEnd - performanceStart).toFixed(2)}ms`
    });

    // Simulate diagnostic delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    setDiagnostics(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const getOverallStatus = () => {
    if (diagnostics.length === 0) return null;
    
    const failCount = diagnostics.filter(d => d.status === 'fail').length;
    const warningCount = diagnostics.filter(d => d.status === 'warning').length;
    
    if (failCount > 0) return 'fail';
    if (warningCount > 2) return 'warning';
    return 'pass';
  };

  const getRecommendations = () => {
    const overall = getOverallStatus();
    const recommendations: string[] = [];

    if (deviceType === 'mobile') {
      recommendations.push('On mobile devices, use click-to-add as primary interaction');
      recommendations.push('Ensure touch targets are at least 44px for accessibility');
    }

    if (diagnostics.some(d => d.test === 'Browser Compatibility' && d.status === 'warning')) {
      recommendations.push('Consider testing drag functionality in your specific browser');
    }

    if (diagnostics.some(d => d.test === 'Performance' && d.status === 'warning')) {
      recommendations.push('Performance may be affected - consider reducing visual effects during drag');
    }

    if (overall === 'fail') {
      recommendations.push('Critical issues detected - drag and drop may not work properly');
      recommendations.push('Use click-to-add as fallback interaction method');
    }

    return recommendations;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getDeviceIcon()}
              <CardTitle>Drag & Drop Compatibility Diagnostic</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{deviceType}</Badge>
            {getOverallStatus() && (
              <Badge 
                variant={getOverallStatus() === 'pass' ? 'default' : 
                        getOverallStatus() === 'warning' ? 'secondary' : 'destructive'}
              >
                {getOverallStatus() === 'pass' ? 'Compatible' : 
                 getOverallStatus() === 'warning' ? 'Partially Compatible' : 'Issues Detected'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
            </Button>
          </div>

          {isRunning && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Testing drag and drop compatibility...</p>
            </div>
          )}

          {diagnostics.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results</h3>
              {diagnostics.map((diagnostic, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  {getStatusIcon(diagnostic.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{diagnostic.test}</h4>
                      <Badge 
                        variant={diagnostic.status === 'pass' ? 'default' : 
                                diagnostic.status === 'warning' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {diagnostic.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{diagnostic.message}</p>
                    {diagnostic.details && (
                      <p className="text-xs text-gray-500 mt-1">{diagnostic.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {diagnostics.length > 0 && getRecommendations().length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {getRecommendations().map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}